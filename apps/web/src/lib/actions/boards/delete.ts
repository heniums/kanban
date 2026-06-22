"use server";

import { revalidatePath } from "next/cache";

import { getSessionUserId } from "./auth";
import { getBoardById, softDeleteBoard } from "@/lib/data/boards";

export async function deleteBoardAction(id: string) {
  const userId = await getSessionUserId();

  const existing = await getBoardById(id);

  if (!existing) {
    throw new Error("Board not found");
  }

  if (existing.ownerId !== userId) {
    throw new Error("Forbidden");
  }

  await softDeleteBoard(id);

  revalidatePath("/boards");

  return { success: true };
}
