"use server";

import { revalidatePath } from "next/cache";
import { verifySession } from "@/lib/dal";
import {
  createComment,
  updateComment,
  deleteComment,
  getCommentsByCardId,
} from "@/lib/data/comments";
import { createDbClient } from "@/lib/db/client";
import { cards } from "@/lib/db/schema/cards";
import { sql } from "drizzle-orm";
import {
  createCommentSchema,
  updateCommentSchema,
  deleteCommentSchema,
  getCommentsByCardIdSchema,
} from "@/lib/schemas/comment";
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
}

export async function createCommentAction(input: unknown): Promise<Result<Comment>> {
  const { userId } = await verifySession();
  const parsed = createCommentSchema.safeParse(input);
  if (!parsed.success) return { errors: formatZodErrors(parsed.error) };
  try {
    const comment = await createComment(parsed.data, { userId });
    await revalidateForCard(comment.cardId);
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
    await revalidateForCard(comment.cardId);
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
    await revalidateForCard(deleted.cardId);
    return { data: { cardId: deleted.cardId } };
  } catch (err) {
    return { errors: [{ field: "", message: err instanceof Error ? err.message : "Failed" }] };
  }
}

export async function getCommentsByCardIdAction(input: unknown): Promise<Result<Comment[]>> {
  const { userId } = await verifySession();
  const parsed = getCommentsByCardIdSchema.safeParse(input);
  if (!parsed.success) return { errors: formatZodErrors(parsed.error) };
  const { cardId, limit = 50, offset = 0 } = parsed.data;
  const list = await getCommentsByCardId(cardId, { userId }, { limit, offset });
  return { data: list };
}
