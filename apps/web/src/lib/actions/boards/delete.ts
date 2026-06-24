"use server";

import { revalidatePath } from "next/cache";

import { verifySession } from "@/lib/dal";
import { softDeleteBoard } from "@/lib/data/boards";

export async function deleteBoardAction(id: string) {
  const { userId } = await verifySession();

  const deleted = await softDeleteBoard(id, { ownerId: userId });

  if (!deleted) {
    return { error: "Board not found or not owned" };
  }

  revalidatePath("/boards");
  revalidatePath(`/boards/${id}`);

  return { success: true };
}
