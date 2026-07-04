import { sql } from "drizzle-orm";
import { createDbClient } from "@/lib/db/client";
import { cards } from "@/lib/db/schema/cards";
import { comments } from "@/lib/db/schema/comments";
import { boards } from "@/lib/db/schema/boards";
import { boardMembers } from "@/lib/db/schema/board-members";

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
         INNER JOIN ${boardMembers} bm ON bm.board_id = c.board_id AND bm.user_id = ${options.userId}
         WHERE c.board_id = ${boardId}
           AND b.deleted_at IS NULL`,
    )
  ).rows as Array<{ card_id: string; n: number }>;
  const out: Record<string, number> = {};
  for (const r of rows) {
    if (r.n > 0) out[r.card_id] = r.n;
  }
  return out;
}
