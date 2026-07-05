import { sql } from "drizzle-orm";
import { createDbClient } from "@/lib/db/client";
import { comments, type Comment } from "@/lib/db/schema/comments";

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
): Promise<Comment | null> {
  const db = createDbClient();
  const [updated] = await db
    .update(comments)
    .set({ content: data.content })
    .where(sql`${comments.id} = ${commentId}`)
    .returning();
  return updated ?? null;
}

export async function deleteComment(commentId: string): Promise<Comment | null> {
  const db = createDbClient();
  const [deleted] = await db
    .delete(comments)
    .where(sql`${comments.id} = ${commentId}`)
    .returning();
  return deleted ?? null;
}
