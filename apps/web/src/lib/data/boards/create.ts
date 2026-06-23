import { createDbClient, boards, type Board } from "@kanban/shared/server";

export async function createBoard(data: {
  title: string;
  description?: string | null;
  background: string;
  ownerId: string;
}): Promise<Board> {
  const db = createDbClient();
  const [board] = await db.insert(boards).values(data).returning();
  return board;
}
