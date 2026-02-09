# Database Schema Specification

> Complete Prisma 7 schema for the Video Platform MVP

---

## Overview

This document contains the complete database schema ready to copy into `prisma/schema.prisma`. The schema follows Prisma 7 conventions:

- Generator uses `prisma-client` (not `prisma-client-js`)
- No `url` in datasource block (URL is defined in `prisma.config.ts`)
- All IDs use `cuid()` for distributed-friendly unique identifiers

**Storage Note:** Video files are stored in S3/R2 object storage, NOT in PostgreSQL. The `fileUrl` and `hlsUrl` fields store path references (e.g., `videos/abc123/original.mp4`), not the actual file content.

---

## Complete Prisma Schema

Copy this entire block into `prisma/schema.prisma`:

```prisma
// =============================================================================
// Video Platform MVP — Prisma 7 Schema
// =============================================================================
//
// IMPORTANT: This is a Prisma 7 schema.
// - Database URL is NOT here — it's in prisma.config.ts
// - Generator is "prisma-client", not "prisma-client-js"
// - Use driver adapters in src/lib/prisma.ts
//
// Commands:
//   npx prisma generate      — Generate client
//   npx prisma db push       — Push schema to database (dev)
//   npx prisma migrate dev   — Create migration
//   npx prisma studio        — Visual database browser
//   npx prisma db seed       — Run seed script
// =============================================================================

generator client {
  provider        = "prisma-client"
  output          = "../src/generated/prisma"
  previewFeatures = ["fullTextSearchPostgres"]
}

datasource db {
  provider = "postgresql"
  // NO url here — see prisma.config.ts
}

// =============================================================================
// ENUMS
// =============================================================================

enum UserRole {
  VIEWER
  CREATOR
  STUDIO
  ADMIN
}

enum VideoStatus {
  DRAFT
  PROCESSING
  PUBLISHED
  UNLISTED
  REJECTED
}

enum ProcessingJobStatus {
  QUEUED
  PROCESSING
  COMPLETED
  FAILED
}

// =============================================================================
// USER & AUTH MODELS
// =============================================================================

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  passwordHash  String?
  name          String?
  username      String    @unique
  avatarUrl     String?
  bio           String?   @db.VarChar(500)
  role          UserRole  @default(VIEWER)
  emailVerified DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Relations
  videos   Video[]
  accounts Account[]
  sessions Session[]

  @@index([email])
  @@index([username])
}

// Auth.js required model — OAuth/credential provider accounts
model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@index([userId])
}

// Auth.js required model — user sessions (for database strategy)
model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}

// Auth.js required model — email verification & password reset tokens
model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

// =============================================================================
// VIDEO MODELS
// =============================================================================

model Video {
  id           String      @id @default(cuid())
  title        String      @db.VarChar(200)
  slug         String      @unique
  description  String?     @db.Text
  duration     Int?        // Duration in seconds, null until processed
  fileUrl      String      // S3/R2 path to original upload (e.g., "videos/abc123/original.mp4")
  hlsUrl       String?     // S3/R2 path to HLS playlist (e.g., "videos/abc123/hls/master.m3u8")
  thumbnailUrl String?     // S3/R2 path to thumbnail (e.g., "videos/abc123/thumb.jpg")
  viewCount    Int         @default(0)
  status       VideoStatus @default(DRAFT)
  publishedAt  DateTime?
  createdAt    DateTime    @default(now())
  updatedAt    DateTime    @updatedAt

  // Foreign keys
  userId     String
  categoryId String?

  // Relations
  creator        User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  category       Category?       @relation(fields: [categoryId], references: [id], onDelete: SetNull)
  tags           VideoTag[]
  processingJobs ProcessingJob[]

  @@index([userId])
  @@index([categoryId])
  @@index([status])
  @@index([slug])
  @@index([createdAt])
  @@index([publishedAt])
}

model Category {
  id          String   @id @default(cuid())
  name        String   @unique
  slug        String   @unique
  description String?  @db.Text
  sortOrder   Int      @default(0)
  createdAt   DateTime @default(now())

  // Relations
  videos Video[]

  @@index([slug])
  @@index([sortOrder])
}

model Tag {
  id        String   @id @default(cuid())
  name      String   @unique
  slug      String   @unique
  createdAt DateTime @default(now())

  // Relations
  videos VideoTag[]

  @@index([slug])
}

// Junction table for Video <-> Tag many-to-many relationship
model VideoTag {
  videoId String
  tagId   String

  video Video @relation(fields: [videoId], references: [id], onDelete: Cascade)
  tag   Tag   @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@id([videoId, tagId])
  @@index([videoId])
  @@index([tagId])
}

// =============================================================================
// PROCESSING MODELS
// =============================================================================

model ProcessingJob {
  id           String              @id @default(cuid())
  videoId      String
  status       ProcessingJobStatus @default(QUEUED)
  progress     Int                 @default(0) // 0-100 percentage
  resolution   String?             // e.g., "720p", "1080p", "4k"
  errorMessage String?             @db.Text
  startedAt    DateTime?
  completedAt  DateTime?
  createdAt    DateTime            @default(now())

  // Relations
  video Video @relation(fields: [videoId], references: [id], onDelete: Cascade)

  @@index([videoId])
  @@index([status])
  @@index([createdAt])
}
```

---

## Full-Text Search

The schema includes the `fullTextSearchPostgres` preview feature for PostgreSQL full-text search on video titles and descriptions.

### Enabling Full-Text Search

After running `prisma migrate dev`, create a full-text search index via a raw SQL migration:

```sql
-- Create GIN index for full-text search on Video title and description
CREATE INDEX video_search_idx ON "Video"
USING GIN (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, '')));
```

### Using Full-Text Search in Queries

```typescript
// Search videos by text
const results = await prisma.video.findMany({
  where: {
    OR: [
      { title: { search: 'tutorial' } },
      { description: { search: 'tutorial' } },
    ],
    status: 'PUBLISHED',
  },
  orderBy: {
    _relevance: {
      fields: ['title', 'description'],
      search: 'tutorial',
      sort: 'desc',
    },
  },
});
```

---

## Model Details

### User

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (cuid) | Primary key |
| `email` | String | Unique email address |
| `passwordHash` | String? | Bcrypt hash (null for OAuth users) |
| `name` | String? | Display name |
| `username` | String | Unique handle (for URLs: `/channel/username`) |
| `avatarUrl` | String? | S3/R2 path to avatar image |
| `bio` | String? | Profile bio (max 500 chars) |
| `role` | UserRole | VIEWER, CREATOR, STUDIO, or ADMIN |
| `emailVerified` | DateTime? | When email was verified |
| `createdAt` | DateTime | Account creation timestamp |
| `updatedAt` | DateTime | Last update timestamp |

### Video

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (cuid) | Primary key |
| `title` | String | Video title (max 200 chars) |
| `slug` | String | URL-friendly unique identifier |
| `description` | String? | Full description (no limit) |
| `duration` | Int? | Duration in seconds (set after processing) |
| `fileUrl` | String | S3/R2 path to original uploaded file |
| `hlsUrl` | String? | S3/R2 path to HLS master playlist |
| `thumbnailUrl` | String? | S3/R2 path to thumbnail image |
| `viewCount` | Int | Total view count (default 0) |
| `status` | VideoStatus | Current publication status |
| `publishedAt` | DateTime? | When video was published |
| `userId` | String | FK to creator User |
| `categoryId` | String? | FK to Category (optional) |

### Category

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (cuid) | Primary key |
| `name` | String | Category name (unique) |
| `slug` | String | URL-friendly identifier (unique) |
| `description` | String? | Category description |
| `sortOrder` | Int | Display order (lower = first) |
| `createdAt` | DateTime | Creation timestamp |

**Default Categories (seeded):**
1. Film
2. Music
3. Comedy
4. Documentary
5. Education
6. Sports
7. Gaming
8. News
9. Technology
10. Entertainment
11. How-To
12. Travel

### Tag

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (cuid) | Primary key |
| `name` | String | Tag name (unique) |
| `slug` | String | URL-friendly identifier (unique) |
| `createdAt` | DateTime | Creation timestamp |

### VideoTag (Junction Table)

| Field | Type | Description |
|-------|------|-------------|
| `videoId` | String | FK to Video (composite PK) |
| `tagId` | String | FK to Tag (composite PK) |

### ProcessingJob

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (cuid) | Primary key |
| `videoId` | String | FK to Video |
| `status` | ProcessingJobStatus | QUEUED, PROCESSING, COMPLETED, FAILED |
| `progress` | Int | 0-100 percentage complete |
| `resolution` | String? | Target resolution (e.g., "720p") |
| `errorMessage` | String? | Error details if FAILED |
| `startedAt` | DateTime? | When processing began |
| `completedAt` | DateTime? | When processing finished |
| `createdAt` | DateTime | Job creation timestamp |

### Auth.js Models

The schema includes three models required by `@auth/prisma-adapter`:

- **Account**: Stores OAuth provider accounts linked to users
- **Session**: Stores user sessions (for database session strategy)
- **VerificationToken**: Stores tokens for email verification and password reset

---

## Entity Relationship Diagram

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│     Account     │       │      User       │       │    Session      │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id              │       │ id              │       │ id              │
│ userId ─────────┼──────→│ email           │←──────┼─ userId         │
│ provider        │       │ passwordHash    │       │ sessionToken    │
│ providerAcctId  │       │ name            │       │ expires         │
│ ...tokens       │       │ username        │       └─────────────────┘
└─────────────────┘       │ avatarUrl       │
                          │ bio             │
                          │ role            │       ┌─────────────────┐
                          │ emailVerified   │       │VerificationToken│
                          │ createdAt       │       ├─────────────────┤
                          │ updatedAt       │       │ identifier      │
                          └────────┬────────┘       │ token           │
                                   │                │ expires         │
                                   │ 1:N            └─────────────────┘
                                   ▼
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│    Category     │       │      Video      │       │ ProcessingJob   │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id              │←──────┼─ categoryId     │       │ id              │
│ name            │  N:1  │ id              │──────→│ videoId         │
│ slug            │       │ userId ─────────┼───┐   │ status          │
│ description     │       │ title           │   │   │ progress        │
│ sortOrder       │       │ slug            │   │   │ resolution      │
│ createdAt       │       │ description     │   │   │ errorMessage    │
└─────────────────┘       │ duration        │   │   │ startedAt       │
                          │ fileUrl         │   │   │ completedAt     │
                          │ hlsUrl          │   │   └─────────────────┘
                          │ thumbnailUrl    │   │
                          │ viewCount       │   │         1:N (User → Video)
                          │ status          │   └─────────────────────────────┐
                          │ publishedAt     │                                 │
                          │ createdAt       │                                 │
                          │ updatedAt       │                                 │
                          └────────┬────────┘                                 │
                                   │                                          │
                                   │ M:N (via VideoTag)                       │
                                   ▼                                          │
┌─────────────────┐       ┌─────────────────┐                                 │
│       Tag       │       │    VideoTag     │                                 │
├─────────────────┤       ├─────────────────┤                                 │
│ id              │←──────┼─ tagId          │                                 │
│ name            │       │ videoId ────────┼─────────────────────────────────┘
│ slug            │       └─────────────────┘
│ createdAt       │
└─────────────────┘
```

---

## Indexes Summary

| Model | Index | Purpose |
|-------|-------|---------|
| User | `email` | Quick lookup by email for auth |
| User | `username` | Quick lookup for channel URLs |
| Account | `userId` | Find all accounts for a user |
| Session | `userId` | Find all sessions for a user |
| Video | `userId` | List videos by creator |
| Video | `categoryId` | Filter videos by category |
| Video | `status` | Filter by publication status |
| Video | `slug` | Quick lookup for watch page |
| Video | `createdAt` | Sort by newest |
| Video | `publishedAt` | Sort published videos |
| Category | `slug` | Quick lookup for category pages |
| Category | `sortOrder` | Order categories in nav |
| Tag | `slug` | Quick lookup for tag pages |
| VideoTag | `videoId` | Find tags for a video |
| VideoTag | `tagId` | Find videos with a tag |
| ProcessingJob | `videoId` | Find jobs for a video |
| ProcessingJob | `status` | Find pending/failed jobs |
| ProcessingJob | `createdAt` | Sort job queue |

---

## Seed Script Setup

### 1. Create the Seed Script

Create `prisma/seed.ts`:

```typescript
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { hash } from "bcryptjs";
import slugify from "slugify";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const categories = [
  { name: "Film", description: "Movies, short films, and cinematic content" },
  { name: "Music", description: "Music videos, performances, and concerts" },
  { name: "Comedy", description: "Stand-up, sketches, and funny videos" },
  { name: "Documentary", description: "Documentaries and non-fiction storytelling" },
  { name: "Education", description: "Tutorials, courses, and educational content" },
  { name: "Sports", description: "Sports highlights, analysis, and fitness" },
  { name: "Gaming", description: "Gameplay, reviews, and esports" },
  { name: "News", description: "News coverage and current events" },
  { name: "Technology", description: "Tech reviews, tutorials, and innovations" },
  { name: "Entertainment", description: "General entertainment and variety content" },
  { name: "How-To", description: "DIY, crafts, and instructional guides" },
  { name: "Travel", description: "Travel vlogs, guides, and destination content" },
];

async function main() {
  console.log("🌱 Starting seed...");

  // Seed categories
  console.log("📁 Creating categories...");
  for (let i = 0; i < categories.length; i++) {
    const category = categories[i];
    await prisma.category.upsert({
      where: { slug: slugify(category.name, { lower: true }) },
      update: {},
      create: {
        name: category.name,
        slug: slugify(category.name, { lower: true }),
        description: category.description,
        sortOrder: i,
      },
    });
  }
  console.log(`✅ Created ${categories.length} categories`);

  // Seed admin user
  console.log("👤 Creating admin user...");
  const adminPassword = await hash("admin123", 12);
  await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      username: "admin",
      name: "Admin User",
      passwordHash: adminPassword,
      role: "ADMIN",
      emailVerified: new Date(),
    },
  });
  console.log("✅ Created admin user (admin@example.com / admin123)");

  console.log("🌱 Seed completed!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

### 2. Update package.json

Add the following to `package.json`:

```json
{
  "prisma": {
    "seed": "npx tsx prisma/seed.ts"
  }
}
```

### 3. Install Required Dependencies

```bash
npm install bcryptjs
npm install -D @types/bcryptjs tsx
```

### 4. Run the Seed

```bash
npx prisma db seed
```

The seed script will:
1. Create all 12 default categories with proper slugs and sort order
2. Create an admin user with credentials:
   - Email: `admin@example.com`
   - Password: `admin123`
   - Role: `ADMIN`

---

## Storage Architecture

### File Storage (S3/R2)

Video files are stored in object storage, NOT in PostgreSQL. The database only stores path references.

**Bucket Structure:**
```
videos/
  {videoId}/
    original.mp4          # Original uploaded file
    thumb.jpg             # Generated thumbnail
    hls/
      master.m3u8         # HLS master playlist
      720p/
        playlist.m3u8
        segment-000.ts
        segment-001.ts
        ...
      1080p/
        playlist.m3u8
        segment-000.ts
        ...
```

**Example Database Values:**
```typescript
{
  fileUrl: "videos/clx1abc123/original.mp4",
  thumbnailUrl: "videos/clx1abc123/thumb.jpg",
  hlsUrl: "videos/clx1abc123/hls/master.m3u8"
}
```

### CDN URLs

In production, construct full URLs using the CDN base URL:

```typescript
const cdnBase = process.env.CDN_BASE_URL; // e.g., "https://cdn.example.com"

function getVideoUrl(video: Video) {
  return {
    thumbnail: video.thumbnailUrl ? `${cdnBase}/${video.thumbnailUrl}` : null,
    hls: video.hlsUrl ? `${cdnBase}/${video.hlsUrl}` : null,
    original: `${cdnBase}/${video.fileUrl}`,
  };
}
```

---

## Migration Commands

```bash
# Generate Prisma client after schema changes
npx prisma generate

# Push schema to database (development only, no migration history)
npx prisma db push

# Create a new migration (production-ready)
npx prisma migrate dev --name init

# Apply migrations in production
npx prisma migrate deploy

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Open Prisma Studio (visual database browser)
npx prisma studio

# Run seed script
npx prisma db seed
```

---

## TypeScript Usage

### Importing Types

```typescript
// Import the Prisma client
import prisma from "@/lib/prisma";

// Import generated types
import type {
  User,
  Video,
  Category,
  Tag,
  UserRole,
  VideoStatus,
  ProcessingJobStatus
} from "@/generated/prisma/client";

// Use in components
interface VideoCardProps {
  video: Video & {
    creator: Pick<User, "id" | "name" | "username" | "avatarUrl">;
    category: Category | null;
  };
}
```

### Common Query Patterns

```typescript
// Get published videos with creator and category
const videos = await prisma.video.findMany({
  where: { status: "PUBLISHED" },
  include: {
    creator: { select: { id: true, name: true, username: true, avatarUrl: true } },
    category: true,
  },
  orderBy: { publishedAt: "desc" },
  take: 20,
});

// Get video with tags
const video = await prisma.video.findUnique({
  where: { slug: "my-video-slug" },
  include: {
    creator: true,
    category: true,
    tags: { include: { tag: true } },
  },
});

// Get user's channel with video count
const channel = await prisma.user.findUnique({
  where: { username: "johndoe" },
  include: {
    _count: { select: { videos: { where: { status: "PUBLISHED" } } } },
  },
});

// Increment view count
await prisma.video.update({
  where: { id: videoId },
  data: { viewCount: { increment: 1 } },
});
```
