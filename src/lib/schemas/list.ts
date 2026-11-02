import { z } from "zod";

const uuid = z
  .string()
  .regex(
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/,
    "Invalid UUID",
  );

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
