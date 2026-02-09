# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

# Video Platform MVP

> **This file defines project conventions for Claude Code. Follow these rules strictly.**

---

## Project Overview

**Type:** Mainstream media video showcase platform**Purpose:** Studios and individual creators upload/manage videos; viewers browse, search, and watch**Phase:** MVP (Phase 1)**OS:** Windows 11 (development)

---

## Tech Stack — Exact Versions

Package

Version

Notes

**next**

16.1.6

App Router, React Server Components, Turbopack dev

**react / react-dom**

19.2.3

React 19 with `use()`, Actions, `useOptimistic`, `useFormStatus`

**typescript**

^5

Strict mode enabled

**tailwindcss**

^4

Tailwind CSS v4 — CSS-first config, `@theme` directive

**prisma** (CLI)

^7.3.0

Prisma 7 — `prisma.config.ts`, driver adapters, NO url in schema

**@prisma/client**

^7.3.0

Import from `@prisma/client`

**@prisma/adapter-pg**

^7.3.0

Required driver adapter for self-hosted PostgreSQL

**zod**

^4.3.6

**Zod 4** — new APIs, see Zod 4 section below

**next-auth**

5.0.0-beta.30

Auth.js v5 beta — App Router native

**@auth/prisma-adapter**

^2.11.1

Prisma adapter for Auth.js

**react-hook-form**

^7.71.1

Form state management

**@hookform/resolvers**

^5.2.2

Zod resolver for react-hook-form

**hls.js**

^1.6.15

HLS video playback

**lucide-react**

^0.563.0

Icon library (NOT Font Awesome)

**date-fns**

^4.1.0

Date formatting

**slugify**

^1.6.6

URL slug generation

**sonner**

^2.0.7

Toast notifications

**next-themes**

^0.4.6

Dark/light theme switching

**radix-ui**

^1.4.3

Primitives (installed via Shadcn)

**shadcn** (CLI)

^3.8.4

Component generation tool

**class-variance-authority**

^0.7.1

Variant styling (used by Shadcn)

**clsx + tailwind-merge**

^2.1.1 / ^3.4.0

Class merging (used by `cn()` helper)

**dotenv**

^17.2.4

Env loading for `prisma.config.ts`

**tw-animate-css**

^1.4.0

Animation utilities

---

## Critical Version-Specific Rules

### Prisma 7 (NOT Prisma 6)

Prisma 7 has breaking changes from Prisma 6. **Follow these rules exactly:**

**Config Architecture:**

-   `prisma/schema.prisma` — Models and generator ONLY. **NO `url` in datasource block.**
-   `prisma.config.ts` — Database URL lives HERE (project root)
-   `src/lib/prisma.ts` — Client singleton using `PrismaPg` driver adapter

**Schema file pattern:**

```prisma
generator client {  provider = "prisma-client"          // NOT "prisma-client-js"  output   = "../src/generated/prisma"}datasource db {  provider = "postgresql"  // NO url here — url is in prisma.config.ts}
```

**Client singleton pattern (`src/lib/prisma.ts`):**

```typescript
import { PrismaPg } from "@prisma/adapter-pg";import { PrismaClient } from "@/generated/prisma/client";const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });const prisma = new PrismaClient({ adapter });export default prisma;
```

**Prisma commands:**

```bash
npx prisma generate        # Generate client to src/generated/prismanpx prisma db push          # Push schema (dev)npx prisma migrate dev      # Create migration (when ready)npx prisma studio           # Visual DB browser
```

**NEVER DO:**

-   ❌ Put `url = env("DATABASE_URL")` in schema.prisma
-   ❌ Use `provider = "prisma-client-js"` (that's Prisma 6)
-   ❌ Import from `@prisma/client` (we use custom output path)
-   ❌ Create PrismaClient without the adapter

### Zod 4 (NOT Zod 3)

Zod 4 has significant API changes. **Use Zod 4 syntax only:**

**String format validators — top-level functions:**

```typescript
// ✅ Zod 4 — CORRECTimport { z } from "zod";const emailSchema = z.email();           // NOT z.string().email()const urlSchema = z.url();               // NOT z.string().url()const uuidSchema = z.uuid();             // NOT z.string().uuid()// String with constraints — still use z.string()const nameSchema = z.string().min(2).max(100);
```

**Error customization — unified `error` param:**

```typescript
// ✅ Zod 4 — CORRECTz.string().min(5, { error: "Too short" });z.string({  error: (issue) =>    issue.input === undefined ? "Required" : "Must be a string",});// ❌ Zod 3 — WRONGz.string().min(5, { message: "Too short" });       // deprecatedz.string({ required_error: "Required" });           // removedz.string({ invalid_type_error: "Not a string" });   // removed
```

**Object schemas:**

```typescript
// ✅ Zod 4 — CORRECTz.strictObject({ name: z.string() });   // strict (no extra keys)z.looseObject({ name: z.string() });    // passthrough (allow extra)z.object({ name: z.string() });         // default (strip extra)// ❌ Zod 3 — WRONG (still works but deprecated)z.object({ name: z.string() }).strict();z.object({ name: z.string() }).passthrough();
```

**Records — now require two arguments:**

```typescript
// ✅ Zod 4 — CORRECTz.record(z.string(), z.number());       // key schema + value schema// ❌ Zod 3 — WRONGz.record(z.number());                   // single argument removed
```

**Other Zod 4 changes:**

-   `.merge()` is deprecated → use `.extend()` instead
-   `.superRefine()` is deprecated → use `.check()` instead
-   `error.errors` → `error.issues`
-   `message` param still works but is deprecated → use `error` param

**Form validation pattern with Zod 4 + react-hook-form:**

```typescript
import { z } from "zod";import { zodResolver } from "@hookform/resolvers/zod";import { useForm } from "react-hook-form";const loginSchema = z.object({  email: z.email({ error: "Valid email required" }),  password: z.string().min(8, { error: "Min 8 characters" }),});type LoginFormData = z.infer<typeof loginSchema>;const form = useForm<LoginFormData>({  resolver: zodResolver(loginSchema),});
```

### Next.js 16 (NOT Next.js 15)

**Key differences from Next.js 15:**

-   Turbopack is the default dev bundler
-   React 19 is the default (not RC)
-   Improved streaming SSR and partial prerendering
-   `next.config.ts` (TypeScript config) is standard

**App Router patterns:**

```typescript
// Server Component (default — no directive needed)export default async function Page() {  const data = await prisma.video.findMany();  return <div>{/* render */}</div>;}// Client Component (must declare)"use client";export default function InteractiveComponent() {  const [state, setState] = useState(false);  return <button onClick={() => setState(true)}>Click</button>;}
```

**Server Actions (preferred over API routes for mutations):**

```typescript
// src/app/actions/video.ts"use server";import { prisma } from "@/lib/prisma";import { revalidatePath } from "next/cache";export async function publishVideo(videoId: string) {  await prisma.video.update({    where: { id: videoId },    data: { status: "PUBLISHED", publishedAt: new Date() },  });  revalidatePath("/dashboard/videos");}
```

**When to use API Routes vs Server Actions:**

-   **Server Actions:** Form submissions, mutations, data updates
-   **API Routes (Route Handlers):** Webhooks, file uploads, external API endpoints, long polling

### Tailwind CSS 4 (NOT Tailwind 3)

**CSS-first configuration — NO `tailwind.config.ts` needed:**

```css
/* src/app/globals.css */@import "tailwindcss";@theme {  --color-brand: #3b82f6;
```

**Key differences from Tailwind 3:**

-   Config is in CSS (`@theme` directive), not `tailwind.config.ts`
-   Automatic content detection (no `content` array needed)
-   Native CSS nesting support
-   `@apply` still works but CSS-native approach is preferred

### React 19

**New hooks and patterns available:**

```typescript
// useOptimistic — for optimistic UI updatesconst [optimisticViews, addOptimisticView] = useOptimistic(viewCount);// useFormStatus — for form submission statesimport { useFormStatus } from "react-dom";function SubmitButton() {  const { pending } = useFormStatus();  return <button disabled={pending}>{pending ? "Saving..." : "Save"}</button>;}// use() — for reading promises/context in renderconst data = use(dataPromise);
```

---

## Project Structure

```
video-platform/├── docs/│   ├── AUTH.md                    # Complete authentication & authorization specification│   ├── DATABASE_SCHEMA.md         # Complete Prisma schema specification│   ├── SERVER_INTERACTIONS.md     # Complete server-side data fetching, mutations, API routes spec│   ├── UI_DESIGN.md               # Complete UI and design system specification│   └── VIDEO_PIPELINE.md          # Complete video upload, transcoding, storage, and playback spec├── prisma/│   ├── schema.prisma              # Models only, no url│   ├── seed.ts                    # Seed script (categories + admin user)│   └── migrations/                # Generated by prisma migrate├── prisma.config.ts               # Database URL (Prisma 7)├── public/│   └── images/├── src/│   ├── app/│   │   ├── (auth)/                # Route group: no main nav│   │   │   ├── login/│   │   │   │   └── page.tsx│   │   │   ├── register/│   │   │   │   └── page.tsx│   │   │   ├── forgot-password/│   │   │   │   └── page.tsx│   │   │   ├── reset-password/│   │   │   │   └── page.tsx│   │   │   └── layout.tsx         # Auth layout (centered, minimal)│   │   ├── (main)/                # Route group: public pages with nav│   │   │   ├── page.tsx           # Homepage│   │   │   ├── watch/[slug]/│   │   │   ├── channel/[id]/│   │   │   ├── category/[slug]/│   │   │   ├── search/│   │   │   └── layout.tsx         # Main layout (header + footer)│   │   ├── (dashboard)/           # Route group: creator/studio panel│   │   │   ├── dashboard/│   │   │   ├── upload/│   │   │   ├── videos/│   │   │   ├── settings/│   │   │   └── layout.tsx         # Dashboard layout (sidebar nav)│   │   ├── (admin)/               # Route group: admin panel│   │   │   ├── admin/│   │   │   └── layout.tsx│   │   ├── api/│   │   │   ├── auth/[...nextauth]/│   │   │   ├── videos/│   │   │   └── upload/│   │   ├── actions/               # Server Actions│   │   ├── layout.tsx             # Root layout│   │   ├── page.tsx               # Root redirect or landing│   │   └── globals.css│   ├── components/│   │   ├── ui/                    # Shadcn components (auto-generated, DO NOT edit)│   │   ├── layout/                # Header, Footer, Sidebar, Navigation│   │   ├── video/                 # VideoCard, VideoGrid, VideoPlayer, VideoUpload│   │   └── forms/                 # LoginForm, RegisterForm, ForgotPasswordForm, ResetPasswordForm, VideoMetadataForm│   ├── hooks/                     # Custom React hooks│   ├── generated/│   │   └── prisma/                # Prisma-generated client (DO NOT edit)│   ├── lib/│   │   ├── prisma.ts              # Prisma client singleton (with adapter)│   │   ├── auth.ts                # Auth.js config (providers, callbacks, JWT)│   │   ├── auth-utils.ts           # Role helpers (requireAuth, requireRole, hasRole)│   │   ├── utils.ts               # cn() helper (Shadcn)│   │   └── validations/           # Zod 4 schemas (auth.ts, video.ts, etc.)│   └── types/                     # TypeScript type definitions│       └── next-auth.d.ts         # Auth.js type augmentation (Session, JWT, User)├── middleware.ts                   # Route protection (Edge runtime)├── .env                           # DATABASE_URL, AUTH_SECRET, etc.├── .gitignore├── CLAUDE.md                      # This file├── components.json                # Shadcn config├── next.config.ts├── package.json└── tsconfig.json
```

---

## Documentation

Project documentation lives in `docs/`.

**Rule:** When adding new documentation files to `docs/`, always update CLAUDE.md to reference them:

1.  Add the file to the Project Structure tree above
2.  Add a brief description of what the doc contains

This ensures Claude Code can discover all relevant project context.

---

## Design System

### Theme: Dark Mode Primary

```
Background:      #0f0f0f (zinc-950) — main backgroundSurface:         #18181b (zinc-900) — cards, panelsSurface Hover:   #27272a (zinc-800) — hover statesBorder:          #3f3f46 (zinc-700) — subtle bordersText Primary:    #fafafa (zinc-50)  — headings, primary textText Secondary:  #a1a1aa (zinc-400) — descriptions, metadataText Muted:      #71717a (zinc-500) — timestamps, countsAccent:          TBD (electric blue, red, or teal) — CTAs, active statesDanger:          #ef4444 (red-500)  — errors, delete actionsSuccess:         #22c55e (green-500) — published, success states
```

### Typography

```typescript
// src/app/layout.tsximport { Plus_Jakarta_Sans } from "next/font/google";const jakarta = Plus_Jakarta_Sans({  subsets: ["latin"],  variable: "--font-sans",});// Apply: <body className={`${jakarta.variable} font-sans`}>
```

**Scale:**

-   Page titles: `text-2xl font-bold` or `text-3xl font-bold`
-   Section headings: `text-xl font-semibold`
-   Card titles: `text-base font-medium`
-   Body text: `text-sm` (14px)
-   Metadata/captions: `text-xs text-zinc-400`

### Layout Patterns

**Video Grid:** Responsive columns

```
Mobile:   1 column   (grid-cols-1)Tablet:   2 columns  (sm:grid-cols-2)Desktop:  3-4 columns (lg:grid-cols-3 xl:grid-cols-4)Sidebar:  3-5 columns (when sidebar present, fewer cols)
```

**Spacing:**

-   Page padding: `px-4 sm:px-6 lg:px-8`
-   Section gaps: `space-y-8` or `gap-8`
-   Card gaps: `gap-4` or `gap-6`
-   Internal card padding: `p-4`

### Component Patterns

**VideoCard layout:**

```
┌─────────────────────┐│    Thumbnail        │  16:9 aspect ratio│    (with duration)  │  Hover: slight scale + overlay├─────────────────────┤│ Avatar | Title      │  2 lines max, truncate│        | Creator    │  text-xs text-zinc-400│        | Views·Date │  "12K views · 3 days ago"└─────────────────────┘
```

---

## Coding Conventions

### File Naming

-   **Components:** PascalCase — `VideoCard.tsx`, `SearchBar.tsx`
-   **Pages/Layouts:** lowercase — `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`
-   **Utilities/Hooks:** camelCase — `useVideoPlayer.ts`, `formatViews.ts`
-   **Server Actions:** camelCase — `publishVideo.ts`, `deleteVideo.ts`
-   **Zod schemas:** camelCase with Schema suffix — `loginSchema.ts`, `videoSchema.ts`
-   **Types:** PascalCase with Type/Props suffix — `VideoCardProps`, `UserRole`

### Component Structure

```typescript
// 1. Imports (grouped: react, next, third-party, local)"use client"; // Only if neededimport { useState } from "react";import Image from "next/image";import { Play } from "lucide-react";import { Button } from "@/components/ui/button";import { cn } from "@/lib/utils";// 2. Typesinterface VideoCardProps {  video: {    id: string;    title: string;    thumbnailUrl: string;    duration: number;    viewCount: number;    createdAt: Date;    creator: { name: string; avatarUrl: string };  };  className?: string;}// 3. Componentexport function VideoCard({ video, className }: VideoCardProps) {  return (    <div className={cn("group cursor-pointer", className)}>      {/* ... */}    </div>  );}
```

### Import Rules

-   Use `@/` path alias for all project imports
-   Import icons individually: `import { Play, Pause, Search } from "lucide-react"`
-   Import Shadcn components from `@/components/ui/[component]`
-   Never use `require()` — always ES module `import`

### Server vs Client Components

**Default to Server Components.** Only add `"use client"` when you need:

-   `useState`, `useEffect`, `useRef`, or other React hooks
-   Event handlers (`onClick`, `onChange`, `onSubmit`)
-   Browser APIs (`window`, `localStorage`, `navigator`)
-   Third-party client libraries (HLS.js, react-hook-form)

**Pattern: Server wrapper + client island:**

```typescript
// page.tsx (Server)export default async function WatchPage({ params }: { params: { slug: string } }) {  const video = await prisma.video.findUnique({ where: { slug: params.slug } });  return <VideoPlayer video={video} />; // Client component}// VideoPlayer.tsx (Client)"use client";export function VideoPlayer({ video }: { video: Video }) {  // HLS.js, play/pause, etc.}
```

### Error Handling

```typescript
// For Server Actionsexport async function createVideo(formData: FormData) {  try {    const data = videoSchema.parse(Object.fromEntries(formData));    const video = await prisma.video.create({ data });    revalidatePath("/dashboard/videos");    return { success: true, video };  } catch (error) {    if (error instanceof z.ZodError) {      return { success: false, errors: error.issues };    }    return { success: false, error: "Something went wrong" };  }}// For API Routesexport async function GET(request: NextRequest) {  try {    // ... logic    return NextResponse.json(data);  } catch (error) {    console.error("[API] Error:", error);    return NextResponse.json(      { error: "Internal server error" },      { status: 500 }    );  }}
```

### Loading & Error States

Every route group should have:

-   `loading.tsx` — Skeleton UI matching the page layout
-   `error.tsx` — Error boundary with retry button
-   `not-found.tsx` — 404 page for dynamic routes

```typescript
// loading.tsx exampleimport { Skeleton } from "@/components/ui/skeleton";export default function Loading() {  return (    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">      {Array.from({ length: 8 }).map((_, i) => (        <div key={i} className="space-y-3">          <Skeleton className="aspect-video w-full rounded-lg" />          <Skeleton className="h-4 w-3/4" />          <Skeleton className="h-3 w-1/2" />        </div>      ))}    </div>  );}
```

---

## Database Schema (MVP)

> **Full schema specification:** See `docs/DATABASE_SCHEMA.md` for the complete Prisma schema ready to copy into `prisma/schema.prisma`.

**Naming conventions:**

-   Models: PascalCase singular — `User`, `Video`, `Category`
-   Fields: camelCase — `viewCount`, `createdAt`, `thumbnailUrl`
-   Enums: SCREAMING_SNAKE_CASE values — `PUBLISHED`, `PROCESSING`
-   Relations: descriptive names — `creator`, `category`, `tags`
-   IDs: Use `cuid()` for all primary keys

**Core models:**

```
User       — id, email, passwordHash, name, avatarUrl, bio, role, createdAt, updatedAtVideo      — id, userId, title, slug, description, categoryId, status, duration,             fileUrl, hlsUrl, thumbnailUrl, viewCount, createdAt, updatedAt, publishedAtCategory   — id, name, slug, description, sortOrderTag        — id, name, slugVideoTag   — videoId, tagId (many-to-many junction)ProcessingJob — id, videoId, status, progress, errorMessage, startedAt, completedAt
```

**User roles enum:** `VIEWER`, `CREATOR`, `STUDIO`, `ADMIN`**Video status enum:** `DRAFT`, `PROCESSING`, `PUBLISHED`, `UNLISTED`, `REJECTED`**Job status enum:** `QUEUED`, `PROCESSING`, `COMPLETED`, `FAILED`

---

## Authentication (Auth.js v5)

**Setup pattern:**

```typescript
// src/lib/auth.tsimport NextAuth from "next-auth";import Credentials from "next-auth/providers/credentials";import { PrismaAdapter } from "@auth/prisma-adapter";import { prisma } from "@/lib/prisma";export const { handlers, auth, signIn, signOut } = NextAuth({  adapter: PrismaAdapter(prisma),  providers: [    Credentials({      // credential-based auth    }),  ],  session: { strategy: "jwt" },  callbacks: {    jwt({ token, user }) {      if (user) token.role = user.role;      return token;    },    session({ session, token }) {      session.user.role = token.role;      return session;    },  },});
```

**Protecting routes:**

```typescript
// Middleware or layout-level auth checkimport { auth } from "@/lib/auth";import { redirect } from "next/navigation";export default async function DashboardLayout({ children }) {  const session = await auth();  if (!session) redirect("/login");  if (session.user.role === "VIEWER") redirect("/");  return <>{children}</>;}
```

---

## Git Workflow

### Branch Naming

```
feat/auth              — New featurefeat/video-upload      — New featurefix/upload-progress    — Bug fixrefactor/prisma-schema — Code refactorchore/update-deps      — Maintenance
```

### Commit Message Format

```
type(scope): descriptionfeat(auth): add email/password registration with Zod 4 validationfix(player): resolve HLS quality switching on mobilerefactor(db): normalize tags into separate tablechore(deps): update Prisma to 7.3.1
```

**Types:** `feat`, `fix`, `refactor`, `chore`, `docs`, `style`, `test`

### Feature Branch Workflow

```
main ← feat/auth ← feat/database-schema ← feat/video-upload ← ...
```

1.  Create branch from `main`: `git checkout -b feat/auth`
2.  Implement feature with atomic commits
3.  Test locally
4.  Merge to `main`: `git checkout main && git merge feat/auth`
5.  Delete branch: `git branch -d feat/auth`

---

## Implementation Order

```
Feature 1:  Auth System                    → feat/authFeature 2:  Full Database Schema           → feat/database-schemaFeature 3:  Video Upload & Processing      → feat/video-uploadFeature 4:  Creator Dashboard              → feat/creator-dashboardFeature 5:  Video Browsing (Public)        → feat/browsingFeature 6:  Search                         → feat/searchFeature 7:  Video Player & Watch Page      → feat/video-playerFeature 8:  Channel/Profile Pages          → feat/channelsFeature 9:  Admin Panel                    → feat/adminFeature 10: Polish & Deploy                → feat/polish
```

---

## Do's and Don'ts

### DO

-   ✅ Use Server Components by default
-   ✅ Use Server Actions for form mutations
-   ✅ Use Zod 4 APIs (`z.email()`, `{ error: }` param)
-   ✅ Use Prisma 7 driver adapter pattern
-   ✅ Use `cn()` for conditional class merging
-   ✅ Use Lucide React for icons (tree-shakable SVGs)
-   ✅ Use `next/image` for all images (optimization, lazy loading)
-   ✅ Use `next/font` for fonts (self-hosted, no layout shift)
-   ✅ Add Skeleton loading states for all async pages
-   ✅ Validate ALL inputs with Zod 4 (both client and server)
-   ✅ Use TypeScript strict mode — no `any` types
-   ✅ Run `npx prisma generate` after every schema change

### DON'T

-   ❌ Use Font Awesome (use Lucide React)
-   ❌ Use Zod 3 syntax (`z.string().email()`, `{ message: }`)
-   ❌ Put database URL in `schema.prisma` (Prisma 7)
-   ❌ Use `"prisma-client-js"` generator (Prisma 7 uses `"prisma-client"`)
-   ❌ Add `"use client"` unless the component actually needs it
-   ❌ Use `localStorage` for auth state (use Auth.js sessions)
-   ❌ Store video files in PostgreSQL (use S3/R2 object storage)
-   ❌ Import entire icon libraries (`import * from "lucide-react"`)
-   ❌ Use `tailwind.config.ts` for theme (Tailwind 4 uses CSS `@theme`)
-   ❌ Skip error boundaries — every route needs `error.tsx`
-   ❌ Use `any` type — always define proper types
-   ❌ Commit `.env`, `node_modules/`, `.next/`, or `src/generated/`

---

## Current State Note

The `src/app/my-app/` directory contains a nested Next.js project that was likely created by mistake and should be removed.