"use server";

import { verifySession } from "@/lib/dal";
import { getBoardById } from "@/lib/data/boards";

export async function getBoardAction(id: string) {
  const { userId } = await verifySession();

  const board = await getBoardById(id, { ownerId: userId });

  return board ?? null;
}
