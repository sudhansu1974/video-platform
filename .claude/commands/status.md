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
