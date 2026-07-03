"use server";

import { revalidatePath } from "next/cache";
import { verifySession } from "@/lib/dal";
import {
  createCard,
  updateCard,
  deleteCard,
  moveCard,
  reorderCards,
  copyCard,
  getCardById,
} from "@/lib/data/cards";
import {
  createCardSchema,
  updateCardSchema,
  deleteCardSchema,
  moveCardSchema,
  reorderCardsSchema,
  copyCardSchema,
} from "@/lib/schemas/card";
import type { Card } from "@/lib/db/schema/cards";
import { emitToBoard, REALTIME_EVENTS } from "@/lib/realtime/events";

type Result<T> = { data: T } | { errors: Array<{ field: string; message: string }> };

function formatZodErrors(error: import("zod").ZodError) {
  return error.errors.map((e) => ({ field: e.path.join("."), message: e.message }));
}

export async function createCardAction(input: unknown): Promise<Result<Card>> {
  const { userId } = await verifySession();
  const parsed = createCardSchema.safeParse(input);
  if (!parsed.success) {
    return { errors: formatZodErrors(parsed.error) };
  }
  try {
    const card = await createCard(parsed.data, { ownerId: userId });
    revalidatePath(`/boards/${card.boardId}`);
    emitToBoard(card.boardId, REALTIME_EVENTS.CARD_CREATED, { card });
    return { data: card };
  } catch (err) {
    return { errors: [{ field: "", message: err instanceof Error ? err.message : "Failed" }] };
  }
}

export async function updateCardAction(input: unknown): Promise<Result<Card>> {
  const { userId } = await verifySession();
  const parsed = updateCardSchema.safeParse(input);
  if (!parsed.success) {
    return { errors: formatZodErrors(parsed.error) };
  }
  const { cardId, ...patch } = parsed.data;
  try {
    const card = await updateCard(cardId, patch, { ownerId: userId });
    if (!card) {
      return { errors: [{ field: "", message: "Card not found" }] };
    }
    revalidatePath(`/boards/${card.boardId}`);
    emitToBoard(card.boardId, REALTIME_EVENTS.CARD_UPDATED, { card });
    return { data: card };
  } catch (err) {
    return { errors: [{ field: "", message: err instanceof Error ? err.message : "Failed" }] };
  }
}

export async function deleteCardAction(input: unknown): Promise<Result<{ boardId: string }>> {
  const { userId } = await verifySession();
  const parsed = deleteCardSchema.safeParse(input);
  if (!parsed.success) {
    return { errors: formatZodErrors(parsed.error) };
  }
  try {
    const deleted = await deleteCard(parsed.data.cardId, { ownerId: userId });
    if (!deleted) {
      return { errors: [{ field: "", message: "Card not found" }] };
    }
    revalidatePath(`/boards/${deleted.boardId}`);
    emitToBoard(deleted.boardId, REALTIME_EVENTS.CARD_DELETED, {
      cardId: deleted.id,
      listId: deleted.listId,
      boardId: deleted.boardId,
    });
    return { data: { boardId: deleted.boardId } };
  } catch (err) {
    return { errors: [{ field: "", message: err instanceof Error ? err.message : "Failed" }] };
  }
}

export async function moveCardAction(input: unknown): Promise<Result<Card>> {
  const { userId } = await verifySession();
  const parsed = moveCardSchema.safeParse(input);
  if (!parsed.success) {
    return { errors: formatZodErrors(parsed.error) };
  }
  try {
    const card = await moveCard(
      parsed.data.cardId,
      parsed.data.targetListId,
      parsed.data.targetPosition,
      { ownerId: userId },
    );
    if (!card) {
      return { errors: [{ field: "", message: "Card not found" }] };
    }
    revalidatePath(`/boards/${card.boardId}`);
    emitToBoard(card.boardId, REALTIME_EVENTS.CARD_MOVED, {
      cardId: card.id,
      sourceListId: card.listId,
      targetListId: card.listId,
      targetPosition: card.position,
      boardId: card.boardId,
    });
    return { data: card };
  } catch (err) {
    return { errors: [{ field: "", message: err instanceof Error ? err.message : "Failed" }] };
  }
}

export async function reorderCardsAction(input: unknown): Promise<Result<Card[]>> {
  const { userId } = await verifySession();
  const parsed = reorderCardsSchema.safeParse(input);
  if (!parsed.success) {
    return { errors: formatZodErrors(parsed.error) };
  }
  try {
    const cards = await reorderCards(parsed.data.listId, parsed.data.orderedCardIds, {
      ownerId: userId,
    });
    const sample = await getCardById(parsed.data.orderedCardIds[0], { ownerId: userId });
    if (sample) revalidatePath(`/boards/${sample.boardId}`);
    return { data: cards };
  } catch (err) {
    return { errors: [{ field: "", message: err instanceof Error ? err.message : "Failed" }] };
  }
}

export async function copyCardAction(input: unknown): Promise<Result<Card>> {
  const { userId } = await verifySession();
  const parsed = copyCardSchema.safeParse(input);
  if (!parsed.success) {
    return { errors: formatZodErrors(parsed.error) };
  }
  try {
    const card = await copyCard(parsed.data.cardId, { ownerId: userId });
    if (!card) {
      return { errors: [{ field: "", message: "Card not found" }] };
    }
    revalidatePath(`/boards/${card.boardId}`);
    emitToBoard(card.boardId, REALTIME_EVENTS.CARD_CREATED, { card });
    return { data: card };
  } catch (err) {
    return { errors: [{ field: "", message: err instanceof Error ? err.message : "Failed" }] };
  }
}
