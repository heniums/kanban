"use server";

import { getSessionUserId } from "./auth";
import { listBoardsByOwner } from "@/lib/data/boards";

export async function listBoardsAction() {
  const userId = await getSessionUserId();

  const owned = await listBoardsByOwner(userId);
  const shared: typeof owned = [];

  return { owned, shared };
}
