# Database Schema Specification

> Complete Prisma 7 schema for the Video Platform MVP

---

## Overview

This document describes the database schema as implemented in `prisma/schema.prisma`. The schema follows Prisma 7 conventions:

- Generator uses `prisma-client` (not `prisma-client-js`)
- No `url` in datasource block (URL is defined in `prisma.config.ts`)
- All IDs use `cuid()` for distributed-friendly unique identifiers
- Client is generated to `src/generated/prisma`

**Storage Note:** Video files are stored in S3/R2 object storage, NOT in PostgreSQL. The `fileUrl` and `hlsUrl` fields store path references (e.g., `videos/abc123/original.mp4`), not the actual file content.

---

## Enums

### UserRole

| Value | Description |
|-------|-------------|
| `VIEWER` | Default role, can browse and watch |
| `CREATOR` | Individual content creator |
| `STUDIO` | Professional studio account |
| `ADMIN` | Platform administrator |

### VideoStatus

| Value | Description |
|-------|-------------|
| `DRAFT` | Not published, only visible to creator |
| `PROCESSING` | Upload complete, transcoding in progress |
| `PUBLISHED` | Live and visible to all viewers |
| `UNLISTED` | Accessible via direct link only |
| `REJECTED` | Removed by admin moderation |

### ProcessingJobStatus

| Value | Description |
|-------|-------------|
| `QUEUED` | Waiting to be picked up |
| `PROCESSING` | Transcoding in progress |
| `COMPLETED` | Successfully transcoded |
| `FAILED` | Transcoding failed |

---

## Models

### User

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | String | PK, cuid() | Primary key |
| `email` | String | unique | Email address |
| `passwordHash` | String | required | Bcrypt hash |
| `name` | String | required | Display name |
| `username` | String | unique | Handle for URLs (`/channel/username`) |
| `avatarUrl` | String? | nullable | S3/R2 path to avatar image |
| `bio` | String? | nullable, @db.Text | Profile bio |
| `role` | UserRole | default VIEWER | User role |
| `emailVerified` | DateTime? | nullable | When email was verified |
| `createdAt` | DateTime | default now() | Account creation |
| `updatedAt` | DateTime | @updatedAt | Last update |

**Relations:** `videos` Video[], `accounts` Account[], `sessions` Session[]

### Video

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | String | PK, cuid() | Primary key |
| `userId` | String | FK to User | Creator reference |
| `title` | String | required | Video title |
| `slug` | String | unique | URL-friendly identifier |
| `description` | String? | nullable, @db.Text | Full description |
| `categoryId` | String? | nullable, FK to Category | Category reference |
| `status` | VideoStatus | default DRAFT | Publication status |
| `duration` | Int? | nullable | Duration in seconds (set after processing) |
| `fileUrl` | String | required | S3/R2 path to original upload |
| `hlsUrl` | String? | nullable | S3/R2 path to HLS master playlist |
| `thumbnailUrl` | String? | nullable | S3/R2 path to thumbnail |
| `viewCount` | Int | default 0 | Total view count |
| `publishedAt` | DateTime? | nullable | When video was published |
| `createdAt` | DateTime | default now() | Upload timestamp |
| `updatedAt` | DateTime | @updatedAt | Last update |

**Relations:** `creator` User, `category` Category?, `videoTags` VideoTag[], `processingJobs` ProcessingJob[]

**Indexes:** userId, categoryId, status, createdAt, slug

### Category

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | String | PK, cuid() | Primary key |
| `name` | String | unique | Category name |
| `slug` | String | unique | URL-friendly identifier |
| `description` | String? | nullable | Category description |
| `sortOrder` | Int | default 0 | Display order (lower = first) |
| `createdAt` | DateTime | default now() | Creation timestamp |

**Relations:** `videos` Video[]

**Indexes:** slug, sortOrder

### Tag

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | String | PK, cuid() | Primary key |
| `name` | String | unique | Tag name |
| `slug` | String | unique | URL-friendly identifier |
| `createdAt` | DateTime | default now() | Creation timestamp |

**Relations:** `videoTags` VideoTag[]

**Indexes:** slug

### VideoTag (Junction Table)

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `videoId` | String | composite PK, FK to Video | Video reference |
| `tagId` | String | composite PK, FK to Tag | Tag reference |

**Relations:** `video` Video (onDelete: Cascade), `tag` Tag (onDelete: Cascade)

**Indexes:** videoId, tagId

### ProcessingJob

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | String | PK, cuid() | Primary key |
| `videoId` | String | FK to Video | Video reference |
| `status` | ProcessingJobStatus | default QUEUED | Job status |
| `progress` | Int | default 0 | 0-100 percentage |
| `resolution` | String? | nullable | Target resolution (e.g., "720p") |
| `errorMessage` | String? | nullable, @db.Text | Error details if FAILED |
| `startedAt` | DateTime? | nullable | When processing began |
| `completedAt` | DateTime? | nullable | When processing finished |
| `createdAt` | DateTime | default now() | Job creation timestamp |

**Relations:** `video` Video

**Indexes:** videoId, status

### Auth.js Models

These models are required by `@auth/prisma-adapter` for next-auth v5:

**Account** — Stores OAuth provider accounts linked to users.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (cuid) | Primary key |
| `userId` | String | FK to User (onDelete: Cascade) |
| `type` | String | Account type |
| `provider` | String | OAuth provider name |
| `providerAccountId` | String | Provider's account ID |
| `refresh_token` | String? (@db.Text) | OAuth refresh token |
| `access_token` | String? (@db.Text) | OAuth access token |
| `expires_at` | Int? | Token expiration |
| `token_type` | String? | Token type |
| `scope` | String? | OAuth scope |
| `id_token` | String? (@db.Text) | OpenID Connect ID token |
| `session_state` | String? | Session state |

**Unique constraint:** `[provider, providerAccountId]`

**Session** — Stores user sessions (for database session strategy).

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (cuid) | Primary key |
| `sessionToken` | String (unique) | Session token |
| `userId` | String | FK to User (onDelete: Cascade) |
| `expires` | DateTime | Session expiration |

**VerificationToken** — Stores tokens for email verification and password reset. No `id` field, no relation to User.

| Field | Type | Description |
|-------|------|-------------|
| `identifier` | String | Token identifier (e.g., email) |
| `token` | String (unique) | The token value |
| `expires` | DateTime | Token expiration |

**Unique constraint:** `[identifier, token]`

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
│ slug            │       │ userId          │       │ status          │
│ description     │       │ title           │       │ progress        │
│ sortOrder       │       │ slug            │       │ resolution      │
│ createdAt       │       │ description     │       │ errorMessage    │
└─────────────────┘       │ duration        │       │ startedAt       │
                          │ fileUrl         │       │ completedAt     │
                          │ hlsUrl          │       └─────────────────┘
                          │ thumbnailUrl    │
                          │ viewCount       │
                          │ status          │
                          │ publishedAt     │
                          │ createdAt       │
                          │ updatedAt       │
                          └────────┬────────┘
                                   │
                                   │ M:N (via VideoTag)
                                   ▼
┌─────────────────┐       ┌─────────────────┐
│       Tag       │       │    VideoTag     │
├─────────────────┤       ├─────────────────┤
│ id              │←──────┼─ tagId          │
│ name            │       │ videoId         │
│ slug            │       └─────────────────┘
│ createdAt       │
└─────────────────┘
```

---

## Indexes Summary

| Model | Index | Purpose |
|-------|-------|---------|
| Video | `userId` | List videos by creator |
| Video | `categoryId` | Filter videos by category |
| Video | `status` | Filter by publication status |
| Video | `createdAt` | Sort by newest |
| Video | `slug` | Quick lookup for watch page |
| Category | `slug` | Quick lookup for category pages |
| Category | `sortOrder` | Order categories in nav |
| Tag | `slug` | Quick lookup for tag pages |
| VideoTag | `videoId` | Find tags for a video |
| VideoTag | `tagId` | Find videos with a tag |
| ProcessingJob | `videoId` | Find jobs for a video |
| ProcessingJob | `status` | Find pending/failed jobs |

---

## Seed Data

The seed script (`prisma/seed.ts`) populates the database with initial data.

### Categories (12)

| # | Name | Slug |
|---|------|------|
| 0 | Film | film |
| 1 | Music | music |
| 2 | Comedy | comedy |
| 3 | Documentary | documentary |
| 4 | Education | education |
| 5 | Sports | sports |
| 6 | Gaming | gaming |
| 7 | News | news |
| 8 | Technology | technology |
| 9 | Entertainment | entertainment |
| 10 | How-To | how-to |
| 11 | Travel | travel |

### Test Users (3)

| Email | Password | Role | Username |
|-------|----------|------|----------|
| admin@videoplatform.dev | Admin123! | ADMIN | admin |
| creator@videoplatform.dev | Creator123! | CREATOR | creator-jane |
| studio@videoplatform.dev | Studio123! | STUDIO | apex-studio |

### Running the Seed

```bash
npx prisma db seed
```

The seed config is in `prisma.config.ts` under `migrations.seed`.

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

---

## Prisma Commands

```bash
npx prisma generate        # Generate client to src/generated/prisma
npx prisma db push         # Push schema to database (dev)
npx prisma migrate dev     # Create migration
npx prisma db seed         # Run seed script
npx prisma studio          # Visual database browser
npx prisma migrate deploy  # Apply migrations in production
```

---

## TypeScript Usage

### Importing Types

```typescript
import prisma from "@/lib/prisma";

import type {
  User,
  Video,
  Category,
  Tag,
  UserRole,
  VideoStatus,
  ProcessingJobStatus
} from "@/generated/prisma/client";
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
    videoTags: { include: { tag: true } },
  },
});

// Increment view count
await prisma.video.update({
  where: { id: videoId },
  data: { viewCount: { increment: 1 } },
});
```
