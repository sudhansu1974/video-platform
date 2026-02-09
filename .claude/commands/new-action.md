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
