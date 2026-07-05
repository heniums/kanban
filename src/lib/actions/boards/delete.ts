"use server";

import { revalidatePath } from "next/cache";

import { verifySession } from "@/lib/dal";
import { softDeleteBoard } from "@/lib/data/boards";
import { assertBoardPermission } from "@/lib/actions/guards";
import { BoardPermission } from "@/lib/permissions";

export async function deleteBoardAction(id: string) {
  const { userId } = await verifySession();

  const allowed = await assertBoardPermission(id, userId, BoardPermission.MANAGE_SETTINGS);
  if (!allowed) {
    return { error: "Forbidden" };
  }

  const deleted = await softDeleteBoard(id);

  if (!deleted) {
    return { error: "Board not found" };
  }

  revalidatePath("/boards");
  revalidatePath(`/boards/${id}`);

  return { success: true };
}
