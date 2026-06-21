import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";

vi.mock("../db.js", () => ({ createDbClient: vi.fn() }));
vi.mock("../services/boards/create-board.js", () => ({
  createBoard: vi.fn(),
}));
vi.mock("../services/boards/get-board-by-id.js", () => ({
  getBoardById: vi.fn(),
}));
vi.mock("../services/boards/list-boards-by-owner.js", () => ({
  listBoardsByOwner: vi.fn(),
}));
vi.mock("../services/boards/list-shared-boards.js", () => ({
  listSharedBoards: vi.fn(),
}));
vi.mock("../services/boards/update-board.js", () => ({
  updateBoard: vi.fn(),
}));

import { createBoard } from "../services/boards/create-board.js";
import { getBoardById } from "../services/boards/get-board-by-id.js";
import { listBoardsByOwner } from "../services/boards/list-boards-by-owner.js";
import { listSharedBoards } from "../services/boards/list-shared-boards.js";
import { updateBoard } from "../services/boards/update-board.js";
import { createDbClient } from "../db.js";

const mockBoard = {
  id: "board-1",
  title: "Test Board",
  description: null,
  background: "#1a1a2e",
  ownerId: "user-1",
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

describe("POST /api/boards", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createDbClient).mockReturnValue({} as never);
  });

  it("creates a board and returns 201", async () => {
    vi.mocked(createBoard).mockResolvedValue(mockBoard);

    const res = await request(createApp())
      .post("/api/boards")
      .set("x-user-id", "user-1")
      .send({ title: "Test Board", background: "#1a1a2e" });

    expect(res.status).toBe(201);
    expect(res.body.board).toBeDefined();
    expect(res.body.board.title).toBe("Test Board");
    expect(createBoard).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        title: "Test Board",
        background: "#1a1a2e",
        ownerId: "user-1",
      })
    );
  });

  it("creates a board with description", async () => {
    vi.mocked(createBoard).mockResolvedValue({
      ...mockBoard,
      title: "With Desc",
      description: "A description",
    });

    const res = await request(createApp())
      .post("/api/boards")
      .set("x-user-id", "user-1")
      .send({ title: "With Desc", description: "A description", background: "#1a1a2e" });

    expect(res.status).toBe(201);
    expect(res.body.board.description).toBe("A description");
  });

  it("returns 401 without x-user-id header", async () => {
    const res = await request(createApp())
      .post("/api/boards")
      .send({ title: "Test Board", background: "#1a1a2e" });

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/authentication/i);
    expect(createBoard).not.toHaveBeenCalled();
  });

  it("returns 400 for empty title", async () => {
    const res = await request(createApp())
      .post("/api/boards")
      .set("x-user-id", "user-1")
      .send({ title: "", background: "#1a1a2e" });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/validation/i);
    expect(createBoard).not.toHaveBeenCalled();
  });

  it("returns 400 for missing title", async () => {
    const res = await request(createApp())
      .post("/api/boards")
      .set("x-user-id", "user-1")
      .send({ background: "#1a1a2e" });

    expect(res.status).toBe(400);
    expect(createBoard).not.toHaveBeenCalled();
  });

  it("returns 400 for missing background", async () => {
    const res = await request(createApp())
      .post("/api/boards")
      .set("x-user-id", "user-1")
      .send({ title: "Test Board" });

    expect(res.status).toBe(400);
    expect(createBoard).not.toHaveBeenCalled();
  });

  it("returns 400 for title over 100 characters", async () => {
    const res = await request(createApp())
      .post("/api/boards")
      .set("x-user-id", "user-1")
      .send({ title: "a".repeat(101), background: "#1a1a2e" });

    expect(res.status).toBe(400);
    expect(createBoard).not.toHaveBeenCalled();
  });

  it("returns 500 on service error", async () => {
    vi.mocked(createBoard).mockRejectedValue(new Error("DB error"));

    const res = await request(createApp())
      .post("/api/boards")
      .set("x-user-id", "user-1")
      .send({ title: "Test Board", background: "#1a1a2e" });

    expect(res.status).toBe(500);
  });
});

describe("GET /api/boards", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createDbClient).mockReturnValue({} as never);
  });

  it("returns owned and shared boards", async () => {
    vi.mocked(listBoardsByOwner).mockResolvedValue([mockBoard]);
    vi.mocked(listSharedBoards).mockResolvedValue([]);

    const res = await request(createApp())
      .get("/api/boards")
      .set("x-user-id", "user-1");

    expect(res.status).toBe(200);
    expect(res.body.owned).toHaveLength(1);
    expect(res.body.shared).toHaveLength(0);
    expect(listBoardsByOwner).toHaveBeenCalledWith(expect.anything(), "user-1");
    expect(listSharedBoards).toHaveBeenCalledWith(expect.anything(), "user-1");
  });

  it("returns 401 without x-user-id header", async () => {
    const res = await request(createApp()).get("/api/boards");

    expect(res.status).toBe(401);
    expect(listBoardsByOwner).not.toHaveBeenCalled();
  });

  it("returns 500 on service error", async () => {
    vi.mocked(listBoardsByOwner).mockRejectedValue(new Error("DB error"));

    const res = await request(createApp())
      .get("/api/boards")
      .set("x-user-id", "user-1");

    expect(res.status).toBe(500);
  });
});

describe("GET /api/boards/:id", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createDbClient).mockReturnValue({} as never);
  });

  it("returns board when owner requests it", async () => {
    vi.mocked(getBoardById).mockResolvedValue(mockBoard);

    const res = await request(createApp())
      .get("/api/boards/board-1")
      .set("x-user-id", "user-1");

    expect(res.status).toBe(200);
    expect(res.body.board).toBeDefined();
    expect(res.body.board.id).toBe("board-1");
    expect(getBoardById).toHaveBeenCalledWith(expect.anything(), "board-1");
  });

  it("returns 403 when non-owner requests it", async () => {
    vi.mocked(getBoardById).mockResolvedValue(mockBoard);

    const res = await request(createApp())
      .get("/api/boards/board-1")
      .set("x-user-id", "user-2");

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/forbidden/i);
  });

  it("returns 404 when board not found", async () => {
    vi.mocked(getBoardById).mockResolvedValue(null);

    const res = await request(createApp())
      .get("/api/boards/nonexistent")
      .set("x-user-id", "user-1");

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/not found/i);
  });

  it("returns 401 without x-user-id header", async () => {
    const res = await request(createApp()).get("/api/boards/board-1");

    expect(res.status).toBe(401);
    expect(getBoardById).not.toHaveBeenCalled();
  });

  it("returns 500 on service error", async () => {
    vi.mocked(getBoardById).mockRejectedValue(new Error("DB error"));

    const res = await request(createApp())
      .get("/api/boards/board-1")
      .set("x-user-id", "user-1");

    expect(res.status).toBe(500);
  });
});

describe("PATCH /api/boards/:id", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createDbClient).mockReturnValue({} as never);
  });

  it("updates board title when owner", async () => {
    vi.mocked(getBoardById).mockResolvedValue(mockBoard);
    vi.mocked(updateBoard).mockResolvedValue({ ...mockBoard, title: "Updated" });

    const res = await request(createApp())
      .patch("/api/boards/board-1")
      .set("x-user-id", "user-1")
      .send({ title: "Updated" });

    expect(res.status).toBe(200);
    expect(res.body.board.title).toBe("Updated");
    expect(updateBoard).toHaveBeenCalledWith(expect.anything(), "board-1", { title: "Updated" });
  });

  it("updates board background when owner", async () => {
    vi.mocked(getBoardById).mockResolvedValue(mockBoard);
    vi.mocked(updateBoard).mockResolvedValue({ ...mockBoard, background: "#ff0000" });

    const res = await request(createApp())
      .patch("/api/boards/board-1")
      .set("x-user-id", "user-1")
      .send({ background: "#ff0000" });

    expect(res.status).toBe(200);
    expect(res.body.board.background).toBe("#ff0000");
  });

  it("updates board description when owner", async () => {
    vi.mocked(getBoardById).mockResolvedValue(mockBoard);
    vi.mocked(updateBoard).mockResolvedValue({ ...mockBoard, description: "New desc" });

    const res = await request(createApp())
      .patch("/api/boards/board-1")
      .set("x-user-id", "user-1")
      .send({ description: "New desc" });

    expect(res.status).toBe(200);
    expect(res.body.board.description).toBe("New desc");
  });

  it("returns 403 when non-owner updates", async () => {
    vi.mocked(getBoardById).mockResolvedValue(mockBoard);

    const res = await request(createApp())
      .patch("/api/boards/board-1")
      .set("x-user-id", "user-2")
      .send({ title: "Updated" });

    expect(res.status).toBe(403);
    expect(updateBoard).not.toHaveBeenCalled();
  });

  it("returns 404 when board not found", async () => {
    vi.mocked(getBoardById).mockResolvedValue(null);

    const res = await request(createApp())
      .patch("/api/boards/nonexistent")
      .set("x-user-id", "user-1")
      .send({ title: "Updated" });

    expect(res.status).toBe(404);
    expect(updateBoard).not.toHaveBeenCalled();
  });

  it("returns 400 for empty title", async () => {
    const res = await request(createApp())
      .patch("/api/boards/board-1")
      .set("x-user-id", "user-1")
      .send({ title: "" });

    expect(res.status).toBe(400);
    expect(updateBoard).not.toHaveBeenCalled();
  });

  it("returns 400 for title over 100 characters", async () => {
    const res = await request(createApp())
      .patch("/api/boards/board-1")
      .set("x-user-id", "user-1")
      .send({ title: "a".repeat(101) });

    expect(res.status).toBe(400);
    expect(updateBoard).not.toHaveBeenCalled();
  });

  it("returns 401 without x-user-id header", async () => {
    const res = await request(createApp())
      .patch("/api/boards/board-1")
      .send({ title: "Updated" });

    expect(res.status).toBe(401);
    expect(updateBoard).not.toHaveBeenCalled();
  });

  it("returns 500 on service error", async () => {
    vi.mocked(getBoardById).mockResolvedValue(mockBoard);
    vi.mocked(updateBoard).mockRejectedValue(new Error("DB error"));

    const res = await request(createApp())
      .patch("/api/boards/board-1")
      .set("x-user-id", "user-1")
      .send({ title: "Updated" });

    expect(res.status).toBe(500);
  });
});
