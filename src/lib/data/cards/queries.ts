import { eq, sql } from "drizzle-orm";
import { createDbClient } from "@/lib/db/client";
import { cards, type Card } from "@/lib/db/schema/cards";
import { cardLabels } from "@/lib/db/schema/card-labels";
import { labels, type Label } from "@/lib/db/schema/labels";
import { cardAssignees } from "@/lib/db/schema/card-assignees";
import { users } from "@/lib/db/schema/users";
import { checklists } from "@/lib/db/schema/checklists";
import { checklistItems } from "@/lib/db/schema/checklist-items";
import { comments } from "@/lib/db/schema/comments";
import { attachments } from "@/lib/db/schema/attachments";
import { cardAttachments } from "@/lib/db/schema/card-attachments";
import type { CardSummary } from "@/components/cards/card-item";

export async function getCardById(cardId: string): Promise<Card | null> {
  const db = createDbClient();
  const [card] = await db
    .select({ card: cards })
    .from(cards)
    .where(sql`${cards.id} = ${cardId}`);
  return card?.card ?? null;
}

export async function getCardLabelsByCardId(
  cardId: string,
): Promise<{ id: string; name: string; color: string }[]> {
  const db = createDbClient();
  return db
    .select({ id: labels.id, name: labels.name, color: labels.color })
    .from(cardLabels)
    .innerJoin(labels, eq(labels.id, cardLabels.labelId))
    .where(sql`${cardLabels.cardId} = ${cardId}`);
}

export async function getCardAssigneesByCardId(
  cardId: string,
): Promise<{ id: string; name: string; avatarUrl: string | null }[]> {
  const db = createDbClient();
  return db
    .select({ id: users.id, name: users.name, avatarUrl: users.avatarUrl })
    .from(cardAssignees)
    .innerJoin(users, eq(users.id, cardAssignees.userId))
    .where(sql`${cardAssignees.cardId} = ${cardId}`);
}

export async function getCardSummaryById(cardId: string): Promise<CardSummary | null> {
  const db = createDbClient();

  const [cardRows, labelRows, assigneeRows, checklistItemsRows, commentRows] = await Promise.all([
    db
      .select({ card: cards })
      .from(cards)
      .where(sql`${cards.id} = ${cardId}`),
    db
      .select({ id: labels.id, name: labels.name, color: labels.color })
      .from(cardLabels)
      .innerJoin(labels, eq(labels.id, cardLabels.labelId))
      .where(sql`${cardLabels.cardId} = ${cardId}`),
    db
      .select({ id: users.id, name: users.name, avatarUrl: users.avatarUrl })
      .from(cardAssignees)
      .innerJoin(users, eq(users.id, cardAssignees.userId))
      .where(sql`${cardAssignees.cardId} = ${cardId}`),
    db
      .select({ isCompleted: checklistItems.isCompleted })
      .from(checklists)
      .innerJoin(checklistItems, eq(checklistItems.checklistId, checklists.id))
      .where(eq(checklists.cardId, cardId)),
    db
      .select({ count: sql<number>`count(*)` })
      .from(comments)
      .where(eq(comments.cardId, cardId)),
  ]);

  const card = cardRows[0]?.card ?? null;
  if (!card) return null;

  const checklistProgress =
    checklistItemsRows.length > 0
      ? {
          total: checklistItemsRows.length,
          completed: checklistItemsRows.filter((r) => r.isCompleted).length,
        }
      : null;

  const commentCount = Number(commentRows[0]?.count ?? 0);

  return {
    ...card,
    labels: labelRows,
    assignees: assigneeRows,
    checklistProgress,
    commentCount,
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

export async function getCardAttachmentPreviewsByBoardId(
  boardId: string,
): Promise<Record<string, string>> {
  const db = createDbClient();
  const rows = await db
    .select({
      cardId: cardAttachments.cardId,
      url: attachments.url,
    })
    .from(cardAttachments)
    .innerJoin(attachments, eq(attachments.id, cardAttachments.attachmentId))
    .innerJoin(cards, eq(cards.id, cardAttachments.cardId))
    .where(sql`${cards.boardId} = ${boardId}`)
    .orderBy(sql`${cardAttachments.displayOrder} ASC`);

  const out: Record<string, string> = {};
  for (const r of rows) {
    if (!out[r.cardId]) out[r.cardId] = r.url;
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
  const userById = new Map<string, { name: string; avatarUrl: string | null }>();
  if (ids.length) {
    const { inArray } = await import("drizzle-orm");
    const userRows = await db
      .select({ id: users.id, name: users.name, avatarUrl: users.avatarUrl })
      .from(users)
      .where(inArray(users.id, ids));
    for (const u of userRows) userById.set(u.id, { name: u.name, avatarUrl: u.avatarUrl });
  }
  const out: Record<string, { id: string; name: string; avatarUrl: string | null }[]> = {};
  for (const r of rows) {
    if (!out[r.cardId]) out[r.cardId] = [];
    const u = userById.get(r.userId);
    out[r.cardId].push({
      id: r.userId,
      name: u?.name ?? "Unknown",
      avatarUrl: u?.avatarUrl ?? null,
    });
  }
  return out;
}
