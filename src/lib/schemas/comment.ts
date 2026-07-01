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
