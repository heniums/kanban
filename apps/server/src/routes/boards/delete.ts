import { type Request, type Response } from "express";

import { createDbClient } from "../../db.js";
import { getBoardById } from "../../services/boards/get-board-by-id.js";
import { softDeleteBoard } from "../../services/boards/soft-delete-board.js";

export async function deleteBoardRoute(req: Request, res: Response) {
  const db = createDbClient();

  try {
    const board = await getBoardById(db, req.params.id as string);

    if (!board) {
      res.status(404).json({ error: "Board not found" });
      return;
    }

    if (board.ownerId !== req.userId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const deleted = await softDeleteBoard(db, board.id);

    if (!deleted) {
      res.status(404).json({ error: "Board not found" });
      return;
    }

    res.status(200).json({ board: deleted });
  } catch (err) {
    console.error("Delete board error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}