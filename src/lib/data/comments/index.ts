import { sql } from "drizzle-orm";
import { createDbClient } from "@/lib/db/client";
import { comments, type Comment } from "@/lib/db/schema/comments";
import { cards } from "@/lib/db/schema/cards";
import { boards } from "@/lib/db/schema/boards";

async function assertCardOwnedBy(
  tx: ReturnType<typeof createDbClient>,
  cardId: string,
  ownerId: string,
): Promise<void> {
  const [row] = await tx
    .select({ id: cards.id })
    .from(cards)
    .innerJoin(boards, sql`${boards.id} = ${cards.boardId}`)
    .where(
      sql`${cards.id} = ${cardId} AND ${boards.ownerId} = ${ownerId} AND ${boards.deletedAt} IS NULL`,
    );
  if (!row) throw new Error("Card not found or board not owned");
}

export async function createComment(
  data: { cardId: string; content: string },
  options: { userId: string },
): Promise<Comment> {
  const db = createDbClient();
  return db.transaction(async (tx) => {
    await assertCardOwnedBy(tx, data.cardId, options.userId);
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
    .where(sql`${comments.id} = ${commentId} AND ${comments.userId} = ${options.userId}`)
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
    .where(sql`${comments.id} = ${commentId} AND ${comments.userId} = ${options.userId}`)
    .returning();
  return deleted ?? null;
}

export async function getCommentsByCardId(
  cardId: string,
  options: { userId: string },
  pagination: { limit: number; offset: number } = { limit: 50, offset: 0 },
): Promise<Comment[]> {
  const db = createDbClient();
  return db.transaction(async (tx) => {
    await assertCardOwnedBy(tx, cardId, options.userId);
    return tx
      .select()
      .from(comments)
      .where(sql`${comments.cardId} = ${cardId}`)
      .orderBy(sql`${comments.createdAt} ASC`)
      .limit(pagination.limit)
      .offset(pagination.offset);
  });
}
