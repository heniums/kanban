"use server";

import { createDbClient, boards } from "@kanban/shared";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { getSessionUserId } from "./auth";

export async function restoreBoardAction(id: string) {
  const userId = await getSessionUserId();

  const db = createDbClient();

  const [existing] = await db
    .select()
    .from(boards)
    .where(eq(boards.id, id));

  if (!existing) {
    throw new Error("Board not found");
  }

  if (existing.ownerId !== userId) {
    throw new Error("Forbidden");
  }

  await db
    .update(boards)
    .set({ deletedAt: null })
    .where(eq(boards.id, id));

  revalidatePath("/boards");

  return { success: true };
}
