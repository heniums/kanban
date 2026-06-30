import { createDbClient } from "@/lib/db/client";
import { boards, type Board } from "@/lib/db/schema/boards";
import { eq, and, isNull } from "drizzle-orm";

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
