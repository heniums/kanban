import { createDbClient } from "@/lib/db/client";
import { boards, type Board } from "@/lib/db/schema/boards";
import { boardMembers } from "@/lib/db/schema/board-members";
import { eq, and, isNull, desc } from "drizzle-orm";

const MAX_LIMIT = 100;

export async function listBoardsByMember(userId: string): Promise<Board[]> {
  const db = createDbClient();
  return db
    .select({ board: boards })
    .from(boards)
    .innerJoin(
      boardMembers,
      and(eq(boards.id, boardMembers.boardId), eq(boardMembers.userId, userId)),
    )
    .where(isNull(boards.deletedAt))
    .orderBy(desc(boards.createdAt))
    .limit(MAX_LIMIT)
    .then((rows) => rows.map((r) => r.board));
}
