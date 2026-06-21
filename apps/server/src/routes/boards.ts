import { Router, type Request, type Response } from "express";
import { createBoardSchema } from "@kanban/shared";

import { createDbClient } from "../db.js";
import { createBoard } from "../services/boards/create-board.js";
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

export default router;
