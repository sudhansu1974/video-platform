import prisma from "@/lib/prisma";
import type { VideoStatus } from "@/generated/prisma/client";

// ─── Get Creator Videos (Paginated) ──────────────────

interface GetCreatorVideosOptions {
  status?: VideoStatus;
  page?: number;
  limit?: number;
  sortBy?: "createdAt" | "title" | "viewCount" | "status";
  sortOrder?: "asc" | "desc";
  search?: string;
}

export async function getCreatorVideos(
  userId: string,
  options: GetCreatorVideosOptions = {}
) {
  const {
    status,
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortOrder = "desc",
    search,
  } = options;

  const where = {
    userId,
    ...(status ? { status } : {}),
    ...(search
      ? { title: { contains: search, mode: "insensitive" as const } }
      : {}),
  };

  const [videos, totalCount] = await Promise.all([
    prisma.video.findMany({
      where,
      include: {
        category: true,
        videoTags: {
          include: { tag: true },
        },
        processingJobs: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.video.count({ where }),
  ]);

  return {
    videos,
    totalCount,
    totalPages: Math.ceil(totalCount / limit),
  };
}

// ─── Get Creator Stats ───────────────────────────────

export async function getCreatorStats(userId: string) {
  const [totalVideos, publishedVideos, processingVideos, draftVideos, viewsResult] =
    await Promise.all([
      prisma.video.count({ where: { userId } }),
      prisma.video.count({ where: { userId, status: "PUBLISHED" } }),
      prisma.video.count({ where: { userId, status: "PROCESSING" } }),
      prisma.video.count({ where: { userId, status: "DRAFT" } }),
      prisma.video.aggregate({
        where: { userId },
        _sum: { viewCount: true },
      }),
    ]);

  return {
    totalVideos,
    publishedVideos,
    processingVideos,
    draftVideos,
    totalViews: viewsResult._sum.viewCount ?? 0,
  };
}

// ─── Get Video By ID ─────────────────────────────────

export async function getVideoById(videoId: string, userId?: string) {
  const video = await prisma.video.findUnique({
    where: { id: videoId },
    include: {
      category: true,
      creator: {
        select: { id: true, name: true, username: true, role: true },
      },
      videoTags: {
        include: { tag: true },
      },
      processingJobs: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!video) return null;

  // If userId provided, verify ownership (unless admin check happens at caller)
  if (userId && video.userId !== userId && video.creator.role !== "ADMIN") {
    return null;
  }

  return video;
}

// ─── Get Recent Processing Jobs ──────────────────────

export async function getRecentProcessingJobs(
  userId: string,
  limit: number = 5
) {
  const jobs = await prisma.processingJob.findMany({
    where: {
      video: { userId },
    },
    include: {
      video: {
        select: { id: true, title: true, slug: true, status: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return jobs;
}
