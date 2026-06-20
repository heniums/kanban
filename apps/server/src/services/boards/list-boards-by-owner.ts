import { eq, isNull, and, desc } from "drizzle-orm";
import { boards } from "../../schema/boards.js";
import type { DbClient } from "../../db.js";
import type { Board } from "./types.js";

const MAX_LIMIT = 100;

export async function listBoardsByOwner(
  db: DbClient,
  ownerId: string,
  options?: { limit?: number; offset?: number },
): Promise<Board[]> {
  const limit = Math.min(options?.limit ?? MAX_LIMIT, MAX_LIMIT);
  const offset = options?.offset ?? 0;
  return db
    .select()
    .from(boards)
    .where(and(eq(boards.ownerId, ownerId), isNull(boards.deletedAt)))
    .orderBy(desc(boards.createdAt))
    .limit(limit)
    .offset(offset);
}
