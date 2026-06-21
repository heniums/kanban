import { type Request, type Response } from "express";

import { createDbClient } from "../../db.js";
import { listBoardsByOwner } from "../../services/boards/list-boards-by-owner.js";
import { listSharedBoards } from "../../services/boards/list-shared-boards.js";

export async function listBoardsRoute(req: Request, res: Response) {
  const db = createDbClient();

  try {
    const [owned, shared] = await Promise.all([
      listBoardsByOwner(db, req.userId!),
      listSharedBoards(db, req.userId!),
    ]);
    res.status(200).json({ owned, shared });
  } catch (err) {
    console.error("List boards error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}