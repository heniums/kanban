import { asc, eq } from "drizzle-orm";
import { createDbClient } from "@/lib/db/client";
import { lists, type List } from "@/lib/db/schema/lists";

export async function getListsByBoardId(boardId: string): Promise<List[]> {
  const db = createDbClient();
  const rows = await db
    .select({ list: lists })
    .from(lists)
    .where(eq(lists.boardId, boardId))
    .orderBy(asc(lists.position));
  return rows.map((r) => r.list);
}
