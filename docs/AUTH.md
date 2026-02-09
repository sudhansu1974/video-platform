# Authentication Specification

> Complete Auth.js v5 authentication specification for the Video Platform MVP.
> **This is the single source of truth for all authentication and authorization decisions.**
> Claude Code must reference this document when building any auth-related feature.

---

## Table of Contents

1. [Auth Provider](#1-auth-provider)
2. [Auth Flows](#2-auth-flows)
3. [Role-Based Access Control](#3-role-based-access-control)
4. [Middleware & Route Protection](#4-middleware--route-protection)
5. [Auth File Structure](#5-auth-file-structure)
6. [Zod 4 Validation Schemas](#6-zod-4-validation-schemas)
7. [Implementation Reference](#7-implementation-reference)

---

## 1. Auth Provider

### Stack

| Component | Package | Version |
|-----------|---------|---------|
| Auth framework | `next-auth` | 5.0.0-beta.30 |
| Prisma adapter | `@auth/prisma-adapter` | ^2.11.1 |
| Password hashing | `bcryptjs` | ^2.4.3 |
| Type definitions | `@types/bcryptjs` | ^2.4.6 |

### Provider: Credentials (Email + Password)

- **No OAuth providers** for MVP — email/password only
- Password hashing: `bcryptjs` with **12 salt rounds**
- Session strategy: **JWT** (not database sessions) — better for serverless/edge runtime
- The `Session` and `Account` models exist in the schema for future OAuth support but are not actively used with JWT strategy

### Session Shape

The session object available via `auth()` or `useSession()`:

```typescript
interface Session {
  user: {
    id: string;        // User.id (cuid)
    email: string;     // User.email
    name: string | null; // User.name
    role: UserRole;    // "VIEWER" | "CREATOR" | "STUDIO" | "ADMIN"
    avatarUrl: string | null; // User.avatarUrl
  };
  expires: string;     // ISO date string
}
```

### JWT Token Contents

```typescript
interface JWT {
  sub: string;         // User.id
  email: string;
  name: string | null;
  role: UserRole;
  avatarUrl: string | null;
}
```

### Auth Configuration

**File:** `src/lib/auth.ts`

```typescript
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/lib/prisma";
import { compare } from "bcryptjs";
import type { UserRole } from "@/generated/prisma/client";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.passwordHash) {
          return null;
        }

        const isPasswordValid = await compare(
          credentials.password as string,
          user.passwordHash
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          avatarUrl: user.avatarUrl,
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Initial sign-in — populate token from user
      if (user) {
        token.role = (user as { role: UserRole }).role;
        token.avatarUrl = (user as { avatarUrl: string | null }).avatarUrl;
      }

      // Session update trigger (e.g., after profile edit)
      if (trigger === "update" && session) {
        token.name = session.name;
        token.avatarUrl = session.avatarUrl;
        token.role = session.role;
      }

      return token;
    },
    async session({ session, token }) {
      session.user.id = token.sub!;
      session.user.role = token.role as UserRole;
      session.user.avatarUrl = token.avatarUrl as string | null;
      return session;
    },
  },
});
```

### Type Augmentation

**File:** `src/types/next-auth.d.ts`

Extend the default Auth.js types to include custom fields:

```typescript
import type { UserRole } from "@/generated/prisma/client";

declare module "next-auth" {
  interface User {
    role: UserRole;
    avatarUrl: string | null;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name: string | null;
      role: UserRole;
      avatarUrl: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: UserRole;
    avatarUrl: string | null;
  }
}
```

---

## 2. Auth Flows

### 2.1 Registration Flow

**Route:** `/register`
**Form fields:** name, username, email, password, confirmPassword

**Step-by-step flow:**

1. User navigates to `/register`
2. User fills out the registration form:
   - **Display Name** — required, 2-50 characters
   - **Username** — required, 3-30 characters, alphanumeric + hyphens/underscores, lowercase
   - **Email** — required, valid email format
   - **Password** — required, minimum 8 characters
   - **Confirm Password** — required, must match password
3. Client-side validation runs via Zod 4 schema + react-hook-form
4. On submit, call the `register` Server Action:
   a. Server-side Zod 4 validation (re-validate everything)
   b. Check email uniqueness — query `prisma.user.findUnique({ where: { email } })`
   c. Check username uniqueness — query `prisma.user.findUnique({ where: { username } })`
   d. Hash password with `bcryptjs` (12 rounds): `await hash(password, 12)`
   e. Create user with role `VIEWER`: `prisma.user.create({ data: { ... } })`
   f. Auto sign-in via `signIn("credentials", { email, password, redirect: false })`
5. On success: redirect to homepage (`/`)
6. On error: display error message on form

**Error states:**

| Error | Message shown |
|-------|--------------|
| Email already registered | "An account with this email already exists" |
| Username already taken | "This username is already taken" |
| Passwords don't match | "Passwords do not match" (client-side only) |
| Validation errors | Field-specific error messages from Zod |
| Server error | "Something went wrong. Please try again." |

**Server Action:** `src/app/actions/auth.ts`

```typescript
"use server";

import { hash } from "bcryptjs";
import { signIn } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { registerSchema } from "@/lib/validations/auth";

export async function register(formData: {
  name: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}) {
  // 1. Validate
  const result = registerSchema.safeParse(formData);
  if (!result.success) {
    return { success: false, errors: result.error.issues };
  }

  const { name, username, email, password } = result.data;

  // 2. Check email uniqueness
  const existingEmail = await prisma.user.findUnique({ where: { email } });
  if (existingEmail) {
    return { success: false, error: "An account with this email already exists" };
  }

  // 3. Check username uniqueness
  const existingUsername = await prisma.user.findUnique({ where: { username } });
  if (existingUsername) {
    return { success: false, error: "This username is already taken" };
  }

  // 4. Hash password
  const passwordHash = await hash(password, 12);

  // 5. Create user
  await prisma.user.create({
    data: {
      name,
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      passwordHash,
      role: "VIEWER",
    },
  });

  // 6. Auto sign-in
  await signIn("credentials", {
    email: email.toLowerCase(),
    password,
    redirect: false,
  });

  return { success: true };
}
```

### 2.2 Login Flow

**Route:** `/login`
**Form fields:** email, password

**Step-by-step flow:**

1. User navigates to `/login` (or is redirected here from a protected route with `?callbackUrl=...`)
2. User fills out the login form:
   - **Email** — required, valid email format
   - **Password** — required, minimum 1 character
3. Client-side validation runs via Zod 4 schema + react-hook-form
4. On submit, call `signIn("credentials", { ... })` from Auth.js:
   a. Auth.js invokes the `authorize` callback in the Credentials provider
   b. Find user by email: `prisma.user.findUnique({ where: { email } })`
   c. If user not found or no `passwordHash` → return `null` (auth fails)
   d. Compare password with hash: `await compare(password, user.passwordHash)`
   e. If mismatch → return `null` (auth fails)
   f. If match → return user object, JWT is created
5. On success: redirect to `callbackUrl` (from query param) or homepage (`/`)
6. On error: display generic error message

**Error states:**

| Error | Message shown |
|-------|--------------|
| Invalid credentials | "Invalid email or password" (generic — never reveal which field is wrong) |
| Server error | "Something went wrong. Please try again." |

**Security notes:**
- Never reveal whether the email exists or the password is wrong — always show "Invalid email or password"
- Rate limiting should be added in production (not MVP scope)

### 2.3 Password Reset Flow (MVP — Simplified)

**Routes:** `/forgot-password`, `/reset-password`

For MVP, the password reset flow logs the reset link to the server console instead of sending a real email. Real email sending (e.g., via Resend, SendGrid) is Phase 2.

**Forgot password flow:**

1. User navigates to `/forgot-password`
2. User enters their email address
3. On submit, call the `forgotPassword` Server Action:
   a. Look up user by email
   b. If email exists:
      - Generate a random token: `crypto.randomUUID()`
      - Hash the token for storage: `await hash(token, 12)`
      - Create `VerificationToken` with:
        - `identifier`: user's email
        - `token`: hashed token
        - `expires`: `new Date(Date.now() + 60 * 60 * 1000)` (1 hour from now)
      - Log the reset link to console: `console.log("Password reset link: /reset-password?token={rawToken}&email={email}")`
   c. If email does NOT exist: do nothing (don't reveal that the email isn't registered)
4. Always show the same success message: "If an account exists with that email, we've sent a password reset link."

**Reset password flow:**

1. User clicks the reset link: `/reset-password?token=xxx&email=user@example.com`
2. Page validates the token:
   a. Find `VerificationToken` where `identifier` matches the email
   b. Compare the URL token against the stored hash
   c. Check that `expires` is in the future
   d. If invalid or expired → show error "This reset link is invalid or has expired"
3. If valid, show the new password form:
   - **New Password** — required, minimum 8 characters
   - **Confirm New Password** — required, must match
4. On submit, call the `resetPassword` Server Action:
   a. Re-validate the token (same checks as step 2)
   b. Hash the new password: `await hash(newPassword, 12)`
   c. Update the user: `prisma.user.update({ where: { email }, data: { passwordHash } })`
   d. Delete the used token: `prisma.verificationToken.delete({ where: { identifier_token: { identifier: email, token: hashedToken } } })`
5. On success: redirect to `/login` with a success message ("Password reset successfully. Please sign in.")

**VerificationToken model (from DATABASE_SCHEMA.md):**

```prisma
model VerificationToken {
  identifier String      // User's email
  token      String   @unique  // Hashed token
  expires    DateTime    // Expiry timestamp

  @@unique([identifier, token])
}
```

### 2.4 Logout Flow

1. User clicks "Sign Out" from the avatar dropdown menu in the header
2. Call `signOut()` from Auth.js (or invoke via Server Action)
3. JWT session is cleared
4. Redirect to homepage (`/`)

**Implementation:**

```typescript
// In a Client Component (e.g., Header dropdown)
import { signOut } from "next-auth/react";

<button onClick={() => signOut({ callbackUrl: "/" })}>
  Sign Out
</button>
```

Or via Server Action:

```typescript
// src/app/actions/auth.ts
"use server";

import { signOut } from "@/lib/auth";

export async function logout() {
  await signOut({ redirect: false });
}
```

---

## 3. Role-Based Access Control

### 3.1 Roles

Defined in the Prisma schema as `enum UserRole`:

| Role | Description | Default? |
|------|-------------|----------|
| `VIEWER` | Can browse and watch videos | Yes (assigned on registration) |
| `CREATOR` | Can upload and manage own videos | No (admin-assigned) |
| `STUDIO` | Same as CREATOR with additional studio features (future) | No (admin-assigned) |
| `ADMIN` | Full platform access, user/content management | No (seeded or admin-assigned) |

### 3.2 Permissions Matrix

| Resource / Action | VIEWER | CREATOR | STUDIO | ADMIN |
|---|---|---|---|---|
| Browse/watch videos | Yes | Yes | Yes | Yes |
| Search videos | Yes | Yes | Yes | Yes |
| View channel pages | Yes | Yes | Yes | Yes |
| Edit own profile | Yes | Yes | Yes | Yes |
| Upload videos | No | Yes | Yes | Yes |
| Manage own videos | No | Yes | Yes | Yes |
| Access creator dashboard | No | Yes | Yes | Yes |
| Moderate all content | No | No | No | Yes |
| Manage users/roles | No | No | No | Yes |
| Manage categories | No | No | No | Yes |
| Access admin panel | No | No | No | Yes |

### 3.3 Role Upgrade

- Only users with the `ADMIN` role can change another user's role
- A `VIEWER` can request an upgrade to `CREATOR` — for MVP this is done manually by an admin changing the role in the admin panel
- No self-service role upgrade flow in MVP

### 3.4 Role Check Helpers

**File:** `src/lib/auth-utils.ts`

```typescript
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import type { UserRole } from "@/generated/prisma/client";

/**
 * Get the current session. Returns null if not authenticated.
 */
export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}

/**
 * Require authentication. Redirects to login if not authenticated.
 */
export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  return session.user;
}

/**
 * Require a specific role (or higher). Redirects if insufficient.
 */
const ROLE_HIERARCHY: Record<UserRole, number> = {
  VIEWER: 0,
  CREATOR: 1,
  STUDIO: 2,
  ADMIN: 3,
};

export async function requireRole(minimumRole: UserRole) {
  const user = await requireAuth();
  if (ROLE_HIERARCHY[user.role] < ROLE_HIERARCHY[minimumRole]) {
    redirect("/");
  }
  return user;
}

/**
 * Check if user has at least the specified role. Does not redirect.
 */
export function hasRole(userRole: UserRole, minimumRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[minimumRole];
}

/**
 * Check if user can upload videos (CREATOR, STUDIO, or ADMIN).
 */
export function canUpload(role: UserRole): boolean {
  return hasRole(role, "CREATOR");
}

/**
 * Check if user can access admin panel (ADMIN only).
 */
export function isAdmin(role: UserRole): boolean {
  return role === "ADMIN";
}
```

---

## 4. Middleware & Route Protection

### 4.1 Strategy

Auth protection uses a **two-layer approach:**

1. **Next.js Middleware** (`middleware.ts` at project root) — handles redirect-based protection
   - Runs on the Edge runtime
   - Checks if a session exists (lightweight JWT check)
   - Redirects unauthenticated users to `/login?callbackUrl=<original_url>`
   - Does NOT do role-based checks (keep middleware simple and fast)

2. **Layout-level auth checks** — handles role-based protection
   - Runs in the Node.js runtime (Server Components)
   - Calls `requireRole()` from `src/lib/auth-utils.ts`
   - Can do complex role logic, database queries if needed
   - Each route group layout handles its own role requirements

### 4.2 Protected Routes

| Route Pattern | Auth Required? | Role Required | Protected By |
|---|---|---|---|
| `/` | No | — | — |
| `/watch/*` | No | — | — |
| `/channel/*` | No | — | — |
| `/category/*` | No | — | — |
| `/search` | No | — | — |
| `/login` | No (redirect if logged in) | — | Auth layout |
| `/register` | No (redirect if logged in) | — | Auth layout |
| `/forgot-password` | No | — | — |
| `/reset-password` | No | — | — |
| `/settings` | Yes | Any role | Middleware |
| `/dashboard` | Yes | CREATOR+ | Middleware + Layout |
| `/dashboard/videos` | Yes | CREATOR+ | Middleware + Layout |
| `/dashboard/upload` | Yes | CREATOR+ | Middleware + Layout |
| `/dashboard/settings` | Yes | CREATOR+ | Middleware + Layout |
| `/admin` | Yes | ADMIN | Middleware + Layout |
| `/admin/videos` | Yes | ADMIN | Middleware + Layout |
| `/admin/users` | Yes | ADMIN | Middleware + Layout |
| `/admin/categories` | Yes | ADMIN | Middleware + Layout |

### 4.3 Middleware Implementation

**File:** `middleware.ts` (project root)

```typescript
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

// Routes that require authentication (any role)
const protectedRoutes = [
  "/dashboard",
  "/admin",
  "/upload",
  "/settings",
];

// Routes that should redirect to home if already authenticated
const authRoutes = ["/login", "/register"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  // Check if the current path starts with any protected route
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Check if the current path is an auth route (login/register)
  const isAuthRoute = authRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Redirect unauthenticated users away from protected routes
  if (isProtectedRoute && !isLoggedIn) {
    const callbackUrl = encodeURIComponent(pathname);
    return NextResponse.redirect(
      new URL(`/login?callbackUrl=${callbackUrl}`, req.url)
    );
  }

  // Redirect authenticated users away from auth routes
  if (isAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Match all routes except static files and API routes
    "/((?!api|_next/static|_next/image|favicon.ico|images).*)",
  ],
};
```

### 4.4 Layout-Level Role Checks

**Dashboard layout** — `src/app/(dashboard)/layout.tsx`:

```typescript
import { requireRole } from "@/lib/auth-utils";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Redirects to / if user is not at least CREATOR
  await requireRole("CREATOR");

  return (
    <div className="flex min-h-screen">
      {/* Sidebar + Content */}
      {children}
    </div>
  );
}
```

**Admin layout** — `src/app/(admin)/layout.tsx`:

```typescript
import { requireRole } from "@/lib/auth-utils";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Redirects to / if user is not ADMIN
  await requireRole("ADMIN");

  return (
    <div className="flex min-h-screen">
      {/* Admin Sidebar + Content */}
      {children}
    </div>
  );
}
```

**Auth layout** — `src/app/(auth)/layout.tsx`:

```typescript
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Redirect authenticated users to homepage
  const session = await auth();
  if (session) redirect("/");

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950">
      {children}
    </div>
  );
}
```

### 4.5 Server Action Protection

Every Server Action that mutates data must verify authentication and authorization:

```typescript
"use server";

import { requireRole } from "@/lib/auth-utils";

export async function publishVideo(videoId: string) {
  // Verify user is at least CREATOR
  const user = await requireRole("CREATOR");

  // Verify ownership
  const video = await prisma.video.findUnique({
    where: { id: videoId },
  });

  if (!video || video.userId !== user.id) {
    throw new Error("Not authorized");
  }

  // Proceed with mutation...
}
```

**Admin actions** check for `ADMIN` role:

```typescript
export async function changeUserRole(userId: string, newRole: UserRole) {
  await requireRole("ADMIN");
  // Proceed with role change...
}
```

---

## 5. Auth File Structure

### 5.1 File Map

```
video-platform/
├── middleware.ts                          # Route protection (Edge runtime)
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── layout.tsx                # Auth layout (centered, redirects if logged in)
│   │   │   ├── login/
│   │   │   │   └── page.tsx              # Login page (renders LoginForm)
│   │   │   ├── register/
│   │   │   │   └── page.tsx              # Register page (renders RegisterForm)
│   │   │   ├── forgot-password/
│   │   │   │   └── page.tsx              # Forgot password page
│   │   │   └── reset-password/
│   │   │       └── page.tsx              # Reset password page (token validation)
│   │   ├── api/
│   │   │   └── auth/
│   │   │       └── [...nextauth]/
│   │   │           └── route.ts          # Auth.js API route handler
│   │   └── actions/
│   │       └── auth.ts                   # Server Actions: register, forgotPassword, resetPassword
│   ├── components/
│   │   └── forms/
│   │       ├── LoginForm.tsx             # Client Component: login form
│   │       ├── RegisterForm.tsx          # Client Component: registration form
│   │       ├── ForgotPasswordForm.tsx    # Client Component: forgot password form
│   │       └── ResetPasswordForm.tsx     # Client Component: reset password form
│   ├── lib/
│   │   ├── auth.ts                       # NextAuth config (providers, callbacks)
│   │   ├── auth-utils.ts                 # Role helpers: requireAuth, requireRole, hasRole
│   │   └── validations/
│   │       └── auth.ts                   # Zod 4 schemas: loginSchema, registerSchema, etc.
│   └── types/
│       └── next-auth.d.ts                # Type augmentation for Session, JWT, User
```

### 5.2 API Route Handler

**File:** `src/app/api/auth/[...nextauth]/route.ts`

```typescript
import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;
```

This is the only API route needed for authentication. Auth.js handles all the REST endpoints internally (sign-in, sign-out, session, CSRF, etc.).

### 5.3 Auth Page Components

**Login page** — `src/app/(auth)/login/page.tsx`:

```typescript
import { LoginForm } from "@/components/forms/LoginForm";

export default function LoginPage() {
  return <LoginForm />;
}
```

**Register page** — `src/app/(auth)/register/page.tsx`:

```typescript
import { RegisterForm } from "@/components/forms/RegisterForm";

export default function RegisterPage() {
  return <RegisterForm />;
}
```

Pages are minimal Server Components that render Client Component forms. All form logic (validation, submission, error display) lives in the form components.

---

## 6. Zod 4 Validation Schemas

**File:** `src/lib/validations/auth.ts`

All schemas use **Zod 4 syntax** — `z.email()`, `{ error: }` parameter, etc.

```typescript
import { z } from "zod";

// ─── Login ───────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.email({ error: "Please enter a valid email address" }),
  password: z.string().min(1, { error: "Password is required" }),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// ─── Registration ────────────────────────────────────────

export const registerSchema = z
  .object({
    name: z
      .string()
      .min(2, { error: "Name must be at least 2 characters" })
      .max(50, { error: "Name must be at most 50 characters" }),
    username: z
      .string()
      .min(3, { error: "Username must be at least 3 characters" })
      .max(30, { error: "Username must be at most 30 characters" })
      .regex(/^[a-z0-9_-]+$/, {
        error: "Username can only contain lowercase letters, numbers, hyphens, and underscores",
      }),
    email: z.email({ error: "Please enter a valid email address" }),
    password: z
      .string()
      .min(8, { error: "Password must be at least 8 characters" }),
    confirmPassword: z.string(),
  })
  .check(
    (ctx) => ctx.password === ctx.confirmPassword,
    { error: "Passwords do not match", path: ["confirmPassword"] }
  );

export type RegisterFormData = z.infer<typeof registerSchema>;

// ─── Forgot Password ────────────────────────────────────

export const forgotPasswordSchema = z.object({
  email: z.email({ error: "Please enter a valid email address" }),
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

// ─── Reset Password ─────────────────────────────────────

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, { error: "Password must be at least 8 characters" }),
    confirmPassword: z.string(),
    token: z.string(),
    email: z.email(),
  })
  .check(
    (ctx) => ctx.password === ctx.confirmPassword,
    { error: "Passwords do not match", path: ["confirmPassword"] }
  );

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
```

---

## 7. Implementation Reference

### 7.1 Environment Variables

Required in `.env`:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/video_platform"

# Auth.js
AUTH_SECRET="generate-with-npx-auth-secret"
AUTH_URL="http://localhost:3000"

# Generate AUTH_SECRET with:
# npx auth secret
```

`AUTH_SECRET` is required by Auth.js v5 for JWT signing and CSRF protection. Generate it with `npx auth secret` or any random 32+ character string.

### 7.2 Client-Side Auth Access

**In Client Components**, use the `useSession` hook from `next-auth/react`:

```typescript
"use client";

import { useSession } from "next-auth/react";

export function ProfileButton() {
  const { data: session, status } = useSession();

  if (status === "loading") return <Skeleton className="h-8 w-8 rounded-full" />;
  if (!session) return <LoginButton />;

  return (
    <div>
      <span>{session.user.name}</span>
      <span>{session.user.role}</span>
    </div>
  );
}
```

**Important:** Wrap the app with `SessionProvider` in the root layout for client-side session access:

```typescript
// src/app/layout.tsx (relevant excerpt)
import { SessionProvider } from "next-auth/react";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
```

### 7.3 Server-Side Auth Access

**In Server Components**, use the `auth()` function directly:

```typescript
// Server Component
import { auth } from "@/lib/auth";

export default async function Page() {
  const session = await auth();

  if (!session) {
    return <p>Not logged in</p>;
  }

  return <p>Welcome, {session.user.name}!</p>;
}
```

**In Server Actions**, use `auth()` or the helper functions from `auth-utils.ts`:

```typescript
"use server";

import { auth } from "@/lib/auth";
import { requireAuth, requireRole } from "@/lib/auth-utils";

export async function someAction() {
  const user = await requireAuth(); // throws redirect if not logged in
  // user is guaranteed to be defined here
}
```

### 7.4 Form Component Pattern

All auth forms follow this pattern — Client Component with react-hook-form + Zod 4:

```typescript
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { loginSchema, type LoginFormData } from "@/lib/validations/auth";
import { signIn } from "next-auth/react";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: LoginFormData) {
    setError(null);

    const result = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid email or password");
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <Card className="max-w-md w-full bg-zinc-900 border-zinc-700/50">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-zinc-50 text-center">
          Sign In
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <p className="text-sm text-red-500 text-center">{error}</p>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              {...register("email")}
              className="bg-zinc-950 border-zinc-700"
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              {...register("password")}
              className="bg-zinc-950 border-zinc-700"
            />
            {errors.password && (
              <p className="text-sm text-red-500">{errors.password.message}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full bg-blue-500 hover:bg-blue-600 text-white"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Signing in..." : "Sign In"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
```

### 7.5 Callback URL Handling

When a user is redirected to `/login` from a protected route, the original URL is preserved as a query parameter:

```
/login?callbackUrl=%2Fdashboard%2Fvideos
```

The login form should read this and redirect after successful auth:

```typescript
import { useSearchParams } from "next/navigation";

const searchParams = useSearchParams();
const callbackUrl = searchParams.get("callbackUrl") || "/";

// After successful sign-in:
router.push(callbackUrl);
```

### 7.6 Security Considerations

| Concern | Mitigation |
|---------|-----------|
| Password storage | bcryptjs with 12 salt rounds — never store plaintext |
| Credential enumeration | Login errors are generic ("Invalid email or password") |
| Forgot password enumeration | Always show same message regardless of email existence |
| CSRF protection | Built into Auth.js v5 automatically |
| JWT signing | `AUTH_SECRET` env variable, minimum 32 characters |
| Password reset tokens | Hashed before storage, 1-hour expiry, single-use (deleted after use) |
| Session fixation | JWT is regenerated on sign-in |
| Input validation | Zod 4 on both client and server side |
| SQL injection | Prisma ORM handles parameterized queries |
| XSS | React's default escaping + no `dangerouslySetInnerHTML` |

---

## Appendix: Auth Flow Diagrams

### Registration Sequence

```
User                Browser (Client)         Server Action            Database
 │                       │                       │                      │
 │  Fill form            │                       │                      │
 │──────────────────────>│                       │                      │
 │                       │  Zod 4 validate       │                      │
 │                       │──────────────>        │                      │
 │                       │                       │  Check email unique  │
 │                       │                       │─────────────────────>│
 │                       │                       │  Check username      │
 │                       │                       │─────────────────────>│
 │                       │                       │  Hash password       │
 │                       │                       │  (bcryptjs, 12 rds)  │
 │                       │                       │  Create User         │
 │                       │                       │─────────────────────>│
 │                       │                       │  signIn()            │
 │                       │                       │  (create JWT)        │
 │                       │  Redirect to /        │                      │
 │  See homepage         │<──────────────        │                      │
 │<──────────────────────│                       │                      │
```

### Login Sequence

```
User                Browser (Client)         Auth.js Authorize        Database
 │                       │                       │                      │
 │  Fill form            │                       │                      │
 │──────────────────────>│                       │                      │
 │                       │  signIn("credentials")│                      │
 │                       │──────────────────────>│                      │
 │                       │                       │  Find user by email  │
 │                       │                       │─────────────────────>│
 │                       │                       │  Compare password    │
 │                       │                       │  (bcryptjs)          │
 │                       │                       │  Return user or null │
 │                       │  JWT created           │                      │
 │                       │<──────────────────────│                      │
 │                       │  Redirect to          │                      │
 │                       │  callbackUrl or /     │                      │
 │  See destination      │                       │                      │
 │<──────────────────────│                       │                      │
```

### Middleware Flow

```
Request
  │
  ▼
middleware.ts
  │
  ├─ Is protected route?
  │   ├─ Yes → Has session?
  │   │         ├─ Yes → NextResponse.next() → Layout role check
  │   │         └─ No  → Redirect to /login?callbackUrl=...
  │   └─ No
  │
  ├─ Is auth route? (/login, /register)
  │   ├─ Yes → Has session?
  │   │         ├─ Yes → Redirect to /
  │   │         └─ No  → NextResponse.next()
  │   └─ No
  │
  └─ NextResponse.next()
```
