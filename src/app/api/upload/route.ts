import { NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { videoUploadSchema, ALLOWED_VIDEO_TYPES, ALLOWED_EXTENSIONS, MAX_FILE_SIZE } from "@/lib/validations/video";
import { generateUploadPath, generateSlug } from "@/lib/upload";
import { processVideo } from "@/lib/processing";
import type { UserRole } from "@/generated/prisma/client";

// TODO: Replace local storage with S3/R2 in production

const CREATOR_ROLES: UserRole[] = ["CREATOR", "STUDIO", "ADMIN"];

export async function POST(request: Request) {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!CREATOR_ROLES.includes(session.user.role)) {
      return NextResponse.json(
        { error: "Insufficient permissions. Creator role required." },
        { status: 403 }
      );
    }

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    if (!ALLOWED_VIDEO_TYPES.includes(file.type as typeof ALLOWED_VIDEO_TYPES[number])) {
      return NextResponse.json(
        { error: `Invalid file type. Allowed: ${ALLOWED_VIDEO_TYPES.join(", ")}` },
        { status: 400 }
      );
    }

    // Validate file extension
    const ext = path.extname(file.name).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext as typeof ALLOWED_EXTENSIONS[number])) {
      return NextResponse.json(
        { error: `Invalid file extension. Allowed: ${ALLOWED_EXTENSIONS.join(", ")}` },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 2GB." },
        { status: 400 }
      );
    }

    // Validate metadata
    const title = formData.get("title") as string;
    const description = (formData.get("description") as string) || undefined;
    const categoryId = (formData.get("categoryId") as string) || undefined;
    const tagsRaw = formData.get("tags") as string;
    const tags = tagsRaw ? JSON.parse(tagsRaw) as string[] : undefined;

    const parsed = videoUploadSchema.safeParse({
      title,
      description,
      categoryId,
      tags,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.issues },
        { status: 400 }
      );
    }

    // Save file to local storage
    const storagePath = await generateUploadPath(file.name, "raw");
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(storagePath, buffer);

    // Generate unique slug
    const slug = generateSlug(parsed.data.title);

    // Create Video record
    const video = await prisma.video.create({
      data: {
        userId: session.user.id,
        title: parsed.data.title,
        slug,
        description: parsed.data.description,
        categoryId: parsed.data.categoryId || null,
        status: "PROCESSING",
        fileUrl: storagePath,
      },
    });

    // Create VideoTag records if tags provided
    if (parsed.data.tags && parsed.data.tags.length > 0) {
      for (const tagName of parsed.data.tags) {
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
          data: { videoId: video.id, tagId: tag.id },
        });
      }
    }

    // Create ProcessingJob
    const job = await prisma.processingJob.create({
      data: {
        videoId: video.id,
        status: "QUEUED",
      },
    });

    // Fire-and-forget: kick off processing
    // TODO: Use a proper job queue (BullMQ, Inngest, etc.) in production
    setTimeout(() => {
      processVideo(video.id, job.id).catch(console.error);
    }, 0);

    return NextResponse.json({
      success: true,
      videoId: video.id,
      slug: video.slug,
    });
  } catch (error) {
    console.error("[API] Upload error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
