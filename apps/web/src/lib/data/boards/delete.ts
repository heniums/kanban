import { createDbClient, boards } from "@kanban/shared";
import { eq, and, isNull } from "drizzle-orm";
import type { Board } from "@kanban/shared";

export async function softDeleteBoard(
  id: string,
  options: { ownerId: string }
): Promise<Board | null> {
  const db = createDbClient();
  const [board] = await db
    .update(boards)
    .set({ deletedAt: new Date() })
    .where(
      and(
        eq(boards.id, id),
        eq(boards.ownerId, options.ownerId),
        isNull(boards.deletedAt)
      )
    )
    .returning();
  return board ?? null;
}
