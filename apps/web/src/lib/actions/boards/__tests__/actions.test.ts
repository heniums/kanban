import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  mockAuth,
  mockGetBoardById,
  mockGetBoardByIdIncludingDeleted,
  mockListBoardsByOwner,
  mockCreateBoard,
  mockUpdateBoard,
  mockSoftDeleteBoard,
  mockRestoreBoard,
} = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockGetBoardById: vi.fn(),
  mockGetBoardByIdIncludingDeleted: vi.fn(),
  mockListBoardsByOwner: vi.fn(),
  mockCreateBoard: vi.fn(),
  mockUpdateBoard: vi.fn(),
  mockSoftDeleteBoard: vi.fn(),
  mockRestoreBoard: vi.fn(),
}));

vi.mock("@/auth", () => ({
  auth: mockAuth,
}));

vi.mock("@/lib/data/boards", () => ({
  getBoardById: mockGetBoardById,
  getBoardByIdIncludingDeleted: mockGetBoardByIdIncludingDeleted,
  listBoardsByOwner: mockListBoardsByOwner,
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
import { getBoardAction } from "../get";
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
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
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
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    const formData = new FormData();
    formData.set("title", "");
    formData.set("background", "#000");

    const result = await createBoardAction(formData);
    expect(result).toHaveProperty("errors");
    expect(mockCreateBoard).not.toHaveBeenCalled();
  });

  it("rejects invalid background", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    const formData = new FormData();
    formData.set("title", "OK");
    formData.set("background", "<script>");

    const result = await createBoardAction(formData);
    expect(result).toHaveProperty("errors");
    expect(mockCreateBoard).not.toHaveBeenCalled();
  });

  it("throws Unauthorized when not signed in", async () => {
    mockAuth.mockResolvedValue(null);
    const formData = new FormData();
    formData.set("title", "OK");
    formData.set("background", "#000");

    await expect(createBoardAction(formData)).rejects.toThrow("Unauthorized");
    expect(mockCreateBoard).not.toHaveBeenCalled();
  });
});

describe("getBoardAction", () => {
  it("returns the board when caller is owner", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockGetBoardById.mockResolvedValue(SAMPLE_BOARD);

    const result = await getBoardAction("board-1");
    expect(result).toEqual(SAMPLE_BOARD);
  });

  it("returns null when board not found", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockGetBoardById.mockResolvedValue(null);

    const result = await getBoardAction("missing");
    expect(result).toBeNull();
  });

  it("throws Forbidden when caller is not owner", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-2" } });
    mockGetBoardById.mockResolvedValue(SAMPLE_BOARD);

    await expect(getBoardAction("board-1")).rejects.toThrow("Forbidden");
  });

  it("throws Unauthorized when not signed in", async () => {
    mockAuth.mockResolvedValue(null);
    await expect(getBoardAction("board-1")).rejects.toThrow("Unauthorized");
  });
});

describe("listBoardsAction", () => {
  it("returns owned boards for the current user", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockListBoardsByOwner.mockResolvedValue([SAMPLE_BOARD]);

    const result = await listBoardsAction();
    expect(result.owned).toEqual([SAMPLE_BOARD]);
    expect(result.shared).toEqual([]);
    expect(mockListBoardsByOwner).toHaveBeenCalledWith("user-1");
  });

  it("throws Unauthorized when not signed in", async () => {
    mockAuth.mockResolvedValue(null);
    await expect(listBoardsAction()).rejects.toThrow("Unauthorized");
  });
});

describe("updateBoardAction", () => {
  it("updates the board when caller is owner", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockGetBoardById.mockResolvedValue(SAMPLE_BOARD);
    mockUpdateBoard.mockResolvedValue({ ...SAMPLE_BOARD, title: "Updated" });

    const formData = new FormData();
    formData.set("title", "Updated");
    formData.set("background", "#000");

    const result = await updateBoardAction("board-1", formData);
    expect(result).toHaveProperty("board");
    expect(result.board?.title).toBe("Updated");
  });

  it("returns errors for invalid input", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    const formData = new FormData();
    formData.set("title", "OK");
    formData.set("background", "<script>alert(1)</script>");

    const result = await updateBoardAction("board-1", formData);
    expect(result).toHaveProperty("errors");
    expect(mockGetBoardById).not.toHaveBeenCalled();
  });

  it("returns errors when board not found", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockGetBoardById.mockResolvedValue(null);
    const formData = new FormData();
    formData.set("title", "Updated");
    formData.set("background", "#000");

    const result = await updateBoardAction("board-1", formData);
    expect(result).toHaveProperty("errors");
    expect(mockUpdateBoard).not.toHaveBeenCalled();
  });

  it("throws Forbidden when caller is not owner", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-2" } });
    mockGetBoardById.mockResolvedValue(SAMPLE_BOARD);
    const formData = new FormData();
    formData.set("title", "Updated");
    formData.set("background", "#000");

    await expect(updateBoardAction("board-1", formData)).rejects.toThrow("Forbidden");
    expect(mockUpdateBoard).not.toHaveBeenCalled();
  });
});

describe("deleteBoardAction", () => {
  it("soft-deletes when caller is owner", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockGetBoardById.mockResolvedValue(SAMPLE_BOARD);
    mockSoftDeleteBoard.mockResolvedValue(SAMPLE_BOARD);

    const result = await deleteBoardAction("board-1");
    expect(result).toEqual({ success: true });
    expect(mockSoftDeleteBoard).toHaveBeenCalledWith("board-1");
  });

  it("throws Board not found when board missing", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockGetBoardById.mockResolvedValue(null);

    await expect(deleteBoardAction("board-1")).rejects.toThrow("Board not found");
    expect(mockSoftDeleteBoard).not.toHaveBeenCalled();
  });

  it("throws Forbidden when caller is not owner", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-2" } });
    mockGetBoardById.mockResolvedValue(SAMPLE_BOARD);

    await expect(deleteBoardAction("board-1")).rejects.toThrow("Forbidden");
    expect(mockSoftDeleteBoard).not.toHaveBeenCalled();
  });
});

describe("restoreBoardAction", () => {
  it("restores a soft-deleted board when caller is owner", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockGetBoardByIdIncludingDeleted.mockResolvedValue(SAMPLE_BOARD);
    mockRestoreBoard.mockResolvedValue(SAMPLE_BOARD);

    const result = await restoreBoardAction("board-1");
    expect(result).toEqual({ success: true });
    expect(mockRestoreBoard).toHaveBeenCalledWith("board-1");
  });

  it("throws Board not found when board missing", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockGetBoardByIdIncludingDeleted.mockResolvedValue(null);

    await expect(restoreBoardAction("board-1")).rejects.toThrow("Board not found");
    expect(mockRestoreBoard).not.toHaveBeenCalled();
  });

  it("throws Forbidden when caller is not owner", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-2" } });
    mockGetBoardByIdIncludingDeleted.mockResolvedValue(SAMPLE_BOARD);

    await expect(restoreBoardAction("board-1")).rejects.toThrow("Forbidden");
    expect(mockRestoreBoard).not.toHaveBeenCalled();
  });
});
