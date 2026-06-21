import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";

vi.mock("../db.js", () => ({ createDbClient: vi.fn() }));
vi.mock("../services/boards/create-board.js", () => ({
  createBoard: vi.fn(),
}));

import { createBoard } from "../services/boards/create-board.js";
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
