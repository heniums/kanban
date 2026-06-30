import { createDbClient } from "@/lib/db/client";
import { boards, type Board } from "@/lib/db/schema/boards";
import { lists } from "@/lib/db/schema/lists";

const DEFAULT_LIST_TITLE = "To Do";

export async function createBoard(data: {
  title: string;
  description?: string | null;
  background: string;
  ownerId: string;
}): Promise<Board> {
  const db = createDbClient();
  return db.transaction(async (tx) => {
    const [board] = await tx.insert(boards).values(data).returning();
    await tx.insert(lists).values({
      boardId: board.id,
      title: DEFAULT_LIST_TITLE,
      position: 0,
    });
    return board;
  });
}
