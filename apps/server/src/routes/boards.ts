import { Router, type Request, type Response } from "express";
import { createBoardSchema } from "@kanban/shared";

import { createDbClient } from "../db.js";
import { createBoard } from "../services/boards/create-board.js";
import { getBoardById } from "../services/boards/get-board-by-id.js";
import { listBoardsByOwner } from "../services/boards/list-boards-by-owner.js";
import { listSharedBoards } from "../services/boards/list-shared-boards.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.post("/", requireAuth, async (req: Request, res: Response) => {
  const parsed = createBoardSchema.safeParse(req.body);

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
    const board = await createBoard(db, {
      ...parsed.data,
      ownerId: req.userId!,
    });
    res.status(201).json({ board });
  } catch (err) {
    console.error("Create board error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/", requireAuth, async (req: Request, res: Response) => {
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
});

router.get("/:id", requireAuth, async (req: Request, res: Response) => {
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
});

export default router;
