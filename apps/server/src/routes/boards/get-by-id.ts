import { type Request, type Response } from "express";

import { createDbClient } from "../../db.js";
import { getBoardById } from "../../services/boards/get-board-by-id.js";

export async function getBoardByIdRoute(req: Request, res: Response) {
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

    res.status(200).json({ board });
  } catch (err) {
    console.error("Get board error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}