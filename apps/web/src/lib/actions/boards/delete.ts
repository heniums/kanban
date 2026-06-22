"use server";

import { revalidatePath } from "next/cache";

import { getSessionUserId } from "./auth";
import { softDeleteBoard } from "@/lib/data/boards";

export async function deleteBoardAction(id: string) {
  const userId = await getSessionUserId();

  const deleted = await softDeleteBoard(id, { ownerId: userId });

  if (!deleted) {
    return { error: "Board not found or not owned" };
  }

  revalidatePath("/boards");
  revalidatePath(`/boards/${id}`);

  return { success: true };
}
