"use server";

import { verifySession } from "@/lib/dal";
import { listBoardsByRole } from "@/lib/data/boards";

export async function listBoardsAction() {
  const { userId } = await verifySession();

  return await listBoardsByRole(userId);
}
