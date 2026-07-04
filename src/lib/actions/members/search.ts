"use server";

import { verifySession } from "@/lib/dal";
import { hasPermission, BoardPermission } from "@/lib/permissions";
import { searchUsers } from "@/lib/data/members";

export async function searchUsersAction(boardId: string, query: string) {
  const { userId } = await verifySession();

  const canManageMembers = await hasPermission(userId, boardId, BoardPermission.MANAGE_MEMBERS);
  if (!canManageMembers) {
    return { error: "You do not have permission to manage members" };
  }

  if (query.length < 2) {
    return { error: "Search query must be at least 2 characters" };
  }

  const users = await searchUsers(boardId, query);
  return { users };
}
