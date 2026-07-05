"use server";

import { verifySession } from "@/lib/dal";
import { hasPermission, BoardPermission } from "@/lib/permissions";
import { getBoardMembers } from "@/lib/data/members";
import { getBoardMembersSchema } from "@/lib/schemas/member";

export async function getBoardMembersAction(input: unknown) {
  const { userId } = await verifySession();

  const parsed = getBoardMembersSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Invalid input" };
  }

  const canView = await hasPermission(userId, parsed.data.boardId, BoardPermission.VIEW);
  if (!canView) {
    return { error: "You do not have permission to view members" };
  }

  const members = await getBoardMembers(parsed.data.boardId);
  return { members };
}
