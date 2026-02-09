"use server";

import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { signIn, signOut } from "@/lib/auth";
import {
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  type RegisterInput,
  type ResetPasswordInput,
} from "@/lib/validations/auth";

// ─── Logout ────────────────────────────────────────────

export async function logout() {
  await signOut({ redirectTo: "/login" });
}

// ─── Register User ─────────────────────────────────────

export async function registerUser(input: RegisterInput) {
  const parsed = registerSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false as const,
      error: "Validation failed",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { name, username, email, password } = parsed.data;

  const existingEmail = await prisma.user.findUnique({
    where: { email },
  });

  if (existingEmail) {
    return {
      success: false as const,
      error: "Email already registered",
    };
  }

  const existingUsername = await prisma.user.findUnique({
    where: { username },
  });

  if (existingUsername) {
    return {
      success: false as const,
      error: "Username already taken",
    };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.create({
    data: {
      name,
      username,
      email,
      passwordHash,
      role: "VIEWER",
    },
  });

  await signIn("credentials", {
    email,
    password,
    redirect: false,
  });

  return { success: true as const };
}

// ─── Request Password Reset ────────────────────────────

export async function requestPasswordReset(input: { email: string }) {
  const parsed = forgotPasswordSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false as const,
      error: "Valid email is required",
    };
  }

  const { email } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (user) {
    const token = crypto.randomUUID();

    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires: new Date(Date.now() + 3600000), // 1 hour
      },
    });

    // TODO: Replace console.log with actual email sending in production
    console.log(
      `[Password Reset] ${process.env.NEXTAUTH_URL}/reset-password?token=${token}`
    );
  }

  return {
    success: true as const,
    message:
      "If an account exists with that email, a reset link has been sent.",
  };
}

// ─── Reset Password ────────────────────────────────────

export async function resetPassword(input: ResetPasswordInput) {
  const parsed = resetPasswordSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false as const,
      error: "Validation failed",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { token, password } = parsed.data;

  const verificationToken = await prisma.verificationToken.findUnique({
    where: { token },
  });

  if (!verificationToken || verificationToken.expires < new Date()) {
    return {
      success: false as const,
      error: "Invalid or expired reset token",
    };
  }

  const user = await prisma.user.findUnique({
    where: { email: verificationToken.identifier },
  });

  if (!user) {
    return {
      success: false as const,
      error: "Invalid or expired reset token",
    };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });

  await prisma.verificationToken.delete({
    where: {
      identifier_token: {
        identifier: verificationToken.identifier,
        token: verificationToken.token,
      },
    },
  });

  return { success: true as const };
}
