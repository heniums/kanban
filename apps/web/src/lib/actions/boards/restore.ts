"use server";

import { revalidatePath } from "next/cache";

import { getSessionUserId } from "./auth";
import { restoreBoard } from "@/lib/data/boards";

export async function restoreBoardAction(id: string) {
  const userId = await getSessionUserId();

  const restored = await restoreBoard(id, { ownerId: userId });

  if (!restored) {
    return { error: "Board not found or not owned" };
  }

  revalidatePath("/boards");

  return { success: true };
}
