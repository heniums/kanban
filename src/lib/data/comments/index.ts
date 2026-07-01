import { sql } from "drizzle-orm";
import { createDbClient } from "@/lib/db/client";
import { comments, type Comment } from "@/lib/db/schema/comments";
import { cards } from "@/lib/db/schema/cards";
import { boards } from "@/lib/db/schema/boards";

type Tx = Parameters<Parameters<ReturnType<typeof createDbClient>["transaction"]>[0]>[0];

async function assertCardOwnedBy(tx: Tx, cardId: string, ownerId: string): Promise<void> {
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

export async function getCommentCountsByBoardId(
  boardId: string,
  options: { userId: string },
): Promise<Record<string, number>> {
  const db = createDbClient();
  const rows = (
    await db.execute(
      sql`SELECT c.id AS card_id, COALESCE(cnt.n, 0)::int AS n
         FROM ${cards} c
         LEFT JOIN (
           SELECT card_id, COUNT(*)::int AS n
           FROM ${comments}
           GROUP BY card_id
         ) cnt ON cnt.card_id = c.id
         INNER JOIN ${boards} b ON b.id = c.board_id
         WHERE c.board_id = ${boardId}
           AND b.owner_id = ${options.userId}
           AND b.deleted_at IS NULL`,
    )
  ).rows as Array<{ card_id: string; n: number }>;
  const out: Record<string, number> = {};
  for (const r of rows) {
    if (r.n > 0) out[r.card_id] = r.n;
  }
  return out;
}
