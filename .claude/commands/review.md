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
