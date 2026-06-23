import { createDbClient, boards, type Board } from "@kanban/shared/server";
import { eq, and, isNull } from "drizzle-orm";

interface OwnerScopedOptions {
  ownerId: string;
}

export async function getBoardById(
  id: string,
  options?: OwnerScopedOptions
): Promise<Board | null> {
  const db = createDbClient();
  const conditions = options?.ownerId
    ? and(eq(boards.id, id), eq(boards.ownerId, options.ownerId), isNull(boards.deletedAt))
    : and(eq(boards.id, id), isNull(boards.deletedAt));
  const result = await db.select().from(boards).where(conditions);
  return result[0] ?? null;
}

export async function getBoardByIdIncludingDeleted(
  id: string,
  options?: OwnerScopedOptions
): Promise<Board | null> {
  const db = createDbClient();
  const conditions = options?.ownerId
    ? and(eq(boards.id, id), eq(boards.ownerId, options.ownerId))
    : eq(boards.id, id);
  const result = await db.select().from(boards).where(conditions);
  return result[0] ?? null;
}
