import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z.string().min(1, { error: "Name is required" }).max(100, { error: "Name too long" }),
  bio: z.string().max(1000, { error: "Bio must be 1000 characters or less" }).optional().or(z.literal("")),
  websiteUrl: z.url({ error: "Invalid URL" }).optional().or(z.literal("")),
  location: z.string().max(100, { error: "Location too long" }).optional().or(z.literal("")),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, { error: "Current password is required" }),
    newPassword: z.string().min(8, { error: "Password must be at least 8 characters" }),
    confirmPassword: z.string().min(1, { error: "Please confirm your password" }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    error: "Passwords don't match",
    path: ["confirmPassword"],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

// Avatar upload validation
export const ALLOWED_AVATAR_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;
export const MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5MB

// Banner upload validation
export const ALLOWED_BANNER_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;
export const MAX_BANNER_SIZE = 10 * 1024 * 1024; // 10MB
