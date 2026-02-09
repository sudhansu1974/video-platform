# Video Platform — Claude Code Slash Commands Setup
# Run this script from your project root (video-platform/)
# PowerShell: .\setup-claude-commands.ps1

# Create the commands directory
New-Item -Path ".claude\commands" -ItemType Directory -Force

Write-Host "Creating Claude Code slash commands..." -ForegroundColor Cyan

# ============================================================
# 1. /git-finish-and-start — Commit, merge, new branch
# ============================================================
@'
# Finish Current Feature & Start New Branch

Commit any staged and unstaged changes in the current branch with a suitable commit message based on the code changes. Use conventional commit format: type(scope): description.

Then merge the current branch into the `$1` branch and resolve any merge conflicts.

Then create and checkout a new branch called `$2`.

Steps:
1. Run `git status` to see what changed
2. Run `git diff` and `git diff --staged` to understand the changes
3. Stage all changes with `git add .`
4. Commit with an appropriate conventional commit message
5. Switch to `$1` branch: `git checkout $1`
6. Merge the previous branch: `git merge <previous-branch>`
7. If there are conflicts, resolve them intelligently based on the code context
8. Create and switch to the new branch: `git checkout -b $2`
9. Confirm the new branch is active with `git branch --show-current`
'@ | Out-File -FilePath ".claude\commands\git-finish-and-start.md" -Encoding utf8

# ============================================================
# 2. /git-commit — Auto-commit with smart message
# ============================================================
@'
# Quick Commit

Look at all staged and unstaged changes using `git diff` and `git diff --staged` and `git status`.

Analyze the code changes and generate a suitable conventional commit message in this format:
```
type(scope): short description
```

Types: feat, fix, refactor, chore, docs, style, test
Scope: the main area changed (auth, video, player, dashboard, admin, db, ui, etc.)

Stage all changes and commit with the generated message.

If there are multiple unrelated changes, make separate commits grouping related files together.

Show the final git log entry after committing.
'@ | Out-File -FilePath ".claude\commands\git-commit.md" -Encoding utf8

# ============================================================
# 3. /prisma-update — Schema changes workflow
# ============================================================
@'
# Prisma Schema Update

I've described a database change: $ARGUMENTS

Implement this change following the project's Prisma 7 conventions:

1. Read `CLAUDE.md` and `docs/DATABASE_SCHEMA.md` for schema conventions
2. Open `prisma/schema.prisma` and make the required changes
3. Ensure all models follow conventions: cuid() IDs, camelCase fields, proper relations, appropriate indexes
4. Run `npx prisma generate` to regenerate the client
5. Run `npx prisma db push` to sync with the database (development)
6. If the change is significant enough for a migration, run `npx prisma migrate dev --name <descriptive-name>` instead of db push
7. Open any TypeScript files that import from Prisma and verify they still compile: `npx tsc --noEmit`
8. If the schema change affects any existing Server Actions or API routes, update them to match
9. Update `docs/DATABASE_SCHEMA.md` to reflect the change
10. Show me the final state of the changed models in schema.prisma
'@ | Out-File -FilePath ".claude\commands\prisma-update.md" -Encoding utf8

# ============================================================
# 4. /new-page — Scaffold a new page
# ============================================================
@'
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
'@ | Out-File -FilePath ".claude\commands\new-page.md" -Encoding utf8

# ============================================================
# 5. /new-component — Scaffold a new component
# ============================================================
@'
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
'@ | Out-File -FilePath ".claude\commands\new-component.md" -Encoding utf8

# ============================================================
# 6. /new-action — Create a Server Action
# ============================================================
@'
# Create Server Action

Create a new Server Action: $ARGUMENTS

Follow these steps:

1. Read `CLAUDE.md` and `docs/SERVER_INTERACTIONS.md` for conventions
2. Determine the domain and create/update the correct file in `src/app/actions/`:
   - auth.ts — registration, login, password reset
   - video.ts — CRUD, publish, delete videos
   - admin.ts — moderation, user management, categories
   - profile.ts — profile updates, avatar
3. Add "use server" at the top of the file (if new file)
4. Create a Zod 4 validation schema for the input:
   - Use Zod 4 syntax: z.email(), z.url(), { error: "message" }
   - Define the schema above the action function
5. Implement the action with this exact pattern:
   a. Check auth session: `const session = await auth()`
   b. Validate input with the Zod schema using `.safeParse()`
   c. Check role permissions (refer to AUTH.md permission matrix)
   d. Check ownership if applicable (user can only edit own resources, unless admin)
   e. Perform the Prisma mutation inside try/catch
   f. Call `revalidatePath()` for all affected routes
   g. Return typed result: `{ success: true, data }` or `{ success: false, error }`
6. NEVER expose passwordHash or other sensitive fields in the return data
7. Use `select` in Prisma queries to return only needed fields
8. Verify compilation: `npx tsc --noEmit`
'@ | Out-File -FilePath ".claude\commands\new-action.md" -Encoding utf8

# ============================================================
# 7. /new-api-route — Create an API Route Handler
# ============================================================
@'
# Create API Route

Create a new API Route Handler: $ARGUMENTS

Follow these steps:

1. Read `CLAUDE.md` and `docs/SERVER_INTERACTIONS.md` for conventions
2. API Routes should ONLY be used for: webhooks, file uploads, external API endpoints, fire-and-forget operations (like view counting), or Auth.js catch-all. For form mutations, use Server Actions instead.
3. Create the route file at the correct path under `src/app/api/`:
   - Follow Next.js App Router convention: `route.ts` inside the directory
   - Use dynamic segments where needed: `[id]/route.ts`
4. Export the appropriate HTTP method handlers: GET, POST, PUT, PATCH, DELETE
5. Use NextRequest and NextResponse types from "next/server"
6. Validate request body with Zod 4 for POST/PUT/PATCH endpoints
7. Check auth session where required: `const session = await auth()`
8. Wrap everything in try/catch, return proper HTTP status codes:
   - 200: success, 201: created, 400: validation error
   - 401: unauthorized, 403: forbidden, 404: not found, 500: server error
9. Never expose internal error details in responses
10. Verify compilation: `npx tsc --noEmit`
'@ | Out-File -FilePath ".claude\commands\new-api-route.md" -Encoding utf8

# ============================================================
# 8. /new-schema — Create Zod validation schema
# ============================================================
@'
# Create Zod Validation Schema

Create a Zod 4 validation schema for: $ARGUMENTS

Steps:

1. Read `CLAUDE.md` for Zod 4 syntax rules
2. Create/update the schema file in `src/lib/validations/`:
   - auth.ts — login, register, password reset schemas
   - video.ts — video create, update, search filter schemas
   - profile.ts — profile update, avatar schemas
   - admin.ts — category, user management schemas
3. Use ONLY Zod 4 syntax:
   - z.email() NOT z.string().email()
   - z.url() NOT z.string().url()
   - { error: "message" } NOT { message: "message" }
   - z.strictObject() for strict validation
4. Export the schema AND the inferred TypeScript type:
   ```typescript
   export const videoCreateSchema = z.object({ ... });
   export type VideoCreateInput = z.infer<typeof videoCreateSchema>;
   ```
5. Include sensible constraints: min/max lengths, enums for status/role fields, proper error messages
6. If the schema is for a form, make sure it matches the form fields exactly
7. Verify compilation: `npx tsc --noEmit`
'@ | Out-File -FilePath ".claude\commands\new-schema.md" -Encoding utf8

# ============================================================
# 9. /new-hook — Create custom React hook
# ============================================================
@'
# Create Custom Hook

Create a custom React hook: $ARGUMENTS

Steps:

1. Read `CLAUDE.md` for conventions
2. Create the hook file in `src/hooks/` with camelCase naming: `useHookName.ts`
3. Follow these rules:
   - Prefix with `use` (React convention)
   - Add "use client" comment since hooks only work in Client Components
   - Define proper TypeScript types for parameters and return values
   - Handle loading, error, and success states where applicable
   - Clean up side effects in useEffect return functions
   - Use useCallback for stable function references passed to children
   - Memoize expensive computations with useMemo
4. Export as named export: `export function useHookName()`
5. Document the hook's purpose with a brief JSDoc comment
6. Verify compilation: `npx tsc --noEmit`

Common hooks for this project:
- useDebounce — for search input debouncing
- useInfiniteScroll — for paginated video grids
- useVideoPlayer — for HLS.js player control
- useMediaQuery — for responsive behavior
'@ | Out-File -FilePath ".claude\commands\new-hook.md" -Encoding utf8

# ============================================================
# 10. /add-shadcn — Install Shadcn component
# ============================================================
@'
# Add Shadcn Component

Install and configure Shadcn/ui component(s): $ARGUMENTS

Steps:

1. Install the component(s) using the Shadcn CLI:
   ```
   npx shadcn@latest add <component-name>
   ```
2. If multiple components are requested, install them all in one command
3. Verify the component files were created in `src/components/ui/`
4. Show a quick usage example following the project conventions (dark theme, cn() helper)
5. DO NOT modify any files in `src/components/ui/` — these are Shadcn-managed

Available: button, card, input, label, dialog, dropdown-menu, avatar, badge, skeleton, tabs, select, textarea, separator, sheet, toast, table, pagination, scroll-area, tooltip, sonner, alert, alert-dialog, aspect-ratio, breadcrumb, calendar, checkbox, collapsible, command, context-menu, drawer, form, hover-card, menubar, navigation-menu, popover, progress, radio-group, resizable, slider, switch, toggle, toggle-group.
'@ | Out-File -FilePath ".claude\commands\add-shadcn.md" -Encoding utf8

# ============================================================
# 11. /fix-types — Fix TypeScript errors
# ============================================================
@'
# Fix TypeScript Errors

Run the TypeScript compiler and fix all errors.

Steps:

1. Run `npx tsc --noEmit` to get all TypeScript errors
2. Read through each error carefully
3. Fix errors in order, starting with type definition files (types/) then implementation files
4. Common fixes:
   - Missing types: define proper interfaces, never use `any`
   - Import errors: check path aliases (@/) and file existence
   - Prisma type mismatches: run `npx prisma generate` first
   - Null/undefined: use proper null checks or optional chaining
5. After fixing, run `npx tsc --noEmit` again to verify zero errors
6. If there are ESLint errors too, run `npm run lint` and fix those
7. Report what was fixed and how many errors were resolved
'@ | Out-File -FilePath ".claude\commands\fix-types.md" -Encoding utf8

# ============================================================
# 12. /review — Code review current branch
# ============================================================
@'
# Code Review

Review the code changes in the current branch for quality and conventions compliance.

Steps:

1. Read `CLAUDE.md` for project conventions
2. Run `git diff main` to see all changes vs main branch
3. Review every changed file for:

   **Architecture:**
   - Server Components used by default, "use client" only when necessary
   - Data fetching in Server Components, not Client Components
   - Mutations use Server Actions, not client-side API calls

   **Security:**
   - All Server Actions check auth session AND role permissions
   - All inputs validated with Zod 4
   - No sensitive data exposed (passwordHash, etc.)

   **TypeScript:**
   - No `any` types anywhere
   - Proper interfaces for all props

   **Conventions:**
   - Lucide React icons (not Font Awesome)
   - cn() for conditional classes
   - Shadcn components only (no custom low-level UI)
   - Prisma 7 patterns (adapter, no url in schema)
   - Zod 4 syntax (z.email(), { error: })

   **Performance:**
   - Prisma queries use select for list views
   - Images use next/image
   - No unnecessary "use client" directives

   **Missing:**
   - loading.tsx for new pages?
   - error.tsx for new pages?
   - revalidatePath() after mutations?

4. Run `npx tsc --noEmit` and `npm run lint`
5. Report: CRITICAL (must fix), WARNING (should fix), SUGGESTION (nice to have)
'@ | Out-File -FilePath ".claude\commands\review.md" -Encoding utf8

# ============================================================
# 13. /seed-db — Seed database
# ============================================================
@'
# Seed Database

Update and run the database seed script.

If a specific seed requirement is given: $ARGUMENTS

Steps:

1. Open or create `prisma/seed.ts`
2. The seed script must:
   - Import PrismaClient with the Prisma 7 adapter pattern
   - Clear existing data in the correct order (respect foreign keys)
   - Create default categories: Film, Music, Comedy, Documentary, Education, Sports, Gaming, News, Technology, Entertainment, How-To, Travel
   - Create a test admin user (email: admin@videoplatform.dev, role: ADMIN)
   - Create 2-3 test creator users with sample videos (if schema supports it)
   - Use upsert where possible to make the script idempotent
3. Make sure `package.json` has: `"prisma": { "seed": "npx tsx prisma/seed.ts" }`
4. Install tsx if not present: `npm install -D tsx`
5. Run the seed: `npx prisma db seed`
6. Verify by opening Prisma Studio: `npx prisma studio`
7. Report what was seeded
'@ | Out-File -FilePath ".claude\commands\seed-db.md" -Encoding utf8

# ============================================================
# 14. /status — Project health check
# ============================================================
@'
# Project Status Check

Run a full health check on the project and report status.

Steps:

1. **Git:** current branch, uncommitted changes, branch list
2. **Dependencies:** `npm outdated`, check for missing packages
3. **TypeScript:** `npx tsc --noEmit` — count errors
4. **ESLint:** `npm run lint` — count warnings/errors
5. **Prisma:** check if schema is in sync, client is generated
6. **Build:** `npm run build` — check for build errors
7. **Structure:**
   - Count pages (page.tsx files)
   - Count components (.tsx in components/)
   - Count Server Actions (files in actions/)
   - List pages missing loading.tsx or error.tsx

8. **Summary:**
   ```
   Branch: feat/auth
   Git: 3 uncommitted files
   TypeScript: 0 errors
   ESLint: 2 warnings
   Build: Passes
   Prisma: In sync
   Pages: 8 created, 2 missing loading.tsx
   Components: 12 created
   Actions: 5 created
   ```
'@ | Out-File -FilePath ".claude\commands\status.md" -Encoding utf8

# ============================================================
# 15. /add-loading-error — Add loading/error states
# ============================================================
@'
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
'@ | Out-File -FilePath ".claude\commands\add-loading-error.md" -Encoding utf8

# ============================================================
# 16. /refactor — Refactor code
# ============================================================
@'
# Refactor

Refactor the specified code: $ARGUMENTS

Steps:

1. Read `CLAUDE.md` for project conventions
2. Identify the file(s) to refactor
3. Check for:
   - Convention violations (naming, structure, imports)
   - Unnecessary "use client" directives
   - Duplicated logic to extract into utilities/hooks
   - Missing TypeScript types (any, implicit any)
   - Zod 3 syntax that should be Zod 4
   - Prisma queries missing select
   - Large components that should be split
   - Missing error handling
4. Apply refactoring while maintaining same functionality
5. Verify: `npx tsc --noEmit` and `npm run build`
6. Report what changed and why
'@ | Out-File -FilePath ".claude\commands\refactor.md" -Encoding utf8

# ============================================================
# 17. /install-package — Install & configure npm package
# ============================================================
@'
# Install Package

Install and configure the npm package: $ARGUMENTS

Steps:

1. Determine if production or dev dependency
2. Install: `npm install <package>` or `npm install -D <package>`
3. Install TypeScript types if needed: `npm install -D @types/<package>`
4. Create config files if needed
5. Add environment variables to `.env` if required
6. Create wrapper/utility in `src/lib/` if initialization needed
7. Show usage example following project conventions
8. Verify: `npx tsc --noEmit`
'@ | Out-File -FilePath ".claude\commands\install-package.md" -Encoding utf8

# ============================================================
# 18. /debug — Debug and fix errors
# ============================================================
@'
# Debug Error

Debug and fix this error: $ARGUMENTS

Steps:

1. Read the error message — identify type, file, line, stack trace
2. For TypeScript errors: `npx tsc --noEmit` for full context
3. For Prisma errors: `npx prisma generate` then `npx prisma db push`, check DATABASE_URL
4. For build errors: `npm run build`, check "use client"/"use server" directives
5. For runtime errors: check browser console and terminal output
6. Fix the root cause, not symptoms
7. Verify: `npx tsc --noEmit` and `npm run build`
8. Explain cause and fix
'@ | Out-File -FilePath ".claude\commands\debug.md" -Encoding utf8

# ============================================================
# 19. /gen-docs — Generate/update documentation
# ============================================================
@'
# Generate Project Documentation

Create or update project documentation: $ARGUMENTS

Steps:

1. Read `CLAUDE.md` for project conventions
2. Scan codebase: schema.prisma, pages, components, actions, API routes
3. Create/update the doc in `docs/` directory
4. Reflect ACTUAL current state, not just plans
5. Include code examples from the project
6. Note gaps and TODOs
'@ | Out-File -FilePath ".claude\commands\gen-docs.md" -Encoding utf8

Write-Host ""
Write-Host "✅ Created 19 slash commands in .claude/commands/" -ForegroundColor Green
Write-Host ""
Write-Host "Available commands:" -ForegroundColor Yellow
Write-Host "  /git-finish-and-start main feat/new-branch  — Commit, merge, new branch"
Write-Host "  /git-commit                                  — Auto-commit with smart message"
Write-Host "  /prisma-update add email verification fields — Schema changes workflow"
Write-Host "  /new-page search results page                — Scaffold new page"
Write-Host "  /new-component VideoCard                     — Scaffold new component"
Write-Host "  /new-action publishVideo                     — Create Server Action"
Write-Host "  /new-api-route video view counter            — Create API route"
Write-Host "  /new-schema video upload form                — Create Zod 4 schema"
Write-Host "  /new-hook useDebounce                        — Create custom hook"
Write-Host "  /add-shadcn progress checkbox switch         — Install Shadcn components"
Write-Host "  /fix-types                                   — Fix all TypeScript errors"
Write-Host "  /review                                      — Code review current branch"
Write-Host "  /seed-db                                     — Seed database"
Write-Host "  /status                                      — Full project health check"
Write-Host "  /add-loading-error /dashboard/videos         — Add loading/error to page"
Write-Host "  /refactor src/components/video/VideoCard.tsx  — Refactor code"
Write-Host "  /install-package bcryptjs                    — Install & configure package"
Write-Host "  /debug Cannot find module error              — Debug & fix errors"
Write-Host "  /gen-docs API documentation                  — Generate/update docs"
Write-Host ""
Write-Host "Usage in Claude Code: type / then the command name" -ForegroundColor Cyan
