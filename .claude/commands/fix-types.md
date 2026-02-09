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
