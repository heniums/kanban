import { z } from "zod";

const uuid = z.string().uuid();

export const createListSchema = z.object({
  boardId: uuid,
  title: z.string().min(1, "Title is required").max(100, "Title must be at most 100 characters"),
});

export const renameListSchema = z.object({
  listId: uuid,
  title: z.string().min(1, "Title is required").max(100, "Title must be at most 100 characters"),
});

export const reorderListsSchema = z.object({
  boardId: uuid,
  orderedListIds: z.array(uuid),
});
