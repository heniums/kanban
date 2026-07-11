import { eq, sql } from "drizzle-orm";
import { createDbClient } from "@/lib/db/client";
import { checklists, type Checklist } from "@/lib/db/schema/checklists";
import {
  checklistItems,
  type ChecklistItem,
  type NewChecklistItem,
} from "@/lib/db/schema/checklist-items";
import { cards } from "@/lib/db/schema/cards";

export async function createChecklist(data: {
  cardId: string;
  title: string;
}): Promise<Checklist & { boardId: string }> {
  const db = createDbClient();
  return db.transaction(async (tx) => {
    const [maxRow] = await tx
      .select({ value: sql<number>`COALESCE(MAX(${checklists.position}), -1)` })
      .from(checklists)
      .where(sql`${checklists.cardId} = ${data.cardId}`);
    const nextPosition = (maxRow?.value ?? -1) + 1;
    const [cardRow] = await tx
      .select({ boardId: cards.boardId })
      .from(cards)
      .where(eq(cards.id, data.cardId));
    const [checklist] = await tx
      .insert(checklists)
      .values({ cardId: data.cardId, title: data.title, position: nextPosition })
      .returning();
    return { ...checklist, boardId: cardRow?.boardId ?? "" };
  });
}

export async function deleteChecklist(
  checklistId: string,
): Promise<(Checklist & { boardId: string }) | null> {
  const db = createDbClient();
  return db.transaction(async (tx) => {
    const [row] = await tx
      .select({
        id: checklists.id,
        cardId: checklists.cardId,
        position: checklists.position,
        boardId: cards.boardId,
      })
      .from(checklists)
      .innerJoin(cards, sql`${cards.id} = ${checklists.cardId}`)
      .where(sql`${checklists.id} = ${checklistId}`);
    if (!row) return null;
    await tx.delete(checklists).where(eq(checklists.id, checklistId));
    await tx.execute(
      sql`UPDATE checklists SET position = position - 1 WHERE card_id = ${row.cardId} AND position > ${row.position}`,
    );
    return {
      id: row.id,
      cardId: row.cardId,
      position: row.position,
      title: "",
      boardId: row.boardId,
    };
  });
}

export async function createChecklistItem(data: {
  checklistId: string;
  content: string;
}): Promise<ChecklistItem & { cardId: string; boardId: string }> {
  const db = createDbClient();
  return db.transaction(async (tx) => {
    const [maxRow] = await tx
      .select({ value: sql<number>`COALESCE(MAX(${checklistItems.position}), -1)` })
      .from(checklistItems)
      .where(sql`${checklistItems.checklistId} = ${data.checklistId}`);
    const nextPosition = (maxRow?.value ?? -1) + 1;
    const [cardRow] = await tx
      .select({ cardId: checklists.cardId, boardId: cards.boardId })
      .from(checklists)
      .innerJoin(cards, sql`${cards.id} = ${checklists.cardId}`)
      .where(eq(checklists.id, data.checklistId));
    const [item] = await tx
      .insert(checklistItems)
      .values({
        checklistId: data.checklistId,
        content: data.content,
        isCompleted: false,
        position: nextPosition,
      })
      .returning();
    return { ...item, cardId: cardRow?.cardId ?? "", boardId: cardRow?.boardId ?? "" };
  });
}

export async function updateChecklistItem(
  itemId: string,
  data: { content?: string; isCompleted?: boolean },
): Promise<(ChecklistItem & { cardId: string; boardId: string }) | null> {
  const db = createDbClient();
  const patch: Partial<NewChecklistItem> = {};
  if (data.content !== undefined) patch.content = data.content;
  if (data.isCompleted !== undefined) patch.isCompleted = data.isCompleted;
  if (Object.keys(patch).length === 0) return null;

  const [updated] = await db
    .update(checklistItems)
    .set(patch)
    .where(sql`${checklistItems.id} = ${itemId}`)
    .returning();
  if (!updated) return null;

  const [row] = await db
    .select({ cardId: checklists.cardId, boardId: cards.boardId })
    .from(checklists)
    .innerJoin(cards, sql`${cards.id} = ${checklists.cardId}`)
    .where(eq(checklists.id, updated.checklistId));

  return { ...updated, cardId: row?.cardId ?? "", boardId: row?.boardId ?? "" };
}

export async function deleteChecklistItem(
  itemId: string,
): Promise<(ChecklistItem & { cardId: string; boardId: string }) | null> {
  const db = createDbClient();
  return db.transaction(async (tx) => {
    const [item] = await tx
      .select({
        id: checklistItems.id,
        checklistId: checklistItems.checklistId,
        content: checklistItems.content,
        isCompleted: checklistItems.isCompleted,
        position: checklistItems.position,
        cardId: checklists.cardId,
        boardId: cards.boardId,
      })
      .from(checklistItems)
      .innerJoin(checklists, sql`${checklists.id} = ${checklistItems.checklistId}`)
      .innerJoin(cards, sql`${cards.id} = ${checklists.cardId}`)
      .where(sql`${checklistItems.id} = ${itemId}`);
    if (!item) return null;
    await tx.delete(checklistItems).where(eq(checklistItems.id, itemId));
    await tx.execute(
      sql`UPDATE checklist_items SET position = position - 1 WHERE checklist_id = ${item.checklistId} AND position > ${item.position}`,
    );
    return item;
  });
}
