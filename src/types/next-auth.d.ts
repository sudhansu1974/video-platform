import { UserRole } from "@/generated/prisma/client";
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      username: string;
      avatarUrl: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: UserRole;
    username: string;
    avatarUrl: string | null;
    passwordHash: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    username: string;
    avatarUrl: string | null;
  }
}
