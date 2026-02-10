import { z } from "zod";

// ─── Category Schemas ────────────────────────────────

export const createCategorySchema = z.object({
  name: z
    .string()
    .min(2, { error: "Name must be at least 2 characters" })
    .max(100, { error: "Name must be at most 100 characters" }),
  slug: z
    .string()
    .min(2, { error: "Slug must be at least 2 characters" })
    .max(100, { error: "Slug must be at most 100 characters" })
    .regex(/^[a-z0-9-]+$/, {
      error: "Slug must be lowercase alphanumeric with hyphens",
    })
    .optional(),
  description: z
    .string()
    .max(500, { error: "Description must be at most 500 characters" })
    .optional(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;

export const updateCategorySchema = z.object({
  categoryId: z.string().min(1, { error: "Category ID is required" }),
  name: z
    .string()
    .min(2, { error: "Name must be at least 2 characters" })
    .max(100, { error: "Name must be at most 100 characters" })
    .optional(),
  slug: z
    .string()
    .min(2, { error: "Slug must be at least 2 characters" })
    .max(100, { error: "Slug must be at most 100 characters" })
    .regex(/^[a-z0-9-]+$/, {
      error: "Slug must be lowercase alphanumeric with hyphens",
    })
    .optional(),
  description: z
    .string()
    .max(500, { error: "Description must be at most 500 characters" })
    .optional(),
});

export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

// ─── User Role Schema ────────────────────────────────

export const updateUserRoleSchema = z.object({
  userId: z.string().min(1, { error: "User ID is required" }),
  role: z.enum(["VIEWER", "CREATOR", "STUDIO", "ADMIN"], {
    error: "Invalid role",
  }),
});

export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;

// ─── Bulk Video Action Schema ────────────────────────

export const bulkVideoActionSchema = z.object({
  videoIds: z
    .array(z.string().min(1))
    .min(1, { error: "Select at least one video" })
    .max(100, { error: "Maximum 100 videos at once" }),
  status: z.enum(["PUBLISHED", "UNLISTED", "REJECTED", "DRAFT"], {
    error: "Invalid status",
  }),
});

export type BulkVideoActionInput = z.infer<typeof bulkVideoActionSchema>;

// ─── Create User Schema ─────────────────────────────

export const createUserSchema = z.object({
  email: z.email({ error: "Valid email is required" }),
  username: z
    .string()
    .min(3, { error: "Username must be at least 3 characters" })
    .max(30, { error: "Username must be at most 30 characters" })
    .regex(/^[a-zA-Z0-9_-]+$/, {
      error:
        "Username can only contain letters, numbers, hyphens, and underscores",
    }),
  password: z
    .string()
    .min(8, { error: "Password must be at least 8 characters" }),
  displayName: z
    .string()
    .max(100, { error: "Display name must be at most 100 characters" })
    .optional(),
  role: z.enum(["VIEWER", "CREATOR", "STUDIO", "ADMIN"], {
    error: "Invalid role",
  }),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
