import { eq, isNull, and } from "drizzle-orm";
import { boards } from "../../schema/boards.js";
import type { DbClient } from "../../db.js";
import type { Board, BoardUpdate } from "./types.js";

export async function updateBoard(
  db: DbClient,
  id: string,
  data: BoardUpdate,
): Promise<Board | null> {
  const [board] = await db
    .update(boards)
    .set(data)
    .where(and(eq(boards.id, id), isNull(boards.deletedAt)))
    .returning();
  return board ?? null;
}
