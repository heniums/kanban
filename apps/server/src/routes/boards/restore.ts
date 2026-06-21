import { type Request, type Response } from "express";

import { createDbClient } from "../../db.js";
import { getBoardByIdIncludingDeleted } from "../../services/boards/get-board-by-id-including-deleted.js";
import { restoreBoard } from "../../services/boards/restore-board.js";

export async function restoreBoardRoute(req: Request, res: Response) {
  const db = createDbClient();

  try {
    const board = await getBoardByIdIncludingDeleted(db, req.params.id as string);

    if (!board) {
      res.status(404).json({ error: "Board not found" });
      return;
    }

    if (board.ownerId !== req.userId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const restored = await restoreBoard(db, board.id);

    if (!restored) {
      res.status(404).json({ error: "Board not found" });
      return;
    }

    res.status(200).json({ board: restored });
  } catch (err) {
    console.error("Restore board error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}