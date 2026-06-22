import { createDbClient, boards } from "@kanban/shared";
import { eq, and, isNull } from "drizzle-orm";
import type { BoardRow } from "@kanban/shared";

export async function softDeleteBoard(id: string): Promise<BoardRow | null> {
  const db = createDbClient();
  const [board] = await db
    .update(boards)
    .set({ deletedAt: new Date() })
    .where(and(eq(boards.id, id), isNull(boards.deletedAt)))
    .returning();
  return board ?? null;
}
