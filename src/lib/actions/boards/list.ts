"use server";

import { verifySession } from "@/lib/dal";
import { listBoardsByOwner } from "@/lib/data/boards";

export async function listBoardsAction() {
  const { userId } = await verifySession();

  const owned = await listBoardsByOwner(userId);
  const shared: typeof owned = [];

  return { owned, shared };
}
