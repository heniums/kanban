import { createDbClient, boards } from "@kanban/shared";
import { eq, and, isNull, desc } from "drizzle-orm";
import type { Board } from "@kanban/shared";

const MAX_LIMIT = 100;

export async function listBoardsByOwner(ownerId: string): Promise<Board[]> {
  const db = createDbClient();
  return db
    .select()
    .from(boards)
    .where(and(eq(boards.ownerId, ownerId), isNull(boards.deletedAt)))
    .orderBy(desc(boards.createdAt))
    .limit(MAX_LIMIT);
}
