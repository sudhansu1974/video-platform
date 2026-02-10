"use server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { UserRole, VideoStatus } from "@/generated/prisma/client";
import {
  createCategorySchema,
  updateCategorySchema,
  updateUserRoleSchema,
  bulkVideoActionSchema,
  createUserSchema,
  type CreateCategoryInput,
  type UpdateCategoryInput,
  type UpdateUserRoleInput,
  type BulkVideoActionInput,
  type CreateUserInput,
} from "@/lib/validations/admin";

// ─── Helpers ─────────────────────────────────────────

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" as const, session: null };
  }
  if (session.user.role !== "ADMIN") {
    return { error: "Forbidden" as const, session: null };
  }
  return { error: null, session };
}

// ─── User Actions ────────────────────────────────────

export async function createUserAdmin(input: CreateUserInput) {
  const { error } = await requireAdmin();
  if (error) return { success: false as const, error };

  const parsed = createUserSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false as const,
      error: "Validation failed",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { email, username, password, displayName, role } = parsed.data;

  // Check email uniqueness
  const existingEmail = await prisma.user.findUnique({ where: { email } });
  if (existingEmail) {
    return { success: false as const, error: "Email already in use" };
  }

  // Check username uniqueness
  const existingUsername = await prisma.user.findUnique({
    where: { username },
  });
  if (existingUsername) {
    return { success: false as const, error: "Username already taken" };
  }

  const bcrypt = await import("bcryptjs");
  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      email,
      username,
      name: displayName || username,
      passwordHash,
      role: role as UserRole,
    },
  });

  revalidatePath("/admin/users");

  return { success: true as const, userId: user.id };
}

export async function updateUserRole(input: UpdateUserRoleInput) {
  const { error, session } = await requireAdmin();
  if (error) return { success: false as const, error };

  const parsed = updateUserRoleSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: "Validation failed" };
  }

  const { userId, role } = parsed.data;

  // Prevent admin from demoting themselves
  if (userId === session!.user.id) {
    return { success: false as const, error: "Cannot change your own role" };
  }

  // Prevent demoting the last admin
  if (role !== "ADMIN") {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user?.role === "ADMIN") {
      const adminCount = await prisma.user.count({
        where: { role: "ADMIN" },
      });
      if (adminCount <= 1) {
        return {
          success: false as const,
          error: "Cannot remove the last admin",
        };
      }
    }
  }

  await prisma.user.update({
    where: { id: userId },
    data: { role: role as UserRole },
  });

  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);

  return { success: true as const };
}

export async function suspendUser(userId: string) {
  const { error, session } = await requireAdmin();
  if (error) return { success: false as const, error };

  if (userId === session!.user.id) {
    return { success: false as const, error: "Cannot suspend yourself" };
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { success: false as const, error: "User not found" };

  // Unlist all published videos and demote to VIEWER
  await Promise.all([
    prisma.video.updateMany({
      where: { userId, status: "PUBLISHED" },
      data: { status: "UNLISTED" },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { role: "VIEWER" },
    }),
  ]);

  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);

  return { success: true as const };
}

export async function deleteUserAdmin(userId: string) {
  const { error, session } = await requireAdmin();
  if (error) return { success: false as const, error };

  if (userId === session!.user.id) {
    return { success: false as const, error: "Cannot delete yourself" };
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { success: false as const, error: "User not found" };

  // Delete all user's data in order
  const videos = await prisma.video.findMany({
    where: { userId },
    select: { id: true },
  });
  const videoIds = videos.map((v) => v.id);

  if (videoIds.length > 0) {
    await prisma.videoTag.deleteMany({
      where: { videoId: { in: videoIds } },
    });
    await prisma.processingJob.deleteMany({
      where: { videoId: { in: videoIds } },
    });
    await prisma.video.deleteMany({ where: { userId } });
  }

  await prisma.session.deleteMany({ where: { userId } });
  await prisma.account.deleteMany({ where: { userId } });
  await prisma.user.delete({ where: { id: userId } });

  revalidatePath("/admin/users");

  return { success: true as const };
}

// ─── Video Actions ───────────────────────────────────

export async function adminUpdateVideoStatus(
  videoId: string,
  status: VideoStatus
) {
  const { error } = await requireAdmin();
  if (error) return { success: false as const, error };

  const video = await prisma.video.findUnique({ where: { id: videoId } });
  if (!video) return { success: false as const, error: "Video not found" };

  await prisma.video.update({
    where: { id: videoId },
    data: {
      status,
      ...(status === "PUBLISHED" && !video.publishedAt
        ? { publishedAt: new Date() }
        : {}),
    },
  });

  revalidatePath("/admin/videos");
  revalidatePath(`/watch/${video.slug}`);

  return { success: true as const };
}

export async function deleteVideoAdmin(videoId: string) {
  const { error } = await requireAdmin();
  if (error) return { success: false as const, error };

  const video = await prisma.video.findUnique({ where: { id: videoId } });
  if (!video) return { success: false as const, error: "Video not found" };

  // Delete physical files
  // TODO: Replace with S3/R2 delete operations in production
  const { unlink } = await import("fs/promises");
  const filesToDelete = [video.fileUrl];
  if (video.thumbnailUrl) {
    const thumbnailPath = video.thumbnailUrl.replace(/^\/api\/uploads\//, "");
    const path = await import("path");
    filesToDelete.push(path.join(process.cwd(), "uploads", thumbnailPath));
  }
  for (const filePath of filesToDelete) {
    try {
      await unlink(filePath);
    } catch {
      // File may not exist
    }
  }

  await prisma.videoTag.deleteMany({ where: { videoId } });
  await prisma.processingJob.deleteMany({ where: { videoId } });
  await prisma.video.delete({ where: { id: videoId } });

  revalidatePath("/admin/videos");

  return { success: true as const };
}

export async function bulkUpdateVideoStatus(input: BulkVideoActionInput) {
  const { error } = await requireAdmin();
  if (error) return { success: false as const, error };

  const parsed = bulkVideoActionSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: "Validation failed" };
  }

  const { videoIds, status } = parsed.data;

  const result = await prisma.video.updateMany({
    where: { id: { in: videoIds } },
    data: {
      status: status as VideoStatus,
      ...(status === "PUBLISHED" ? { publishedAt: new Date() } : {}),
    },
  });

  revalidatePath("/admin/videos");

  return { success: true as const, updated: result.count };
}

// ─── Category Actions ────────────────────────────────

export async function createCategory(input: CreateCategoryInput) {
  const { error } = await requireAdmin();
  if (error) return { success: false as const, error };

  const parsed = createCategorySchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false as const,
      error: "Validation failed",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { name, description } = parsed.data;
  const slugify = (await import("slugify")).default;
  const slug = parsed.data.slug || slugify(name, { lower: true, strict: true });

  // Check uniqueness
  const existing = await prisma.category.findFirst({
    where: { OR: [{ name }, { slug }] },
  });
  if (existing) {
    return {
      success: false as const,
      error: "A category with this name or slug already exists",
    };
  }

  const category = await prisma.category.create({
    data: { name, slug, description: description || null },
  });

  revalidatePath("/admin/categories");

  return { success: true as const, categoryId: category.id };
}

export async function updateCategory(input: UpdateCategoryInput) {
  const { error } = await requireAdmin();
  if (error) return { success: false as const, error };

  const parsed = updateCategorySchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false as const,
      error: "Validation failed",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { categoryId, name, slug, description } = parsed.data;

  const category = await prisma.category.findUnique({
    where: { id: categoryId },
  });
  if (!category) {
    return { success: false as const, error: "Category not found" };
  }

  // Check uniqueness (excluding self)
  if (name || slug) {
    const existing = await prisma.category.findFirst({
      where: {
        id: { not: categoryId },
        OR: [
          ...(name ? [{ name }] : []),
          ...(slug ? [{ slug }] : []),
        ],
      },
    });
    if (existing) {
      return {
        success: false as const,
        error: "A category with this name or slug already exists",
      };
    }
  }

  await prisma.category.update({
    where: { id: categoryId },
    data: {
      ...(name ? { name } : {}),
      ...(slug ? { slug } : {}),
      ...(description !== undefined ? { description: description || null } : {}),
    },
  });

  revalidatePath("/admin/categories");

  return { success: true as const };
}

export async function deleteCategory(categoryId: string) {
  const { error } = await requireAdmin();
  if (error) return { success: false as const, error };

  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    include: { _count: { select: { videos: true } } },
  });

  if (!category) {
    return { success: false as const, error: "Category not found" };
  }

  if (category._count.videos > 0) {
    return {
      success: false as const,
      error: `Cannot delete: ${category._count.videos} videos use this category. Reassign them first.`,
    };
  }

  await prisma.category.delete({ where: { id: categoryId } });

  revalidatePath("/admin/categories");

  return { success: true as const };
}

// ─── Tag Actions ─────────────────────────────────────

export async function deleteTag(tagId: string) {
  const { error } = await requireAdmin();
  if (error) return { success: false as const, error };

  const tag = await prisma.tag.findUnique({ where: { id: tagId } });
  if (!tag) return { success: false as const, error: "Tag not found" };

  await prisma.videoTag.deleteMany({ where: { tagId } });
  await prisma.tag.delete({ where: { id: tagId } });

  revalidatePath("/admin/tags");

  return { success: true as const };
}

export async function mergeTags(sourceTagId: string, targetTagId: string) {
  const { error } = await requireAdmin();
  if (error) return { success: false as const, error };

  if (sourceTagId === targetTagId) {
    return { success: false as const, error: "Cannot merge a tag into itself" };
  }

  const [source, target] = await Promise.all([
    prisma.tag.findUnique({ where: { id: sourceTagId } }),
    prisma.tag.findUnique({ where: { id: targetTagId } }),
  ]);
  if (!source) return { success: false as const, error: "Source tag not found" };
  if (!target) return { success: false as const, error: "Target tag not found" };

  // Get source video associations
  const sourceVideoTags = await prisma.videoTag.findMany({
    where: { tagId: sourceTagId },
  });

  // Get existing target video associations to avoid duplicates
  const targetVideoIds = new Set(
    (
      await prisma.videoTag.findMany({
        where: { tagId: targetTagId },
        select: { videoId: true },
      })
    ).map((vt) => vt.videoId)
  );

  // Move non-duplicate associations
  for (const vt of sourceVideoTags) {
    if (!targetVideoIds.has(vt.videoId)) {
      await prisma.videoTag.create({
        data: { videoId: vt.videoId, tagId: targetTagId },
      });
    }
  }

  // Delete source tag and its associations
  await prisma.videoTag.deleteMany({ where: { tagId: sourceTagId } });
  await prisma.tag.delete({ where: { id: sourceTagId } });

  revalidatePath("/admin/tags");

  return { success: true as const };
}

// ─── Processing Actions ──────────────────────────────

export async function retryProcessingJob(jobId: string) {
  const { error } = await requireAdmin();
  if (error) return { success: false as const, error };

  const job = await prisma.processingJob.findUnique({
    where: { id: jobId },
    include: { video: true },
  });
  if (!job) return { success: false as const, error: "Job not found" };
  if (job.status !== "FAILED") {
    return { success: false as const, error: "Only failed jobs can be retried" };
  }

  // Reset job and video status
  await Promise.all([
    prisma.processingJob.update({
      where: { id: jobId },
      data: {
        status: "QUEUED",
        progress: 0,
        errorMessage: null,
        startedAt: null,
        completedAt: null,
      },
    }),
    prisma.video.update({
      where: { id: job.videoId },
      data: { status: "PROCESSING" },
    }),
  ]);

  // Fire-and-forget: kick off processing again
  // TODO: In production, use a proper job queue (BullMQ, etc.)
  import("@/lib/processing").then(({ processVideo }) => {
    processVideo(job.videoId, jobId).catch(console.error);
  });

  revalidatePath("/admin/processing");

  return { success: true as const };
}
