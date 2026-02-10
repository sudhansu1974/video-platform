# VideoHub — Video Platform MVP

A mainstream media video showcase platform for studios and individual creators to upload, manage, and share video content with viewers.

## Tech Stack

- **Next.js 16** — App Router, Server Components, Server Actions, Turbopack
- **React 19** — `use()`, `useOptimistic`, `useFormStatus`
- **TypeScript 5** — Strict mode
- **Tailwind CSS 4** — CSS-first config with `@theme` directive
- **Prisma 7** — PostgreSQL with driver adapters
- **Auth.js v5** — Credentials provider, JWT sessions
- **Shadcn/ui** — Component library (Radix UI primitives)
- **Zod 4** — Schema validation
- **HLS.js** — Adaptive video playback
- **FFmpeg** — Video processing and transcoding

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 15+
- FFmpeg installed on system

### Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Copy environment file: `cp .env.example .env`
4. Update `.env` with your database URL and auth secret
5. Push schema to database: `npm run db:push`
6. Seed the database: `npm run db:seed`
7. Start dev server: `npm run dev`
8. Open http://localhost:3000

### Default Accounts (from seed)

| Role    | Email                       | Password     |
|---------|-----------------------------|--------------|
| Admin   | admin@videoplatform.dev     | Admin123!    |
| Creator | creator@videoplatform.dev   | Creator123!  |
| Studio  | studio@videoplatform.dev    | Studio123!   |

## Project Structure

```
src/
  app/
    (auth)/         Login, register, forgot/reset password
    (main)/         Public pages (home, browse, watch, search, channel)
    (dashboard)/    Creator dashboard (videos, upload, channel settings)
    (admin)/        Admin panel (users, videos, categories, tags, processing)
    api/            Upload, file serving, search suggestions, views
    actions/        Server Actions (auth, video, profile, admin)
  components/
    ui/             Shadcn components (auto-generated)
    layout/         Header, Footer, Sidebar, Navigation
    video/          VideoCard, VideoGrid, VideoPlayer, UploadForm
    forms/          Auth forms
    settings/       Profile, avatar, password forms
    admin/          Admin-specific components
    dashboard/      Dashboard-specific components
  lib/
    queries/        Database query functions
    validations/    Zod schemas
    auth.ts         Auth.js config
    prisma.ts       Prisma client singleton
    processing.ts   FFmpeg video processing
  types/            TypeScript type definitions
```

## User Roles

- **Viewer** — Browse and watch (default on registration)
- **Creator** — Upload videos, manage channel (admin-assigned)
- **Studio** — Organization account, same as Creator (admin-assigned)
- **Admin** — Full platform management

## Available Scripts

| Script          | Description                    |
|-----------------|--------------------------------|
| `npm run dev`   | Start dev server (Turbopack)   |
| `npm run build` | Production build               |
| `npm start`     | Start production server        |
| `npm run lint`  | Run ESLint                     |
| `npm run db:migrate` | Run Prisma migrations    |
| `npm run db:push`    | Push schema to database  |
| `npm run db:seed`    | Seed database            |
| `npm run db:studio`  | Open Prisma Studio       |

## Production TODOs

Search the codebase for `// TODO:` to find all production upgrade markers:

- Cloud storage (S3/R2) for video and image files
- CDN for media delivery
- Job queue (BullMQ/Inngest) for video processing
- Search engine (Meilisearch/Typesense) for better search
- Cloud transcoding (AWS MediaConvert/Mux)
- Redis for caching and rate limiting
- Email service for notifications
- Analytics service for view tracking
- Multi-channel support for Studio accounts
- Team member invites and permissions
