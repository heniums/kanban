import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  mockVerifySession,
  mockGetBoardById,
  mockListBoardsByMember,
  mockListBoardsByRole,
  mockCreateBoard,
  mockUpdateBoard,
  mockSoftDeleteBoard,
  mockRestoreBoard,
} = vi.hoisted(() => ({
  mockVerifySession: vi.fn(),
  mockGetBoardById: vi.fn(),
  mockListBoardsByMember: vi.fn(),
  mockListBoardsByRole: vi.fn(),
  mockCreateBoard: vi.fn(),
  mockUpdateBoard: vi.fn(),
  mockSoftDeleteBoard: vi.fn(),
  mockRestoreBoard: vi.fn(),
}));

vi.mock("@/lib/dal", () => ({
  verifySession: mockVerifySession,
}));

vi.mock("@/lib/data/boards", () => ({
  getBoardById: mockGetBoardById,
  listBoardsByMember: mockListBoardsByMember,
  listBoardsByRole: mockListBoardsByRole,
  createBoard: mockCreateBoard,
  updateBoard: mockUpdateBoard,
  softDeleteBoard: mockSoftDeleteBoard,
  restoreBoard: mockRestoreBoard,
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    const err: any = new Error("NEXT_REDIRECT");
    err.digest = `NEXT_REDIRECT;${url}`;
    throw err;
  }),
}));

import { createBoardAction } from "../create";
import { listBoardsAction } from "../list";
import { updateBoardAction } from "../update";
import { deleteBoardAction } from "../delete";
import { restoreBoardAction } from "../restore";

const SAMPLE_BOARD = {
  id: "board-1",
  title: "Test",
  description: null,
  background: "#000",
  ownerId: "user-1",
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("createBoardAction", () => {
  it("creates a board with the session user's id and redirects", async () => {
    mockVerifySession.mockResolvedValue({ userId: "user-1" });
    mockCreateBoard.mockResolvedValue(SAMPLE_BOARD);

    const formData = new FormData();
    formData.set("title", "My Board");
    formData.set("background", "#000");

    await expect(createBoardAction(formData)).rejects.toThrow("NEXT_REDIRECT");
    expect(mockCreateBoard).toHaveBeenCalledWith({
      title: "My Board",
      description: undefined,
      background: "#000",
      ownerId: "user-1",
    });
  });

  it("rejects empty title via Zod validation", async () => {
    mockVerifySession.mockResolvedValue({ userId: "user-1" });
    const formData = new FormData();
    formData.set("title", "");
    formData.set("background", "#000");

    const result = await createBoardAction(formData);
    expect(result).toHaveProperty("errors");
    expect(mockCreateBoard).not.toHaveBeenCalled();
  });

  it("rejects invalid background", async () => {
    mockVerifySession.mockResolvedValue({ userId: "user-1" });
    const formData = new FormData();
    formData.set("title", "OK");
    formData.set("background", "<script>");

    const result = await createBoardAction(formData);
    expect(result).toHaveProperty("errors");
    expect(mockCreateBoard).not.toHaveBeenCalled();
  });

  it("redirects to /login when not signed in", async () => {
    mockVerifySession.mockRejectedValue(new Error("NEXT_REDIRECT"));
    const formData = new FormData();
    formData.set("title", "OK");
    formData.set("background", "#000");

    await expect(createBoardAction(formData)).rejects.toThrow("NEXT_REDIRECT");
    expect(mockCreateBoard).not.toHaveBeenCalled();
  });
});

describe("listBoardsAction", () => {
  it("returns boards for the current user", async () => {
    mockVerifySession.mockResolvedValue({ userId: "user-1" });
    mockListBoardsByRole.mockResolvedValue({ owned: [SAMPLE_BOARD], shared: [] });

    const result = await listBoardsAction();
    expect(result.owned).toEqual([SAMPLE_BOARD]);
    expect(result.shared).toEqual([]);
    expect(mockListBoardsByRole).toHaveBeenCalledWith("user-1");
  });

  it("redirects to /login when not signed in", async () => {
    mockVerifySession.mockRejectedValue(new Error("NEXT_REDIRECT"));
    await expect(listBoardsAction()).rejects.toThrow("NEXT_REDIRECT");
  });
});

describe("updateBoardAction", () => {
  it("updates the board when caller is owner", async () => {
    mockVerifySession.mockResolvedValue({ userId: "user-1" });
    mockUpdateBoard.mockResolvedValue({ ...SAMPLE_BOARD, title: "Updated" });

    const formData = new FormData();
    formData.set("title", "Updated");
    formData.set("background", "#000");

    const result = await updateBoardAction("board-1", formData);
    expect(result).toHaveProperty("board");
    if ("board" in result) {
      expect(result.board.title).toBe("Updated");
    }
  });

  it("returns errors for invalid input", async () => {
    mockVerifySession.mockResolvedValue({ userId: "user-1" });
    const formData = new FormData();
    formData.set("title", "OK");
    formData.set("background", "<script>alert(1)</script>");

    const result = await updateBoardAction("board-1", formData);
    expect(result).toHaveProperty("errors");
  });

  it("returns errors when board not found or not owned", async () => {
    mockVerifySession.mockResolvedValue({ userId: "user-1" });
    mockUpdateBoard.mockResolvedValue(null);
    const formData = new FormData();
    formData.set("title", "Updated");
    formData.set("background", "#000");

    const result = await updateBoardAction("board-1", formData);
    expect(result).toHaveProperty("errors");
  });
});

describe("deleteBoardAction", () => {
  it("soft-deletes when caller is owner", async () => {
    mockVerifySession.mockResolvedValue({ userId: "user-1" });
    mockSoftDeleteBoard.mockResolvedValue(SAMPLE_BOARD);

    const result = await deleteBoardAction("board-1");
    expect(result).toEqual({ success: true });
    expect(mockSoftDeleteBoard).toHaveBeenCalledWith("board-1", { ownerId: "user-1" });
  });

  it("returns error when board not found or not owned", async () => {
    mockVerifySession.mockResolvedValue({ userId: "user-1" });
    mockSoftDeleteBoard.mockResolvedValue(null);

    const result = await deleteBoardAction("board-1");
    expect(result).toHaveProperty("error");
  });
});

describe("restoreBoardAction", () => {
  it("restores a soft-deleted board when caller is owner", async () => {
    mockVerifySession.mockResolvedValue({ userId: "user-1" });
    mockRestoreBoard.mockResolvedValue(SAMPLE_BOARD);

    const result = await restoreBoardAction("board-1");
    expect(result).toEqual({ success: true });
    expect(mockRestoreBoard).toHaveBeenCalledWith("board-1", { ownerId: "user-1" });
  });

  it("returns error when board not found or not owned", async () => {
    mockVerifySession.mockResolvedValue({ userId: "user-1" });
    mockRestoreBoard.mockResolvedValue(null);

    const result = await restoreBoardAction("board-1");
    expect(result).toHaveProperty("error");
  });
});
