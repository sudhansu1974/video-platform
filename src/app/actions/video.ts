"use server";

import { unlink } from "fs/promises";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { videoMetadataSchema, type VideoMetadataInput } from "@/lib/validations/video";
import { revalidatePath } from "next/cache";

// ─── Update Video Metadata ───────────────────────────

export async function updateVideoMetadata(input: VideoMetadataInput) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false as const, error: "Unauthorized" };
  }

  const parsed = videoMetadataSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false as const,
      error: "Validation failed",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { videoId, title, description, categoryId, tags } = parsed.data;

  // Verify ownership or admin
  const video = await prisma.video.findUnique({
    where: { id: videoId },
  });

  if (!video) {
    return { success: false as const, error: "Video not found" };
  }

  if (video.userId !== session.user.id && session.user.role !== "ADMIN") {
    return { success: false as const, error: "Forbidden" };
  }

  // Update video metadata
  await prisma.video.update({
    where: { id: videoId },
    data: {
      title,
      description: description || null,
      categoryId: categoryId || null,
    },
  });

  // Update tags: delete existing, create new
  if (tags !== undefined) {
    await prisma.videoTag.deleteMany({ where: { videoId } });

    for (const tagName of tags) {
      const normalizedTag = tagName.trim().toLowerCase();
      if (!normalizedTag) continue;

      const tag = await prisma.tag.upsert({
        where: { name: normalizedTag },
        create: {
          name: normalizedTag,
          slug: normalizedTag.replace(/\s+/g, "-"),
        },
        update: {},
      });

      await prisma.videoTag.create({
        data: { videoId, tagId: tag.id },
      });
    }
  }

  revalidatePath("/dashboard/videos");
  revalidatePath(`/watch/${video.slug}`);

  return { success: true as const };
}

// ─── Delete Video ─────────────────────────────────────

export async function deleteVideo(videoId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false as const, error: "Unauthorized" };
  }

  const video = await prisma.video.findUnique({
    where: { id: videoId },
  });

  if (!video) {
    return { success: false as const, error: "Video not found" };
  }

  if (video.userId !== session.user.id && session.user.role !== "ADMIN") {
    return { success: false as const, error: "Forbidden" };
  }

  // Delete physical files
  // TODO: Replace with S3/R2 delete operations in production
  const filesToDelete = [video.fileUrl];
  if (video.thumbnailUrl) {
    // thumbnailUrl is a public URL path, need to resolve to absolute path
    const thumbnailPath = video.thumbnailUrl.replace(
      /^\/api\/uploads\//,
      ""
    );
    const path = await import("path");
    filesToDelete.push(
      path.join(process.cwd(), "uploads", thumbnailPath)
    );
  }

  for (const filePath of filesToDelete) {
    try {
      await unlink(filePath);
    } catch {
      // File may not exist, continue
    }
  }

  // Delete related records, then the video
  await prisma.videoTag.deleteMany({ where: { videoId } });
  await prisma.processingJob.deleteMany({ where: { videoId } });
  await prisma.video.delete({ where: { id: videoId } });

  revalidatePath("/dashboard/videos");

  return { success: true as const };
}

// ─── Get Upload Status ────────────────────────────────

export async function getUploadStatus(videoId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false as const, error: "Unauthorized" };
  }

  const video = await prisma.video.findUnique({
    where: { id: videoId },
    include: {
      processingJobs: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!video) {
    return { success: false as const, error: "Video not found" };
  }

  if (video.userId !== session.user.id && session.user.role !== "ADMIN") {
    return { success: false as const, error: "Forbidden" };
  }

  const job = video.processingJobs[0] ?? null;

  return {
    success: true as const,
    status: video.status,
    title: video.title,
    slug: video.slug,
    thumbnailUrl: video.thumbnailUrl,
    processingJob: job
      ? {
          status: job.status,
          progress: job.progress,
          errorMessage: job.errorMessage,
          completedAt: job.completedAt,
        }
      : null,
  };
}

// ─── Update Video Status ─────────────────────────────

export async function updateVideoStatus(
  videoId: string,
  status: "PUBLISHED" | "UNLISTED"
) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false as const, error: "Unauthorized" };
  }

  const video = await prisma.video.findUnique({
    where: { id: videoId },
  });

  if (!video) {
    return { success: false as const, error: "Video not found" };
  }

  if (video.userId !== session.user.id && session.user.role !== "ADMIN") {
    return { success: false as const, error: "Forbidden" };
  }

  // Only allow toggling between PUBLISHED and UNLISTED
  if (video.status !== "PUBLISHED" && video.status !== "UNLISTED") {
    return {
      success: false as const,
      error: "Can only change status between Published and Unlisted",
    };
  }

  await prisma.video.update({
    where: { id: videoId },
    data: {
      status,
      ...(status === "PUBLISHED" && !video.publishedAt
        ? { publishedAt: new Date() }
        : {}),
    },
  });

  revalidatePath("/dashboard/videos");
  revalidatePath(`/dashboard/videos/${videoId}/edit`);
  revalidatePath(`/watch/${video.slug}`);

  return { success: true as const };
}

// ─── Duplicate Video ─────────────────────────────────

export async function duplicateVideo(videoId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false as const, error: "Unauthorized" };
  }

  const video = await prisma.video.findUnique({
    where: { id: videoId },
    include: {
      videoTags: { include: { tag: true } },
    },
  });

  if (!video) {
    return { success: false as const, error: "Video not found" };
  }

  if (video.userId !== session.user.id && session.user.role !== "ADMIN") {
    return { success: false as const, error: "Forbidden" };
  }

  // Generate a unique slug
  const slugify = (await import("slugify")).default;
  const baseSlug = slugify(`${video.title} copy`, { lower: true, strict: true });
  const existingCount = await prisma.video.count({
    where: { slug: { startsWith: baseSlug } },
  });
  const slug = existingCount > 0 ? `${baseSlug}-${existingCount}` : baseSlug;

  const newVideo = await prisma.video.create({
    data: {
      userId: session.user.id,
      title: `${video.title} (Copy)`,
      slug,
      description: video.description,
      categoryId: video.categoryId,
      status: "DRAFT",
      fileUrl: video.fileUrl,
      thumbnailUrl: video.thumbnailUrl,
    },
  });

  // Copy tags
  for (const vt of video.videoTags) {
    await prisma.videoTag.create({
      data: { videoId: newVideo.id, tagId: vt.tagId },
    });
  }

  revalidatePath("/dashboard/videos");

  return { success: true as const, newVideoId: newVideo.id };
}

// ─── Get Categories ───────────────────────────────────

export async function getCategories() {
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
  });
  return categories;
}
