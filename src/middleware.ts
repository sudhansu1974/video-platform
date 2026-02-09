import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";
import type { UserRole } from "@/generated/prisma/client";

const { auth } = NextAuth(authConfig);

const CREATOR_ROLES: UserRole[] = ["CREATOR", "STUDIO", "ADMIN"];

export default auth((req) => {
  const { nextUrl } = req;
  const session = req.auth;
  const pathname = nextUrl.pathname;

  // Redirect authenticated users away from auth pages
  if (session && (pathname === "/login" || pathname === "/register")) {
    return NextResponse.redirect(new URL("/", nextUrl));
  }

  // Protected routes — require authentication
  const isProtected =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/admin") ||
    pathname === "/upload" ||
    pathname === "/settings";

  if (isProtected && !session) {
    const loginUrl = new URL("/login", nextUrl);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (session) {
    const role = session.user.role;

    // /admin/* — ADMIN only
    if (pathname.startsWith("/admin") && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", nextUrl));
    }

    // /dashboard/* and /upload — CREATOR, STUDIO, ADMIN only
    if (
      (pathname.startsWith("/dashboard") || pathname === "/upload") &&
      !CREATOR_ROLES.includes(role)
    ) {
      return NextResponse.redirect(new URL("/", nextUrl));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/upload",
    "/settings",
    "/login",
    "/register",
  ],
};
