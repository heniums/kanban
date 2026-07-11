import { sql, asc } from "drizzle-orm";
import { createDbClient } from "@/lib/db/client";
import { cards, type Card, type NewCard } from "@/lib/db/schema/cards";
import { cardLabels } from "@/lib/db/schema/card-labels";
import { cardAssignees } from "@/lib/db/schema/card-assignees";
import { lists } from "@/lib/db/schema/lists";
import { boards } from "@/lib/db/schema/boards";
import { deleteCloudinaryAsset } from "@/lib/cloudinary";
import { listAttachmentsByCardId } from "@/lib/data/attachments";
import type { CreateCardInput, UpdateCardInput } from "./schemas";

export async function createCard(data: CreateCardInput): Promise<Card> {
  const db = createDbClient();
  return db.transaction(async (tx) => {
    const [list] = await tx
      .select({ id: lists.id, boardId: lists.boardId })
      .from(lists)
      .innerJoin(boards, sql`${boards.id} = ${lists.boardId}`)
      .where(sql`${lists.id} = ${data.listId} AND ${boards.deletedAt} IS NULL`);
    if (!list) {
      throw new Error("List not found");
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

export async function updateCard(cardId: string, data: UpdateCardInput): Promise<Card | null> {
  const db = createDbClient();
  return db.transaction(async (tx) => {
    const patch: Partial<NewCard> = {};
    if (data.title !== undefined) patch.title = data.title;
    if (data.description !== undefined) patch.description = data.description;
    if (data.dueDate !== undefined) patch.dueDate = data.dueDate;
    if (data.listId !== undefined) patch.listId = data.listId;

    let updated: Card | undefined;
    if (Object.keys(patch).length > 0) {
      const rows = await tx
        .update(cards)
        .set(patch)
        .where(sql`${cards.id} = ${cardId}`)
        .returning();
      updated = rows[0];
      if (!updated) return null;
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

    if (!updated) {
      const [card] = await tx
        .select()
        .from(cards)
        .where(sql`${cards.id} = ${cardId}`);
      return card ?? null;
    }

    return updated;
  });
}

export async function deleteCard(cardId: string): Promise<Card | null> {
  const db = createDbClient();
  return db.transaction(async (tx) => {
    const attachments = await listAttachmentsByCardId(cardId);
    for (const att of attachments) {
      try {
        await deleteCloudinaryAsset(att.publicId);
      } catch {
        // Best-effort cleanup
      }
    }

    const [deleted] = await tx
      .delete(cards)
      .where(sql`${cards.id} = ${cardId}`)
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
): Promise<Card | null> {
  const db = createDbClient();
  return db.transaction(async (tx) => {
    const [existing] = await tx
      .select()
      .from(cards)
      .where(sql`${cards.id} = ${cardId}`);
    if (!existing) return null;

    const [targetList] = await tx
      .select({ id: lists.id })
      .from(lists)
      .innerJoin(boards, sql`${boards.id} = ${lists.boardId}`)
      .where(
        sql`${lists.id} = ${targetListId} AND ${boards.id} = ${existing.boardId} AND ${boards.deletedAt} IS NULL`,
      );
    if (!targetList) return null;

    const sourceListId = existing.listId;
    const clampedTarget = Math.max(0, targetPosition);

    if (sourceListId === targetListId) {
      const allCards = await tx
        .select({ id: cards.id })
        .from(cards)
        .where(sql`${cards.listId} = ${sourceListId}`)
        .orderBy(asc(cards.position));

      const [{ max }] = (
        await tx.execute(
          sql`SELECT COALESCE(MAX(position), -1) + 1 AS max FROM cards WHERE list_id = ${sourceListId}`,
        )
      ).rows as Array<{ max: number }>;
      const safeTarget = Math.min(clampedTarget, max - 1);
      if (safeTarget === existing.position) return existing;

      const ordered = allCards.map((c) => c.id).filter((id) => id !== cardId);
      ordered.splice(safeTarget, 0, cardId);

      const orderedIds = sql.join(
        ordered.map((id) => sql`${id}`),
        sql`, `,
      );
      const whenThenNeg = sql.join(
        ordered.map((id, i) => sql`WHEN ${id} THEN ${-(i + 1)}::int`),
        sql` `,
      );
      const whenThenFin = sql.join(
        ordered.map((id, i) => sql`WHEN ${id} THEN ${i}::int`),
        sql` `,
      );
      const whereClause = sql`id IN (${orderedIds}) AND list_id = ${sourceListId}`;

      await tx
        .update(cards)
        .set({ position: sql`CASE id ${whenThenNeg} END` })
        .where(whereClause);

      const result = await tx
        .update(cards)
        .set({ position: sql`CASE id ${whenThenFin} END` })
        .where(whereClause)
        .returning();

      const moved = result.find((r) => r.id === cardId);
      return moved ?? null;
    }

    const sourceCards = await tx
      .select({ id: cards.id })
      .from(cards)
      .where(sql`${cards.listId} = ${sourceListId}`)
      .orderBy(asc(cards.position));

    const targetCards = await tx
      .select({ id: cards.id })
      .from(cards)
      .where(sql`${cards.listId} = ${targetListId}`)
      .orderBy(asc(cards.position));

    const sourceOrdered = sourceCards.map((c) => c.id).filter((id) => id !== cardId);

    const [{ max }] = (
      await tx.execute(
        sql`SELECT COALESCE(MAX(position), -1) + 1 AS max FROM cards WHERE list_id = ${targetListId}`,
      )
    ).rows as Array<{ max: number }>;
    const safeTarget = Math.min(clampedTarget, max);

    const targetOrdered = targetCards.map((c) => c.id);
    targetOrdered.splice(safeTarget, 0, cardId);

    const targetExcl = targetOrdered.filter((id) => id !== cardId);

    await tx
      .update(cards)
      .set({ listId: targetListId, position: -999 })
      .where(sql`${cards.id} = ${cardId}`);

    if (sourceOrdered.length > 0) {
      const sourceIds = sql.join(
        sourceOrdered.map((id) => sql`${id}`),
        sql`, `,
      );
      const whenThenNeg = sql.join(
        sourceOrdered.map((id, i) => sql`WHEN ${id} THEN ${-(i + 1)}::int`),
        sql` `,
      );
      await tx
        .update(cards)
        .set({ position: sql`CASE id ${whenThenNeg} END` })
        .where(sql`id IN (${sourceIds}) AND list_id = ${sourceListId}`);
    }

    if (targetExcl.length > 0) {
      const targetExclIds = sql.join(
        targetExcl.map((id) => sql`${id}`),
        sql`, `,
      );
      const whenThenNeg = sql.join(
        targetExcl.map((id, i) => sql`WHEN ${id} THEN ${-(i + 1)}::int`),
        sql` `,
      );
      await tx
        .update(cards)
        .set({ position: sql`CASE id ${whenThenNeg} END` })
        .where(sql`id IN (${targetExclIds}) AND list_id = ${targetListId}`);
    }

    if (sourceOrdered.length > 0) {
      const sourceIds = sql.join(
        sourceOrdered.map((id) => sql`${id}`),
        sql`, `,
      );
      const whenThenFin = sql.join(
        sourceOrdered.map((id, i) => sql`WHEN ${id} THEN ${i}::int`),
        sql` `,
      );
      await tx
        .update(cards)
        .set({ position: sql`CASE id ${whenThenFin} END` })
        .where(sql`id IN (${sourceIds}) AND list_id = ${sourceListId}`);
    }

    const targetIdsAll = sql.join(
      targetOrdered.map((id) => sql`${id}`),
      sql`, `,
    );
    const whenThenFinAll = sql.join(
      targetOrdered.map((id, i) => sql`WHEN ${id} THEN ${i}::int`),
      sql` `,
    );
    const result = await tx
      .update(cards)
      .set({ position: sql`CASE id ${whenThenFinAll} END` })
      .where(sql`id IN (${targetIdsAll}) AND list_id = ${targetListId}`)
      .returning();

    const moved = result.find((r) => r.id === cardId);
    return moved ?? null;
  });
}

export async function reorderCards(listId: string, orderedCardIds: string[]): Promise<Card[]> {
  if (orderedCardIds.length === 0) return [];

  if (new Set(orderedCardIds).size !== orderedCardIds.length) {
    throw new Error("orderedCardIds must not contain duplicates");
  }

  const db = createDbClient();
  return db.transaction(async (tx) => {
    const ids = sql.join(
      orderedCardIds.map((id) => sql`${id}`),
      sql`, `,
    );
    const whenThenNeg = sql.join(
      orderedCardIds.map((id, i) => sql`WHEN ${id} THEN ${-(i + 1)}::int`),
      sql` `,
    );
    const whenThenFin = sql.join(
      orderedCardIds.map((id, i) => sql`WHEN ${id} THEN ${i}::int`),
      sql` `,
    );
    const whereClause = sql`id IN (${ids}) AND list_id = ${listId} AND board_id IN (SELECT id FROM boards WHERE deleted_at IS NULL)`;

    await tx
      .update(cards)
      .set({ position: sql`CASE id ${whenThenNeg} END` })
      .where(whereClause);

    const result = await tx
      .update(cards)
      .set({ position: sql`CASE id ${whenThenFin} END` })
      .where(whereClause)
      .returning();

    const rowsById = new Map<string, Card>(result.map((r) => [r.id, r] as const));
    return orderedCardIds.map((id) => rowsById.get(id)).filter((r): r is Card => r !== undefined);
  });
}

export async function copyCard(sourceCardId: string): Promise<Card | null> {
  const db = createDbClient();
  return db.transaction(async (tx) => {
    const [source] = await tx
      .select()
      .from(cards)
      .where(sql`${cards.id} = ${sourceCardId}`);
    if (!source) return null;

    const [maxRow] = await tx
      .select({ value: sql<number>`COALESCE(MAX(${cards.position}), -1)` })
      .from(cards)
      .where(sql`${cards.listId} = ${source.listId}`);
    const nextPosition = (maxRow?.value ?? -1) + 1;

    const [copy] = await tx
      .insert(cards)
      .values({
        listId: source.listId,
        boardId: source.boardId,
        title: `${source.title} (copy)`,
        description: source.description,
        dueDate: source.dueDate,
        position: nextPosition,
      })
      .returning();
    if (!copy) return null;

    const srcLabels = await tx
      .select({ labelId: cardLabels.labelId })
      .from(cardLabels)
      .where(sql`${cardLabels.cardId} = ${sourceCardId}`);
    for (const sl of srcLabels) {
      await tx.insert(cardLabels).values({ cardId: copy.id, labelId: sl.labelId });
    }

    const srcAssignees = await tx
      .select({ userId: cardAssignees.userId })
      .from(cardAssignees)
      .where(sql`${cardAssignees.cardId} = ${sourceCardId}`);
    for (const sa of srcAssignees) {
      await tx.insert(cardAssignees).values({ cardId: copy.id, userId: sa.userId });
    }

    return copy;
  });
}
