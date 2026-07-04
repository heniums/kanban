import { createDbClient } from "@/lib/db/client";
import { boards, type Board } from "@/lib/db/schema/boards";
import { boardMembers } from "@/lib/db/schema/board-members";
import { eq, and, isNull } from "drizzle-orm";

interface UserScopedOptions {
  userId: string;
}

export async function getBoardById(id: string, options: UserScopedOptions): Promise<Board | null> {
  const db = createDbClient();
  const result = await db
    .select({ board: boards })
    .from(boards)
    .innerJoin(
      boardMembers,
      and(eq(boards.id, boardMembers.boardId), eq(boardMembers.userId, options.userId)),
    )
    .where(and(eq(boards.id, id), isNull(boards.deletedAt)));
  return result[0]?.board ?? null;
}
