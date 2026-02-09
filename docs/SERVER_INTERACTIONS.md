# Server Interactions Specification

> Complete specification for all server-side data fetching, mutations, API routes, and server actions in the Video Platform MVP.
> **This is the single source of truth for all server-side data flow decisions.**
> Claude Code must reference this document when building any data fetching, mutation, or API endpoint.

---

## Table of Contents

1. [Data Fetching Rules](#1-data-fetching-rules)
2. [Server Actions](#2-server-actions)
3. [API Route Handlers](#3-api-route-handlers)
4. [Data Access Patterns](#4-data-access-patterns)
5. [Error Handling & Revalidation](#5-error-handling--revalidation)
6. [Security Checklist](#6-security-checklist)

---

## 1. Data Fetching Rules

### 1.1 Core Principles

- **ALL database reads happen in Server Components.** Never fetch data in Client Components.
- Use Prisma queries directly in Server Components — no intermediate API layer for reads.
- For related data, use Prisma `include`/`select` to avoid N+1 queries.
- Always select only needed fields for list views (don't fetch full video descriptions for grid cards).
- Use `Promise.all()` to parallelize independent queries on the same page.

### 1.2 Select Fields by Context

**List views (VideoCard, VideoGrid, homepage sections):**

Only select fields needed for card rendering — never fetch `description`, `fileUrl`, `hlsUrl`, or `passwordHash`:

```typescript
const videoListSelect = {
  id: true,
  title: true,
  slug: true,
  thumbnailUrl: true,
  duration: true,
  viewCount: true,
  createdAt: true,
  creator: {
    select: {
      name: true,
      username: true,
      avatarUrl: true,
    },
  },
} as const;
```

**Detail views (Watch page, edit page):**

Fetch full video data including relations:

```typescript
const videoDetailSelect = {
  id: true,
  title: true,
  slug: true,
  description: true,
  duration: true,
  fileUrl: true,
  hlsUrl: true,
  thumbnailUrl: true,
  viewCount: true,
  status: true,
  publishedAt: true,
  createdAt: true,
  updatedAt: true,
  userId: true,
  categoryId: true,
  creator: {
    select: {
      id: true,
      name: true,
      username: true,
      avatarUrl: true,
      bio: true,
    },
  },
  category: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },
  tags: {
    include: {
      tag: true,
    },
  },
} as const;
```

### 1.3 Pagination Pattern

All paginated queries use offset-based pagination with `skip`/`take`:

```typescript
const page = Number(searchParams?.page) || 1;
const perPage = 24; // 6 rows of 4 columns, or 8 rows of 3

const [items, totalCount] = await Promise.all([
  prisma.video.findMany({
    where: { status: "PUBLISHED" },
    select: videoListSelect,
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * perPage,
    take: perPage,
  }),
  prisma.video.count({
    where: { status: "PUBLISHED" },
  }),
]);

const totalPages = Math.ceil(totalCount / perPage);
```

**Per-page defaults:**
- Homepage sections: 8 videos per section (no pagination, "See all" link)
- Category page: 24 videos
- Search results: 24 videos
- Channel page: 24 videos
- Dashboard videos table: 20 videos
- Admin tables: 20 items

### 1.4 Page-Level Data Fetching Patterns

#### Homepage — `(main)/page.tsx`

```typescript
import prisma from "@/lib/prisma";

const videoListSelect = {
  id: true,
  title: true,
  slug: true,
  thumbnailUrl: true,
  duration: true,
  viewCount: true,
  createdAt: true,
  creator: {
    select: { name: true, username: true, avatarUrl: true },
  },
} as const;

export default async function HomePage() {
  const [trending, latest, categories] = await Promise.all([
    // Top 8 by view count (published only)
    prisma.video.findMany({
      where: { status: "PUBLISHED" },
      select: videoListSelect,
      orderBy: { viewCount: "desc" },
      take: 8,
    }),
    // Newest 8 (published only)
    prisma.video.findMany({
      where: { status: "PUBLISHED" },
      select: videoListSelect,
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    // First 3 categories with their top 4 videos each
    prisma.category.findMany({
      orderBy: { sortOrder: "asc" },
      take: 3,
      include: {
        videos: {
          where: { status: "PUBLISHED" },
          select: videoListSelect,
          orderBy: { viewCount: "desc" },
          take: 4,
        },
      },
    }),
  ]);

  return (
    <>
      {/* Render Trending, Latest, Category sections */}
    </>
  );
}
```

#### Category Page — `(main)/category/[slug]/page.tsx`

```typescript
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";

type SortOption = "latest" | "most-viewed" | "oldest";

const sortMap: Record<SortOption, object> = {
  "latest": { createdAt: "desc" as const },
  "most-viewed": { viewCount: "desc" as const },
  "oldest": { createdAt: "asc" as const },
};

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string; sort?: string }>;
}) {
  const { slug } = await params;
  const { page: pageParam, sort: sortParam } = await searchParams;
  const page = Number(pageParam) || 1;
  const sort = (sortParam as SortOption) || "latest";
  const perPage = 24;

  const category = await prisma.category.findUnique({
    where: { slug },
  });

  if (!category) notFound();

  const [videos, totalCount] = await Promise.all([
    prisma.video.findMany({
      where: { categoryId: category.id, status: "PUBLISHED" },
      select: videoListSelect,
      orderBy: sortMap[sort],
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.video.count({
      where: { categoryId: category.id, status: "PUBLISHED" },
    }),
  ]);

  return (
    <>
      {/* Render category header, sort controls, video grid, pagination */}
    </>
  );
}
```

#### Watch Page — `(main)/watch/[slug]/page.tsx`

```typescript
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function WatchPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const video = await prisma.video.findUnique({
    where: { slug },
    select: videoDetailSelect,
  });

  if (!video || (video.status !== "PUBLISHED" && video.status !== "UNLISTED")) {
    notFound();
  }

  // Fetch related videos — same category, excluding current video
  const relatedVideos = await prisma.video.findMany({
    where: {
      status: "PUBLISHED",
      id: { not: video.id },
      ...(video.categoryId ? { categoryId: video.categoryId } : {}),
    },
    select: videoListSelect,
    orderBy: { viewCount: "desc" },
    take: 12,
  });

  return (
    <>
      {/* Render VideoPlayer (client), video info, related sidebar */}
    </>
  );
}
```

#### Search Page — `(main)/search/page.tsx`

```typescript
import prisma from "@/lib/prisma";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; sort?: string; category?: string }>;
}) {
  const { q, page: pageParam, sort: sortParam, category } = await searchParams;
  const query = q?.trim() || "";
  const page = Number(pageParam) || 1;
  const sort = sortParam || "relevance";
  const perPage = 24;

  if (!query) {
    return (
      <>
        {/* Empty search state — prompt user to enter a query */}
      </>
    );
  }

  const where = {
    status: "PUBLISHED" as const,
    OR: [
      { title: { contains: query, mode: "insensitive" as const } },
      { description: { contains: query, mode: "insensitive" as const } },
    ],
    ...(category ? { category: { slug: category } } : {}),
  };

  const orderBy =
    sort === "latest"
      ? { createdAt: "desc" as const }
      : sort === "most-viewed"
        ? { viewCount: "desc" as const }
        : { viewCount: "desc" as const }; // "relevance" fallback — use viewCount until full-text search is configured

  const [videos, totalCount, categories] = await Promise.all([
    prisma.video.findMany({
      where,
      select: videoListSelect,
      orderBy,
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.video.count({ where }),
    prisma.category.findMany({
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true, slug: true },
    }),
  ]);

  return (
    <>
      {/* Render search header, filter bar, results grid, pagination */}
    </>
  );
}
```

#### Channel Page — `(main)/channel/[username]/page.tsx`

```typescript
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function ChannelPage({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { username } = await params;
  const { page: pageParam } = await searchParams;
  const page = Number(pageParam) || 1;
  const perPage = 24;

  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      name: true,
      username: true,
      avatarUrl: true,
      bio: true,
      createdAt: true,
      _count: {
        select: {
          videos: { where: { status: "PUBLISHED" } },
        },
      },
    },
  });

  if (!user) notFound();

  const [videos, totalViews] = await Promise.all([
    prisma.video.findMany({
      where: { userId: user.id, status: "PUBLISHED" },
      select: {
        id: true,
        title: true,
        slug: true,
        thumbnailUrl: true,
        duration: true,
        viewCount: true,
        createdAt: true,
        // No creator select — redundant on channel page
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.video.aggregate({
      where: { userId: user.id, status: "PUBLISHED" },
      _sum: { viewCount: true },
    }),
  ]);

  return (
    <>
      {/* Render channel banner, avatar, stats, tabs (Videos/About) */}
    </>
  );
}
```

#### Dashboard Overview — `(dashboard)/dashboard/page.tsx`

```typescript
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/auth-utils";

export default async function DashboardPage() {
  const user = await requireRole("CREATOR");

  const [totalVideos, publishedVideos, totalViews, recentVideos] =
    await Promise.all([
      prisma.video.count({ where: { userId: user.id } }),
      prisma.video.count({
        where: { userId: user.id, status: "PUBLISHED" },
      }),
      prisma.video.aggregate({
        where: { userId: user.id },
        _sum: { viewCount: true },
      }),
      prisma.video.findMany({
        where: { userId: user.id },
        select: {
          id: true,
          title: true,
          slug: true,
          thumbnailUrl: true,
          status: true,
          viewCount: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

  return (
    <>
      {/* Render stats cards, recent videos table */}
    </>
  );
}
```

#### Dashboard Videos — `(dashboard)/videos/page.tsx`

```typescript
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/auth-utils";

export default async function DashboardVideosPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string }>;
}) {
  const user = await requireRole("CREATOR");
  const { page: pageParam, status } = await searchParams;
  const page = Number(pageParam) || 1;
  const perPage = 20;

  const where = {
    userId: user.id,
    ...(status ? { status: status as any } : {}),
  };

  const [videos, totalCount] = await Promise.all([
    prisma.video.findMany({
      where,
      select: {
        id: true,
        title: true,
        slug: true,
        thumbnailUrl: true,
        status: true,
        viewCount: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.video.count({ where }),
  ]);

  return (
    <>
      {/* Render videos table with status filter, actions, pagination */}
    </>
  );
}
```

#### Admin Dashboard — `(admin)/admin/page.tsx`

```typescript
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/auth-utils";

export default async function AdminDashboardPage() {
  await requireRole("ADMIN");

  const [totalVideos, pendingReview, totalUsers, totalCategories] =
    await Promise.all([
      prisma.video.count(),
      prisma.video.count({ where: { status: "DRAFT" } }),
      prisma.user.count(),
      prisma.category.count(),
    ]);

  return (
    <>
      {/* Render admin stats cards */}
    </>
  );
}
```

#### Admin Videos — `(admin)/admin/videos/page.tsx`

```typescript
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/auth-utils";

export default async function AdminVideosPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string; q?: string }>;
}) {
  await requireRole("ADMIN");
  const { page: pageParam, status, q } = await searchParams;
  const page = Number(pageParam) || 1;
  const perPage = 20;

  const where = {
    ...(status ? { status: status as any } : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" as const } },
            { creator: { name: { contains: q, mode: "insensitive" as const } } },
          ],
        }
      : {}),
  };

  const [videos, totalCount] = await Promise.all([
    prisma.video.findMany({
      where,
      select: {
        id: true,
        title: true,
        slug: true,
        thumbnailUrl: true,
        status: true,
        viewCount: true,
        createdAt: true,
        creator: {
          select: { id: true, name: true, username: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.video.count({ where }),
  ]);

  return (
    <>
      {/* Render admin videos table with filters, actions */}
    </>
  );
}
```

#### Admin Users — `(admin)/admin/users/page.tsx`

```typescript
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/auth-utils";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; role?: string; q?: string }>;
}) {
  await requireRole("ADMIN");
  const { page: pageParam, role, q } = await searchParams;
  const page = Number(pageParam) || 1;
  const perPage = 20;

  const where = {
    ...(role ? { role: role as any } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { email: { contains: q, mode: "insensitive" as const } },
            { username: { contains: q, mode: "insensitive" as const } },
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
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.user.count({ where }),
  ]);

  return (
    <>
      {/* Render users table with role filter, search, actions */}
    </>
  );
}
```

#### Admin Categories — `(admin)/admin/categories/page.tsx`

```typescript
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/auth-utils";

export default async function AdminCategoriesPage() {
  await requireRole("ADMIN");

  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      _count: { select: { videos: true } },
    },
  });

  return (
    <>
      {/* Render category list with video counts, edit/add actions */}
    </>
  );
}
```

### 1.5 Header Data Fetching

The Header component needs the categories list for the dropdown. Fetch in the layout that renders the Header:

```typescript
// src/app/(main)/layout.tsx
import prisma from "@/lib/prisma";
import { Header } from "@/components/layout/Header";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true, slug: true },
  });

  return (
    <>
      <Header categories={categories} />
      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      <Footer />
    </>
  );
}
```

---

## 2. Server Actions

### 2.1 Rules

- **ALL mutations go through Server Actions**, NOT API Route Handlers.
- Server Actions live in `src/app/actions/` directory, grouped by domain.
- Every Server Action file starts with `"use server"`.
- Every Server Action MUST:
  1. Validate input with Zod 4
  2. Check auth session
  3. Check role permissions
  4. Perform mutation
  5. Revalidate affected paths
  6. Return typed result
- Server Action parameters MUST be typed objects, NOT `FormData`. Parse `FormData` in the calling Client Component and pass typed data to the action.

### 2.2 Return Type Convention

Every Server Action returns one of:

```typescript
type ActionResult<T = void> =
  | { success: true; data?: T }
  | {
      success: false;
      error: string;
      fieldErrors?: Record<string, string[]>;
    };
```

### 2.3 Auth Actions — `src/app/actions/auth.ts`

> Full implementation details in `docs/AUTH.md`. Below is the action signature reference.

```typescript
"use server";

import { hash, compare } from "bcryptjs";
import { signIn } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "@/lib/validations/auth";

// ─── Register ─────────────────────────────────────────────

export async function registerUser(input: z.input<typeof registerSchema>) {
  // 1. Validate input with Zod 4
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false as const,
      error: "Validation failed",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { name, username, email, password } = parsed.data;

  // 2. No auth check needed — public action
  // 3. Check uniqueness (email + username)
  const [existingEmail, existingUsername] = await Promise.all([
    prisma.user.findUnique({ where: { email: email.toLowerCase() } }),
    prisma.user.findUnique({ where: { username: username.toLowerCase() } }),
  ]);

  if (existingEmail) {
    return {
      success: false as const,
      error: "An account with this email already exists",
    };
  }
  if (existingUsername) {
    return {
      success: false as const,
      error: "This username is already taken",
    };
  }

  // 4. Hash password and create user
  const passwordHash = await hash(password, 12);
  await prisma.user.create({
    data: {
      name,
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      passwordHash,
      role: "VIEWER",
    },
  });

  // 5. Auto sign-in
  await signIn("credentials", {
    email: email.toLowerCase(),
    password,
    redirect: false,
  });

  // 6. Return success
  return { success: true as const };
}

// ─── Request Password Reset ───────────────────────────────

export async function requestPasswordReset(
  input: z.input<typeof forgotPasswordSchema>
) {
  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false as const,
      error: "Validation failed",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { email } = parsed.data;

  // Find user — but always return same message regardless
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (user) {
    // Generate token
    const token = crypto.randomUUID();
    const hashedToken = await hash(token, 12);

    // Store hashed token
    await prisma.verificationToken.create({
      data: {
        identifier: email.toLowerCase(),
        token: hashedToken,
        expires: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      },
    });

    // MVP: Log to console instead of sending email
    console.log(
      `[Password Reset] Link: /reset-password?token=${token}&email=${email}`
    );
  }

  // Always return the same message — prevent email enumeration
  return { success: true as const };
}

// ─── Reset Password ───────────────────────────────────────

export async function resetPassword(
  input: z.input<typeof resetPasswordSchema>
) {
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false as const,
      error: "Validation failed",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { email, token, password } = parsed.data;

  // Find verification tokens for this email
  const tokens = await prisma.verificationToken.findMany({
    where: { identifier: email.toLowerCase() },
  });

  // Compare raw token against each stored hash
  let matchedToken: typeof tokens[0] | null = null;
  for (const t of tokens) {
    const isMatch = await compare(token, t.token);
    if (isMatch) {
      matchedToken = t;
      break;
    }
  }

  if (!matchedToken) {
    return {
      success: false as const,
      error: "This reset link is invalid or has expired",
    };
  }

  // Check expiry
  if (matchedToken.expires < new Date()) {
    return {
      success: false as const,
      error: "This reset link is invalid or has expired",
    };
  }

  // Update password
  const passwordHash = await hash(password, 12);
  await prisma.user.update({
    where: { email: email.toLowerCase() },
    data: { passwordHash },
  });

  // Delete used token
  await prisma.verificationToken.delete({
    where: {
      identifier_token: {
        identifier: email.toLowerCase(),
        token: matchedToken.token,
      },
    },
  });

  return { success: true as const };
}
```

### 2.4 Video Actions — `src/app/actions/video.ts`

```typescript
"use server";

import { auth } from "@/lib/auth";
import { requireRole } from "@/lib/auth-utils";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import slugify from "slugify";

// ─── Schemas ──────────────────────────────────────────────

const createVideoSchema = z.object({
  title: z.string().min(1, { error: "Title is required" }).max(200, { error: "Title must be at most 200 characters" }),
  description: z.string().max(5000, { error: "Description must be at most 5000 characters" }).optional(),
  categoryId: z.string().optional(),
  tags: z.array(z.string()).max(10, { error: "Maximum 10 tags" }).optional(),
  fileUrl: z.string().min(1, { error: "File URL is required" }),
});

const updateVideoSchema = z.object({
  videoId: z.string(),
  title: z.string().min(1, { error: "Title is required" }).max(200, { error: "Title must be at most 200 characters" }),
  description: z.string().max(5000, { error: "Description must be at most 5000 characters" }).optional(),
  categoryId: z.string().optional(),
  tags: z.array(z.string()).max(10, { error: "Maximum 10 tags" }).optional(),
});

// ─── Create Video ─────────────────────────────────────────

export async function createVideo(input: z.input<typeof createVideoSchema>) {
  // 1. Auth + role check
  const user = await requireRole("CREATOR");

  // 2. Validate
  const parsed = createVideoSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false as const,
      error: "Validation failed",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { title, description, categoryId, tags, fileUrl } = parsed.data;

  // 3. Generate unique slug
  let slug = slugify(title, { lower: true, strict: true });
  const existingSlug = await prisma.video.findUnique({ where: { slug } });
  if (existingSlug) {
    slug = `${slug}-${Date.now().toString(36)}`;
  }

  // 4. Create video with tags
  const video = await prisma.video.create({
    data: {
      title,
      slug,
      description,
      fileUrl,
      categoryId: categoryId || null,
      userId: user.id,
      status: "DRAFT",
      tags: tags?.length
        ? {
            create: await Promise.all(
              tags.map(async (tagName) => {
                const tagSlug = slugify(tagName, { lower: true, strict: true });
                const tag = await prisma.tag.upsert({
                  where: { slug: tagSlug },
                  update: {},
                  create: { name: tagName, slug: tagSlug },
                });
                return { tagId: tag.id };
              })
            ),
          }
        : undefined,
    },
  });

  // 5. Revalidate
  revalidatePath("/dashboard/videos");

  return { success: true as const, data: { videoId: video.id, slug: video.slug } };
}

// ─── Update Video ─────────────────────────────────────────

export async function updateVideo(input: z.input<typeof updateVideoSchema>) {
  const session = await auth();
  if (!session?.user) {
    return { success: false as const, error: "Unauthorized" };
  }

  const parsed = updateVideoSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false as const,
      error: "Validation failed",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { videoId, title, description, categoryId, tags } = parsed.data;

  // Ownership check
  const video = await prisma.video.findUnique({ where: { id: videoId } });
  if (!video) {
    return { success: false as const, error: "Video not found" };
  }
  if (video.userId !== session.user.id && session.user.role !== "ADMIN") {
    return { success: false as const, error: "Forbidden" };
  }

  // Generate new slug if title changed
  let slug = video.slug;
  if (title !== video.title) {
    slug = slugify(title, { lower: true, strict: true });
    const existingSlug = await prisma.video.findFirst({
      where: { slug, id: { not: videoId } },
    });
    if (existingSlug) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }
  }

  // Update tags — delete existing, create new
  if (tags !== undefined) {
    await prisma.videoTag.deleteMany({ where: { videoId } });
  }

  const updated = await prisma.video.update({
    where: { id: videoId },
    data: {
      title,
      slug,
      description,
      categoryId: categoryId || null,
      tags: tags?.length
        ? {
            create: await Promise.all(
              tags.map(async (tagName) => {
                const tagSlug = slugify(tagName, { lower: true, strict: true });
                const tag = await prisma.tag.upsert({
                  where: { slug: tagSlug },
                  update: {},
                  create: { name: tagName, slug: tagSlug },
                });
                return { tagId: tag.id };
              })
            ),
          }
        : undefined,
    },
  });

  revalidatePath("/dashboard/videos");
  revalidatePath(`/watch/${updated.slug}`);
  if (video.slug !== updated.slug) {
    revalidatePath(`/watch/${video.slug}`);
  }

  return { success: true as const, data: { slug: updated.slug } };
}

// ─── Publish Video ────────────────────────────────────────

export async function publishVideo(videoId: string) {
  const session = await auth();
  if (!session?.user) {
    return { success: false as const, error: "Unauthorized" };
  }

  const video = await prisma.video.findUnique({ where: { id: videoId } });
  if (!video) {
    return { success: false as const, error: "Video not found" };
  }
  if (video.userId !== session.user.id && session.user.role !== "ADMIN") {
    return { success: false as const, error: "Forbidden" };
  }

  await prisma.video.update({
    where: { id: videoId },
    data: {
      status: "PUBLISHED",
      publishedAt: video.publishedAt ?? new Date(),
    },
  });

  revalidatePath("/dashboard/videos");
  revalidatePath(`/watch/${video.slug}`);
  revalidatePath("/");

  return { success: true as const };
}

// ─── Unpublish Video ──────────────────────────────────────

export async function unpublishVideo(videoId: string) {
  const session = await auth();
  if (!session?.user) {
    return { success: false as const, error: "Unauthorized" };
  }

  const video = await prisma.video.findUnique({ where: { id: videoId } });
  if (!video) {
    return { success: false as const, error: "Video not found" };
  }
  if (video.userId !== session.user.id && session.user.role !== "ADMIN") {
    return { success: false as const, error: "Forbidden" };
  }

  await prisma.video.update({
    where: { id: videoId },
    data: { status: "DRAFT" },
  });

  revalidatePath("/dashboard/videos");
  revalidatePath(`/watch/${video.slug}`);
  revalidatePath("/");

  return { success: true as const };
}

// ─── Delete Video ─────────────────────────────────────────

export async function deleteVideo(videoId: string) {
  const session = await auth();
  if (!session?.user) {
    return { success: false as const, error: "Unauthorized" };
  }

  const video = await prisma.video.findUnique({ where: { id: videoId } });
  if (!video) {
    return { success: false as const, error: "Video not found" };
  }
  if (video.userId !== session.user.id && session.user.role !== "ADMIN") {
    return { success: false as const, error: "Forbidden" };
  }

  // Hard delete — cascades to VideoTag and ProcessingJob via schema onDelete
  // TODO: Add S3 cleanup for fileUrl, hlsUrl, thumbnailUrl in production
  await prisma.video.delete({ where: { id: videoId } });

  revalidatePath("/dashboard/videos");
  revalidatePath("/");

  return { success: true as const };
}
```

### 2.5 Profile Actions — `src/app/actions/profile.ts`

```typescript
"use server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const updateProfileSchema = z.object({
  name: z
    .string()
    .min(2, { error: "Name must be at least 2 characters" })
    .max(50, { error: "Name must be at most 50 characters" }),
  username: z
    .string()
    .min(3, { error: "Username must be at least 3 characters" })
    .max(30, { error: "Username must be at most 30 characters" })
    .regex(/^[a-z0-9_-]+$/, {
      error: "Username can only contain lowercase letters, numbers, hyphens, and underscores",
    }),
  bio: z
    .string()
    .max(500, { error: "Bio must be at most 500 characters" })
    .optional(),
});

// ─── Update Profile ───────────────────────────────────────

export async function updateProfile(
  input: z.input<typeof updateProfileSchema>
) {
  const session = await auth();
  if (!session?.user) {
    return { success: false as const, error: "Unauthorized" };
  }

  const parsed = updateProfileSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false as const,
      error: "Validation failed",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { name, username, bio } = parsed.data;

  // Check username uniqueness (exclude current user)
  if (username.toLowerCase() !== session.user.id) {
    const existingUsername = await prisma.user.findFirst({
      where: {
        username: username.toLowerCase(),
        id: { not: session.user.id },
      },
    });
    if (existingUsername) {
      return {
        success: false as const,
        error: "This username is already taken",
      };
    }
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name,
      username: username.toLowerCase(),
      bio: bio || null,
    },
  });

  revalidatePath("/dashboard/settings");
  revalidatePath(`/channel/${username.toLowerCase()}`);

  return { success: true as const };
}

// ─── Update Avatar ────────────────────────────────────────

const updateAvatarSchema = z.object({
  avatarUrl: z.string().min(1, { error: "Avatar URL is required" }),
});

export async function updateAvatar(
  input: z.input<typeof updateAvatarSchema>
) {
  const session = await auth();
  if (!session?.user) {
    return { success: false as const, error: "Unauthorized" };
  }

  const parsed = updateAvatarSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false as const,
      error: "Validation failed",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  // TODO: Delete old avatar from S3 if it exists
  await prisma.user.update({
    where: { id: session.user.id },
    data: { avatarUrl: parsed.data.avatarUrl },
  });

  revalidatePath("/dashboard/settings");

  return { success: true as const };
}
```

### 2.6 Admin Actions — `src/app/actions/admin.ts`

```typescript
"use server";

import { requireRole } from "@/lib/auth-utils";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import slugify from "slugify";
import type { UserRole } from "@/generated/prisma/client";

// ─── Approve Video ────────────────────────────────────────

export async function approveVideo(videoId: string) {
  await requireRole("ADMIN");

  const video = await prisma.video.findUnique({ where: { id: videoId } });
  if (!video) {
    return { success: false as const, error: "Video not found" };
  }

  await prisma.video.update({
    where: { id: videoId },
    data: {
      status: "PUBLISHED",
      publishedAt: video.publishedAt ?? new Date(),
    },
  });

  revalidatePath("/admin/videos");
  revalidatePath(`/watch/${video.slug}`);
  revalidatePath("/");

  return { success: true as const };
}

// ─── Reject Video ─────────────────────────────────────────

const rejectVideoSchema = z.object({
  videoId: z.string(),
  reason: z.string().max(500).optional(),
});

export async function rejectVideo(input: z.input<typeof rejectVideoSchema>) {
  await requireRole("ADMIN");

  const parsed = rejectVideoSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false as const,
      error: "Validation failed",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { videoId, reason } = parsed.data;

  const video = await prisma.video.findUnique({ where: { id: videoId } });
  if (!video) {
    return { success: false as const, error: "Video not found" };
  }

  await prisma.video.update({
    where: { id: videoId },
    data: { status: "REJECTED" },
    // NOTE: Rejection reason is not stored in the schema for MVP.
    // Log it server-side for now.
  });

  if (reason) {
    console.log(`[Admin] Video ${videoId} rejected. Reason: ${reason}`);
  }

  revalidatePath("/admin/videos");
  revalidatePath(`/watch/${video.slug}`);

  return { success: true as const };
}

// ─── Update User Role ─────────────────────────────────────

const updateUserRoleSchema = z.object({
  userId: z.string(),
  newRole: z.enum(["VIEWER", "CREATOR", "STUDIO", "ADMIN"]),
});

export async function updateUserRole(
  input: z.input<typeof updateUserRoleSchema>
) {
  const admin = await requireRole("ADMIN");

  const parsed = updateUserRoleSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false as const,
      error: "Validation failed",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { userId, newRole } = parsed.data;

  // Prevent admin from changing their own role
  if (userId === admin.id) {
    return {
      success: false as const,
      error: "Cannot change your own role",
    };
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return { success: false as const, error: "User not found" };
  }

  await prisma.user.update({
    where: { id: userId },
    data: { role: newRole as UserRole },
  });

  revalidatePath("/admin/users");

  return { success: true as const };
}

// ─── Suspend User ─────────────────────────────────────────
// For MVP, suspending a user changes their role to VIEWER and unpublishes all their videos.

export async function suspendUser(userId: string) {
  const admin = await requireRole("ADMIN");

  if (userId === admin.id) {
    return {
      success: false as const,
      error: "Cannot suspend yourself",
    };
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return { success: false as const, error: "User not found" };
  }

  // Downgrade to VIEWER and unpublish all their videos
  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { role: "VIEWER" },
    }),
    prisma.video.updateMany({
      where: { userId, status: "PUBLISHED" },
      data: { status: "DRAFT" },
    }),
  ]);

  revalidatePath("/admin/users");
  revalidatePath("/admin/videos");
  revalidatePath("/");

  return { success: true as const };
}

// ─── Create Category ──────────────────────────────────────

const createCategorySchema = z.object({
  name: z.string().min(1, { error: "Name is required" }).max(50, { error: "Name must be at most 50 characters" }),
  description: z.string().max(200, { error: "Description must be at most 200 characters" }).optional(),
});

export async function createCategory(
  input: z.input<typeof createCategorySchema>
) {
  await requireRole("ADMIN");

  const parsed = createCategorySchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false as const,
      error: "Validation failed",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { name, description } = parsed.data;
  const slug = slugify(name, { lower: true, strict: true });

  // Check uniqueness
  const existing = await prisma.category.findUnique({ where: { slug } });
  if (existing) {
    return {
      success: false as const,
      error: "A category with this name already exists",
    };
  }

  // Get next sort order
  const lastCategory = await prisma.category.findFirst({
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });

  await prisma.category.create({
    data: {
      name,
      slug,
      description: description || null,
      sortOrder: (lastCategory?.sortOrder ?? -1) + 1,
    },
  });

  revalidatePath("/admin/categories");
  revalidatePath("/");

  return { success: true as const };
}

// ─── Update Category ──────────────────────────────────────

const updateCategorySchema = z.object({
  categoryId: z.string(),
  name: z.string().min(1, { error: "Name is required" }).max(50, { error: "Name must be at most 50 characters" }),
  description: z.string().max(200, { error: "Description must be at most 200 characters" }).optional(),
});

export async function updateCategory(
  input: z.input<typeof updateCategorySchema>
) {
  await requireRole("ADMIN");

  const parsed = updateCategorySchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false as const,
      error: "Validation failed",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { categoryId, name, description } = parsed.data;
  const slug = slugify(name, { lower: true, strict: true });

  // Check uniqueness (exclude current category)
  const existing = await prisma.category.findFirst({
    where: { slug, id: { not: categoryId } },
  });
  if (existing) {
    return {
      success: false as const,
      error: "A category with this name already exists",
    };
  }

  const category = await prisma.category.findUnique({
    where: { id: categoryId },
  });
  if (!category) {
    return { success: false as const, error: "Category not found" };
  }

  await prisma.category.update({
    where: { id: categoryId },
    data: { name, slug, description: description || null },
  });

  revalidatePath("/admin/categories");
  revalidatePath(`/category/${slug}`);
  if (category.slug !== slug) {
    revalidatePath(`/category/${category.slug}`);
  }
  revalidatePath("/");

  return { success: true as const };
}

// ─── Delete Category ──────────────────────────────────────
// Sets categoryId to null on all videos in this category (onDelete: SetNull in schema).

export async function deleteCategory(categoryId: string) {
  await requireRole("ADMIN");

  const category = await prisma.category.findUnique({
    where: { id: categoryId },
  });
  if (!category) {
    return { success: false as const, error: "Category not found" };
  }

  await prisma.category.delete({ where: { id: categoryId } });

  revalidatePath("/admin/categories");
  revalidatePath("/");

  return { success: true as const };
}
```

### 2.7 Calling Server Actions from Client Components

Server Actions are always called from Client Components via imported function references. Parse form data in the client, pass typed objects to the action:

```typescript
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateVideo } from "@/app/actions/video";
import { z } from "zod";

const schema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  categoryId: z.string().optional(),
  tags: z.array(z.string()).max(10).optional(),
});

type FormData = z.infer<typeof schema>;

export function VideoEditForm({ videoId }: { videoId: string }) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: FormData) {
    const result = await updateVideo({ videoId, ...data });

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success("Video updated");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Form fields */}
    </form>
  );
}
```

### 2.8 Optimistic Updates Pattern

For actions where immediate UI feedback improves UX (like publish/unpublish), use React 19's `useOptimistic`:

```typescript
"use client";

import { useOptimistic, useTransition } from "react";
import { publishVideo, unpublishVideo } from "@/app/actions/video";
import { toast } from "sonner";

export function VideoStatusToggle({
  videoId,
  currentStatus,
}: {
  videoId: string;
  currentStatus: string;
}) {
  const [optimisticStatus, setOptimisticStatus] = useOptimistic(currentStatus);
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    const newStatus =
      optimisticStatus === "PUBLISHED" ? "DRAFT" : "PUBLISHED";

    startTransition(async () => {
      setOptimisticStatus(newStatus);

      const result =
        newStatus === "PUBLISHED"
          ? await publishVideo(videoId)
          : await unpublishVideo(videoId);

      if (!result.success) {
        toast.error(result.error);
      }
    });
  }

  return (
    <button onClick={handleToggle} disabled={isPending}>
      {optimisticStatus === "PUBLISHED" ? "Unpublish" : "Publish"}
    </button>
  );
}
```

---

## 3. API Route Handlers

### 3.1 When to Use Route Handlers

Use Route Handlers (`src/app/api/`) ONLY for:

| Use Case | Reason |
|----------|--------|
| Auth.js catch-all | Required by Auth.js v5 |
| File upload (presigned URLs) | Not a form submission — needs direct HTTP |
| Webhook receivers | External services POST to this endpoint |
| View count increment | Fire-and-forget POST from the client, no form |
| External API consumption | If third-party services need a REST endpoint |

**Everything else uses Server Actions.**

### 3.2 Auth Route Handler

**File:** `src/app/api/auth/[...nextauth]/route.ts`

```typescript
import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;
```

### 3.3 View Count Increment

**File:** `src/app/api/videos/[id]/views/route.ts`

Fire-and-forget view counter — called from the VideoPlayer client component when playback starts:

```typescript
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.video.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to increment view count" },
      { status: 500 }
    );
  }
}
```

**Client-side call:**

```typescript
// In VideoPlayer client component
useEffect(() => {
  // Increment view count once when video starts playing
  let counted = false;
  function handlePlay() {
    if (!counted) {
      counted = true;
      fetch(`/api/videos/${videoId}/views`, { method: "POST" });
    }
  }
  // Attach to video element play event
}, [videoId]);
```

### 3.4 Upload Presigned URL

**File:** `src/app/api/upload/route.ts`

Generates presigned URLs for direct-to-S3 uploads from the client:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasRole } from "@/lib/auth-utils";
import { z } from "zod";

const uploadRequestSchema = z.object({
  filename: z.string().min(1),
  contentType: z.string().min(1),
  type: z.enum(["video", "avatar", "thumbnail"]),
});

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Role check — only CREATOR+ can upload videos
    const body = await request.json();
    const parsed = uploadRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const { filename, contentType, type } = parsed.data;

    if (type === "video" && !hasRole(session.user.role, "CREATOR")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // TODO: Generate presigned URL using S3/R2 SDK
    // For MVP, return a mock upload path
    const key = `${type}s/${session.user.id}/${Date.now()}-${filename}`;

    return NextResponse.json({
      uploadUrl: `/placeholder-upload/${key}`, // Replace with real presigned URL
      key,
    });
  } catch (error) {
    console.error("[Upload API] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

### 3.5 Processing Webhook

**File:** `src/app/api/webhooks/processing/route.ts`

Receives callbacks from the video processing service when transcoding completes:

```typescript
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";

const webhookSchema = z.object({
  jobId: z.string(),
  status: z.enum(["COMPLETED", "FAILED"]),
  hlsUrl: z.string().optional(),
  thumbnailUrl: z.string().optional(),
  duration: z.number().optional(),
  errorMessage: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // TODO: Verify webhook signature/secret in production
    const webhookSecret = request.headers.get("x-webhook-secret");
    if (webhookSecret !== process.env.PROCESSING_WEBHOOK_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = webhookSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payload" },
        { status: 400 }
      );
    }

    const { jobId, status, hlsUrl, thumbnailUrl, duration, errorMessage } =
      parsed.data;

    // Update processing job
    const job = await prisma.processingJob.update({
      where: { id: jobId },
      data: {
        status,
        progress: status === "COMPLETED" ? 100 : undefined,
        errorMessage: errorMessage || null,
        completedAt: new Date(),
      },
    });

    // Update video if processing completed
    if (status === "COMPLETED") {
      await prisma.video.update({
        where: { id: job.videoId },
        data: {
          hlsUrl: hlsUrl || undefined,
          thumbnailUrl: thumbnailUrl || undefined,
          duration: duration || undefined,
          status: "DRAFT", // Ready to be published
        },
      });
    } else if (status === "FAILED") {
      console.error(
        `[Processing] Job ${jobId} failed: ${errorMessage}`
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Processing Webhook] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

---

## 4. Data Access Patterns

### 4.1 Complete Server Actions Index

| Domain | Action | File | Auth | Min Role | Ownership |
|--------|--------|------|------|----------|-----------|
| **Auth** | `registerUser` | `actions/auth.ts` | No | — | — |
| **Auth** | `requestPasswordReset` | `actions/auth.ts` | No | — | — |
| **Auth** | `resetPassword` | `actions/auth.ts` | No | — | — |
| **Video** | `createVideo` | `actions/video.ts` | Yes | CREATOR | — |
| **Video** | `updateVideo` | `actions/video.ts` | Yes | Any | Owner or ADMIN |
| **Video** | `publishVideo` | `actions/video.ts` | Yes | Any | Owner or ADMIN |
| **Video** | `unpublishVideo` | `actions/video.ts` | Yes | Any | Owner or ADMIN |
| **Video** | `deleteVideo` | `actions/video.ts` | Yes | Any | Owner or ADMIN |
| **Profile** | `updateProfile` | `actions/profile.ts` | Yes | Any | Self only |
| **Profile** | `updateAvatar` | `actions/profile.ts` | Yes | Any | Self only |
| **Admin** | `approveVideo` | `actions/admin.ts` | Yes | ADMIN | — |
| **Admin** | `rejectVideo` | `actions/admin.ts` | Yes | ADMIN | — |
| **Admin** | `updateUserRole` | `actions/admin.ts` | Yes | ADMIN | — |
| **Admin** | `suspendUser` | `actions/admin.ts` | Yes | ADMIN | — |
| **Admin** | `createCategory` | `actions/admin.ts` | Yes | ADMIN | — |
| **Admin** | `updateCategory` | `actions/admin.ts` | Yes | ADMIN | — |
| **Admin** | `deleteCategory` | `actions/admin.ts` | Yes | ADMIN | — |

### 4.2 Complete API Routes Index

| Route | Method | Purpose | Auth |
|-------|--------|---------|------|
| `/api/auth/[...nextauth]` | GET, POST | Auth.js handler | Managed by Auth.js |
| `/api/videos/[id]/views` | POST | Increment view count | No |
| `/api/upload` | POST | Generate presigned upload URL | Yes (CREATOR+) |
| `/api/webhooks/processing` | POST | Video processing completion | Webhook secret |

### 4.3 Complete Page Data Fetching Index

| Page | Route | Data Fetched | Auth |
|------|-------|-------------|------|
| Homepage | `/` | Trending videos, latest videos, category sections | No |
| Category | `/category/[slug]` | Category info, paginated videos | No |
| Watch | `/watch/[slug]` | Video detail, related videos | No |
| Search | `/search` | Search results, categories for filter | No |
| Channel | `/channel/[username]` | User profile, paginated videos, total views | No |
| Dashboard Overview | `/dashboard` | User's video stats, recent videos | CREATOR+ |
| Dashboard Videos | `/dashboard/videos` | User's paginated videos with filters | CREATOR+ |
| Dashboard Settings | `/dashboard/settings` | Current user profile | CREATOR+ |
| Admin Overview | `/admin` | Platform-wide stats | ADMIN |
| Admin Videos | `/admin/videos` | All videos with filters | ADMIN |
| Admin Users | `/admin/users` | All users with filters | ADMIN |
| Admin Categories | `/admin/categories` | All categories with video counts | ADMIN |

---

## 5. Error Handling & Revalidation

### 5.1 Server Action Error Handling

Every Server Action follows this pattern:

```typescript
export async function someAction(input: SomeInput) {
  try {
    // 1. Auth checks
    // 2. Validation
    // 3. Business logic
    // 4. Mutation
    // 5. Revalidation
    return { success: true, data: result };
  } catch (error) {
    console.error("[someAction]", error);
    return {
      success: false,
      error: "Something went wrong. Please try again.",
    };
  }
}
```

Rules:
- Wrap all Prisma calls in try/catch.
- Log errors server-side with `console.error("[Action Name]", error)`.
- Return user-friendly error messages — never expose raw Prisma/DB errors.
- Specific known errors (uniqueness violations, not found) get specific messages.
- Unknown errors get the generic "Something went wrong" message.

### 5.2 API Route Error Handling

```typescript
export async function POST(request: NextRequest) {
  try {
    // ... logic
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("[API Route Name]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

### 5.3 Revalidation Strategy

Use `revalidatePath()` after every mutation that affects displayed data:

| Mutation | Paths to Revalidate |
|----------|-------------------|
| Create video | `/dashboard/videos` |
| Update video | `/dashboard/videos`, `/watch/[slug]` |
| Publish video | `/dashboard/videos`, `/watch/[slug]`, `/` |
| Unpublish video | `/dashboard/videos`, `/watch/[slug]`, `/` |
| Delete video | `/dashboard/videos`, `/` |
| Update profile | `/dashboard/settings`, `/channel/[username]` |
| Admin approve | `/admin/videos`, `/watch/[slug]`, `/` |
| Admin reject | `/admin/videos`, `/watch/[slug]` |
| Admin change role | `/admin/users` |
| Admin suspend user | `/admin/users`, `/admin/videos`, `/` |
| Create category | `/admin/categories`, `/` |
| Update category | `/admin/categories`, `/category/[slug]`, `/` |
| Delete category | `/admin/categories`, `/` |

**Future:** When fetch-based caching is added, use `revalidateTag()` for more granular cache invalidation.

### 5.4 Page-Level Error Handling

Every route group needs `error.tsx` boundaries:

```typescript
// src/app/(main)/watch/[slug]/error.tsx
"use client";

import { Button } from "@/components/ui/button";

export default function WatchError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 space-y-4">
      <h2 className="text-xl font-semibold text-zinc-50">
        Something went wrong
      </h2>
      <p className="text-sm text-zinc-400">
        We couldn't load this video. Please try again.
      </p>
      <Button onClick={reset} variant="outline">
        Try again
      </Button>
    </div>
  );
}
```

---

## 6. Security Checklist

### 6.1 Every Server Action MUST

1. **Check session exists:** `await auth()` or `await requireAuth()`
2. **Check role is sufficient:** `await requireRole("CREATOR")` or manual role check
3. **Check ownership:** Verify `resource.userId === session.user.id` (unless ADMIN)
4. **Validate ALL input with Zod 4:** `schema.safeParse(input)`
5. **Sanitize text inputs:** React escapes output by default, but never use `dangerouslySetInnerHTML` with user content
6. **Never return sensitive fields:** Never include `passwordHash`, full `email` of other users, or internal error details in responses

### 6.2 Every API Route MUST

1. **Validate auth** for protected endpoints
2. **Validate request body** with Zod 4
3. **Return appropriate HTTP status codes:** 400 for bad input, 401 for unauthenticated, 403 for forbidden, 404 for not found, 500 for server errors
4. **Verify webhook signatures** for external webhook endpoints

### 6.3 Data Exposure Prevention

| Context | Rule |
|---------|------|
| List views | Never select `passwordHash`, `fileUrl`, `hlsUrl` |
| User profiles | Never expose `email` to other users (only to the user themselves and admins) |
| Admin endpoints | Verify `ADMIN` role even though layout checks exist (defense in depth) |
| Error responses | Never expose stack traces, SQL errors, or internal paths |
| Password reset | Always return same message regardless of email existence |
| Login errors | Always show generic "Invalid email or password" |

### 6.4 Input Validation Schemas Location

All reusable Zod 4 schemas live in `src/lib/validations/`:

```
src/lib/validations/
├── auth.ts          # loginSchema, registerSchema, forgotPasswordSchema, resetPasswordSchema
├── video.ts         # createVideoSchema, updateVideoSchema
├── profile.ts       # updateProfileSchema, updateAvatarSchema
└── admin.ts         # createCategorySchema, updateCategorySchema, rejectVideoSchema, updateUserRoleSchema
```

Schemas defined inline within Server Action files (as shown in the examples above) should be extracted to these validation files when the action file grows large. For MVP, inline schemas in action files are acceptable.

---

## Appendix: Decision Log

| Decision | Rationale |
|----------|-----------|
| Server Actions over API Routes for mutations | Simpler, type-safe, collocated with the app, progressive enhancement |
| Offset-based pagination over cursor-based | Simpler for MVP, URLs are shareable (`?page=2`), adequate for expected data volume |
| No intermediate data access layer | Prisma queries directly in Server Components — no unnecessary abstraction for MVP |
| Hard delete for videos (MVP) | Simpler than soft delete. S3 cleanup is a TODO for production |
| Suspension = role downgrade + unpublish | MVP-appropriate — no separate `isSuspended` flag needed |
| Rejection reason logged, not stored | No `rejectionReason` field in schema for MVP — log it server-side |
| `contains` search over full-text search | Simpler for MVP. Full-text search index is in the schema but query implementation deferred |
