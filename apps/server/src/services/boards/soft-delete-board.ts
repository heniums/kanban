import { eq, isNull, and } from "drizzle-orm";
import { boards } from "../../schema/boards.js";
import type { DbClient } from "../../db.js";
import type { Board } from "./types.js";

export async function softDeleteBoard(
  db: DbClient,
  id: string,
): Promise<Board | null> {
  const [board] = await db
    .update(boards)
    .set({ deletedAt: new Date() })
    .where(and(eq(boards.id, id), isNull(boards.deletedAt)))
    .returning();
  return board ?? null;
}
