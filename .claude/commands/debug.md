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
