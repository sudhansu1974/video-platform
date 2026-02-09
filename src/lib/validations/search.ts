import { z } from "zod";

export const searchQuerySchema = z.object({
  q: z.string().min(1).max(200).trim(),
  category: z.string().max(100).optional(),
  tag: z.string().max(100).optional(),
  sort: z.enum(["relevance", "recent", "popular", "views"]).optional(),
  duration: z.enum(["short", "medium", "long"]).optional(),
  uploadDate: z.enum(["today", "week", "month", "year"]).optional(),
  page: z.coerce.number().int().min(1).optional(),
});

export type SearchQuery = z.infer<typeof searchQuerySchema>;
