"use server";

import { revalidatePath } from "next/cache";

import { getSessionUserId } from "./auth";
import { getBoardByIdIncludingDeleted, restoreBoard } from "@/lib/data/boards";

export async function restoreBoardAction(id: string) {
  const userId = await getSessionUserId();

  const existing = await getBoardByIdIncludingDeleted(id);

  if (!existing) {
    throw new Error("Board not found");
  }

  if (existing.ownerId !== userId) {
    throw new Error("Forbidden");
  }

  await restoreBoard(id);

  revalidatePath("/boards");

  return { success: true };
}
