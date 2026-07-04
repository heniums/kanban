"use server";

import { verifySession } from "@/lib/dal";
import { hasPermission, BoardPermission } from "@/lib/permissions";
import { getBoardMembers } from "@/lib/data/members";

export async function getBoardMembersAction(boardId: string) {
  const { userId } = await verifySession();

  const canView = await hasPermission(userId, boardId, BoardPermission.VIEW);
  if (!canView) {
    return { error: "You do not have permission to view members" };
  }

  const members = await getBoardMembers(boardId);
  return { members };
}
