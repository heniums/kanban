import { hasPermission, BoardPermission } from "@/lib/permissions";

export interface BoardCapabilities {
  settings: boolean;
  delete: boolean;
}

export async function getBoardCapabilities(
  userId: string,
  boardId: string,
): Promise<BoardCapabilities> {
  const canManageSettings = await hasPermission(userId, boardId, BoardPermission.MANAGE_SETTINGS);
  return { settings: canManageSettings, delete: canManageSettings };
}
