import { createDbClient, boards } from "@kanban/shared";
import type { BoardRow } from "@kanban/shared";

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
