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
