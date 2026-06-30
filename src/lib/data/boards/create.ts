import { createDbClient } from "@/lib/db/client";
import { boards, type Board } from "@/lib/db/schema/boards";

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
