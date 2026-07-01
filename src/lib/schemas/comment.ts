import { z } from "zod";

const uuid = z.string().uuid();

export const createCommentSchema = z.object({
  cardId: uuid,
  content: z.string().min(1).max(2000),
});

export const updateCommentSchema = z.object({
  commentId: uuid,
  content: z.string().min(1).max(2000),
});

export const deleteCommentSchema = z.object({
  commentId: uuid,
});

export const getCommentsByCardIdSchema = z.object({
  cardId: uuid,
  limit: z.number().int().min(1).max(100).optional(),
  offset: z.number().int().min(0).optional(),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;
export type GetCommentsByCardIdInput = z.infer<typeof getCommentsByCardIdSchema>;
