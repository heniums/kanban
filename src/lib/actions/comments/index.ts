"use server";

import { revalidatePath } from "next/cache";
import { verifySession } from "@/lib/dal";
import { createComment, updateComment, deleteComment } from "@/lib/data/comments";
import {
  createCommentSchema,
  updateCommentSchema,
  deleteCommentSchema,
} from "@/lib/schemas/comment";
import { emitToBoard, REALTIME_EVENTS } from "@/lib/realtime/events";
import { assertCardPermission, assertCommentPermission } from "@/lib/actions/guards";
import { BoardPermission } from "@/lib/permissions";
import type { Comment } from "@/lib/db/schema/comments";

type Result<T> = { data: T } | { errors: Array<{ field: string; message: string }> };

function formatZodErrors(error: import("zod").ZodError) {
  return error.errors.map((e) => ({ field: e.path.join("."), message: e.message }));
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
    revalidatePath(`/boards/${comment.boardId}`);
    emitToBoard(comment.boardId, REALTIME_EVENTS.COMMENT_CREATED, {
      cardId: comment.cardId,
      boardId: comment.boardId,
    });
    return { data: comment };
  } catch (err) {
    return { errors: [{ field: "", message: err instanceof Error ? err.message : "Failed" }] };
  }
}

export async function updateCommentAction(input: unknown): Promise<Result<Comment>> {
  const { userId } = await verifySession();
  const parsed = updateCommentSchema.safeParse(input);
  if (!parsed.success) return { errors: formatZodErrors(parsed.error) };

  const hasAccess = await assertCommentPermission(
    parsed.data.commentId,
    userId,
    BoardPermission.EDIT_CONTENT,
  );
  if (!hasAccess) {
    return { errors: [{ field: "", message: "Comment not found or insufficient permissions" }] };
  }

  try {
    const comment = await updateComment(parsed.data.commentId, { content: parsed.data.content });
    if (!comment) return { errors: [{ field: "", message: "Comment not found" }] };
    revalidatePath(`/boards/${comment.boardId}`);
    emitToBoard(comment.boardId, REALTIME_EVENTS.COMMENT_UPDATED, {
      cardId: comment.cardId,
      boardId: comment.boardId,
    });
    return { data: comment };
  } catch (err) {
    return { errors: [{ field: "", message: err instanceof Error ? err.message : "Failed" }] };
  }
}

export async function deleteCommentAction(input: unknown): Promise<Result<{ cardId: string }>> {
  const { userId } = await verifySession();
  const parsed = deleteCommentSchema.safeParse(input);
  if (!parsed.success) return { errors: formatZodErrors(parsed.error) };

  const hasAccess = await assertCommentPermission(
    parsed.data.commentId,
    userId,
    BoardPermission.EDIT_CONTENT,
  );
  if (!hasAccess) {
    return { errors: [{ field: "", message: "Comment not found or insufficient permissions" }] };
  }

  try {
    const deleted = await deleteComment(parsed.data.commentId);
    if (!deleted) return { errors: [{ field: "", message: "Comment not found" }] };
    revalidatePath(`/boards/${deleted.boardId}`);
    emitToBoard(deleted.boardId, REALTIME_EVENTS.COMMENT_DELETED, {
      cardId: deleted.cardId,
      boardId: deleted.boardId,
    });
    return { data: { cardId: deleted.cardId } };
  } catch (err) {
    return { errors: [{ field: "", message: err instanceof Error ? err.message : "Failed" }] };
  }
}
