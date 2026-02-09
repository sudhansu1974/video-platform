import { z } from "zod";

// ─── Constants ────────────────────────────────────────

export const ALLOWED_VIDEO_TYPES = [
  "video/mp4",
  "video/quicktime",
  "video/x-msvideo",
  "video/webm",
] as const;

export const ALLOWED_EXTENSIONS = [".mp4", ".mov", ".avi", ".webm"] as const;

/** 2 GB in bytes */
export const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024;

// ─── Video Upload Schema ──────────────────────────────

export const videoUploadSchema = z.object({
  title: z
    .string()
    .min(3, { error: "Title must be at least 3 characters" })
    .max(200, { error: "Title must be at most 200 characters" }),
  description: z
    .string()
    .max(5000, { error: "Description must be at most 5000 characters" })
    .optional(),
  categoryId: z.string().optional(),
  tags: z
    .array(z.string().max(50, { error: "Tag must be at most 50 characters" }))
    .max(10, { error: "Maximum 10 tags allowed" })
    .optional(),
});

export type VideoUploadInput = z.infer<typeof videoUploadSchema>;

// ─── Video Metadata Update Schema ─────────────────────

export const videoMetadataSchema = z.object({
  videoId: z.string().min(1, { error: "Video ID is required" }),
  title: z
    .string()
    .min(3, { error: "Title must be at least 3 characters" })
    .max(200, { error: "Title must be at most 200 characters" }),
  description: z
    .string()
    .max(5000, { error: "Description must be at most 5000 characters" })
    .optional(),
  categoryId: z.string().optional(),
  tags: z
    .array(z.string().max(50, { error: "Tag must be at most 50 characters" }))
    .max(10, { error: "Maximum 10 tags allowed" })
    .optional(),
});

export type VideoMetadataInput = z.infer<typeof videoMetadataSchema>;
