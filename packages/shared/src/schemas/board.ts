import { z } from "zod";

export const boardBackgroundSchema = z.string().min(1, "Background is required").max(500);

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
