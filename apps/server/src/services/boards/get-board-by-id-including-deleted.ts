import { eq } from "drizzle-orm";

import type { DbClient } from "../../db.js";
import { boards } from "../../schema/boards.js";
import type { Board } from "./types.js";

export async function getBoardByIdIncludingDeleted(
  db: DbClient,
  id: string
): Promise<Board | null> {
  const result = await db
    .select()
    .from(boards)
    .where(eq(boards.id, id))
    .limit(1);

  return result[0] ?? null;
}
