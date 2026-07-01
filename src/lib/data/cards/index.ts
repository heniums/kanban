import { sql } from "drizzle-orm";
import { createDbClient } from "@/lib/db/client";
import { cards, type Card } from "@/lib/db/schema/cards";
import { cardLabels } from "@/lib/db/schema/card-labels";
import { cardAssignees } from "@/lib/db/schema/card-assignees";
import { lists } from "@/lib/db/schema/lists";
import { boards } from "@/lib/db/schema/boards";

export interface CreateCardInput {
  listId: string;
  title: string;
  description?: string | null;
  dueDate?: Date | null;
  labelIds?: string[];
  assigneeIds?: string[];
}

export async function createCard(
  data: CreateCardInput,
  options: { ownerId: string },
): Promise<Card> {
  const db = createDbClient();
  return db.transaction(async (tx) => {
    const [list] = await tx
      .select({ id: lists.id, boardId: lists.boardId })
      .from(lists)
      .innerJoin(boards, sql`${boards.id} = ${lists.boardId}`)
      .where(
        sql`${lists.id} = ${data.listId} AND ${boards.ownerId} = ${options.ownerId} AND ${boards.deletedAt} IS NULL`,
      );
    if (!list) {
      throw new Error("List not found or board not owned");
    }

    const [maxRow] = await tx
      .select({ value: sql<number>`COALESCE(MAX(${cards.position}), -1)` })
      .from(cards)
      .where(sql`${cards.listId} = ${data.listId}`);
    const nextPosition = (maxRow?.value ?? -1) + 1;

    const [card] = await tx
      .insert(cards)
      .values({
        listId: data.listId,
        boardId: list.boardId,
        title: data.title,
        description: data.description ?? null,
        dueDate: data.dueDate ?? null,
        position: nextPosition,
      })
      .returning();

    if (data.labelIds?.length) {
      for (const labelId of data.labelIds) {
        await tx.insert(cardLabels).values({ cardId: card.id, labelId });
      }
    }
    if (data.assigneeIds?.length) {
      for (const userId of data.assigneeIds) {
        await tx.insert(cardAssignees).values({ cardId: card.id, userId });
      }
    }

    return card;
  });
}

export interface UpdateCardInput {
  title?: string;
  description?: string | null;
  dueDate?: Date | null;
  listId?: string;
  labelIds?: string[];
  assigneeIds?: string[];
}

export async function updateCard(
  cardId: string,
  data: UpdateCardInput,
  options: { ownerId: string },
): Promise<Card | null> {
  const db = createDbClient();
  return db.transaction(async (tx) => {
    const patch: Record<string, unknown> = {};
    if (data.title !== undefined) patch.title = data.title;
    if (data.description !== undefined) patch.description = data.description;
    if (data.dueDate !== undefined) patch.dueDate = data.dueDate;
    if (data.listId !== undefined) patch.listId = data.listId;

    let updated: Card | undefined;
    if (Object.keys(patch).length > 0) {
      const rows = await tx
        .update(cards)
        .set(patch)
        .where(
          sql`${cards.id} = ${cardId} AND ${cards.boardId} IN (SELECT id FROM ${boards} WHERE ${boards.ownerId} = ${options.ownerId} AND ${boards.deletedAt} IS NULL)`,
        )
        .returning();
      updated = rows[0];
      if (!updated) return null;
    } else {
      const [existing] = await tx
        .select()
        .from(cards)
        .where(
          sql`${cards.id} = ${cardId} AND ${cards.boardId} IN (SELECT id FROM ${boards} WHERE ${boards.ownerId} = ${options.ownerId} AND ${boards.deletedAt} IS NULL)`,
        );
      if (!existing) return null;
      updated = existing;
    }

    if (data.labelIds !== undefined) {
      await tx.delete(cardLabels).where(sql`${cardLabels.cardId} = ${cardId}`);
      for (const labelId of data.labelIds) {
        await tx.insert(cardLabels).values({ cardId, labelId });
      }
    }
    if (data.assigneeIds !== undefined) {
      await tx.delete(cardAssignees).where(sql`${cardAssignees.cardId} = ${cardId}`);
      for (const userId of data.assigneeIds) {
        await tx.insert(cardAssignees).values({ cardId, userId });
      }
    }

    return updated;
  });
}

export async function deleteCard(
  cardId: string,
  options: { ownerId: string },
): Promise<Card | null> {
  const db = createDbClient();
  return db.transaction(async (tx) => {
    const [deleted] = await tx
      .delete(cards)
      .where(
        sql`${cards.id} = ${cardId} AND ${cards.boardId} IN (SELECT id FROM ${boards} WHERE ${boards.ownerId} = ${options.ownerId} AND ${boards.deletedAt} IS NULL)`,
      )
      .returning();
    if (!deleted) return null;
    await tx.execute(
      sql`UPDATE cards SET position = position - 1 WHERE list_id = ${deleted.listId} AND position > ${deleted.position}`,
    );
    return deleted;
  });
}

export async function moveCard(
  cardId: string,
  targetListId: string,
  targetPosition: number,
  options: { ownerId: string },
): Promise<Card | null> {
  const db = createDbClient();
  return db.transaction(async (tx) => {
    const [existing] = await tx
      .select()
      .from(cards)
      .where(
        sql`${cards.id} = ${cardId} AND ${cards.boardId} IN (SELECT id FROM ${boards} WHERE ${boards.ownerId} = ${options.ownerId} AND ${boards.deletedAt} IS NULL)`,
      );
    if (!existing) return null;

    const [targetList] = await tx
      .select({ id: lists.id })
      .from(lists)
      .innerJoin(boards, sql`${boards.id} = ${lists.boardId}`)
      .where(
        sql`${lists.id} = ${targetListId} AND ${boards.id} = ${existing.boardId} AND ${boards.ownerId} = ${options.ownerId} AND ${boards.deletedAt} IS NULL`,
      );
    if (!targetList) return null;

    const sourceListId = existing.listId;
    const clampedTarget = Math.max(0, targetPosition);

    if (sourceListId === targetListId) {
      const [{ max }] = (
        await tx.execute(
          sql`SELECT COALESCE(MAX(position), -1) + 1 AS max FROM cards WHERE list_id = ${sourceListId}`,
        )
      ).rows as Array<{ max: number }>;
      const safeTarget = Math.min(clampedTarget, max - 1);
      if (safeTarget === existing.position) return existing;

      if (safeTarget < existing.position) {
        await tx.execute(
          sql`UPDATE cards SET position = position + 1 WHERE list_id = ${sourceListId} AND position >= ${safeTarget} AND position < ${existing.position}`,
        );
      } else {
        await tx.execute(
          sql`UPDATE cards SET position = position - 1 WHERE list_id = ${sourceListId} AND position <= ${safeTarget} AND position > ${existing.position}`,
        );
      }
      const [moved] = await tx
        .update(cards)
        .set({ position: safeTarget })
        .where(sql`${cards.id} = ${cardId}`)
        .returning();
      return moved ?? null;
    }

    // Cross-list move
    await tx.execute(
      sql`UPDATE cards SET position = position - 1 WHERE list_id = ${sourceListId} AND position > ${existing.position}`,
    );

    const [{ max }] = (
      await tx.execute(
        sql`SELECT COALESCE(MAX(position), -1) + 1 AS max FROM cards WHERE list_id = ${targetListId}`,
      )
    ).rows as Array<{ max: number }>;
    const safeTarget = Math.min(clampedTarget, max);

    await tx.execute(
      sql`UPDATE cards SET position = position + 1 WHERE list_id = ${targetListId} AND position >= ${safeTarget}`,
    );
    const [moved] = await tx
      .update(cards)
      .set({ listId: targetListId, position: safeTarget })
      .where(sql`${cards.id} = ${cardId}`)
      .returning();
    return moved ?? null;
  });
}

export async function reorderCards(
  listId: string,
  orderedCardIds: string[],
  options: { ownerId: string },
): Promise<Card[]> {
  if (orderedCardIds.length === 0) return [];

  if (new Set(orderedCardIds).size !== orderedCardIds.length) {
    throw new Error("orderedCardIds must not contain duplicates");
  }

  const db = createDbClient();
  return db.transaction(async (tx) => {
    const updated: Card[] = [];
    for (let i = 0; i < orderedCardIds.length; i++) {
      await tx
        .update(cards)
        .set({ position: -(i + 1) })
        .where(
          sql`${cards.id} = ${orderedCardIds[i]} AND ${cards.listId} = ${listId} AND ${cards.boardId} IN (SELECT id FROM ${boards} WHERE ${boards.ownerId} = ${options.ownerId} AND ${boards.deletedAt} IS NULL)`,
        );
    }
    for (let i = 0; i < orderedCardIds.length; i++) {
      const [row] = await tx
        .update(cards)
        .set({ position: i })
        .where(
          sql`${cards.id} = ${orderedCardIds[i]} AND ${cards.listId} = ${listId} AND ${cards.boardId} IN (SELECT id FROM ${boards} WHERE ${boards.ownerId} = ${options.ownerId} AND ${boards.deletedAt} IS NULL)`,
        )
        .returning();
      if (row) updated.push(row);
    }
    return updated;
  });
}

export async function getCardsByListId(
  listId: string,
  options: { ownerId: string },
): Promise<Card[]> {
  const db = createDbClient();
  const rows = await db
    .select({ card: cards })
    .from(cards)
    .innerJoin(boards, sql`${boards.id} = ${cards.boardId}`)
    .where(
      sql`${cards.listId} = ${listId} AND ${boards.ownerId} = ${options.ownerId} AND ${boards.deletedAt} IS NULL`,
    )
    .orderBy(sql`${cards.position} ASC`);
  return rows.map((r) => r.card);
}

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
