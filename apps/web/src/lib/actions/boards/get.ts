"use server";

import { getSessionUserId } from "./auth";
import { getBoardById } from "@/lib/data/boards";

export async function getBoardAction(id: string) {
  const userId = await getSessionUserId();

  const board = await getBoardById(id, { ownerId: userId });

  return board ?? null;
}
