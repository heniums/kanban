import { eq, isNull, and } from "drizzle-orm";
import { boards } from "../../schema/boards.js";
import type { DbClient } from "../../db.js";
import type { Board } from "./types.js";

export async function getBoardById(
  db: DbClient,
  id: string,
): Promise<Board | null> {
  const result = await db
    .select()
    .from(boards)
    .where(and(eq(boards.id, id), isNull(boards.deletedAt)));
  return result[0] ?? null;
}
