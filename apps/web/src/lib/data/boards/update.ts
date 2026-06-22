import { createDbClient, boards } from "@kanban/shared";
import { eq, and, isNull } from "drizzle-orm";
import type { Board } from "@kanban/shared";

export async function updateBoard(
  id: string,
  data: { title?: string; description?: string | null; background?: string },
  options: { ownerId: string }
): Promise<Board | null> {
  const db = createDbClient();
  const [board] = await db
    .update(boards)
    .set(data)
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
