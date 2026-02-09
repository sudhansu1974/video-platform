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
