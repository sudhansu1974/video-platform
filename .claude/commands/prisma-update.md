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
