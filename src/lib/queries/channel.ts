import prisma from "@/lib/prisma";

// ─── Get Channel By Username ────────────────────────

export async function getChannelByUsername(username: string) {
  const user = await prisma.user.findFirst({
    where: { username: { equals: username, mode: "insensitive" } },
    select: {
      id: true,
      name: true,
      username: true,
      avatarUrl: true,
      bannerUrl: true,
      bio: true,
      websiteUrl: true,
      location: true,
      role: true,
      createdAt: true,
    },
  });

  if (!user) return null;

  const [videoCount, viewsResult] = await Promise.all([
    prisma.video.count({
      where: { userId: user.id, status: "PUBLISHED" },
    }),
    prisma.video.aggregate({
      where: { userId: user.id, status: "PUBLISHED" },
      _sum: { viewCount: true },
    }),
  ]);

  return {
    ...user,
    videoCount,
    totalViews: viewsResult._sum.viewCount ?? 0,
  };
}

// ─── Get Channel Videos (Paginated) ─────────────────

interface ChannelVideoOptions {
  page?: number;
  limit?: number;
  sort?: "recent" | "popular" | "oldest";
  categorySlug?: string;
}

export async function getChannelVideos(
  userId: string,
  options: ChannelVideoOptions = {}
) {
  const { page = 1, limit = 12, sort = "recent", categorySlug } = options;

  const where: Record<string, unknown> = {
    userId,
    status: "PUBLISHED" as const,
  };

  if (categorySlug) {
    where.category = { slug: categorySlug };
  }

  const orderBy =
    sort === "popular"
      ? { viewCount: "desc" as const }
      : sort === "oldest"
        ? { publishedAt: "asc" as const }
        : { publishedAt: "desc" as const };

  const [videos, totalCount] = await Promise.all([
    prisma.video.findMany({
      where,
      include: {
        creator: {
          select: { id: true, name: true, username: true, avatarUrl: true },
        },
        category: true,
      },
      orderBy,
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

// ─── Get Channel Categories ─────────────────────────

export async function getChannelCategories(userId: string) {
  const categories = await prisma.category.findMany({
    where: {
      videos: { some: { userId, status: "PUBLISHED" } },
    },
    include: {
      _count: {
        select: {
          videos: { where: { userId, status: "PUBLISHED" } },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    videoCount: cat._count.videos,
  }));
}

// ─── Get Channel Stats ──────────────────────────────

export async function getChannelStats(userId: string) {
  const [videoCount, viewsResult, mostPopular, recentUpload] =
    await Promise.all([
      prisma.video.count({
        where: { userId, status: "PUBLISHED" },
      }),
      prisma.video.aggregate({
        where: { userId, status: "PUBLISHED" },
        _sum: { viewCount: true },
      }),
      prisma.video.findFirst({
        where: { userId, status: "PUBLISHED" },
        orderBy: { viewCount: "desc" },
        select: {
          id: true,
          title: true,
          slug: true,
          viewCount: true,
          thumbnailUrl: true,
        },
      }),
      prisma.video.findFirst({
        where: { userId, status: "PUBLISHED" },
        orderBy: { publishedAt: "desc" },
        select: {
          id: true,
          title: true,
          slug: true,
          publishedAt: true,
          thumbnailUrl: true,
        },
      }),
    ]);

  return {
    totalVideos: videoCount,
    totalViews: viewsResult._sum.viewCount ?? 0,
    mostPopular,
    recentUpload,
  };
}
