import { and, asc, eq, isNull } from "drizzle-orm";
import { createDbClient } from "@/lib/db/client";
import { lists, type List } from "@/lib/db/schema/lists";
import { boards } from "@/lib/db/schema/boards";

export async function getListsByBoardId(
  boardId: string,
  options: { ownerId: string },
): Promise<List[]> {
  const db = createDbClient();
  const rows = await db
    .select({ list: lists })
    .from(lists)
    .innerJoin(boards, eq(boards.id, lists.boardId))
    .where(
      and(
        eq(lists.boardId, boardId),
        eq(boards.ownerId, options.ownerId),
        isNull(boards.deletedAt),
      ),
    )
    .orderBy(asc(lists.position));
  return rows.map((r) => r.list);
}
