"use server";

import { createDbClient, boards } from "@kanban/shared";
import { eq, and, isNull } from "drizzle-orm";

import { getSessionUserId } from "./auth";

export async function getBoardAction(id: string) {
  const userId = await getSessionUserId();

  const db = createDbClient();
  const result = await db
    .select()
    .from(boards)
    .where(and(eq(boards.id, id), isNull(boards.deletedAt)));

  const board = result[0] ?? null;

  if (!board) {
    return null;
  }

  if (board.ownerId !== userId) {
    throw new Error("Forbidden");
  }

  return board;
}
