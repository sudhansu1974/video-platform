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
