"use server";

import { verifySession } from "@/lib/dal";
import { hasPermission, BoardPermission } from "@/lib/permissions";
import { removeMember } from "@/lib/data/members";
import { revalidatePath } from "next/cache";

export async function removeMemberAction(boardId: string, userId: string) {
  const { userId: currentUserId } = await verifySession();

  const canManageMembers = await hasPermission(
    currentUserId,
    boardId,
    BoardPermission.MANAGE_MEMBERS,
  );
  if (!canManageMembers) {
    return { error: "You do not have permission to manage members" };
  }

  const result = await removeMember(boardId, userId);

  if ("error" in result) {
    return { error: result.error };
  }

  revalidatePath(`/boards/${boardId}/settings`);
  return { success: true };
}
