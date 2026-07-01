"use server";

import { revalidatePath } from "next/cache";
import { verifySession } from "@/lib/dal";
import { deleteList } from "@/lib/data/lists";
import { z } from "zod";

const deleteListInputSchema = z.object({
  listId: z.string().uuid(),
});

type DeleteListResult = { success: true } | { error: string };

export async function deleteListAction(input: { listId: string }): Promise<DeleteListResult> {
  const { userId } = await verifySession();

  const parsed = deleteListInputSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Invalid input" };
  }

  const deleted = await deleteList(parsed.data.listId, { ownerId: userId });
  if (!deleted) {
    return { error: "List not found or not owned" };
  }

  revalidatePath(`/boards/${deleted.boardId}`);
  return { success: true };
}
