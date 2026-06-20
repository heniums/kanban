import { eq, isNull, and } from "drizzle-orm";
import { boards } from "../../schema/boards.js";
import type { DbClient } from "../../db.js";
import type { Board } from "./types.js";

export async function listBoardsByOwner(
  db: DbClient,
  ownerId: string,
): Promise<Board[]> {
  return db
    .select()
    .from(boards)
    .where(and(eq(boards.ownerId, ownerId), isNull(boards.deletedAt)));
}
