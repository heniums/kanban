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
  getCardSummaryById,
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
import type { CardSummary } from "@/components/cards/card-item";
import { emitToBoard, REALTIME_EVENTS } from "@/lib/realtime/events";
import { assertCardPermission, assertListPermission } from "@/lib/actions/guards";
import { BoardPermission } from "@/lib/permissions";

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
    const allowed = await assertListPermission(
      parsed.data.listId,
      userId,
      BoardPermission.EDIT_CONTENT,
    );
    if (!allowed) {
      return { errors: [{ field: "", message: "Forbidden" }] };
    }
    const card = await createCard(parsed.data);
    revalidatePath(`/boards/${card.boardId}`);
    emitToBoard(card.boardId, REALTIME_EVENTS.CARD_CREATED, { card });
    return { data: card };
  } catch (err) {
    return { errors: [{ field: "", message: err instanceof Error ? err.message : "Failed" }] };
  }
}

export async function updateCardAction(input: unknown): Promise<Result<CardSummary>> {
  const { userId } = await verifySession();
  const parsed = updateCardSchema.safeParse(input);
  if (!parsed.success) {
    return { errors: formatZodErrors(parsed.error) };
  }
  const { cardId, ...patch } = parsed.data;
  try {
    const allowed = await assertCardPermission(cardId, userId, BoardPermission.EDIT_CONTENT);
    if (!allowed) {
      return { errors: [{ field: "", message: "Forbidden" }] };
    }
    const card = await updateCard(cardId, patch);
    if (!card) {
      return { errors: [{ field: "", message: "Card not found" }] };
    }
    const cardSummary = await getCardSummaryById(cardId);
    if (!cardSummary) {
      return { errors: [{ field: "", message: "Card not found" }] };
    }
    revalidatePath(`/boards/${card.boardId}`);
    emitToBoard(card.boardId, REALTIME_EVENTS.CARD_UPDATED, { card: cardSummary });
    return { data: cardSummary };
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
    const allowed = await assertCardPermission(
      parsed.data.cardId,
      userId,
      BoardPermission.EDIT_CONTENT,
    );
    if (!allowed) {
      return { errors: [{ field: "", message: "Forbidden" }] };
    }
    const deleted = await deleteCard(parsed.data.cardId);
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
    const allowed = await assertCardPermission(
      parsed.data.cardId,
      userId,
      BoardPermission.EDIT_CONTENT,
    );
    if (!allowed) {
      return { errors: [{ field: "", message: "Forbidden" }] };
    }
    const card = await moveCard(
      parsed.data.cardId,
      parsed.data.targetListId,
      parsed.data.targetPosition,
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
    const allowed = await assertListPermission(
      parsed.data.listId,
      userId,
      BoardPermission.EDIT_CONTENT,
    );
    if (!allowed) {
      return { errors: [{ field: "", message: "Forbidden" }] };
    }
    const cards = await reorderCards(parsed.data.listId, parsed.data.orderedCardIds);
    const sample = await getCardById(parsed.data.orderedCardIds[0]);
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
    const allowed = await assertCardPermission(
      parsed.data.cardId,
      userId,
      BoardPermission.EDIT_CONTENT,
    );
    if (!allowed) {
      return { errors: [{ field: "", message: "Forbidden" }] };
    }
    const card = await copyCard(parsed.data.cardId);
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
