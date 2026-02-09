# Create New Page

Create a new page: $ARGUMENTS

Follow these steps:

1. Read `CLAUDE.md` for project conventions and `docs/UI_DESIGN.md` for design specs
2. Determine the correct route group: (auth), (main), (dashboard), or (admin)
3. Create the page directory and these files:
   - `page.tsx` — Server Component that fetches data and renders the page
   - `loading.tsx` — Skeleton loading state matching the page layout using Shadcn Skeleton
   - `error.tsx` — Error boundary with "use client" directive, error message display, and retry button
4. If the page needs client interactivity, create separate Client Components in `src/components/` and import them into the Server Component page
5. Follow the dark theme design system: zinc-950 background, zinc-900 cards, zinc-50 text
6. Use ONLY Shadcn/ui components and Lucide React icons
7. Make it responsive: mobile-first with sm/md/lg/xl breakpoints
8. Use proper TypeScript types for all props and data
9. Add the page to any relevant navigation components (header, sidebar, etc.)
10. Verify the page compiles: `npx tsc --noEmit`
11. Show me the route path and a summary of what was created
