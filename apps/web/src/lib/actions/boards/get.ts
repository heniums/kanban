"use server";

import { getSessionUserId } from "./auth";
import { getBoardById } from "@/lib/data/boards";

export async function getBoardAction(id: string) {
  const userId = await getSessionUserId();

  const board = await getBoardById(id);

  if (!board) {
    return null;
  }

  if (board.ownerId !== userId) {
    throw new Error("Forbidden");
  }

  return board;
}
