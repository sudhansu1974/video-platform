# UI Design Specification

> Complete UI and design system specification for the Video Platform MVP.
> **This is the single source of truth for all visual and component decisions.**
> Claude Code must reference this document when building any page or component.

---

## Table of Contents

1. [Design System](#1-design-system)
2. [Component Rules](#2-component-rules)
3. [Page Layouts](#3-page-layouts)
4. [Reusable Component Specs](#4-reusable-component-specs)
5. [Utility Formats](#5-utility-formats)

---

## 1. Design System

### 1.1 Color Palette

**Dark mode is the primary and default theme.** Content-first design: thumbnails and video imagery pop against the dark background.

| Token | Tailwind Class | Hex | Usage |
|-------|---------------|-----|-------|
| Background | `bg-zinc-950` | `#09090b` | Main page background |
| Surface | `bg-zinc-900` | `#18181b` | Cards, panels, modals, dropdowns |
| Surface Hover | `bg-zinc-800` | `#27272a` | Hover states on surfaces |
| Surface Active | `bg-zinc-800/80` | — | Active/pressed states |
| Border | `border-zinc-700/50` | — | Subtle semi-transparent borders |
| Border Strong | `border-zinc-700` | `#3f3f46` | Visible borders (inputs, dividers) |
| Text Primary | `text-zinc-50` | `#fafafa` | Headings, primary content |
| Text Secondary | `text-zinc-400` | `#a1a1aa` | Descriptions, metadata, labels |
| Text Muted | `text-zinc-500` | `#71717a` | Timestamps, counters, placeholders |
| Accent | `text-blue-500` / `bg-blue-500` | `#3b82f6` | CTAs, active states, links, focus rings |
| Accent Hover | `bg-blue-600` | `#2563eb` | Hover on accent buttons |
| Danger | `text-red-500` / `bg-red-500` | `#ef4444` | Errors, delete actions, rejected |
| Danger Hover | `bg-red-600` | `#dc2626` | Hover on danger buttons |
| Success | `text-green-500` / `bg-green-500` | `#22c55e` | Published, success states |
| Warning | `text-amber-500` / `bg-amber-500` | `#f59e0b` | Processing, pending states |

### 1.2 Tailwind CSS 4 Theme Config

Define custom tokens in `src/app/globals.css` using the `@theme` directive:

```css
@import "tailwindcss";
@import "tw-animate-css";

@theme {
  --color-brand: #3b82f6;
  --color-brand-hover: #2563eb;
  --font-sans: var(--font-jakarta), ui-sans-serif, system-ui, sans-serif;
}
```

**Do NOT create a `tailwind.config.ts` file.** Tailwind 4 uses CSS-first configuration.

### 1.3 Typography

**Font:** Plus Jakarta Sans via `next/font/google`

```typescript
// src/app/layout.tsx
import { Plus_Jakarta_Sans } from "next/font/google";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
});

// Apply to <body>:
<body className={`${jakarta.variable} font-sans`}>
```

**Type Scale:**

| Role | Classes | Size | Usage |
|------|---------|------|-------|
| Page Title | `text-2xl font-bold` or `text-3xl font-bold` | 24-30px | Top-level page headings |
| Section Heading | `text-xl font-semibold` | 20px | Section titles within pages |
| Card Title | `text-base font-medium` | 16px | VideoCard title, list item names |
| Body | `text-sm` | 14px | Default body text, descriptions |
| Caption/Meta | `text-xs text-zinc-400` | 12px | Timestamps, view counts, metadata |
| Overline | `text-xs font-semibold uppercase tracking-wider text-zinc-500` | 12px | Section labels, category tags |

**Line clamping for truncation:**

```
Single line:  truncate
Two lines:    line-clamp-2
Three lines:  line-clamp-3
```

### 1.4 Spacing System

| Context | Classes | Value |
|---------|---------|-------|
| Page horizontal padding | `px-4 sm:px-6 lg:px-8` | 16/24/32px |
| Page max width | `max-w-screen-2xl mx-auto` | 1536px |
| Section vertical gap | `space-y-8` or `gap-8` | 32px |
| Card grid gap | `gap-4` or `gap-6` | 16/24px |
| Card internal padding | `p-4` | 16px |
| Inline element gap | `gap-2` | 8px |
| Tight spacing | `gap-1` or `space-y-1` | 4px |

### 1.5 Border Radius

| Element | Class | Value |
|---------|-------|-------|
| Cards, thumbnails, modals | `rounded-lg` | 8px |
| Buttons, inputs, badges | `rounded-md` | 6px |
| Avatars, circular elements | `rounded-full` | 50% |
| Small tags/chips | `rounded-sm` | 4px |

### 1.6 Shadows

Minimal shadow usage. Rely on background color differentiation for depth.

| Context | Class |
|---------|-------|
| Dropdowns, popovers | `shadow-lg` (only for floating elements) |
| Modals/dialogs | `shadow-xl` |
| Cards | No shadow — use `bg-zinc-900` against `bg-zinc-950` |
| Focus rings | `ring-2 ring-blue-500/50 ring-offset-2 ring-offset-zinc-950` |

### 1.7 Transitions & Animations

```
Default transition:    transition-colors duration-150
Scale on hover:        transition-transform duration-200 hover:scale-[1.02]
Opacity fade:          transition-opacity duration-200
```

Keep animations subtle. No flashy transitions. Content should feel immediate.

### 1.8 Responsive Breakpoints

Use Tailwind's default breakpoints:

| Breakpoint | Width | Typical device |
|------------|-------|----------------|
| (default) | < 640px | Mobile |
| `sm:` | >= 640px | Large phone / small tablet |
| `md:` | >= 768px | Tablet |
| `lg:` | >= 1024px | Desktop |
| `xl:` | >= 1280px | Large desktop |
| `2xl:` | >= 1536px | Extra large |

---

## 2. Component Rules

### 2.1 Shadcn/ui Only

- **ONLY use Shadcn/ui components** for low-level UI primitives.
- **Never create custom** Button, Input, Dialog, Card, Badge, Table, Dropdown, or similar components from scratch.
- All custom components **compose** Shadcn primitives.
- Install Shadcn components via CLI: `npx shadcn@latest add [component]`
- Shadcn components live in `src/components/ui/` — **DO NOT edit** generated files.

**Required Shadcn components for MVP:**

```
button, card, input, label, badge, skeleton,
dialog, dropdown-menu, table, tabs, separator,
avatar, sheet, select, textarea, checkbox,
tooltip, sonner (toast), scroll-area, form
```

### 2.2 Icons

- **Lucide React ONLY.** Never use Font Awesome, Heroicons, or any other icon library.
- Import icons individually — never barrel import.

```typescript
// Correct
import { Play, Pause, Search, Upload, Settings } from "lucide-react";

// Wrong
import * as Icons from "lucide-react";
```

**Standard icon sizes:**

| Context | Size Class | Pixels |
|---------|-----------|--------|
| Inline with text | `h-4 w-4` | 16px |
| Button icon | `h-4 w-4` or `h-5 w-5` | 16-20px |
| Nav icon | `h-5 w-5` | 20px |
| Feature/empty state | `h-8 w-8` or `h-12 w-12` | 32-48px |
| Hero icon | `h-16 w-16` | 64px |

### 2.3 Images

- Always use `next/image` with explicit `width`, `height`, and `alt` props.
- For thumbnails with unknown aspect ratios, use `fill` with `object-cover` inside a sized container.

```typescript
// Fixed dimensions
<Image src={url} alt={title} width={320} height={180} className="rounded-lg" />

// Fill container (thumbnails)
<div className="relative aspect-video">
  <Image src={url} alt={title} fill className="object-cover rounded-lg" />
</div>
```

### 2.4 Class Merging

Always use the `cn()` helper for conditional or mergeable classes:

```typescript
import { cn } from "@/lib/utils";

<div className={cn(
  "rounded-lg bg-zinc-900 p-4",
  isActive && "border border-blue-500",
  className
)} />
```

### 2.5 Interactive States

Every interactive component must define:

| State | Pattern |
|-------|---------|
| Default | Base styles |
| Hover | `hover:bg-zinc-800` or `hover:text-zinc-50` |
| Focus | `focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:outline-none` |
| Active | `active:scale-[0.98]` (buttons) |
| Disabled | `disabled:opacity-50 disabled:pointer-events-none` |

### 2.6 Loading States

Every async-rendered component needs a Skeleton fallback:

```typescript
import { Skeleton } from "@/components/ui/skeleton";

// VideoCard skeleton
<div className="space-y-3">
  <Skeleton className="aspect-video w-full rounded-lg" />
  <div className="flex gap-3">
    <Skeleton className="h-8 w-8 rounded-full" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  </div>
</div>
```

### 2.7 Empty States

All list/grid views need an empty state:

```
┌─────────────────────────────────┐
│                                 │
│        [Icon: h-12 w-12]       │
│                                 │
│    No videos found              │  text-lg font-medium text-zinc-50
│    Try a different search or    │  text-sm text-zinc-400
│    browse categories            │
│                                 │
│    [ Browse Categories ]        │  Button variant="outline"
│                                 │
└─────────────────────────────────┘
```

### 2.8 Toast Notifications

Use `sonner` for all toast notifications:

```typescript
import { toast } from "sonner";

toast.success("Video published successfully");
toast.error("Failed to upload video");
toast.loading("Processing video...");
```

---

## 3. Page Layouts

### 3.0 Global Layout Structure

```
┌─────────────────────────────────────────────────────────┐
│ Root Layout (src/app/layout.tsx)                        │
│ - Font loading (Plus Jakarta Sans)                     │
│ - ThemeProvider (next-themes)                           │
│ - Toaster (sonner)                                     │
│ - <body className="bg-zinc-950 text-zinc-50">          │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │ Route Group Layout                                │  │
│  │ (auth) | (main) | (dashboard) | (admin)           │  │
│  │                                                   │  │
│  │  ┌─────────────────────────────────────────────┐  │  │
│  │  │ Page Content                                │  │  │
│  │  └─────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### 3a. Homepage — `(main)/page.tsx`

**Route:** `/`
**Layout:** `(main)/layout.tsx` — Header + Footer

```
┌─────────────────────────────────────────────────────────┐
│ HEADER                                                  │
│ ┌──────┐  ┌──────────────────────┐  ┌──────┐ ┌───────┐ │
│ │ Logo │  │ 🔍 Search videos...  │  │Login │ │Sign Up│ │
│ └──────┘  └──────────────────────┘  └──────┘ └───────┘ │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Trending Now                        ← Section heading  │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐      │
│  │▓▓▓▓▓▓▓▓▓│ │▓▓▓▓▓▓▓▓▓│ │▓▓▓▓▓▓▓▓▓│ │▓▓▓▓▓▓▓▓▓│     │
│  │▓▓▓▓▓▓▓▓▓│ │▓▓▓▓▓▓▓▓▓│ │▓▓▓▓▓▓▓▓▓│ │▓▓▓▓▓▓▓▓▓│     │
│  │ 12:34   │ │  8:21   │ │ 45:02   │ │  3:15   │     │
│  ├─────────┤ ├─────────┤ ├─────────┤ ├─────────┤     │
│  │○ Title  │ │○ Title  │ │○ Title  │ │○ Title  │     │
│  │  Creator│ │  Creator│ │  Creator│ │  Creator│     │
│  │  12K·3d │ │  8K·1w  │ │  1M·2m  │ │  500·5h │     │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘     │
│                                                         │
│  Latest Uploads                                         │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐      │
│  │ Video   │ │ Video   │ │ Video   │ │ Video   │      │
│  │ Card    │ │ Card    │ │ Card    │ │ Card    │      │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘      │
│                                                         │
│  🎬 Film                                See all →      │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐      │
│  │ Video   │ │ Video   │ │ Video   │ │ Video   │      │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘      │
│                                                         │
│  🎵 Music                               See all →      │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐      │
│  │ Video   │ │ Video   │ │ Video   │ │ Video   │      │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘      │
│                                                         │
├─────────────────────────────────────────────────────────┤
│ FOOTER                                                  │
│ About · Terms · Privacy · Contact          © 2025      │
└─────────────────────────────────────────────────────────┘
```

**Specifications:**
- **Sections:** "Trending Now" (top 8 by viewCount), "Latest Uploads" (newest 8), then 2-3 category sections (4 videos each)
- **Grid:** `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4`
- **Section heading:** `text-xl font-semibold text-zinc-50` with optional "See all" link (`text-sm text-blue-500 hover:text-blue-400`)
- **Section spacing:** `space-y-8` between sections
- **No hero banner** for MVP — jump straight to content

### 3b. Watch Page — `(main)/watch/[slug]/page.tsx`

**Route:** `/watch/[slug]`
**Layout:** `(main)/layout.tsx` — Header + Footer

```
┌─────────────────────────────────────────────────────────┐
│ HEADER                                                  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌───────────────────────────────┐  ┌─────────────────┐ │
│  │                               │  │ Related Videos  │ │
│  │                               │  │                 │ │
│  │        VIDEO PLAYER           │  │ ┌─────┐ Title  │ │
│  │        (16:9 ratio)           │  │ │thumb│ Creator│ │
│  │                               │  │ └─────┘ 2K · 1d│ │
│  │                               │  │                 │ │
│  │                               │  │ ┌─────┐ Title  │ │
│  └───────────────────────────────┘  │ │thumb│ Creator│ │
│                                     │ └─────┘ 5K · 3d│ │
│  Video Title Here                   │                 │ │
│  ────────────────────               │ ┌─────┐ Title  │ │
│  ┌──┐ Creator Name                  │ │thumb│ Creator│ │
│  │○○│ @username                     │ └─────┘ 12K·1w │ │
│  └──┘                               │                 │ │
│  1.2M views · Jan 15, 2025         │ ┌─────┐ Title  │ │
│                                     │ │thumb│ Creator│ │
│  ┌──────────────────────┐           │ └─────┘ 800·2h │ │
│  │ Tags: #tutorial #code│           │                 │ │
│  └──────────────────────┘           │  ... (8-12)     │ │
│                                     │                 │ │
│  Description text here...           │                 │ │
│  Can be multiple lines.             │                 │ │
│  Expandable if long.                │                 │ │
│                                     └─────────────────┘ │
│                                                         │
├─────────────────────────────────────────────────────────┤
│ FOOTER                                                  │
└─────────────────────────────────────────────────────────┘
```

**Specifications:**
- **Desktop layout:** Two-column — player area (left, ~70% / `col-span-8` on a 12-col grid) + related sidebar (right, ~30% / `col-span-4`)
- **Mobile layout:** Single column — player stacks above, related videos below
- **Player container:** `aspect-video w-full bg-black rounded-lg overflow-hidden`
- **Title:** `text-xl font-semibold text-zinc-50 mt-4`
- **Creator row:** Avatar (32px, `rounded-full`) + Name (link to channel, `text-sm font-medium text-zinc-50 hover:text-blue-400`) + Username (`text-xs text-zinc-400`)
- **Metadata:** `text-sm text-zinc-400` — "1.2M views · Jan 15, 2025"
- **Tags:** Row of Shadcn `Badge variant="secondary"` — `bg-zinc-800 text-zinc-300 hover:bg-zinc-700`
- **Description:** `text-sm text-zinc-300` — collapsible with "Show more" if > 3 lines
- **Related videos:** Compact horizontal card layout (small thumbnail left `w-40 aspect-video`, info right)
- **Related sidebar heading:** `text-base font-semibold text-zinc-50 mb-4`

### 3c. Category Page — `(main)/category/[slug]/page.tsx`

**Route:** `/category/[slug]`
**Layout:** `(main)/layout.tsx`

```
┌─────────────────────────────────────────────────────────┐
│ HEADER                                                  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Film                              ← text-2xl font-bold│
│  Movies, short films, and          ← text-sm zinc-400  │
│  cinematic content                                      │
│                                                         │
│  ┌──────────────────────────────────────────┐           │
│  │ Sort: [Latest ▼]                         │           │
│  └──────────────────────────────────────────┘           │
│                                                         │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐      │
│  │ Video   │ │ Video   │ │ Video   │ │ Video   │      │
│  │ Card    │ │ Card    │ │ Card    │ │ Card    │      │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘      │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐      │
│  │ Video   │ │ Video   │ │ Video   │ │ Video   │      │
│  │ Card    │ │ Card    │ │ Card    │ │ Card    │      │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘      │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐      │
│  │ Video   │ │ Video   │ │ Video   │ │ Video   │      │
│  │ Card    │ │ Card    │ │ Card    │ │ Card    │      │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘      │
│                                                         │
│  ┌─────┐ 1  2  3  ... 10 ┌─────┐                      │
│  │  <  │                  │  >  │   ← Pagination       │
│  └─────┘                  └─────┘                      │
│                                                         │
├─────────────────────────────────────────────────────────┤
│ FOOTER                                                  │
└─────────────────────────────────────────────────────────┘
```

**Specifications:**
- **Page title:** Category name as `text-2xl font-bold text-zinc-50`
- **Description:** Category description as `text-sm text-zinc-400 mt-1`
- **Sort dropdown:** Shadcn `Select` — options: "Latest", "Most Viewed", "Oldest"
- **Grid:** Same `4-col` responsive grid as homepage
- **Per page:** 12 videos (3 rows of 4)
- **Pagination:** Shadcn `Button variant="outline"` for prev/next + page numbers. Active page: `bg-blue-500 text-white`

### 3d. Search Results — `(main)/search/page.tsx`

**Route:** `/search?q=query`
**Layout:** `(main)/layout.tsx`

```
┌─────────────────────────────────────────────────────────┐
│ HEADER                                                  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Results for "tutorial"            ← text-2xl font-bold│
│  42 videos found                   ← text-sm zinc-400  │
│                                                         │
│  ┌──────────────────────────────────────────────┐       │
│  │ Category: [All ▼]  Sort: [Relevance ▼]       │       │
│  └──────────────────────────────────────────────┘       │
│                                                         │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐      │
│  │ Video   │ │ Video   │ │ Video   │ │ Video   │      │
│  │ Card    │ │ Card    │ │ Card    │ │ Card    │      │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘      │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐      │
│  │ Video   │ │ Video   │ │ Video   │ │ Video   │      │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘      │
│                                                         │
│  ← Pagination →                                        │
│                                                         │
├─────────────────────────────────────────────────────────┤
│ FOOTER                                                  │
└─────────────────────────────────────────────────────────┘

── No Results State ──────────────────────────────────────

│                                                         │
│  Results for "xyzabc123"                                │
│                                                         │
│            [Search icon: h-12 w-12 zinc-500]            │
│                                                         │
│            No videos found                              │
│            Try different keywords or                    │
│            browse categories                            │
│                                                         │
│            [ Browse Categories ]                        │
│                                                         │
```

**Specifications:**
- **Heading:** `Results for "{query}"` — `text-2xl font-bold`
- **Result count:** `text-sm text-zinc-400`
- **Filter bar:** Row of Shadcn `Select` components — Category (all categories from DB), Sort by (Relevance, Latest, Most Viewed)
- **Grid + pagination:** Same pattern as Category page
- **No results state:** Centered empty state with `Search` icon, message, and CTA button

### 3e. Channel Page — `(main)/channel/[username]/page.tsx`

**Route:** `/channel/[username]`
**Layout:** `(main)/layout.tsx`

```
┌─────────────────────────────────────────────────────────┐
│ HEADER                                                  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Banner / gradient area (h-32 sm:h-48)            │  │
│  │  bg-gradient-to-r from-zinc-900 to-zinc-800       │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ┌────┐                                                 │
│  │    │  Creator Display Name        ← text-2xl bold   │
│  │ AV │  @username                   ← text-sm zinc-400│
│  │    │  24 videos                   ← text-sm zinc-500│
│  └────┘                                                 │
│         Bio text goes here, can be                      │
│         a couple of lines long.      ← text-sm zinc-300│
│                                                         │
│  ┌────────────────────────────────────────────────────┐ │
│  │ [Videos]  [About]                 ← Shadcn Tabs   │ │
│  └────────────────────────────────────────────────────┘ │
│                                                         │
│  ── Videos Tab (default) ──                             │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐      │
│  │ Video   │ │ Video   │ │ Video   │ │ Video   │      │
│  │ Card    │ │ Card    │ │ Card    │ │ Card    │      │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘      │
│                                                         │
│  ── About Tab ──                                        │
│  │ Joined: January 2025                                │
│  │ Total views: 1.2M                                   │
│  │                                                     │
│  │ Full bio text...                                    │
│                                                         │
├─────────────────────────────────────────────────────────┤
│ FOOTER                                                  │
└─────────────────────────────────────────────────────────┘
```

**Specifications:**
- **Banner:** `h-32 sm:h-48 bg-gradient-to-r from-zinc-900 to-zinc-800 rounded-lg`
- **Avatar:** `h-20 w-20 sm:h-24 sm:w-24 rounded-full border-4 border-zinc-950` — positioned to overlap banner bottom edge with negative margin (`-mt-12`)
- **Display name:** `text-2xl font-bold text-zinc-50`
- **Username:** `text-sm text-zinc-400`
- **Video count:** `text-sm text-zinc-500`
- **Bio:** `text-sm text-zinc-300 max-w-2xl mt-2`
- **Tabs:** Shadcn `Tabs` component — "Videos" (default, grid of published videos), "About" (join date, total views, full bio)
- **Videos grid:** Same 4-col responsive grid, no creator avatar shown (redundant on channel page)

### 3f. Login & Register Pages — `(auth)/login/page.tsx`, `(auth)/register/page.tsx`

**Routes:** `/login`, `/register`
**Layout:** `(auth)/layout.tsx` — Centered, minimal (no header/footer)

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│                        bg-zinc-950                      │
│                                                         │
│              ┌─────────────────────────┐                │
│              │      LOGO / Title       │                │
│              │                         │                │
│              │  ┌───────────────────┐  │                │
│              │  │ Email             │  │                │
│              │  └───────────────────┘  │                │
│              │  ┌───────────────────┐  │                │
│              │  │ Password          │  │                │
│              │  └───────────────────┘  │                │
│              │                         │  ← Login only  │
│              │  ┌───────────────────┐  │                │
│              │  │    Sign In        │  │  ← full-width  │
│              │  └───────────────────┘  │    blue-500 btn│
│              │                         │                │
│              │  Don't have an account? │                │
│              │  Sign up →              │  ← text-blue-500│
│              └─────────────────────────┘                │
│                                                         │
│                     max-w-md mx-auto                    │
│                                                         │
└─────────────────────────────────────────────────────────┘

── Register has additional fields ──

│              │  ┌───────────────────┐  │                │
│              │  │ Display Name      │  │                │
│              │  └───────────────────┘  │                │
│              │  ┌───────────────────┐  │                │
│              │  │ Username          │  │                │
│              │  └───────────────────┘  │                │
│              │  ┌───────────────────┐  │                │
│              │  │ Email             │  │                │
│              │  └───────────────────┘  │                │
│              │  ┌───────────────────┐  │                │
│              │  │ Password          │  │                │
│              │  └───────────────────┘  │                │
│              │  ┌───────────────────┐  │                │
│              │  │ Confirm Password  │  │                │
│              │  └───────────────────┘  │                │
```

**Specifications:**
- **Layout:** `min-h-screen flex items-center justify-center bg-zinc-950`
- **Card:** `max-w-md w-full` using Shadcn `Card` — `bg-zinc-900 border-zinc-700/50`
- **Logo/Title:** App name or logo centered at top of card — `text-2xl font-bold text-zinc-50`
- **Form inputs:** Shadcn `Input` + `Label` — dark theme: `bg-zinc-950 border-zinc-700 text-zinc-50 placeholder:text-zinc-500`
- **Submit button:** Full width, `Button` with `bg-blue-500 hover:bg-blue-600 text-white`
- **Switch link:** `text-sm text-zinc-400` with `text-blue-500 hover:text-blue-400` link
- **Error messages:** `text-sm text-red-500` below each field (react-hook-form + Zod 4 validation)
- **Loading state:** Button shows spinner + "Signing in..." via `useFormStatus`

### 3g. Creator Dashboard — `(dashboard)/` routes

**Routes:** `/dashboard`, `/dashboard/videos`, `/dashboard/upload`, `/dashboard/settings`
**Layout:** `(dashboard)/layout.tsx` — Sidebar + Content area

```
┌─────────────────────────────────────────────────────────┐
│ HEADER (simplified — logo + avatar dropdown only)       │
├──────────┬──────────────────────────────────────────────┤
│ SIDEBAR  │  CONTENT AREA                               │
│          │                                              │
│ ┌──────┐ │  ── Dashboard Overview (/dashboard) ──      │
│ │ Logo │ │                                              │
│ └──────┘ │  ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│          │  │ Total    │ │ Total    │ │ Published│    │
│ Overview │  │ Videos   │ │ Views    │ │ Videos   │    │
│ My Videos│  │   24     │ │  1.2M    │ │   18     │    │
│ Upload   │  └──────────┘ └──────────┘ └──────────┘    │
│ Settings │                                              │
│          │  Recent Videos                               │
│          │  ┌─────────────────────────────────────┐    │
│          │  │ thumb │ Title      │ PUBLISHED │ 12K│    │
│          │  │ thumb │ Title      │ DRAFT     │  0 │    │
│          │  │ thumb │ Title      │ PROCESSING│  0 │    │
│          │  └─────────────────────────────────────┘    │
│          │                                              │
├──────────┴──────────────────────────────────────────────┤

── My Videos (/dashboard/videos) ──

│ SIDEBAR  │  My Videos                    [+ Upload]     │
│          │                                              │
│          │  ┌───────────────────────────────────────┐   │
│          │  │ Thumb │ Title      │Status │Views│Date│   │
│          │  ├───────┼────────────┼───────┼─────┼────┤   │
│          │  │ ░░░░░ │ My Video 1 │🟢 PUB │ 12K │ 3d │   │
│          │  │ ░░░░░ │ Draft Vid  │⚫ DRF │   0 │ 1h │   │
│          │  │ ░░░░░ │ Processing │🟡 PRC │   0 │ 5m │   │
│          │  │ ░░░░░ │ Unlisted   │🔵 UNL │ 200 │ 1w │   │
│          │  └───────┴────────────┴───────┴─────┴────┘   │
│          │                                              │
│          │  Each row has ··· menu: Edit, Delete,        │
│          │  Publish/Unpublish                           │

── Upload (/dashboard/upload) ──

│ SIDEBAR  │  Upload Video                                │
│          │                                              │
│          │  ┌─────────────────────────────────────┐     │
│          │  │                                     │     │
│          │  │     ☁️ Drag & drop video file       │     │
│          │  │     or click to browse              │     │
│          │  │                                     │     │
│          │  │     MP4, WebM, MOV — max 2GB        │     │
│          │  │                                     │     │
│          │  └─────────────────────────────────────┘     │
│          │                                              │
│          │  Title:     [________________________]       │
│          │  Slug:      [________________________] auto  │
│          │  Category:  [Select category ▼      ]       │
│          │  Tags:      [tag input with chips   ]       │
│          │  Description:                                │
│          │  ┌─────────────────────────────────────┐     │
│          │  │                                     │     │
│          │  │                                     │     │
│          │  └─────────────────────────────────────┘     │
│          │                                              │
│          │  [Save as Draft]  [Upload & Publish]         │

── Settings (/dashboard/settings) ──

│ SIDEBAR  │  Profile Settings                            │
│          │                                              │
│          │  ┌────┐                                      │
│          │  │ AV │  Change Avatar                       │
│          │  └────┘                                      │
│          │                                              │
│          │  Display Name: [________________]            │
│          │  Username:     [________________]            │
│          │  Bio:                                        │
│          │  ┌─────────────────────────────────────┐     │
│          │  │                                     │     │
│          │  └─────────────────────────────────────┘     │
│          │                                              │
│          │  [Save Changes]                              │
```

**Specifications:**

**Sidebar:**
- Width: `w-64` on desktop, collapsible to Sheet on mobile (`lg:` breakpoint toggle)
- Background: `bg-zinc-900 border-r border-zinc-700/50`
- Nav items: Shadcn `Button variant="ghost"` — icon + label
- Active state: `bg-zinc-800 text-zinc-50` with left border accent `border-l-2 border-blue-500`
- Icons: `LayoutDashboard`, `Video`, `Upload`, `Settings` from Lucide
- Mobile trigger: Hamburger button in header → Shadcn `Sheet` slides from left

**Overview stats cards:**
- Shadcn `Card` — `bg-zinc-900 border-zinc-700/50 p-6`
- Label: `text-sm text-zinc-400`
- Value: `text-3xl font-bold text-zinc-50`
- Grid: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4`

**Videos table:**
- Shadcn `Table` component
- Columns: Thumbnail (48x27 image), Title, Status (StatusBadge), Views (formatted), Date (relative), Actions (DropdownMenu)
- Row hover: `hover:bg-zinc-800/50`
- Actions dropdown: Edit, Publish/Unpublish, Delete (danger)

**Upload page:**
- Drop zone: `border-2 border-dashed border-zinc-700 rounded-lg p-12 text-center hover:border-zinc-500 transition-colors`
- Drop zone icon: `Upload` from Lucide, `h-8 w-8 text-zinc-500`
- Active drop: `border-blue-500 bg-blue-500/5`
- Form: Shadcn `Input`, `Select`, `Textarea` with `Label`
- Slug auto-generation: From title, editable
- Tags: Chip-style input — type + Enter to add, X to remove
- Buttons: "Save as Draft" (`variant="outline"`), "Upload & Publish" (`bg-blue-500`)

**Settings:**
- Avatar upload: Click to change, shows current avatar in `h-20 w-20 rounded-full`
- Form: Same input styling as upload page
- Save button: `Button` with `bg-blue-500`

### 3h. Admin Panel — `(admin)/` routes

**Routes:** `/admin`, `/admin/videos`, `/admin/users`, `/admin/categories`
**Layout:** `(admin)/layout.tsx` — Sidebar + Content (same structure as dashboard)

```
┌──────────┬──────────────────────────────────────────────┐
│ SIDEBAR  │  CONTENT AREA                               │
│          │                                              │
│ Dashboard│  ── Admin Dashboard (/admin) ──              │
│ Videos   │                                              │
│ Users    │  ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│ Categories│ │ Total    │ │ Pending  │ │ Total    │    │
│          │  │ Videos   │ │ Review   │ │ Users    │    │
│          │  │   142    │ │    5     │ │   89     │    │
│          │  └──────────┘ └──────────┘ └──────────┘    │
│          │                                              │
├──────────┴──────────────────────────────────────────────┤

── Videos Moderation (/admin/videos) ──

│ SIDEBAR  │  Video Moderation                            │
│          │                                              │
│          │  ┌─ Filter: [All ▼] [Status ▼] ──────────┐  │
│          │  │                                        │  │
│          │  │ Thumb│ Title    │Creator│Status│Actions │  │
│          │  │ ░░░░ │ Video 1  │ user1 │ PUB  │[···]  │  │
│          │  │ ░░░░ │ Video 2  │ user2 │ DRAFT│[···]  │  │
│          │  │ ░░░░ │ Flagged  │ user3 │ PUB  │[···]  │  │
│          │  │                                        │  │
│          │  └────────────────────────────────────────┘  │
│          │                                              │
│          │  Actions: Approve ✓, Reject ✗, Delete 🗑    │

── Users Management (/admin/users) ──

│ SIDEBAR  │  Users                          [Search___]  │
│          │                                              │
│          │  │ Avatar│ Name  │ Email     │Role  │Actions│ │
│          │  │  ○    │ John  │ j@ex.com  │VIEWER│ [···]│ │
│          │  │  ○    │ Jane  │ ja@ex.com │CREATOR│[···]│ │
│          │  │  ○    │ Admin │ a@ex.com  │ADMIN │ [···]│ │
│          │                                              │
│          │  Actions: Change Role, Suspend, Delete       │

── Categories Management (/admin/categories) ──

│ SIDEBAR  │  Categories                    [+ Add New]   │
│          │                                              │
│          │  ┌─────────────────────────────────────┐     │
│          │  │ ≡ Film          12 videos   [Edit]  │     │
│          │  │ ≡ Music          8 videos   [Edit]  │     │
│          │  │ ≡ Comedy         5 videos   [Edit]  │     │
│          │  │ ≡ Documentary    3 videos   [Edit]  │     │
│          │  │ ≡ Education     15 videos   [Edit]  │     │
│          │  │ ...                                  │     │
│          │  └─────────────────────────────────────┘     │
│          │                                              │
│          │  Drag handle (≡) to reorder                  │
│          │  Edit opens Dialog with name + description   │
```

**Specifications:**

**Sidebar:**
- Same structure as dashboard sidebar but with admin-specific nav items
- Icons: `LayoutDashboard`, `Video`, `Users`, `FolderOpen` from Lucide
- Red accent for destructive actions: role badge for admin items

**Videos moderation table:**
- Same `Table` pattern as dashboard, with added "Creator" column
- Filter row: Status filter (`Select`), search input
- Actions: Approve (sets `PUBLISHED`), Reject (sets `REJECTED` + optional reason via Dialog), Delete (confirmation Dialog)
- Pending review items highlighted with `bg-amber-500/5 border-l-2 border-amber-500`

**Users table:**
- Columns: Avatar (small), Name, Email, Role (StatusBadge-style), Joined date, Actions
- Role badges: VIEWER → `zinc`, CREATOR → `blue`, STUDIO → `purple`, ADMIN → `red`
- Actions dropdown: Change Role (sub-menu with role options), Suspend, Delete

**Categories management:**
- List view (not table) — each row shows: drag handle, name, video count, edit button
- Drag-to-reorder updates `sortOrder` (nice-to-have for MVP, manual sort order input is acceptable)
- "Add New" button opens Shadcn `Dialog` with name + description fields
- Edit opens same Dialog pre-filled

---

## 4. Reusable Component Specs

### 4.1 VideoCard

**File:** `src/components/video/VideoCard.tsx`
**Type:** Server Component (no interactivity needed)

```typescript
interface VideoCardProps {
  video: {
    id: string;
    title: string;
    slug: string;
    thumbnailUrl: string | null;
    duration: number | null;
    viewCount: number;
    createdAt: Date;
    creator: {
      name: string | null;
      username: string;
      avatarUrl: string | null;
    };
  };
  hideCreator?: boolean; // true on channel page
  className?: string;
}
```

**Visual structure:**

```
┌─────────────────────────────┐
│                             │
│      Thumbnail              │  aspect-video, rounded-lg
│      (16:9)                 │  bg-zinc-800 (placeholder)
│                             │
│                    ┌──────┐ │
│                    │12:34 │ │  bottom-right badge
│                    └──────┘ │  bg-black/80 text-xs px-1.5 py-0.5 rounded
└─────────────────────────────┘
 ┌──┐ Video Title Here Can    │  flex gap-3, mt-3
 │AV│ Be Two Lines Long...    │  title: text-sm font-medium line-clamp-2
 │  │ Creator Name            │  creator: text-xs text-zinc-400
 └──┘ 12K views · 3 days ago  │  meta: text-xs text-zinc-500
```

**Behavior:**
- Entire card is a `Link` wrapping to `/watch/[slug]`
- Thumbnail hover: `group-hover:scale-[1.02] transition-transform duration-200`
- Title hover: `group-hover:text-zinc-50` (if starting from `text-zinc-200`)
- No thumbnail fallback: Show `bg-zinc-800` with centered `Play` icon
- Duration badge: Hidden if `duration` is null (still processing)
- Avatar: `h-8 w-8 rounded-full` — Shadcn `Avatar` with fallback initials
- Creator name: Linked to `/channel/[username]`, `hover:text-blue-400`
- View count: Formatted with `formatViewCount()` — "1.2K", "3.4M"
- Date: Relative via `date-fns` `formatDistanceToNow` — "3 days ago"

### 4.2 VideoGrid

**File:** `src/components/video/VideoGrid.tsx`
**Type:** Server Component

```typescript
interface VideoGridProps {
  videos: VideoCardProps["video"][];
  columns?: 3 | 4;          // default 4
  hideCreator?: boolean;     // passed to each VideoCard
  className?: string;
}
```

**Implementation:**
```
grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4
```

When `columns === 3`:
```
grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4
```

Renders array of `VideoCard` components. Shows empty state if `videos.length === 0`.

### 4.3 SearchBar

**File:** `src/components/layout/SearchBar.tsx`
**Type:** Client Component (`"use client"` — needs form submission + keyboard shortcut)

```typescript
interface SearchBarProps {
  defaultValue?: string;
  className?: string;
}
```

**Visual structure:**

```
┌───────────────────────────────────────┐
│ 🔍 Search videos...          ⌘K      │
└───────────────────────────────────────┘
```

**Specifications:**
- Shadcn `Input` with `Search` icon (Lucide) as left adornment
- Placeholder: "Search videos..."
- Right side: Keyboard shortcut hint `⌘K` / `Ctrl+K` — `text-xs text-zinc-500 border border-zinc-700 rounded px-1.5 py-0.5`
- On submit: Navigate to `/search?q={value}` via `router.push`
- Global keyboard shortcut: `Cmd+K` / `Ctrl+K` focuses the search input
- Styling: `bg-zinc-900 border-zinc-700 text-zinc-50 placeholder:text-zinc-500 rounded-md`
- Width: `w-full max-w-md` on desktop, icon-only trigger on mobile

### 4.4 Header

**File:** `src/components/layout/Header.tsx`
**Type:** Mixed — Server Component wrapper with Client island for search/dropdown

```
┌─────────────────────────────────────────────────────────┐
│ ┌──────┐  ┌──────────────────────┐  Categories ▼       │
│ │ LOGO │  │ 🔍 Search videos...  │  ┌──────┐ ┌───────┐│
│ └──────┘  └──────────────────────┘  │Login │ │Sign Up││
│                                     └──────┘ └───────┘│
└─────────────────────────────────────────────────────────┘

── Authenticated state ──

│ ┌──────┐  ┌──────────────────────┐  Categories ▼  ┌──┐│
│ │ LOGO │  │ 🔍 Search videos...  │               │AV ││
│ └──────┘  └──────────────────────┘               └──┘│
│                                                       │
│                        Avatar dropdown menu:          │
│                        ┌────────────────┐             │
│                        │ Dashboard      │             │
│                        │ My Videos      │             │
│                        │ Settings       │             │
│                        │ ────────────── │             │
│                        │ Sign Out       │             │
│                        └────────────────┘             │
```

**Specifications:**
- Container: `sticky top-0 z-50 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-700/50`
- Inner: `max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center`
- Logo: App name as `text-xl font-bold text-zinc-50` — links to `/`
- SearchBar: Centered, `hidden sm:block` — on mobile, show `Search` icon button that expands
- Categories: Shadcn `DropdownMenu` triggered by "Categories" button — lists all categories as links
- Auth buttons (unauthenticated): `Button variant="ghost"` for Login, `Button` with `bg-blue-500` for Sign Up
- Avatar dropdown (authenticated): Shadcn `DropdownMenu` with `Avatar` trigger — shows Dashboard, My Videos, Settings, divider, Sign Out
- Admin users see additional "Admin Panel" item in dropdown

### 4.5 Footer

**File:** `src/components/layout/Footer.tsx`
**Type:** Server Component

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  ┌──────┐                                               │
│  │ LOGO │   About · Terms · Privacy · Contact           │
│  └──────┘                                               │
│                                                         │
│  © 2025 Video Platform. All rights reserved.            │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Specifications:**
- Container: `bg-zinc-900 border-t border-zinc-700/50 mt-16`
- Inner: `max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8`
- Logo: Same as header — `text-lg font-bold text-zinc-50`
- Links: `text-sm text-zinc-400 hover:text-zinc-50 transition-colors`
- Copyright: `text-xs text-zinc-500`
- Layout: Flex row on desktop (logo left, links center, copyright right), stack on mobile

### 4.6 Sidebar

**File:** `src/components/layout/Sidebar.tsx`
**Type:** Client Component (`"use client"` — needs active state detection + mobile sheet)

**Specifications:**
- Width: `w-64 shrink-0` on desktop (`lg:` and up)
- Mobile: Hidden by default, triggered via hamburger in header → Shadcn `Sheet` (slides from left)
- Background: `bg-zinc-900 border-r border-zinc-700/50 h-full`
- Nav items: Vertical stack with `py-2 px-3 rounded-md text-sm font-medium`
- Default state: `text-zinc-400 hover:text-zinc-50 hover:bg-zinc-800`
- Active state: `text-zinc-50 bg-zinc-800 border-l-2 border-blue-500` (or use Shadcn Button `variant="ghost"` with active class)
- Section dividers: `Separator` component between nav groups
- Each item: Icon (`h-5 w-5`) + Label with `gap-3`

**Dashboard nav items:**

| Icon | Label | Route |
|------|-------|-------|
| `LayoutDashboard` | Overview | `/dashboard` |
| `Video` | My Videos | `/dashboard/videos` |
| `Upload` | Upload | `/dashboard/upload` |
| `Settings` | Settings | `/dashboard/settings` |

**Admin nav items:**

| Icon | Label | Route |
|------|-------|-------|
| `LayoutDashboard` | Dashboard | `/admin` |
| `Video` | Videos | `/admin/videos` |
| `Users` | Users | `/admin/users` |
| `FolderOpen` | Categories | `/admin/categories` |

### 4.7 StatusBadge

**File:** `src/components/video/StatusBadge.tsx`
**Type:** Server Component

```typescript
interface StatusBadgeProps {
  status: "DRAFT" | "PROCESSING" | "PUBLISHED" | "UNLISTED" | "REJECTED";
}
```

**Color mapping using Shadcn `Badge`:**

| Status | Badge Classes | Dot Color |
|--------|--------------|-----------|
| `DRAFT` | `bg-zinc-800 text-zinc-300 border-zinc-700` | `bg-zinc-400` |
| `PROCESSING` | `bg-amber-500/10 text-amber-500 border-amber-500/20` | `bg-amber-500` |
| `PUBLISHED` | `bg-green-500/10 text-green-500 border-green-500/20` | `bg-green-500` |
| `UNLISTED` | `bg-blue-500/10 text-blue-500 border-blue-500/20` | `bg-blue-500` |
| `REJECTED` | `bg-red-500/10 text-red-500 border-red-500/20` | `bg-red-500` |

**Visual:** Small colored dot + status text:

```
● PUBLISHED       ● DRAFT       ● PROCESSING
```

Each badge uses `text-xs font-medium` with a `h-1.5 w-1.5 rounded-full` colored dot before the label.

### 4.8 RelatedVideoCard (compact variant)

**File:** `src/components/video/RelatedVideoCard.tsx`
**Type:** Server Component

Used in the Watch page sidebar. Horizontal layout:

```
┌──────────┬───────────────────────┐
│          │ Video Title Here      │  text-sm font-medium line-clamp-2
│  thumb   │ Creator Name          │  text-xs text-zinc-400
│  (w-40)  │ 12K views · 3d ago   │  text-xs text-zinc-500
│          │                       │
└──────────┴───────────────────────┘
```

**Specifications:**
- Container: `flex gap-3 group cursor-pointer`
- Thumbnail: `w-40 aspect-video rounded-md overflow-hidden relative shrink-0`
- Duration badge: Same as VideoCard, bottom-right
- Info: `flex-1 min-w-0` (min-w-0 for proper truncation)
- Title: `text-sm font-medium text-zinc-200 line-clamp-2 group-hover:text-zinc-50`

### 4.9 Pagination

**File:** `src/components/ui/Pagination.tsx` (or compose from Shadcn Button)
**Type:** Client Component

```
┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐
│ < │ │ 1 │ │ 2 │ │ 3 │ │...│ │10 │ │ > │
└───┘ └───┘ └───┘ └───┘ └───┘ └───┘ └───┘
              ↑ active: bg-blue-500 text-white
```

**Specifications:**
- Uses Shadcn `Button variant="outline"` for each page, `size="sm"`
- Active page: `bg-blue-500 text-white border-blue-500`
- Disabled prev/next: `disabled:opacity-50`
- Truncation: Show first, last, and 2 pages around current with `...` ellipsis
- Updates URL search params: `/category/film?page=2`

---

## 5. Utility Formats

### 5.1 View Count Formatting

```typescript
function formatViewCount(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return count.toString();
}

// Examples: 0 → "0", 999 → "999", 1000 → "1.0K", 1500 → "1.5K", 1200000 → "1.2M"
```

### 5.2 Duration Formatting

```typescript
function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// Examples: 65 → "1:05", 3661 → "1:01:01", 30 → "0:30"
```

### 5.3 Relative Date Formatting

Use `date-fns` `formatDistanceToNowStrict`:

```typescript
import { formatDistanceToNowStrict } from "date-fns";

function formatRelativeDate(date: Date): string {
  return formatDistanceToNowStrict(date, { addSuffix: true });
}

// Examples: "3 days ago", "2 hours ago", "1 month ago"
```

### 5.4 Metadata Line Format

Standard format for video metadata:

```
{viewCount} views · {relativeDate}
```

Example: `12K views · 3 days ago`

Separator: ` · ` (space, middle dot `·` U+00B7, space) — styled with `text-zinc-500`

---

## Appendix: File → Component Mapping

| File Path | Component | Type |
|-----------|-----------|------|
| `src/components/video/VideoCard.tsx` | VideoCard | Server |
| `src/components/video/VideoGrid.tsx` | VideoGrid | Server |
| `src/components/video/RelatedVideoCard.tsx` | RelatedVideoCard | Server |
| `src/components/video/VideoPlayer.tsx` | VideoPlayer | Client |
| `src/components/video/StatusBadge.tsx` | StatusBadge | Server |
| `src/components/layout/Header.tsx` | Header | Mixed |
| `src/components/layout/Footer.tsx` | Footer | Server |
| `src/components/layout/Sidebar.tsx` | Sidebar | Client |
| `src/components/layout/SearchBar.tsx` | SearchBar | Client |
| `src/components/forms/LoginForm.tsx` | LoginForm | Client |
| `src/components/forms/RegisterForm.tsx` | RegisterForm | Client |
| `src/components/forms/VideoMetadataForm.tsx` | VideoMetadataForm | Client |
| `src/components/forms/ProfileForm.tsx` | ProfileForm | Client |
| `src/components/forms/CategoryForm.tsx` | CategoryForm | Client |
| `src/lib/formatters.ts` | Utility functions | — |
