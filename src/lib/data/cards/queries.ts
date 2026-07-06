import { eq, sql } from "drizzle-orm";
import { createDbClient } from "@/lib/db/client";
import { cards, type Card } from "@/lib/db/schema/cards";
import { cardLabels } from "@/lib/db/schema/card-labels";
import { labels, type Label } from "@/lib/db/schema/labels";
import { cardAssignees } from "@/lib/db/schema/card-assignees";
import { users } from "@/lib/db/schema/users";
import type { CardSummary } from "@/components/cards/card-item";

export async function getCardById(cardId: string): Promise<Card | null> {
  const db = createDbClient();
  const [card] = await db
    .select({ card: cards })
    .from(cards)
    .where(sql`${cards.id} = ${cardId}`);
  return card?.card ?? null;
}

export async function getCardSummaryById(cardId: string): Promise<CardSummary | null> {
  const db = createDbClient();
  const card = await getCardById(cardId);
  if (!card) return null;

  const [labelRows, assigneeRows] = await Promise.all([
    db
      .select({ id: labels.id, name: labels.name, color: labels.color })
      .from(cardLabels)
      .innerJoin(labels, eq(labels.id, cardLabels.labelId))
      .where(sql`${cardLabels.cardId} = ${cardId}`),
    db
      .select({ id: users.id, name: users.name })
      .from(cardAssignees)
      .innerJoin(users, eq(users.id, cardAssignees.userId))
      .where(sql`${cardAssignees.cardId} = ${cardId}`),
  ]);

  return {
    ...card,
    labels: labelRows,
    assignees: assigneeRows,
    checklistProgress: null,
    commentCount: 0,
  };
}

export async function getCardsByBoardId(boardId: string): Promise<Card[]> {
  const db = createDbClient();
  const rows = await db
    .select({ card: cards })
    .from(cards)
    .where(sql`${cards.boardId} = ${boardId}`)
    .orderBy(sql`${cards.listId} ASC, ${cards.position} ASC`);
  return rows.map((r) => r.card);
}

export async function getCardLabelsByBoardId(boardId: string): Promise<Record<string, Label[]>> {
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
    .where(sql`${cards.boardId} = ${boardId}`);
  const out: Record<string, Label[]> = {};
  for (const r of rows) {
    if (!out[r.cardId]) out[r.cardId] = [];
    out[r.cardId].push({ id: r.labelId, name: r.labelName, color: r.labelColor } as Label);
  }
  return out;
}

export async function getCardAssigneesByBoardId(
  boardId: string,
): Promise<Record<string, { id: string; name: string }[]>> {
  const db = createDbClient();
  const rows = await db
    .select({
      cardId: cardAssignees.cardId,
      userId: cardAssignees.userId,
    })
    .from(cardAssignees)
    .innerJoin(cards, eq(cards.id, cardAssignees.cardId))
    .where(sql`${cards.boardId} = ${boardId}`);
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
