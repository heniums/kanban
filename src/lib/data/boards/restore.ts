import { createDbClient } from "@/lib/db/client";
import { boards, type Board } from "@/lib/db/schema/boards";
import { eq, and, isNotNull } from "drizzle-orm";

export async function restoreBoard(id: string): Promise<Board | null> {
  const db = createDbClient();
  const [board] = await db
    .update(boards)
    .set({ deletedAt: null })
    .where(and(eq(boards.id, id), isNotNull(boards.deletedAt)))
    .returning();
  return board ?? null;
}
