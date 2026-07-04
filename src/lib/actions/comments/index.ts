"use server";

import { revalidatePath } from "next/cache";
import { verifySession } from "@/lib/dal";
import { createComment, updateComment, deleteComment } from "@/lib/data/comments";
import { createDbClient } from "@/lib/db/client";
import { cards } from "@/lib/db/schema/cards";
import { sql } from "drizzle-orm";
import {
  createCommentSchema,
  updateCommentSchema,
  deleteCommentSchema,
} from "@/lib/schemas/comment";
import { emitToBoard, REALTIME_EVENTS } from "@/lib/realtime/events";
import { assertCardPermission } from "@/lib/actions/guards";
import { BoardPermission } from "@/lib/permissions";
import type { Comment } from "@/lib/db/schema/comments";

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

export async function createCommentAction(input: unknown): Promise<Result<Comment>> {
  const { userId } = await verifySession();
  const parsed = createCommentSchema.safeParse(input);
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
    const comment = await createComment(parsed.data, { userId });
    const boardId = await revalidateForCard(comment.cardId);
    if (boardId)
      emitToBoard(boardId, REALTIME_EVENTS.COMMENT_CREATED, { cardId: comment.cardId, boardId });
    return { data: comment };
  } catch (err) {
    return { errors: [{ field: "", message: err instanceof Error ? err.message : "Failed" }] };
  }
}

export async function updateCommentAction(input: unknown): Promise<Result<Comment>> {
  const { userId } = await verifySession();
  const parsed = updateCommentSchema.safeParse(input);
  if (!parsed.success) return { errors: formatZodErrors(parsed.error) };
  try {
    const comment = await updateComment(
      parsed.data.commentId,
      { content: parsed.data.content },
      { userId },
    );
    if (!comment) return { errors: [{ field: "", message: "Comment not found" }] };
    const boardId = await revalidateForCard(comment.cardId);
    if (boardId)
      emitToBoard(boardId, REALTIME_EVENTS.COMMENT_UPDATED, { cardId: comment.cardId, boardId });
    return { data: comment };
  } catch (err) {
    return { errors: [{ field: "", message: err instanceof Error ? err.message : "Failed" }] };
  }
}

export async function deleteCommentAction(input: unknown): Promise<Result<{ cardId: string }>> {
  const { userId } = await verifySession();
  const parsed = deleteCommentSchema.safeParse(input);
  if (!parsed.success) return { errors: formatZodErrors(parsed.error) };
  try {
    const deleted = await deleteComment(parsed.data.commentId, { userId });
    if (!deleted) return { errors: [{ field: "", message: "Comment not found" }] };
    const boardId = await revalidateForCard(deleted.cardId);
    if (boardId)
      emitToBoard(boardId, REALTIME_EVENTS.COMMENT_DELETED, { cardId: deleted.cardId, boardId });
    return { data: { cardId: deleted.cardId } };
  } catch (err) {
    return { errors: [{ field: "", message: err instanceof Error ? err.message : "Failed" }] };
  }
}
