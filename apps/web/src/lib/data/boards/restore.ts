import { createDbClient, boards } from "@kanban/shared";
import { eq } from "drizzle-orm";
import type { BoardRow } from "@kanban/shared";

export async function restoreBoard(id: string): Promise<BoardRow | null> {
  const db = createDbClient();
  const [board] = await db
    .update(boards)
    .set({ deletedAt: null })
    .where(eq(boards.id, id))
    .returning();
  return board ?? null;
}
