import { createDbClient } from "@/lib/db/client";
import { boards, type Board } from "@/lib/db/schema/boards";
import { eq, and } from "drizzle-orm";

export async function restoreBoard(
  id: string,
  options: { ownerId: string },
): Promise<Board | null> {
  const db = createDbClient();
  const [board] = await db
    .update(boards)
    .set({ deletedAt: null })
    .where(and(eq(boards.id, id), eq(boards.ownerId, options.ownerId)))
    .returning();
  return board ?? null;
}
