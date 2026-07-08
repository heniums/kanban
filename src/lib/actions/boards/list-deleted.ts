"use server";

import { verifySession } from "@/lib/dal";
import { listDeletedBoardsByOwner } from "@/lib/data/boards";
import type { ListDeletedBoardsResult } from "@/lib/data/boards";

export async function listDeletedBoardsAction(params?: {
  page?: number;
  search?: string;
}): Promise<ListDeletedBoardsResult> {
  const { userId } = await verifySession();
  return listDeletedBoardsByOwner({ userId, ...params });
}
