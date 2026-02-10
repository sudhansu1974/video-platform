import prisma from "@/lib/prisma";
import type {
  UserRole,
  VideoStatus,
  ProcessingJobStatus,
} from "@/generated/prisma/client";

// ─── Platform Stats ──────────────────────────────────

export async function getPlatformStats() {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [
    totalUsers,
    totalCreators,
    totalVideos,
    publishedVideos,
    processingVideos,
    rejectedVideos,
    viewsResult,
    newUsersToday,
    newVideosToday,
    activeProcessingJobs,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({
      where: { role: { in: ["CREATOR", "STUDIO"] } },
    }),
    prisma.video.count(),
    prisma.video.count({ where: { status: "PUBLISHED" } }),
    prisma.video.count({ where: { status: "PROCESSING" } }),
    prisma.video.count({ where: { status: "REJECTED" } }),
    prisma.video.aggregate({ _sum: { viewCount: true } }),
    prisma.user.count({
      where: { createdAt: { gte: todayStart } },
    }),
    prisma.video.count({
      where: { createdAt: { gte: todayStart } },
    }),
    prisma.processingJob.count({
      where: { status: { in: ["QUEUED", "PROCESSING"] } },
    }),
  ]);

  return {
    totalUsers,
    totalCreators,
    totalVideos,
    publishedVideos,
    processingVideos,
    rejectedVideos,
    totalViews: viewsResult._sum.viewCount ?? 0,
    newUsersToday,
    newVideosToday,
    activeProcessingJobs,
  };
}

// ─── Recent Activity ─────────────────────────────────

export async function getRecentUsers(limit: number = 5) {
  return prisma.user.findMany({
    select: {
      id: true,
      name: true,
      username: true,
      avatarUrl: true,
      role: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getRecentVideos(limit: number = 5) {
  return prisma.video.findMany({
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      thumbnailUrl: true,
      createdAt: true,
      creator: {
        select: { id: true, name: true, username: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

// ─── User Management ─────────────────────────────────

interface GetAdminUsersOptions {
  page?: number;
  limit?: number;
  search?: string;
  role?: UserRole;
  sort?: "createdAt" | "username" | "name";
  sortOrder?: "asc" | "desc";
}

export async function getAdminUsers(options: GetAdminUsersOptions = {}) {
  const {
    page = 1,
    limit = 20,
    search,
    role,
    sort = "createdAt",
    sortOrder = "desc",
  } = options;

  const where = {
    ...(role ? { role } : {}),
    ...(search
      ? {
          OR: [
            { username: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
            { name: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [users, totalCount] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        avatarUrl: true,
        role: true,
        createdAt: true,
        _count: { select: { videos: true } },
      },
      orderBy: { [sort]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  // Get view counts for each user
  const usersWithViews = await Promise.all(
    users.map(async (user) => {
      const viewsResult = await prisma.video.aggregate({
        where: { userId: user.id },
        _sum: { viewCount: true },
      });
      return {
        ...user,
        videoCount: user._count.videos,
        totalViews: viewsResult._sum.viewCount ?? 0,
      };
    })
  );

  return {
    users: usersWithViews,
    totalCount,
    totalPages: Math.ceil(totalCount / limit),
  };
}

// ─── User Detail ─────────────────────────────────────

export async function getAdminUserById(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      avatarUrl: true,
      bannerUrl: true,
      bio: true,
      websiteUrl: true,
      location: true,
      role: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { videos: true } },
    },
  });

  if (!user) return null;

  const [viewsResult, statusCounts, recentVideos] = await Promise.all([
    prisma.video.aggregate({
      where: { userId },
      _sum: { viewCount: true },
    }),
    prisma.video.groupBy({
      by: ["status"],
      where: { userId },
      _count: true,
    }),
    prisma.video.findMany({
      where: { userId },
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        thumbnailUrl: true,
        viewCount: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  const statusMap = Object.fromEntries(
    statusCounts.map((s) => [s.status, s._count])
  );

  return {
    ...user,
    videoCount: user._count.videos,
    totalViews: viewsResult._sum.viewCount ?? 0,
    publishedCount: statusMap["PUBLISHED"] ?? 0,
    draftCount: statusMap["DRAFT"] ?? 0,
    processingCount: statusMap["PROCESSING"] ?? 0,
    recentVideos,
  };
}

// ─── Video Management ────────────────────────────────

interface GetAdminVideosOptions {
  page?: number;
  limit?: number;
  search?: string;
  status?: VideoStatus;
  categoryId?: string;
  userId?: string;
  sort?: "createdAt" | "title" | "viewCount" | "status";
  sortOrder?: "asc" | "desc";
}

export async function getAdminVideos(options: GetAdminVideosOptions = {}) {
  const {
    page = 1,
    limit = 20,
    search,
    status,
    categoryId,
    userId,
    sort = "createdAt",
    sortOrder = "desc",
  } = options;

  const where = {
    ...(status ? { status } : {}),
    ...(categoryId ? { categoryId } : {}),
    ...(userId ? { userId } : {}),
    ...(search
      ? { title: { contains: search, mode: "insensitive" as const } }
      : {}),
  };

  const [videos, totalCount] = await Promise.all([
    prisma.video.findMany({
      where,
      include: {
        creator: {
          select: { id: true, name: true, username: true, avatarUrl: true },
        },
        category: { select: { id: true, name: true } },
        processingJobs: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { [sort]: sortOrder },
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

// ─── Video Detail ────────────────────────────────────

export async function getAdminVideoById(videoId: string) {
  return prisma.video.findUnique({
    where: { id: videoId },
    include: {
      creator: {
        select: {
          id: true,
          name: true,
          username: true,
          avatarUrl: true,
          role: true,
        },
      },
      category: true,
      videoTags: { include: { tag: true } },
      processingJobs: { orderBy: { createdAt: "desc" } },
    },
  });
}

// ─── Category Management ─────────────────────────────

export async function getAdminCategories() {
  const categories = await prisma.category.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      sortOrder: true,
      createdAt: true,
      _count: { select: { videos: true } },
    },
    orderBy: { name: "asc" },
  });

  // Also get published-only counts
  const withPublishedCounts = await Promise.all(
    categories.map(async (cat) => {
      const publishedCount = await prisma.video.count({
        where: { categoryId: cat.id, status: "PUBLISHED" },
      });
      return {
        ...cat,
        totalVideoCount: cat._count.videos,
        publishedVideoCount: publishedCount,
      };
    })
  );

  return withPublishedCounts;
}

// ─── Tag Management ──────────────────────────────────

interface GetAdminTagsOptions {
  page?: number;
  limit?: number;
  search?: string;
  sort?: "name" | "createdAt";
  sortOrder?: "asc" | "desc";
}

export async function getAdminTags(options: GetAdminTagsOptions = {}) {
  const {
    page = 1,
    limit = 20,
    search,
    sort = "name",
    sortOrder = "asc",
  } = options;

  const where = {
    ...(search
      ? { name: { contains: search, mode: "insensitive" as const } }
      : {}),
  };

  const [tags, totalCount] = await Promise.all([
    prisma.tag.findMany({
      where,
      select: {
        id: true,
        name: true,
        slug: true,
        createdAt: true,
        _count: { select: { videoTags: true } },
      },
      orderBy: { [sort]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.tag.count({ where }),
  ]);

  return {
    tags: tags.map((tag) => ({
      ...tag,
      videoCount: tag._count.videoTags,
    })),
    totalCount,
    totalPages: Math.ceil(totalCount / limit),
  };
}

// ─── All Tags (for merge dropdown) ───────────────────

export async function getAllTags() {
  return prisma.tag.findMany({
    select: { id: true, name: true, slug: true },
    orderBy: { name: "asc" },
  });
}

// ─── Processing Jobs ─────────────────────────────────

interface GetAdminProcessingJobsOptions {
  page?: number;
  limit?: number;
  status?: ProcessingJobStatus;
  sort?: "createdAt" | "status";
  sortOrder?: "asc" | "desc";
}

export async function getAdminProcessingJobs(
  options: GetAdminProcessingJobsOptions = {}
) {
  const {
    page = 1,
    limit = 20,
    status,
    sort = "createdAt",
    sortOrder = "desc",
  } = options;

  const where = {
    ...(status ? { status } : {}),
  };

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [jobs, totalCount, queuedCount, processingCount, completedToday, failedToday] =
    await Promise.all([
      prisma.processingJob.findMany({
        where,
        include: {
          video: {
            select: {
              id: true,
              title: true,
              slug: true,
              creator: {
                select: { id: true, name: true, username: true },
              },
            },
          },
        },
        orderBy: { [sort]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.processingJob.count({ where }),
      prisma.processingJob.count({ where: { status: "QUEUED" } }),
      prisma.processingJob.count({ where: { status: "PROCESSING" } }),
      prisma.processingJob.count({
        where: { status: "COMPLETED", completedAt: { gte: todayStart } },
      }),
      prisma.processingJob.count({
        where: { status: "FAILED", completedAt: { gte: todayStart } },
      }),
    ]);

  return {
    jobs,
    totalCount,
    totalPages: Math.ceil(totalCount / limit),
    summary: {
      queued: queuedCount,
      processing: processingCount,
      completedToday,
      failedToday,
    },
  };
}
