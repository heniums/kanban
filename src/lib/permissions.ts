import { eq, and } from "drizzle-orm";
import { createDbClient } from "@/lib/db/client";
import { boardMembers, type BoardMemberRole } from "@/lib/db/schema/board-members";

export enum BoardPermission {
  VIEW = "view",
  EDIT_CONTENT = "edit_content",
  MANAGE_SETTINGS = "manage_settings",
  MANAGE_MEMBERS = "manage_members",
}

export const ROLE_PERMISSIONS: Record<BoardMemberRole, BoardPermission[]> = {
  owner: [
    BoardPermission.VIEW,
    BoardPermission.EDIT_CONTENT,
    BoardPermission.MANAGE_SETTINGS,
    BoardPermission.MANAGE_MEMBERS,
  ],
  member: [BoardPermission.VIEW, BoardPermission.EDIT_CONTENT],
};

export async function getUserRole(
  userId: string,
  boardId: string,
): Promise<BoardMemberRole | null> {
  const db = createDbClient();
  const [membership] = await db
    .select({ role: boardMembers.role })
    .from(boardMembers)
    .where(and(eq(boardMembers.userId, userId), eq(boardMembers.boardId, boardId)));

  return membership?.role ?? null;
}

export function hasPermissionForRole(role: BoardMemberRole, permission: BoardPermission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export async function hasPermission(
  userId: string,
  boardId: string,
  permission: BoardPermission,
): Promise<boolean> {
  const role = await getUserRole(userId, boardId);
  if (!role) {
    return false;
  }
  return hasPermissionForRole(role, permission);
}
