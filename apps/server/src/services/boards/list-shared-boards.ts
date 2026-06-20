import type { DbClient } from "../../db.js";
import type { Board } from "./types.js";

export async function listSharedBoards(
  _db: DbClient,
  _userId: string,
): Promise<Board[]> {
  return [];
}
