import { sql } from "drizzle-orm";
import { createDbClient } from "@/lib/db/client";
import { boards } from "@/lib/db/schema/boards";
import { cards } from "@/lib/db/schema/cards";
import { checklists } from "@/lib/db/schema/checklists";

export async function assertBoardOwnedBy(boardId: string, userId: string): Promise<boolean> {
  const db = createDbClient();
  const [row] = await db
    .select({ id: boards.id })
    .from(boards)
    .where(
      sql`${boards.id} = ${boardId} AND ${boards.ownerId} = ${userId} AND ${boards.deletedAt} IS NULL`,
    );
  return !!row;
}

export async function assertCardOwnedBy(cardId: string, userId: string): Promise<boolean> {
  const db = createDbClient();
  const [row] = await db
    .select({ id: cards.id })
    .from(cards)
    .innerJoin(boards, sql`${boards.id} = ${cards.boardId}`)
    .where(
      sql`${cards.id} = ${cardId} AND ${boards.ownerId} = ${userId} AND ${boards.deletedAt} IS NULL`,
    );
  return !!row;
}

export async function assertChecklistOwnedBy(
  checklistId: string,
  userId: string,
): Promise<boolean> {
  const db = createDbClient();
  const [row] = await db
    .select({ id: checklists.id })
    .from(checklists)
    .innerJoin(cards, sql`${cards.id} = ${checklists.cardId}`)
    .innerJoin(boards, sql`${boards.id} = ${cards.boardId}`)
    .where(
      sql`${checklists.id} = ${checklistId} AND ${boards.ownerId} = ${userId} AND ${boards.deletedAt} IS NULL`,
    );
  return !!row;
}
