import prisma from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";

// TODO: Replace with dedicated search engine (Meilisearch/Typesense/Elasticsearch) in production

// ─── Types ──────────────────────────────────────────

export interface SearchFilters {
  query: string;
  category?: string; // category slug
  tag?: string; // tag slug
  sort?: "relevance" | "recent" | "popular" | "views";
  duration?: "short" | "medium" | "long"; // <4min, 4-20min, >20min
  uploadDate?: "today" | "week" | "month" | "year";
  page?: number;
  limit?: number;
}

export interface SearchResultVideo {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  thumbnailUrl: string | null;
  duration: number | null;
  viewCount: number;
  publishedAt: Date | null;
  createdAt: Date;
  creator: {
    id: string;
    name: string;
    username: string;
    avatarUrl: string | null;
  };
  category: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

export interface SearchResult {
  videos: SearchResultVideo[];
  totalCount: number;
  totalPages: number;
  query: string;
  appliedFilters: SearchFilters;
}

export interface CreatorResult {
  id: string;
  name: string;
  username: string;
  avatarUrl: string | null;
  videoCount: number;
}

// ─── Search Videos ──────────────────────────────────

export async function searchVideos(
  filters: SearchFilters
): Promise<SearchResult> {
  const {
    query,
    category,
    tag,
    sort = "relevance",
    duration,
    uploadDate,
    page = 1,
    limit = 20,
  } = filters;

  const offset = (page - 1) * limit;

  // Build WHERE conditions
  const conditions: string[] = [`v."status" = 'PUBLISHED'`];
  const params: unknown[] = [query];
  let paramIdx = 2;

  // Full-text search condition
  conditions.push(
    `to_tsvector('english', v."title" || ' ' || coalesce(v."description", '')) @@ plainto_tsquery('english', $1)`
  );

  // Category filter
  if (category) {
    conditions.push(`c."slug" = $${paramIdx}`);
    params.push(category);
    paramIdx++;
  }

  // Tag filter
  if (tag) {
    conditions.push(
      `EXISTS (SELECT 1 FROM "VideoTag" vt JOIN "Tag" t ON t."id" = vt."tagId" WHERE vt."videoId" = v."id" AND t."slug" = $${paramIdx})`
    );
    params.push(tag);
    paramIdx++;
  }

  // Duration filter
  if (duration === "short") {
    conditions.push(`v."duration" IS NOT NULL AND v."duration" < 240`);
  } else if (duration === "medium") {
    conditions.push(
      `v."duration" IS NOT NULL AND v."duration" >= 240 AND v."duration" <= 1200`
    );
  } else if (duration === "long") {
    conditions.push(`v."duration" IS NOT NULL AND v."duration" > 1200`);
  }

  // Upload date filter
  if (uploadDate === "today") {
    conditions.push(`v."publishedAt" > NOW() - INTERVAL '1 day'`);
  } else if (uploadDate === "week") {
    conditions.push(`v."publishedAt" > NOW() - INTERVAL '7 days'`);
  } else if (uploadDate === "month") {
    conditions.push(`v."publishedAt" > NOW() - INTERVAL '30 days'`);
  } else if (uploadDate === "year") {
    conditions.push(`v."publishedAt" > NOW() - INTERVAL '365 days'`);
  }

  const whereClause = conditions.join(" AND ");

  // Sort clause
  let orderClause: string;
  if (sort === "recent") {
    orderClause = `v."publishedAt" DESC NULLS LAST`;
  } else if (sort === "popular" || sort === "views") {
    orderClause = `v."viewCount" DESC`;
  } else {
    // relevance (default)
    orderClause = `ts_rank(to_tsvector('english', v."title" || ' ' || coalesce(v."description", '')), plainto_tsquery('english', $1)) DESC`;
  }

  // Count query
  const countQuery = `
    SELECT COUNT(*)::int as count
    FROM "Video" v
    LEFT JOIN "Category" c ON c."id" = v."categoryId"
    WHERE ${whereClause}
  `;

  // Main query
  params.push(limit, offset);
  const mainQuery = `
    SELECT
      v."id", v."title", v."slug", v."description", v."thumbnailUrl",
      v."duration", v."viewCount", v."publishedAt", v."createdAt",
      u."id" as "creatorId", u."name" as "creatorName",
      u."username" as "creatorUsername", u."avatarUrl" as "creatorAvatarUrl",
      c."id" as "categoryId", c."name" as "categoryName", c."slug" as "categorySlug"
    FROM "Video" v
    JOIN "User" u ON u."id" = v."userId"
    LEFT JOIN "Category" c ON c."id" = v."categoryId"
    WHERE ${whereClause}
    ORDER BY ${orderClause}
    LIMIT $${paramIdx} OFFSET $${paramIdx + 1}
  `;

  const [countResult, rows] = await Promise.all([
    prisma.$queryRawUnsafe<[{ count: number }]>(countQuery, ...params.slice(0, paramIdx - 1)),
    prisma.$queryRawUnsafe<RawVideoRow[]>(mainQuery, ...params),
  ]);

  const totalCount = countResult[0]?.count ?? 0;

  const videos: SearchResultVideo[] = rows.map(mapRawVideoRow);

  return {
    videos,
    totalCount,
    totalPages: Math.ceil(totalCount / limit),
    query,
    appliedFilters: filters,
  };
}

// ─── Search Suggestions ─────────────────────────────

export async function getSearchSuggestions(
  query: string,
  limit: number = 8
): Promise<string[]> {
  if (!query.trim()) return [];

  const sanitized = query.trim().replace(/%/g, "\\%").replace(/_/g, "\\_");

  const results = await prisma.$queryRawUnsafe<{ title: string }[]>(
    `
    SELECT DISTINCT "title"
    FROM "Video"
    WHERE "status" = 'PUBLISHED'
      AND "title" ILIKE $1
    ORDER BY "title"
    LIMIT $2
    `,
    `%${sanitized}%`,
    limit
  );

  return results.map((r) => r.title);
}

// ─── Search Creators ────────────────────────────────

export async function searchCreators(
  query: string,
  limit: number = 5
): Promise<CreatorResult[]> {
  if (!query.trim()) return [];

  const sanitized = query.trim().replace(/%/g, "\\%").replace(/_/g, "\\_");

  const results = await prisma.$queryRawUnsafe<
    Array<{
      id: string;
      name: string;
      username: string;
      avatarUrl: string | null;
      videoCount: number;
    }>
  >(
    `
    SELECT
      u."id", u."name", u."username", u."avatarUrl",
      COUNT(v."id")::int as "videoCount"
    FROM "User" u
    JOIN "Video" v ON v."userId" = u."id" AND v."status" = 'PUBLISHED'
    WHERE u."username" ILIKE $1 OR u."name" ILIKE $1
    GROUP BY u."id", u."name", u."username", u."avatarUrl"
    HAVING COUNT(v."id") > 0
    ORDER BY COUNT(v."id") DESC
    LIMIT $2
    `,
    `%${sanitized}%`,
    limit
  );

  return results;
}

// ─── Trending / Landing Data ────────────────────────

export async function getSearchLandingData() {
  const [trendingVideos, popularCategories, popularTags] = await Promise.all([
    prisma.video.findMany({
      where: { status: "PUBLISHED" },
      include: {
        creator: {
          select: { id: true, name: true, username: true, avatarUrl: true },
        },
        category: true,
      },
      orderBy: { viewCount: "desc" },
      take: 8,
    }),
    prisma.category.findMany({
      where: { videos: { some: { status: "PUBLISHED" } } },
      include: { _count: { select: { videos: { where: { status: "PUBLISHED" } } } } },
      orderBy: { sortOrder: "asc" },
      take: 12,
    }),
    prisma.tag.findMany({
      include: { _count: { select: { videoTags: true } } },
      orderBy: { videoTags: { _count: "desc" } },
      take: 16,
    }),
  ]);

  return { trendingVideos, popularCategories, popularTags };
}

// ─── Internal Helpers ───────────────────────────────

interface RawVideoRow {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  thumbnailUrl: string | null;
  duration: number | null;
  viewCount: number;
  publishedAt: Date | null;
  createdAt: Date;
  creatorId: string;
  creatorName: string;
  creatorUsername: string;
  creatorAvatarUrl: string | null;
  categoryId: string | null;
  categoryName: string | null;
  categorySlug: string | null;
}

function mapRawVideoRow(row: RawVideoRow): SearchResultVideo {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description,
    thumbnailUrl: row.thumbnailUrl,
    duration: row.duration,
    viewCount: row.viewCount,
    publishedAt: row.publishedAt,
    createdAt: row.createdAt,
    creator: {
      id: row.creatorId,
      name: row.creatorName,
      username: row.creatorUsername,
      avatarUrl: row.creatorAvatarUrl,
    },
    category:
      row.categoryId && row.categoryName && row.categorySlug
        ? {
            id: row.categoryId,
            name: row.categoryName,
            slug: row.categorySlug,
          }
        : null,
  };
}
