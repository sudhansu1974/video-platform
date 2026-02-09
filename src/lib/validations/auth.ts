import { z } from "zod";

// ─── Login Schema ──────────────────────────────────────

export const loginSchema = z.object({
  email: z.email({ error: "Valid email is required" }),
  password: z.string().min(1, { error: "Password is required" }),
});

export type LoginInput = z.infer<typeof loginSchema>;

// ─── Register Schema ───────────────────────────────────

const passwordSchema = z
  .string()
  .min(8, { error: "Password must be at least 8 characters" })
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    error:
      "Password must contain at least 1 uppercase, 1 lowercase, and 1 number",
  });

export const registerSchema = z
  .object({
    name: z
      .string()
      .min(2, { error: "Name must be at least 2 characters" })
      .max(50),
    username: z
      .string()
      .min(3, { error: "Username must be at least 3 characters" })
      .max(30)
      .regex(/^[a-zA-Z0-9_-]+$/, {
        error:
          "Username can only contain letters, numbers, hyphens, and underscores",
      }),
    email: z.email({ error: "Valid email is required" }),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    error: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

// ─── Forgot Password Schema ────────────────────────────

export const forgotPasswordSchema = z.object({
  email: z.email({ error: "Valid email is required" }),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

// ─── Reset Password Schema ─────────────────────────────

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    error: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
