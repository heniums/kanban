"use server";

import { revalidatePath } from "next/cache";

import { verifySession } from "@/lib/dal";
import { restoreBoard } from "@/lib/data/boards";

export async function restoreBoardAction(id: string) {
  const { userId } = await verifySession();

  const restored = await restoreBoard(id, { ownerId: userId });

  if (!restored) {
    return { error: "Board not found or not owned" };
  }

  revalidatePath("/boards");

  return { success: true };
}
