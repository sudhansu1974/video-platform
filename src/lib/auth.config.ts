import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type { UserRole } from "@/generated/prisma/client";

export const authConfig = {
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      // authorize is defined in auth.ts where Prisma is available
      authorize: () => null,
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        token.role = user.role;
        token.username = user.username;
        token.avatarUrl = user.avatarUrl;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as UserRole;
      session.user.username = token.username as string;
      session.user.avatarUrl = token.avatarUrl as string | null;
      return session;
    },
  },
} satisfies NextAuthConfig;
