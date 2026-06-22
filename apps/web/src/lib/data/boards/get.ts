import { createDbClient, boards } from "@kanban/shared";
import { eq, and, isNull } from "drizzle-orm";
import type { BoardRow } from "@kanban/shared";

export async function getBoardById(id: string): Promise<BoardRow | null> {
  const db = createDbClient();
  const result = await db
    .select()
    .from(boards)
    .where(and(eq(boards.id, id), isNull(boards.deletedAt)));
  return result[0] ?? null;
}

export async function getBoardByIdIncludingDeleted(id: string): Promise<BoardRow | null> {
  const db = createDbClient();
  const result = await db
    .select()
    .from(boards)
    .where(eq(boards.id, id));
  return result[0] ?? null;
}
