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
