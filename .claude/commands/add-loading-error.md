# Add Loading & Error States

Add loading.tsx and error.tsx to the page/route: $ARGUMENTS

Steps:

1. Find the page directory specified
2. Read the existing `page.tsx` to understand the layout

3. Create `loading.tsx`:
   - Import Skeleton from "@/components/ui/skeleton"
   - Build a skeleton matching the page layout exactly
   - Video grid: skeleton grid with aspect-video placeholders
   - Table: skeleton rows with shimmer
   - Form: skeleton inputs and buttons
   - Match responsive breakpoints

4. Create `error.tsx`:
   - "use client" directive (required)
   - Accept { error, reset } props
   - Shadcn Card with error message and "Try again" Button
   - Dark theme styling

5. For dynamic routes, also create `not-found.tsx`

6. Verify: `npx tsc --noEmit`
