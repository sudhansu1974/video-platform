"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { writeFile, unlink, mkdir } from "fs/promises";
import path from "path";
import bcrypt from "bcryptjs";
import { auth, signOut } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { generateUploadPath, getPublicUrl } from "@/lib/upload";
import {
  updateProfileSchema,
  changePasswordSchema,
  ALLOWED_AVATAR_TYPES,
  MAX_AVATAR_SIZE,
  ALLOWED_BANNER_TYPES,
  MAX_BANNER_SIZE,
  type UpdateProfileInput,
  type ChangePasswordInput,
} from "@/lib/validations/profile";

// ─── Update Profile ─────────────────────────────────

export async function updateProfile(input: UpdateProfileInput) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false as const, error: "Unauthorized" };
  }

  const parsed = updateProfileSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false as const,
      error: "Validation failed",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { name, bio, websiteUrl, location } = parsed.data;

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name,
      bio: bio || null,
      websiteUrl: websiteUrl || null,
      location: location || null,
    },
  });

  revalidatePath("/settings");
  revalidatePath(`/channel/${session.user.username}`);

  return { success: true as const };
}

// ─── Update Avatar ──────────────────────────────────

export async function updateAvatar(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false as const, error: "Unauthorized" };
  }

  const file = formData.get("avatar") as File | null;
  if (!file) {
    return { success: false as const, error: "No file provided" };
  }

  if (!ALLOWED_AVATAR_TYPES.includes(file.type as (typeof ALLOWED_AVATAR_TYPES)[number])) {
    return { success: false as const, error: "Invalid file type. Use JPEG, PNG, WebP, or GIF." };
  }

  if (file.size > MAX_AVATAR_SIZE) {
    return { success: false as const, error: "File too large. Maximum 5MB." };
  }

  // Save file
  // TODO: Use cloud storage and image CDN in production
  const uploadsDir = path.join(process.cwd(), "uploads", "avatars");
  await mkdir(uploadsDir, { recursive: true });

  const ext = path.extname(file.name) || ".jpg";
  const filename = `${session.user.id}-${Date.now()}${ext}`;
  const filePath = path.join(uploadsDir, filename);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, buffer);

  const avatarUrl = getPublicUrl(filePath);

  // Delete old avatar file if it's a local upload
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { avatarUrl: true },
  });
  if (user?.avatarUrl?.startsWith("/api/uploads/avatars/")) {
    const oldFilename = user.avatarUrl.replace("/api/uploads/avatars/", "");
    const oldPath = path.join(uploadsDir, oldFilename);
    await unlink(oldPath).catch(() => {});
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { avatarUrl },
  });

  revalidatePath("/settings");
  revalidatePath(`/channel/${session.user.username}`);

  return { success: true as const, avatarUrl };
}

// ─── Update Banner ──────────────────────────────────

export async function updateBanner(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false as const, error: "Unauthorized" };
  }

  const file = formData.get("banner") as File | null;
  if (!file) {
    return { success: false as const, error: "No file provided" };
  }

  if (!ALLOWED_BANNER_TYPES.includes(file.type as (typeof ALLOWED_BANNER_TYPES)[number])) {
    return { success: false as const, error: "Invalid file type. Use JPEG, PNG, or WebP." };
  }

  if (file.size > MAX_BANNER_SIZE) {
    return { success: false as const, error: "File too large. Maximum 10MB." };
  }

  // Save file
  // TODO: Use cloud storage and image CDN in production
  const uploadsDir = path.join(process.cwd(), "uploads", "banners");
  await mkdir(uploadsDir, { recursive: true });

  const ext = path.extname(file.name) || ".jpg";
  const filename = `${session.user.id}-${Date.now()}${ext}`;
  const filePath = path.join(uploadsDir, filename);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, buffer);

  const bannerUrl = getPublicUrl(filePath);

  // Delete old banner file
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { bannerUrl: true },
  });
  if (user?.bannerUrl?.startsWith("/api/uploads/banners/")) {
    const oldFilename = user.bannerUrl.replace("/api/uploads/banners/", "");
    const oldPath = path.join(uploadsDir, oldFilename);
    await unlink(oldPath).catch(() => {});
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { bannerUrl },
  });

  revalidatePath("/settings");
  revalidatePath(`/channel/${session.user.username}`);

  return { success: true as const, bannerUrl };
}

// ─── Change Password ────────────────────────────────

export async function changePassword(input: ChangePasswordInput) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false as const, error: "Unauthorized" };
  }

  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false as const,
      error: "Validation failed",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { passwordHash: true },
  });

  if (!user) {
    return { success: false as const, error: "User not found" };
  }

  const isValid = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
  if (!isValid) {
    return { success: false as const, error: "Current password is incorrect" };
  }

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);

  await prisma.user.update({
    where: { id: session.user.id },
    data: { passwordHash },
  });

  return { success: true as const };
}

// ─── Delete Account ─────────────────────────────────

export async function deleteAccount(password: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false as const, error: "Unauthorized" };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { passwordHash: true },
  });

  if (!user) {
    return { success: false as const, error: "User not found" };
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    return { success: false as const, error: "Incorrect password" };
  }

  // Delete user's data in order (respecting FK constraints)
  await prisma.$transaction([
    prisma.processingJob.deleteMany({ where: { video: { userId: session.user.id } } }),
    prisma.videoTag.deleteMany({ where: { video: { userId: session.user.id } } }),
    prisma.video.deleteMany({ where: { userId: session.user.id } }),
    prisma.session.deleteMany({ where: { userId: session.user.id } }),
    prisma.account.deleteMany({ where: { userId: session.user.id } }),
    prisma.user.delete({ where: { id: session.user.id } }),
  ]);

  // TODO: Delete user's uploaded files (videos, thumbnails, avatar, banner) from storage

  await signOut({ redirectTo: "/" });
  redirect("/");
}
