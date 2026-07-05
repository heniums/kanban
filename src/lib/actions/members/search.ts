"use server";

import { verifySession } from "@/lib/dal";
import { hasPermission, BoardPermission } from "@/lib/permissions";
import { searchUsers } from "@/lib/data/members";
import { searchUsersSchema } from "@/lib/schemas/member";

export async function searchUsersAction(input: unknown) {
  const { userId } = await verifySession();

  const parsed = searchUsersSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Invalid input" };
  }

  const canManageMembers = await hasPermission(
    userId,
    parsed.data.boardId,
    BoardPermission.MANAGE_MEMBERS,
  );
  if (!canManageMembers) {
    return { error: "You do not have permission to manage members" };
  }

  const users = await searchUsers(parsed.data.boardId, parsed.data.query);
  return { users };
}
