import prisma from "@/lib/prisma";

// ─── Get Video By Slug (Public Watch Page) ──────────

export async function getVideoBySlug(slug: string) {
  const video = await prisma.video.findUnique({
    where: { slug, status: "PUBLISHED" },
    include: {
      creator: {
        select: {
          id: true,
          name: true,
          username: true,
          avatarUrl: true,
          bio: true,
        },
      },
      category: true,
      videoTags: {
        include: { tag: true },
      },
      processingJobs: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  return video;
}

// ─── Get Related Videos ─────────────────────────────

export async function getRelatedVideos(
  videoId: string,
  options?: {
    categoryId?: string | null;
    tagIds?: string[];
    userId?: string;
    limit?: number;
  }
) {
  const limit = options?.limit ?? 12;
  const categoryId = options?.categoryId;
  const tagIds = options?.tagIds ?? [];
  const userId = options?.userId;

  const exclude = { id: { not: videoId }, status: "PUBLISHED" as const };

  // 1. Same category videos
  let videos: RelatedVideo[] = [];
  if (categoryId) {
    const categoryVideos = await prisma.video.findMany({
      where: { ...exclude, categoryId },
      include: {
        creator: { select: { id: true, name: true, username: true, avatarUrl: true } },
        category: true,
      },
      orderBy: [{ viewCount: "desc" }, { publishedAt: "desc" }],
      take: limit,
    });
    videos = categoryVideos;
  }

  // 2. Fill with shared-tag videos if not enough
  if (videos.length < limit && tagIds.length > 0) {
    const existingIds = new Set(videos.map((v) => v.id));
    const tagVideos = await prisma.video.findMany({
      where: {
        ...exclude,
        id: { notIn: [videoId, ...existingIds] },
        videoTags: { some: { tagId: { in: tagIds } } },
      },
      include: {
        creator: { select: { id: true, name: true, username: true, avatarUrl: true } },
        category: true,
      },
      orderBy: { viewCount: "desc" },
      take: limit - videos.length,
    });
    videos = [...videos, ...tagVideos];
  }

  // 3. Fill with same creator videos if not enough
  if (videos.length < limit && userId) {
    const existingIds = new Set(videos.map((v) => v.id));
    const creatorVideos = await prisma.video.findMany({
      where: {
        ...exclude,
        id: { notIn: [videoId, ...existingIds] },
        userId,
      },
      include: {
        creator: { select: { id: true, name: true, username: true, avatarUrl: true } },
        category: true,
      },
      orderBy: { publishedAt: "desc" },
      take: limit - videos.length,
    });
    videos = [...videos, ...creatorVideos];
  }

  // 4. Fall back to popular videos if still not enough
  if (videos.length < limit) {
    const existingIds = new Set(videos.map((v) => v.id));
    const popularVideos = await prisma.video.findMany({
      where: {
        ...exclude,
        id: { notIn: [videoId, ...existingIds] },
      },
      include: {
        creator: { select: { id: true, name: true, username: true, avatarUrl: true } },
        category: true,
      },
      orderBy: { viewCount: "desc" },
      take: limit - videos.length,
    });
    videos = [...videos, ...popularVideos];
  }

  return videos;
}

type RelatedVideo = Awaited<ReturnType<typeof prisma.video.findMany<{
  include: {
    creator: { select: { id: true; name: true; username: true; avatarUrl: true } };
    category: true;
  };
}>>>[number];

// ─── Get Creator Info ───────────────────────────────

export async function getCreatorInfo(userId: string) {
  const [user, videoCount, viewsResult] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        username: true,
        avatarUrl: true,
        bio: true,
        createdAt: true,
      },
    }),
    prisma.video.count({
      where: { userId, status: "PUBLISHED" },
    }),
    prisma.video.aggregate({
      where: { userId, status: "PUBLISHED" },
      _sum: { viewCount: true },
    }),
  ]);

  if (!user) return null;

  return {
    ...user,
    videoCount,
    totalViews: viewsResult._sum.viewCount ?? 0,
  };
}
