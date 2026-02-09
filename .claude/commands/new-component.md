# Create New Component

Create a new component: $ARGUMENTS

Follow these steps:

1. Read `CLAUDE.md` for coding conventions and `docs/UI_DESIGN.md` for design specs
2. Determine the component category and create in the correct directory:
   - `src/components/layout/` — Header, Footer, Sidebar, Navigation
   - `src/components/video/` — VideoCard, VideoGrid, VideoPlayer
   - `src/components/forms/` — LoginForm, UploadForm, SearchBar
   - `src/components/ui/` — NEVER create here, this is Shadcn-only
3. Use PascalCase filename matching the component name
4. Default to Server Component. Only add "use client" if the component needs hooks, event handlers, or browser APIs
5. Define a TypeScript interface for props with descriptive names (e.g., VideoCardProps)
6. Compose ONLY from Shadcn/ui primitives (Button, Card, Input, etc.) and Lucide React icons
7. Use the cn() helper for all conditional class merging
8. Include all states: default, hover, focus, disabled, loading (where applicable)
9. Follow the dark theme tokens from the design system
10. Add an optional `className` prop for external customization
11. Export as a named export (not default): `export function ComponentName()`
12. Verify it compiles: `npx tsc --noEmit`
