import { createDbClient, boards } from "@kanban/shared";
import { eq, and, isNull } from "drizzle-orm";
import type { BoardRow } from "@kanban/shared";

export async function updateBoard(
  id: string,
  data: { title?: string; description?: string | null; background?: string },
): Promise<BoardRow | null> {
  const db = createDbClient();
  const [board] = await db
    .update(boards)
    .set(data)
    .where(and(eq(boards.id, id), isNull(boards.deletedAt)))
    .returning();
  return board ?? null;
}
