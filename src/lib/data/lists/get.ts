import { and, asc, eq, isNull } from "drizzle-orm";
import { createDbClient } from "@/lib/db/client";
import { lists, type List } from "@/lib/db/schema/lists";
import { boards } from "@/lib/db/schema/boards";
import { boardMembers } from "@/lib/db/schema/board-members";

export async function getListsByBoardId(
  boardId: string,
  options: { userId: string },
): Promise<List[]> {
  const db = createDbClient();
  const rows = await db
    .select({ list: lists })
    .from(lists)
    .innerJoin(boards, eq(boards.id, lists.boardId))
    .innerJoin(
      boardMembers,
      and(eq(boardMembers.boardId, lists.boardId), eq(boardMembers.userId, options.userId)),
    )
    .where(and(eq(lists.boardId, boardId), isNull(boards.deletedAt)))
    .orderBy(asc(lists.position));
  return rows.map((r) => r.list);
}
