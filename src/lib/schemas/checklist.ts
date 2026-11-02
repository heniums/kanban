import { z } from "zod";

const uuid = z
  .string()
  .regex(
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/,
    "Invalid UUID",
  );

export const createChecklistSchema = z.object({
  cardId: uuid,
  title: z.string().min(1).max(200),
});

export const deleteChecklistSchema = z.object({
  checklistId: uuid,
});

export const createChecklistItemSchema = z.object({
  checklistId: uuid,
  content: z.string().min(1).max(500),
});

export const updateChecklistItemSchema = z.object({
  itemId: uuid,
  content: z.string().min(1).max(500).optional(),
  isCompleted: z.boolean().optional(),
});

export const deleteChecklistItemSchema = z.object({
  itemId: uuid,
});
