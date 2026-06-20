import { eq } from "drizzle-orm";
import { boards } from "../../schema/boards.js";
import type { DbClient } from "../../db.js";
import type { Board } from "./types.js";

export async function restoreBoard(
  db: DbClient,
  id: string,
): Promise<Board | null> {
  const [board] = await db
    .update(boards)
    .set({ deletedAt: null })
    .where(eq(boards.id, id))
    .returning();
  return board ?? null;
}
