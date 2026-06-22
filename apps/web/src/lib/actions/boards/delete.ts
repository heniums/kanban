"use server";

import { createDbClient, boards } from "@kanban/shared";
import { eq, and, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { getSessionUserId } from "./auth";

export async function deleteBoardAction(id: string) {
  const userId = await getSessionUserId();

  const db = createDbClient();

  const [existing] = await db
    .select()
    .from(boards)
    .where(and(eq(boards.id, id), isNull(boards.deletedAt)));

  if (!existing) {
    throw new Error("Board not found");
  }

  if (existing.ownerId !== userId) {
    throw new Error("Forbidden");
  }

  await db
    .update(boards)
    .set({ deletedAt: new Date() })
    .where(eq(boards.id, id));

  revalidatePath("/boards");

  return { success: true };
}
