import { boards } from "../../schema/boards.js";
import type { DbClient } from "../../db.js";
import type { Board, BoardInput } from "./types.js";

export async function createBoard(
  db: DbClient,
  data: BoardInput,
): Promise<Board> {
  const [board] = await db.insert(boards).values(data).returning();
  return board;
}
