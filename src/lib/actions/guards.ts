import { sql } from "drizzle-orm";
import { createDbClient } from "@/lib/db/client";
import { boards } from "@/lib/db/schema/boards";
import { boardMembers } from "@/lib/db/schema/board-members";
import { cards } from "@/lib/db/schema/cards";
import { checklists } from "@/lib/db/schema/checklists";
import { hasPermissionForRole, BoardPermission } from "@/lib/permissions";

export async function assertBoardPermission(
  boardId: string,
  userId: string,
  permission: BoardPermission,
): Promise<boolean> {
  const db = createDbClient();
  const [membership] = await db
    .select({ role: boardMembers.role })
    .from(boardMembers)
    .innerJoin(boards, sql`${boards.id} = ${boardMembers.boardId}`)
    .where(
      sql`${boardMembers.boardId} = ${boardId} AND ${boardMembers.userId} = ${userId} AND ${boards.deletedAt} IS NULL`,
    );
  if (!membership) return false;
  return hasPermissionForRole(membership.role, permission);
}

export async function assertCardPermission(
  cardId: string,
  userId: string,
  permission: BoardPermission,
): Promise<boolean> {
  const db = createDbClient();
  const [row] = await db
    .select({ boardId: cards.boardId })
    .from(cards)
    .where(sql`${cards.id} = ${cardId}`);
  if (!row) return false;
  return assertBoardPermission(row.boardId, userId, permission);
}

export async function assertChecklistPermission(
  checklistId: string,
  userId: string,
  permission: BoardPermission,
): Promise<boolean> {
  const db = createDbClient();
  const [row] = await db
    .select({ boardId: cards.boardId })
    .from(checklists)
    .innerJoin(cards, sql`${cards.id} = ${checklists.cardId}`)
    .where(sql`${checklists.id} = ${checklistId}`);
  if (!row) return false;
  return assertBoardPermission(row.boardId, userId, permission);
}
