import { createDbClient } from "@/lib/db/client";
import { boards, type Board } from "@/lib/db/schema/boards";
import { eq } from "drizzle-orm";

export async function restoreBoard(id: string): Promise<Board | null> {
  const db = createDbClient();
  const [board] = await db
    .update(boards)
    .set({ deletedAt: null })
    .where(eq(boards.id, id))
    .returning();
  return board ?? null;
}
