import { Router } from "express";

import { requireAuth } from "../../middleware/auth.js";
import { createBoardRoute } from "./create.js";
import { listBoardsRoute } from "./list.js";
import { getBoardByIdRoute } from "./get-by-id.js";
import { updateBoardRoute } from "./update.js";
import { deleteBoardRoute } from "./delete.js";
import { restoreBoardRoute } from "./restore.js";

const router = Router();

router.use(requireAuth);

router.post("/", createBoardRoute);
router.get("/", listBoardsRoute);
router.get("/:id", getBoardByIdRoute);
router.patch("/:id", updateBoardRoute);
router.delete("/:id", deleteBoardRoute);
router.post("/:id/restore", restoreBoardRoute);

export default router;