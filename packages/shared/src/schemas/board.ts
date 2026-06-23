import { z } from "zod";

export const boardBackgroundSchema = z
  .string()
  .min(1, "Background is required")
  .max(500, "Background must be at most 500 characters")
  .regex(
    /^(?:#[0-9a-fA-F]{3}|#[0-9a-fA-F]{6}|linear-gradient\([a-zA-Z0-9 ,%.#-]+\)|radial-gradient\([a-zA-Z0-9 ,%.#-]+\))$/,
    "Background must be a hex color (e.g. #1a1a2e) or gradient function (e.g. linear-gradient(...))"
  );

export const createBoardSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title must be at most 100 characters"),
  description: z.string().max(2000, "Description must be at most 2000 characters").nullable().optional(),
  background: boardBackgroundSchema,
});

export const updateBoardSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title must be at most 100 characters").optional(),
  description: z.string().max(2000, "Description must be at most 2000 characters").nullable().optional(),
  background: boardBackgroundSchema.optional(),
});

export type CreateBoardInput = z.infer<typeof createBoardSchema>;
export type UpdateBoardInput = z.infer<typeof updateBoardSchema>;
