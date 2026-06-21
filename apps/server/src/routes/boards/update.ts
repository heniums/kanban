import { type Request, type Response } from "express";
import { updateBoardSchema } from "@kanban/shared";

import { createDbClient } from "../../db.js";
import { getBoardById } from "../../services/boards/get-board-by-id.js";
import { updateBoard } from "../../services/boards/update-board.js";

export async function updateBoardRoute(req: Request, res: Response) {
  const parsed = updateBoardSchema.safeParse(req.body);

  if (!parsed.success) {
    const errors = parsed.error.errors.map((e: { path: (string | number)[]; message: string }) => ({
      field: e.path.join("."),
      message: e.message,
    }));
    res.status(400).json({ error: "Validation failed", details: errors });
    return;
  }

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

    const updated = await updateBoard(db, board.id, parsed.data);

    if (!updated) {
      res.status(404).json({ error: "Board not found" });
      return;
    }

    res.status(200).json({ board: updated });
  } catch (err) {
    console.error("Update board error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}