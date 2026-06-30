import { createDbClient } from "@/lib/db/client";
import { boards, type Board } from "@/lib/db/schema/boards";
import { eq, and, isNull } from "drizzle-orm";

interface OwnerScopedOptions {
  ownerId: string;
}

export async function getBoardById(id: string, options: OwnerScopedOptions): Promise<Board | null> {
  const db = createDbClient();
  const result = await db
    .select()
    .from(boards)
    .where(and(eq(boards.id, id), eq(boards.ownerId, options.ownerId), isNull(boards.deletedAt)));
  return result[0] ?? null;
}

export async function getBoardByIdIncludingDeleted(
  id: string,
  options: OwnerScopedOptions,
): Promise<Board | null> {
  const db = createDbClient();
  const result = await db
    .select()
    .from(boards)
    .where(and(eq(boards.id, id), eq(boards.ownerId, options.ownerId)));
  return result[0] ?? null;
}
