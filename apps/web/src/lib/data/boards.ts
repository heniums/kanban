import { createDbClient, boards } from "@kanban/shared";
import { eq, and, isNull, desc } from "drizzle-orm";
import type { BoardRow } from "@kanban/shared";

const MAX_LIMIT = 100;

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

export async function listBoardsByOwner(ownerId: string): Promise<BoardRow[]> {
  const db = createDbClient();
  return db
    .select()
    .from(boards)
    .where(and(eq(boards.ownerId, ownerId), isNull(boards.deletedAt)))
    .orderBy(desc(boards.createdAt))
    .limit(MAX_LIMIT);
}

export async function createBoard(data: {
  title: string;
  description?: string | null;
  background: string;
  ownerId: string;
}): Promise<BoardRow> {
  const db = createDbClient();
  const [board] = await db.insert(boards).values(data).returning();
  return board;
}

export async function updateBoard(
  id: string,
  data: { title?: string; description?: string | null; background?: string },
): Promise<BoardRow | null> {
  const db = createDbClient();
  const [board] = await db
    .update(boards)
    .set(data)
    .where(and(eq(boards.id, id), isNull(boards.deletedAt)))
    .returning();
  return board ?? null;
}

export async function softDeleteBoard(id: string): Promise<BoardRow | null> {
  const db = createDbClient();
  const [board] = await db
    .update(boards)
    .set({ deletedAt: new Date() })
    .where(and(eq(boards.id, id), isNull(boards.deletedAt)))
    .returning();
  return board ?? null;
}

export async function restoreBoard(id: string): Promise<BoardRow | null> {
  const db = createDbClient();
  const [board] = await db
    .update(boards)
    .set({ deletedAt: null })
    .where(eq(boards.id, id))
    .returning();
  return board ?? null;
}
