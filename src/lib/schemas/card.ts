import { z } from "zod";

const uuid = z.string().uuid();

export const createCardSchema = z.object({
  listId: uuid,
  title: z.string().min(1, "Title is required").max(200, "Title must be at most 200 characters"),
  description: z.string().max(5000, "Description must be at most 5000 characters").optional(),
  dueDate: z.coerce.date().nullable().optional(),
  labelIds: z.array(uuid).optional(),
  assigneeIds: z.array(uuid).optional(),
});

export const updateCardSchema = z.object({
  cardId: uuid,
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be at most 200 characters")
    .optional(),
  description: z.string().max(5000).nullable().optional(),
  dueDate: z.coerce.date().nullable().optional(),
  listId: uuid.optional(),
  labelIds: z.array(uuid).optional(),
  assigneeIds: z.array(uuid).optional(),
});

export const deleteCardSchema = z.object({
  cardId: uuid,
});

export const moveCardSchema = z.object({
  cardId: uuid,
  targetListId: uuid,
  targetPosition: z.number().int().min(0),
});

export const reorderCardsSchema = z.object({
  listId: uuid,
  orderedCardIds: z.array(uuid),
});

export type CreateCardInput = z.infer<typeof createCardSchema>;
export type UpdateCardInput = z.infer<typeof updateCardSchema>;
export type MoveCardInput = z.infer<typeof moveCardSchema>;
export type ReorderCardsInput = z.infer<typeof reorderCardsSchema>;
