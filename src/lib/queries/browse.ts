import prisma from "@/lib/prisma";

// ─── Types ───────────────────────────────────────────

interface PaginationOptions {
  page?: number;
  limit?: number;
  sort?: "latest" | "popular";
}

// ─── Homepage Data ───────────────────────────────────

export async function getHomepageData() {
  const [trending, latest, categories, categorySections] = await Promise.all([
    // Trending: top 8 by viewCount
    prisma.video.findMany({
      where: { status: "PUBLISHED" },
      include: {
        creator: { select: { id: true, name: true, username: true, avatarUrl: true } },
        category: true,
      },
      orderBy: { viewCount: "desc" },
      take: 8,
    }),
    // Latest: most recent 8
    prisma.video.findMany({
      where: { status: "PUBLISHED" },
      include: {
        creator: { select: { id: true, name: true, username: true, avatarUrl: true } },
        category: true,
      },
      orderBy: { publishedAt: "desc" },
      take: 8,
    }),
    // All categories
    prisma.category.findMany({
      orderBy: { sortOrder: "asc" },
    }),
    // Top 3 categories with most videos, 4 videos each
    getTopCategorySections(3, 4),
  ]);

  return { trending, latest, categories, categorySections };
}

async function getTopCategorySections(categoryCount: number, videosPerCategory: number) {
  // Get categories that have published videos, ordered by video count
  const categoriesWithCount = await prisma.category.findMany({
    where: {
      videos: { some: { status: "PUBLISHED" } },
    },
    include: {
      _count: { select: { videos: true } },
    },
    orderBy: { sortOrder: "asc" },
    take: categoryCount,
  });

  const sections = await Promise.all(
    categoriesWithCount.map(async (cat) => {
      const videos = await prisma.video.findMany({
        where: { status: "PUBLISHED", categoryId: cat.id },
        include: {
          creator: { select: { id: true, name: true, username: true, avatarUrl: true } },
          category: true,
        },
        orderBy: { publishedAt: "desc" },
        take: videosPerCategory,
      });
      return { category: cat, videos };
    })
  );

  return sections;
}

// ─── Browse Videos (Paginated) ───────────────────────

interface BrowseOptions extends PaginationOptions {
  categorySlug?: string;
  tagSlug?: string;
}

export async function getBrowseVideos(options: BrowseOptions = {}) {
  const { page = 1, limit = 24, sort = "latest", categorySlug, tagSlug } = options;

  const where: Record<string, unknown> = { status: "PUBLISHED" as const };

  if (categorySlug) {
    where.category = { slug: categorySlug };
  }
  if (tagSlug) {
    where.videoTags = { some: { tag: { slug: tagSlug } } };
  }

  const [videos, totalCount] = await Promise.all([
    prisma.video.findMany({
      where,
      include: {
        creator: { select: { id: true, name: true, username: true, avatarUrl: true } },
        category: true,
      },
      orderBy: sort === "popular" ? { viewCount: "desc" } : { publishedAt: "desc" },
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

// ─── Category Queries ────────────────────────────────

export async function getCategoryBySlug(slug: string) {
  return prisma.category.findUnique({
    where: { slug },
    include: {
      _count: { select: { videos: { where: { status: "PUBLISHED" } } } },
    },
  });
}

export async function getCategoryVideos(categoryId: string, options: PaginationOptions = {}) {
  const { page = 1, limit = 24, sort = "latest" } = options;

  const where = { status: "PUBLISHED" as const, categoryId };

  const [videos, totalCount] = await Promise.all([
    prisma.video.findMany({
      where,
      include: {
        creator: { select: { id: true, name: true, username: true, avatarUrl: true } },
        category: true,
      },
      orderBy: sort === "popular" ? { viewCount: "desc" } : { publishedAt: "desc" },
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

// ─── Tag Queries ─────────────────────────────────────

export async function getTagBySlug(slug: string) {
  return prisma.tag.findUnique({
    where: { slug },
    include: {
      _count: { select: { videoTags: true } },
    },
  });
}

export async function getTagVideos(tagId: string, options: PaginationOptions = {}) {
  const { page = 1, limit = 24, sort = "latest" } = options;

  const where = {
    status: "PUBLISHED" as const,
    videoTags: { some: { tagId } },
  };

  const [videos, totalCount] = await Promise.all([
    prisma.video.findMany({
      where,
      include: {
        creator: { select: { id: true, name: true, username: true, avatarUrl: true } },
        category: true,
      },
      orderBy: sort === "popular" ? { viewCount: "desc" } : { publishedAt: "desc" },
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

// ─── Utility Queries ─────────────────────────────────

export async function getAllCategories() {
  return prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
  });
}

export async function getTrendingTags(limit: number = 10) {
  return prisma.tag.findMany({
    include: {
      _count: { select: { videoTags: true } },
    },
    orderBy: { videoTags: { _count: "desc" } },
    take: limit,
  });
}
