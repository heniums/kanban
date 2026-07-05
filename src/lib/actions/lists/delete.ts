"use server";

import { revalidatePath } from "next/cache";
import { verifySession } from "@/lib/dal";
import { deleteList } from "@/lib/data/lists";
import { assertListPermission } from "@/lib/actions/guards";
import { BoardPermission } from "@/lib/permissions";
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

  const allowed = await assertListPermission(
    parsed.data.listId,
    userId,
    BoardPermission.EDIT_CONTENT,
  );
  if (!allowed) {
    return { error: "Forbidden" };
  }

  const deleted = await deleteList(parsed.data.listId);
  if (!deleted) {
    return { error: "List not found" };
  }

  revalidatePath(`/boards/${deleted.boardId}`);
  return { success: true };
}
