"use server";

import { revalidatePath } from "next/cache";
import { verifySession } from "@/lib/dal";
import {
  createChecklist,
  deleteChecklist,
  createChecklistItem,
  updateChecklistItem,
  deleteChecklistItem,
} from "@/lib/data/checklists";
import { createDbClient } from "@/lib/db/client";
import { cards } from "@/lib/db/schema/cards";
import {
  createChecklistSchema,
  deleteChecklistSchema,
  createChecklistItemSchema,
  updateChecklistItemSchema,
  deleteChecklistItemSchema,
} from "@/lib/schemas/checklist";
import { emitToBoard, REALTIME_EVENTS } from "@/lib/realtime/events";
import { sql } from "drizzle-orm";

type Result<T> = { data: T } | { errors: Array<{ field: string; message: string }> };

function formatZodErrors(error: import("zod").ZodError) {
  return error.errors.map((e) => ({ field: e.path.join("."), message: e.message }));
}

async function revalidateForCard(cardId: string) {
  const db = createDbClient();
  const [row] = await db
    .select({ boardId: cards.boardId })
    .from(cards)
    .where(sql`${cards.id} = ${cardId}`);
  if (row) revalidatePath(`/boards/${row.boardId}`);
  return row?.boardId ?? null;
}

export async function createChecklistAction(
  input: unknown,
): Promise<Result<{ id: string; cardId: string }>> {
  const { userId } = await verifySession();
  const parsed = createChecklistSchema.safeParse(input);
  if (!parsed.success) return { errors: formatZodErrors(parsed.error) };
  try {
    const cl = await createChecklist(parsed.data, { ownerId: userId });
    const boardId = await revalidateForCard(cl.cardId);
    if (boardId)
      emitToBoard(boardId, REALTIME_EVENTS.CHECKLIST_UPDATED, { cardId: cl.cardId, boardId });
    return { data: { id: cl.id, cardId: cl.cardId } };
  } catch (err) {
    return { errors: [{ field: "", message: err instanceof Error ? err.message : "Failed" }] };
  }
}

export async function deleteChecklistAction(input: unknown): Promise<Result<{ cardId: string }>> {
  const { userId } = await verifySession();
  const parsed = deleteChecklistSchema.safeParse(input);
  if (!parsed.success) return { errors: formatZodErrors(parsed.error) };
  try {
    const cl = await deleteChecklist(parsed.data.checklistId, { ownerId: userId });
    if (!cl) return { errors: [{ field: "", message: "Checklist not found" }] };
    const boardId = await revalidateForCard(cl.cardId);
    if (boardId)
      emitToBoard(boardId, REALTIME_EVENTS.CHECKLIST_UPDATED, { cardId: cl.cardId, boardId });
    return { data: { cardId: cl.cardId } };
  } catch (err) {
    return { errors: [{ field: "", message: err instanceof Error ? err.message : "Failed" }] };
  }
}

export async function createChecklistItemAction(
  input: unknown,
): Promise<Result<{ id: string; checklistId: string }>> {
  const { userId } = await verifySession();
  const parsed = createChecklistItemSchema.safeParse(input);
  if (!parsed.success) return { errors: formatZodErrors(parsed.error) };
  try {
    const item = await createChecklistItem(parsed.data, { ownerId: userId });
    const db = createDbClient();
    const [row] = await db
      .select({ boardId: cards.boardId })
      .from(cards)
      .where(sql`${cards.id} = (SELECT card_id FROM checklists WHERE id = ${item.checklistId})`);
    if (row) {
      emitToBoard(row.boardId, REALTIME_EVENTS.CHECKLIST_UPDATED, {
        cardId: row.boardId,
        boardId: row.boardId,
      });
    }
    return { data: { id: item.id, checklistId: item.checklistId } };
  } catch (err) {
    return { errors: [{ field: "", message: err instanceof Error ? err.message : "Failed" }] };
  }
}

export async function updateChecklistItemAction(input: unknown): Promise<Result<{ id: string }>> {
  const { userId } = await verifySession();
  const parsed = updateChecklistItemSchema.safeParse(input);
  if (!parsed.success) return { errors: formatZodErrors(parsed.error) };
  const { itemId, ...patch } = parsed.data;
  try {
    const item = await updateChecklistItem(itemId, patch, { ownerId: userId });
    if (!item) return { errors: [{ field: "", message: "Item not found" }] };
    const db = createDbClient();
    const [row] = await db
      .select({ boardId: cards.boardId })
      .from(cards)
      .where(sql`${cards.id} = (SELECT card_id FROM checklists WHERE id = ${item.checklistId})`);
    if (row) {
      emitToBoard(row.boardId, REALTIME_EVENTS.CHECKLIST_UPDATED, {
        cardId: row.boardId,
        boardId: row.boardId,
      });
    }
    return { data: { id: item.id } };
  } catch (err) {
    return { errors: [{ field: "", message: err instanceof Error ? err.message : "Failed" }] };
  }
}

export async function deleteChecklistItemAction(input: unknown): Promise<Result<{ id: string }>> {
  const { userId } = await verifySession();
  const parsed = deleteChecklistItemSchema.safeParse(input);
  if (!parsed.success) return { errors: formatZodErrors(parsed.error) };
  try {
    const item = await deleteChecklistItem(parsed.data.itemId, { ownerId: userId });
    if (!item) return { errors: [{ field: "", message: "Item not found" }] };
    const db = createDbClient();
    const [row] = await db
      .select({ boardId: cards.boardId })
      .from(cards)
      .where(sql`${cards.id} = (SELECT card_id FROM checklists WHERE id = ${item.checklistId})`);
    if (row) {
      emitToBoard(row.boardId, REALTIME_EVENTS.CHECKLIST_UPDATED, {
        cardId: row.boardId,
        boardId: row.boardId,
      });
    }
    return { data: { id: item.id } };
  } catch (err) {
    return { errors: [{ field: "", message: err instanceof Error ? err.message : "Failed" }] };
  }
}
