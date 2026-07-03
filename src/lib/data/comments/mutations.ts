import { sql } from "drizzle-orm";
import { createDbClient } from "@/lib/db/client";
import { comments, type Comment } from "@/lib/db/schema/comments";
import { cards } from "@/lib/db/schema/cards";
import { boards } from "@/lib/db/schema/boards";

export async function createComment(
  data: { cardId: string; content: string },
  options: { userId: string },
): Promise<Comment> {
  const db = createDbClient();
  return db.transaction(async (tx) => {
    const [comment] = await tx
      .insert(comments)
      .values({ cardId: data.cardId, userId: options.userId, content: data.content })
      .returning();
    return comment;
  });
}

export async function updateComment(
  commentId: string,
  data: { content: string },
  options: { userId: string },
): Promise<Comment | null> {
  const db = createDbClient();
  const [updated] = await db
    .update(comments)
    .set({ content: data.content })
    .where(
      sql`${comments.id} = ${commentId} AND ${comments.userId} = ${options.userId} AND ${comments.cardId} IN (SELECT id FROM ${cards} WHERE ${cards.boardId} IN (SELECT id FROM ${boards} WHERE ${boards.ownerId} = ${options.userId} AND ${boards.deletedAt} IS NULL))`,
    )
    .returning();
  return updated ?? null;
}

export async function deleteComment(
  commentId: string,
  options: { userId: string },
): Promise<Comment | null> {
  const db = createDbClient();
  const [deleted] = await db
    .delete(comments)
    .where(
      sql`${comments.id} = ${commentId} AND ${comments.userId} = ${options.userId} AND ${comments.cardId} IN (SELECT id FROM ${cards} WHERE ${cards.boardId} IN (SELECT id FROM ${boards} WHERE ${boards.ownerId} = ${options.userId} AND ${boards.deletedAt} IS NULL))`,
    )
    .returning();
  return deleted ?? null;
}
