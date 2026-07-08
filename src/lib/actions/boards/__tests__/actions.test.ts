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
  mockAssertBoardPermission,
} = vi.hoisted(() => ({
  mockVerifySession: vi.fn(),
  mockGetBoardById: vi.fn(),
  mockListBoardsByMember: vi.fn(),
  mockListBoardsByRole: vi.fn(),
  mockCreateBoard: vi.fn(),
  mockUpdateBoard: vi.fn(),
  mockSoftDeleteBoard: vi.fn(),
  mockRestoreBoard: vi.fn(),
  mockAssertBoardPermission: vi.fn(),
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

vi.mock("@/lib/actions/guards", () => ({
  assertBoardPermission: mockAssertBoardPermission,
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
  it("updates the board when caller has permission", async () => {
    mockVerifySession.mockResolvedValue({ userId: "user-1" });
    mockAssertBoardPermission.mockResolvedValue(true);
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
    mockAssertBoardPermission.mockResolvedValue(true);
    const formData = new FormData();
    formData.set("title", "OK");
    formData.set("background", "<script>alert(1)</script>");

    const result = await updateBoardAction("board-1", formData);
    expect(result).toHaveProperty("errors");
  });

  it("returns errors when board not found", async () => {
    mockVerifySession.mockResolvedValue({ userId: "user-1" });
    mockAssertBoardPermission.mockResolvedValue(true);
    mockUpdateBoard.mockResolvedValue(null);
    const formData = new FormData();
    formData.set("title", "Updated");
    formData.set("background", "#000");

    const result = await updateBoardAction("board-1", formData);
    expect(result).toHaveProperty("errors");
  });

  it("returns forbidden when user lacks permission", async () => {
    mockVerifySession.mockResolvedValue({ userId: "user-1" });
    mockAssertBoardPermission.mockResolvedValue(false);
    const formData = new FormData();
    formData.set("title", "Updated");
    formData.set("background", "#000");

    const result = await updateBoardAction("board-1", formData);
    expect(result).toHaveProperty("errors");
    expect(mockUpdateBoard).not.toHaveBeenCalled();
  });
});

describe("deleteBoardAction", () => {
  it("soft-deletes when caller has permission", async () => {
    mockVerifySession.mockResolvedValue({ userId: "user-1" });
    mockAssertBoardPermission.mockResolvedValue(true);
    mockSoftDeleteBoard.mockResolvedValue(SAMPLE_BOARD);

    const result = await deleteBoardAction("board-1");
    expect(result).toEqual({ success: true });
    expect(mockSoftDeleteBoard).toHaveBeenCalledWith("board-1");
  });

  it("returns error when board not found", async () => {
    mockVerifySession.mockResolvedValue({ userId: "user-1" });
    mockAssertBoardPermission.mockResolvedValue(true);
    mockSoftDeleteBoard.mockResolvedValue(null);

    const result = await deleteBoardAction("board-1");
    expect(result).toHaveProperty("error");
  });

  it("returns forbidden when user lacks permission", async () => {
    mockVerifySession.mockResolvedValue({ userId: "user-1" });
    mockAssertBoardPermission.mockResolvedValue(false);

    const result = await deleteBoardAction("board-1");
    expect(result).toHaveProperty("error");
    expect(mockSoftDeleteBoard).not.toHaveBeenCalled();
  });
});

describe("restoreBoardAction", () => {
  it("restores a soft-deleted board when caller has permission", async () => {
    mockVerifySession.mockResolvedValue({ userId: "user-1" });
    mockAssertBoardPermission.mockResolvedValue(true);
    mockRestoreBoard.mockResolvedValue(SAMPLE_BOARD);

    const result = await restoreBoardAction("board-1");
    expect(result).toEqual({ success: true });
    expect(mockRestoreBoard).toHaveBeenCalledWith("board-1");
  });

  it("checks permission including deleted boards", async () => {
    mockVerifySession.mockResolvedValue({ userId: "user-1" });
    mockAssertBoardPermission.mockResolvedValue(true);
    mockRestoreBoard.mockResolvedValue(SAMPLE_BOARD);

    await restoreBoardAction("board-1");
    expect(mockAssertBoardPermission).toHaveBeenCalledWith(
      "board-1",
      "user-1",
      expect.any(String),
      { includeDeleted: true },
    );
  });

  it("returns error when board not found", async () => {
    mockVerifySession.mockResolvedValue({ userId: "user-1" });
    mockAssertBoardPermission.mockResolvedValue(true);
    mockRestoreBoard.mockResolvedValue(null);

    const result = await restoreBoardAction("board-1");
    expect(result).toHaveProperty("error");
  });

  it("returns forbidden when user lacks permission", async () => {
    mockVerifySession.mockResolvedValue({ userId: "user-1" });
    mockAssertBoardPermission.mockResolvedValue(false);

    const result = await restoreBoardAction("board-1");
    expect(result).toHaveProperty("error");
    expect(mockRestoreBoard).not.toHaveBeenCalled();
  });
});
