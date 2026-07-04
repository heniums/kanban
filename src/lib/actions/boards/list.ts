"use server";

import { verifySession } from "@/lib/dal";
import { listBoardsByMember } from "@/lib/data/boards";

export async function listBoardsAction() {
  const { userId } = await verifySession();

  const memberBoards = await listBoardsByMember(userId);

  return { owned: memberBoards, shared: [] };
}
