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
import {
  createChecklistSchema,
  deleteChecklistSchema,
  createChecklistItemSchema,
  updateChecklistItemSchema,
  deleteChecklistItemSchema,
} from "@/lib/schemas/checklist";
import { emitToBoard, REALTIME_EVENTS } from "@/lib/realtime/events";
import {
  assertCardPermission,
  assertChecklistPermission,
  assertChecklistItemPermission,
} from "@/lib/actions/guards";
import { BoardPermission } from "@/lib/permissions";

type Result<T> = { data: T } | { errors: Array<{ field: string; message: string }> };

function formatZodErrors(error: import("zod").ZodError) {
  return error.errors.map((e) => ({ field: e.path.join("."), message: e.message }));
}

export async function createChecklistAction(
  input: unknown,
): Promise<Result<{ id: string; cardId: string }>> {
  const { userId } = await verifySession();
  const parsed = createChecklistSchema.safeParse(input);
  if (!parsed.success) return { errors: formatZodErrors(parsed.error) };

  const hasAccess = await assertCardPermission(
    parsed.data.cardId,
    userId,
    BoardPermission.EDIT_CONTENT,
  );
  if (!hasAccess) {
    return { errors: [{ field: "", message: "Card not found or insufficient permissions" }] };
  }

  try {
    const cl = await createChecklist(parsed.data);
    revalidatePath(`/boards/${cl.boardId}`);
    emitToBoard(cl.boardId, REALTIME_EVENTS.CHECKLIST_UPDATED, {
      cardId: cl.cardId,
      boardId: cl.boardId,
    });
    return { data: { id: cl.id, cardId: cl.cardId } };
  } catch (err) {
    return { errors: [{ field: "", message: err instanceof Error ? err.message : "Failed" }] };
  }
}

export async function deleteChecklistAction(input: unknown): Promise<Result<{ cardId: string }>> {
  const { userId } = await verifySession();
  const parsed = deleteChecklistSchema.safeParse(input);
  if (!parsed.success) return { errors: formatZodErrors(parsed.error) };

  const hasAccess = await assertChecklistPermission(
    parsed.data.checklistId,
    userId,
    BoardPermission.EDIT_CONTENT,
  );
  if (!hasAccess) {
    return { errors: [{ field: "", message: "Checklist not found or insufficient permissions" }] };
  }

  try {
    const cl = await deleteChecklist(parsed.data.checklistId);
    if (!cl) return { errors: [{ field: "", message: "Checklist not found" }] };
    revalidatePath(`/boards/${cl.boardId}`);
    emitToBoard(cl.boardId, REALTIME_EVENTS.CHECKLIST_UPDATED, {
      cardId: cl.cardId,
      boardId: cl.boardId,
    });
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

  const hasAccess = await assertChecklistPermission(
    parsed.data.checklistId,
    userId,
    BoardPermission.EDIT_CONTENT,
  );
  if (!hasAccess) {
    return { errors: [{ field: "", message: "Checklist not found or insufficient permissions" }] };
  }

  try {
    const item = await createChecklistItem(parsed.data);
    revalidatePath(`/boards/${item.boardId}`);
    emitToBoard(item.boardId, REALTIME_EVENTS.CHECKLIST_UPDATED, {
      cardId: item.cardId,
      boardId: item.boardId,
    });
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

  const hasAccess = await assertChecklistItemPermission(
    parsed.data.itemId,
    userId,
    BoardPermission.EDIT_CONTENT,
  );
  if (!hasAccess) {
    return { errors: [{ field: "", message: "Checklist not found or insufficient permissions" }] };
  }

  try {
    const item = await updateChecklistItem(itemId, patch);
    if (!item) return { errors: [{ field: "", message: "Item not found" }] };
    revalidatePath(`/boards/${item.boardId}`);
    emitToBoard(item.boardId, REALTIME_EVENTS.CHECKLIST_UPDATED, {
      cardId: item.cardId,
      boardId: item.boardId,
    });
    return { data: { id: item.id } };
  } catch (err) {
    return { errors: [{ field: "", message: err instanceof Error ? err.message : "Failed" }] };
  }
}

export async function deleteChecklistItemAction(input: unknown): Promise<Result<{ id: string }>> {
  const { userId } = await verifySession();
  const parsed = deleteChecklistItemSchema.safeParse(input);
  if (!parsed.success) return { errors: formatZodErrors(parsed.error) };

  const hasAccess = await assertChecklistItemPermission(
    parsed.data.itemId,
    userId,
    BoardPermission.EDIT_CONTENT,
  );
  if (!hasAccess) {
    return { errors: [{ field: "", message: "Checklist not found or insufficient permissions" }] };
  }

  try {
    const item = await deleteChecklistItem(parsed.data.itemId);
    if (!item) return { errors: [{ field: "", message: "Item not found" }] };
    revalidatePath(`/boards/${item.boardId}`);
    emitToBoard(item.boardId, REALTIME_EVENTS.CHECKLIST_UPDATED, {
      cardId: item.cardId,
      boardId: item.boardId,
    });
    return { data: { id: item.id } };
  } catch (err) {
    return { errors: [{ field: "", message: err instanceof Error ? err.message : "Failed" }] };
  }
}
