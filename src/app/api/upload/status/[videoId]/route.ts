import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ videoId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { videoId } = await params;

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
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    // Verify ownership or admin
    if (video.userId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const job = video.processingJobs[0] ?? null;

    return NextResponse.json({
      videoId: video.id,
      title: video.title,
      slug: video.slug,
      status: video.status,
      thumbnailUrl: video.thumbnailUrl,
      processingJob: job
        ? {
            status: job.status,
            progress: job.progress,
            errorMessage: job.errorMessage,
            completedAt: job.completedAt,
          }
        : null,
    });
  } catch (error) {
    console.error("[API] Status check error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
