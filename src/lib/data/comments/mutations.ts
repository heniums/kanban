import { eq, sql } from "drizzle-orm";
import { createDbClient } from "@/lib/db/client";
import { comments, type Comment } from "@/lib/db/schema/comments";
import { cards } from "@/lib/db/schema/cards";

export async function createComment(
  data: { cardId: string; content: string },
  options: { userId: string },
): Promise<Comment & { boardId: string }> {
  const db = createDbClient();
  return db.transaction(async (tx) => {
    const [card] = await tx
      .select({ boardId: cards.boardId })
      .from(cards)
      .where(eq(cards.id, data.cardId));
    const [comment] = await tx
      .insert(comments)
      .values({ cardId: data.cardId, userId: options.userId, content: data.content })
      .returning();
    return { ...comment, boardId: card?.boardId ?? "" };
  });
}

export async function updateComment(
  commentId: string,
  data: { content: string },
): Promise<(Comment & { boardId: string }) | null> {
  const db = createDbClient();
  const [updated] = await db
    .update(comments)
    .set({ content: data.content })
    .where(sql`${comments.id} = ${commentId}`)
    .returning();
  if (!updated) return null;
  const [row] = await db
    .select({ boardId: cards.boardId })
    .from(cards)
    .where(eq(cards.id, updated.cardId));
  return { ...updated, boardId: row?.boardId ?? "" };
}

export async function deleteComment(
  commentId: string,
): Promise<(Comment & { boardId: string }) | null> {
  const db = createDbClient();
  const [deleted] = await db
    .delete(comments)
    .where(sql`${comments.id} = ${commentId}`)
    .returning();
  if (!deleted) return null;
  const [row] = await db
    .select({ boardId: cards.boardId })
    .from(cards)
    .where(eq(cards.id, deleted.cardId));
  return { ...deleted, boardId: row?.boardId ?? "" };
}
