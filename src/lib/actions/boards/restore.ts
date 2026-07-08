"use server";

import { revalidatePath } from "next/cache";

import { verifySession } from "@/lib/dal";
import { restoreBoard } from "@/lib/data/boards";
import { assertBoardPermission } from "@/lib/actions/guards";
import { BoardPermission } from "@/lib/permissions";

export async function restoreBoardAction(id: string) {
  const { userId } = await verifySession();

  const allowed = await assertBoardPermission(id, userId, BoardPermission.MANAGE_SETTINGS, {
    includeDeleted: true,
  });
  if (!allowed) {
    return { error: "Forbidden" };
  }

  const restored = await restoreBoard(id);

  if (!restored) {
    return { error: "Board not found" };
  }

  revalidatePath("/boards");

  return { success: true };
}
