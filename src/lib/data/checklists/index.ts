import { eq, sql } from "drizzle-orm";
import { createDbClient } from "@/lib/db/client";
import { checklists, type Checklist } from "@/lib/db/schema/checklists";
import { checklistItems, type ChecklistItem } from "@/lib/db/schema/checklist-items";
import { cards } from "@/lib/db/schema/cards";
import { boards } from "@/lib/db/schema/boards";

type Tx = Parameters<Parameters<ReturnType<typeof createDbClient>["transaction"]>[0]>[0];

async function assertCardOwnedBy(tx: Tx, cardId: string, ownerId: string): Promise<void> {
  const [row] = await tx
    .select({ id: cards.id })
    .from(cards)
    .innerJoin(boards, sql`${boards.id} = ${cards.boardId}`)
    .where(
      sql`${cards.id} = ${cardId} AND ${boards.ownerId} = ${ownerId} AND ${boards.deletedAt} IS NULL`,
    );
  if (!row) throw new Error("Card not found or board not owned");
}

export async function createChecklist(
  data: { cardId: string; title: string },
  options: { ownerId: string },
): Promise<Checklist> {
  const db = createDbClient();
  return db.transaction(async (tx) => {
    await assertCardOwnedBy(tx, data.cardId, options.ownerId);
    const [maxRow] = await tx
      .select({ value: sql<number>`COALESCE(MAX(${checklists.position}), -1)` })
      .from(checklists)
      .where(sql`${checklists.cardId} = ${data.cardId}`);
    const nextPosition = (maxRow?.value ?? -1) + 1;
    const [checklist] = await tx
      .insert(checklists)
      .values({ cardId: data.cardId, title: data.title, position: nextPosition })
      .returning();
    return checklist;
  });
}

export async function updateChecklist(
  checklistId: string,
  data: { title: string },
  options: { ownerId: string },
): Promise<Checklist | null> {
  const db = createDbClient();
  return db.transaction(async (tx) => {
    const [row] = await tx
      .select({ id: checklists.id, cardId: checklists.cardId })
      .from(checklists)
      .innerJoin(cards, sql`${cards.id} = ${checklists.cardId}`)
      .innerJoin(boards, sql`${boards.id} = ${cards.boardId}`)
      .where(
        sql`${checklists.id} = ${checklistId} AND ${boards.ownerId} = ${options.ownerId} AND ${boards.deletedAt} IS NULL`,
      );
    if (!row) return null;
    const [updated] = await tx
      .update(checklists)
      .set({ title: data.title })
      .where(eq(checklists.id, checklistId))
      .returning();
    return updated ?? null;
  });
}

export async function deleteChecklist(
  checklistId: string,
  options: { ownerId: string },
): Promise<Checklist | null> {
  const db = createDbClient();
  return db.transaction(async (tx) => {
    const [row] = await tx
      .select({ id: checklists.id, cardId: checklists.cardId, position: checklists.position })
      .from(checklists)
      .innerJoin(cards, sql`${cards.id} = ${checklists.cardId}`)
      .innerJoin(boards, sql`${boards.id} = ${cards.boardId}`)
      .where(
        sql`${checklists.id} = ${checklistId} AND ${boards.ownerId} = ${options.ownerId} AND ${boards.deletedAt} IS NULL`,
      );
    if (!row) return null;
    await tx.delete(checklists).where(eq(checklists.id, checklistId));
    await tx.execute(
      sql`UPDATE checklists SET position = position - 1 WHERE card_id = ${row.cardId} AND position > ${row.position}`,
    );
    return { id: row.id, cardId: row.cardId, position: row.position, title: "" };
  });
}

export async function getChecklistsByCardId(
  cardId: string,
  options: { ownerId: string },
): Promise<Checklist[]> {
  const db = createDbClient();
  return db.transaction(async (tx) => {
    await assertCardOwnedBy(tx, cardId, options.ownerId);
    return tx
      .select()
      .from(checklists)
      .where(sql`${checklists.cardId} = ${cardId}`)
      .orderBy(sql`${checklists.position} ASC`);
  });
}

export async function createChecklistItem(
  data: { checklistId: string; content: string },
  options: { ownerId: string },
): Promise<ChecklistItem> {
  const db = createDbClient();
  return db.transaction(async (tx) => {
    const [parent] = await tx
      .select({ cardId: checklists.cardId })
      .from(checklists)
      .innerJoin(cards, sql`${cards.id} = ${checklists.cardId}`)
      .innerJoin(boards, sql`${boards.id} = ${cards.boardId}`)
      .where(
        sql`${checklists.id} = ${data.checklistId} AND ${boards.ownerId} = ${options.ownerId} AND ${boards.deletedAt} IS NULL`,
      );
    if (!parent) throw new Error("Checklist not found");
    const [maxRow] = await tx
      .select({ value: sql<number>`COALESCE(MAX(${checklistItems.position}), -1)` })
      .from(checklistItems)
      .where(sql`${checklistItems.checklistId} = ${data.checklistId}`);
    const nextPosition = (maxRow?.value ?? -1) + 1;
    const [item] = await tx
      .insert(checklistItems)
      .values({
        checklistId: data.checklistId,
        content: data.content,
        isCompleted: false,
        position: nextPosition,
      })
      .returning();
    return item;
  });
}

export async function updateChecklistItem(
  itemId: string,
  data: { content?: string; isCompleted?: boolean },
  options: { ownerId: string },
): Promise<ChecklistItem | null> {
  const db = createDbClient();
  const patch: Record<string, unknown> = {};
  if (data.content !== undefined) patch.content = data.content;
  if (data.isCompleted !== undefined) patch.isCompleted = data.isCompleted;
  if (Object.keys(patch).length === 0) return null;

  const [updated] = await db
    .update(checklistItems)
    .set(patch)
    .where(
      sql`${checklistItems.id} = ${itemId} AND ${checklistItems.checklistId} IN (SELECT id FROM ${checklists} WHERE ${checklists.cardId} IN (SELECT id FROM ${cards} WHERE ${cards.boardId} IN (SELECT id FROM ${boards} WHERE ${boards.ownerId} = ${options.ownerId} AND ${boards.deletedAt} IS NULL)))`,
    )
    .returning();
  return updated ?? null;
}

export async function deleteChecklistItem(
  itemId: string,
  options: { ownerId: string },
): Promise<ChecklistItem | null> {
  const db = createDbClient();
  return db.transaction(async (tx) => {
    const [item] = await tx
      .select()
      .from(checklistItems)
      .where(
        sql`${checklistItems.id} = ${itemId} AND ${checklistItems.checklistId} IN (SELECT id FROM ${checklists} WHERE ${checklists.cardId} IN (SELECT id FROM ${cards} WHERE ${cards.boardId} IN (SELECT id FROM ${boards} WHERE ${boards.ownerId} = ${options.ownerId} AND ${boards.deletedAt} IS NULL)))`,
      );
    if (!item) return null;
    await tx.delete(checklistItems).where(eq(checklistItems.id, itemId));
    await tx.execute(
      sql`UPDATE checklist_items SET position = position - 1 WHERE checklist_id = ${item.checklistId} AND position > ${item.position}`,
    );
    return item;
  });
}
