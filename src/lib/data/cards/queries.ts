import { eq, sql } from "drizzle-orm";
import { createDbClient } from "@/lib/db/client";
import { cards, type Card } from "@/lib/db/schema/cards";
import { cardLabels } from "@/lib/db/schema/card-labels";
import { labels, type Label } from "@/lib/db/schema/labels";
import { cardAssignees } from "@/lib/db/schema/card-assignees";
import { users } from "@/lib/db/schema/users";
import { boards } from "@/lib/db/schema/boards";

export async function getCardById(
  cardId: string,
  options: { ownerId: string },
): Promise<Card | null> {
  const db = createDbClient();
  const [card] = await db
    .select({ card: cards })
    .from(cards)
    .innerJoin(boards, sql`${boards.id} = ${cards.boardId}`)
    .where(
      sql`${cards.id} = ${cardId} AND ${boards.ownerId} = ${options.ownerId} AND ${boards.deletedAt} IS NULL`,
    );
  return card?.card ?? null;
}

export async function getCardsByBoardId(
  boardId: string,
  options: { ownerId: string },
): Promise<Card[]> {
  const db = createDbClient();
  const rows = await db
    .select({ card: cards })
    .from(cards)
    .innerJoin(boards, sql`${boards.id} = ${cards.boardId}`)
    .where(
      sql`${cards.boardId} = ${boardId} AND ${boards.ownerId} = ${options.ownerId} AND ${boards.deletedAt} IS NULL`,
    )
    .orderBy(sql`${cards.listId} ASC, ${cards.position} ASC`);
  return rows.map((r) => r.card);
}

export async function getCardLabelsByBoardId(
  boardId: string,
  options: { ownerId: string },
): Promise<Record<string, Label[]>> {
  const db = createDbClient();
  const rows = await db
    .select({
      cardId: cardLabels.cardId,
      labelId: labels.id,
      labelName: labels.name,
      labelColor: labels.color,
    })
    .from(cardLabels)
    .innerJoin(cards, eq(cards.id, cardLabels.cardId))
    .innerJoin(labels, eq(labels.id, cardLabels.labelId))
    .innerJoin(boards, sql`${boards.id} = ${cards.boardId}`)
    .where(
      sql`${cards.boardId} = ${boardId} AND ${boards.ownerId} = ${options.ownerId} AND ${boards.deletedAt} IS NULL`,
    );
  const out: Record<string, Label[]> = {};
  for (const r of rows) {
    if (!out[r.cardId]) out[r.cardId] = [];
    out[r.cardId].push({ id: r.labelId, name: r.labelName, color: r.labelColor } as Label);
  }
  return out;
}

export async function getCardAssigneesByBoardId(
  boardId: string,
  options: { ownerId: string },
): Promise<Record<string, { id: string; name: string }[]>> {
  const db = createDbClient();
  const rows = await db
    .select({
      cardId: cardAssignees.cardId,
      userId: cardAssignees.userId,
    })
    .from(cardAssignees)
    .innerJoin(cards, eq(cards.id, cardAssignees.cardId))
    .innerJoin(boards, sql`${boards.id} = ${cards.boardId}`)
    .where(
      sql`${cards.boardId} = ${boardId} AND ${boards.ownerId} = ${options.ownerId} AND ${boards.deletedAt} IS NULL`,
    );
  const ids = [...new Set(rows.map((r) => r.userId))];
  const nameById = new Map<string, string>();
  if (ids.length) {
    const { inArray } = await import("drizzle-orm");
    const userRows = await db
      .select({ id: users.id, name: users.name })
      .from(users)
      .where(inArray(users.id, ids));
    for (const u of userRows) nameById.set(u.id, u.name);
  }
  const out: Record<string, { id: string; name: string }[]> = {};
  for (const r of rows) {
    if (!out[r.cardId]) out[r.cardId] = [];
    out[r.cardId].push({ id: r.userId, name: nameById.get(r.userId) ?? "Unknown" });
  }
  return out;
}
