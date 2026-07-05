"use server";

import { verifySession } from "@/lib/dal";
import { hasPermission, BoardPermission } from "@/lib/permissions";
import { addMember } from "@/lib/data/members";
import { revalidatePath } from "next/cache";
import { addMemberSchema } from "@/lib/schemas/member";

export async function addMemberAction(input: unknown) {
  const { userId: currentUserId } = await verifySession();

  const parsed = addMemberSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Invalid input" };
  }

  const canManageMembers = await hasPermission(
    currentUserId,
    parsed.data.boardId,
    BoardPermission.MANAGE_MEMBERS,
  );
  if (!canManageMembers) {
    return { error: "You do not have permission to manage members" };
  }

  const result = await addMember(parsed.data.boardId, parsed.data.userId);

  if ("error" in result) {
    return { error: result.error };
  }

  revalidatePath(`/boards/${parsed.data.boardId}/settings`);
  revalidatePath("/boards");
  return { success: true };
}
