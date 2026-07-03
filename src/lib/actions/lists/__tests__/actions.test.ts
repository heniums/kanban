import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  mockVerifySession,
  mockCreateList,
  mockRenameList,
  mockDeleteList,
  mockReorderLists,
  mockAssertBoardOwnedBy,
} = vi.hoisted(() => ({
  mockVerifySession: vi.fn(),
  mockCreateList: vi.fn(),
  mockRenameList: vi.fn(),
  mockDeleteList: vi.fn(),
  mockReorderLists: vi.fn(),
  mockAssertBoardOwnedBy: vi.fn(),
}));

vi.mock("@/lib/dal", () => ({
  verifySession: mockVerifySession,
}));

vi.mock("@/lib/data/lists", () => ({
  createList: mockCreateList,
  renameList: mockRenameList,
  deleteList: mockDeleteList,
  reorderLists: mockReorderLists,
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/actions/guards", () => ({
  assertBoardOwnedBy: mockAssertBoardOwnedBy,
}));

const { mockEmitToBoard } = vi.hoisted(() => ({
  mockEmitToBoard: vi.fn(),
}));

vi.mock("@/lib/realtime/events", () => ({
  emitToBoard: mockEmitToBoard,
  REALTIME_EVENTS: {
    LIST_REORDERED: "list:reordered",
  },
}));

import { createListAction } from "../create";
import { renameListAction } from "../update";
import { deleteListAction } from "../delete";
import { reorderListsAction } from "../reorder";
import { emitToBoard, REALTIME_EVENTS } from "@/lib/realtime/events";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("createListAction", () => {
  it("creates a list with the session user as the owner scope", async () => {
    mockVerifySession.mockResolvedValue({ userId: "user-1" });
    mockAssertBoardOwnedBy.mockResolvedValue(true);
    mockCreateList.mockResolvedValue({
      id: "list-1",
      title: "Doing",
      boardId: "board-1",
      position: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await createListAction({
      boardId: "11111111-1111-1111-1111-111111111111",
      title: "Doing",
    });

    expect(mockCreateList).toHaveBeenCalledWith({
      boardId: "11111111-1111-1111-1111-111111111111",
      title: "Doing",
    });
    expect(result).toHaveProperty("list");
  });

  it("returns errors for invalid input", async () => {
    mockVerifySession.mockResolvedValue({ userId: "user-1" });
    const result = await createListAction({ boardId: "bad-uuid", title: "" });
    expect(result).toHaveProperty("errors");
    expect(mockCreateList).not.toHaveBeenCalled();
  });

  it("returns an error when the board is not owned", async () => {
    mockVerifySession.mockResolvedValue({ userId: "user-1" });
    mockAssertBoardOwnedBy.mockResolvedValue(false);
    const result = await createListAction({
      boardId: "11111111-1111-1111-1111-111111111111",
      title: "X",
    });
    expect(result).toHaveProperty("errors");
    expect(mockCreateList).not.toHaveBeenCalled();
  });

  it("redirects to /login when not signed in", async () => {
    mockVerifySession.mockRejectedValue(
      Object.assign(new Error("NEXT_REDIRECT"), { digest: "NEXT_REDIRECT;/login" }),
    );
    await expect(
      createListAction({
        boardId: "11111111-1111-1111-1111-111111111111",
        title: "X",
      }),
    ).rejects.toMatchObject({ digest: expect.stringContaining("NEXT_REDIRECT;/login") });
  });
});

describe("renameListAction", () => {
  it("renames the list and revalidates the board path", async () => {
    mockVerifySession.mockResolvedValue({ userId: "user-1" });
    mockRenameList.mockResolvedValue({ id: "l1", title: "New", boardId: "b1", position: 0 });

    const result = await renameListAction({
      listId: "11111111-1111-1111-1111-111111111111",
      title: "New",
    });

    expect(mockRenameList).toHaveBeenCalledWith(
      "11111111-1111-1111-1111-111111111111",
      { title: "New" },
      { ownerId: "user-1" },
    );
    expect(result).toHaveProperty("list");
  });

  it("returns errors for invalid input", async () => {
    mockVerifySession.mockResolvedValue({ userId: "user-1" });
    const result = await renameListAction({ listId: "bad", title: "" });
    expect(result).toHaveProperty("errors");
  });
});

describe("deleteListAction", () => {
  it("deletes the list and returns success", async () => {
    mockVerifySession.mockResolvedValue({ userId: "user-1" });
    mockDeleteList.mockResolvedValue({ id: "l1", boardId: "b1", position: 0 });

    const result = await deleteListAction({
      listId: "11111111-1111-1111-1111-111111111111",
    });

    expect(mockDeleteList).toHaveBeenCalledWith("11111111-1111-1111-1111-111111111111", {
      ownerId: "user-1",
    });
    expect(result).toEqual({ success: true });
  });

  it("returns an error if the list is not found or not owned", async () => {
    mockVerifySession.mockResolvedValue({ userId: "user-1" });
    mockDeleteList.mockResolvedValue(null);
    const result = await deleteListAction({
      listId: "11111111-1111-1111-1111-111111111111",
    });
    expect(result).toHaveProperty("error");
  });
});

describe("reorderListsAction", () => {
  it("reorders the lists and returns the updated list", async () => {
    mockVerifySession.mockResolvedValue({ userId: "user-1" });
    mockReorderLists.mockResolvedValue([{ id: "l2", boardId: "b1", position: 0, title: "B" }]);

    const result = await reorderListsAction({
      boardId: "11111111-1111-1111-1111-111111111111",
      orderedListIds: [
        "22222222-2222-2222-2222-222222222222",
        "33333333-3333-3333-3333-333333333333",
      ],
    });

    expect(mockReorderLists).toHaveBeenCalled();
    expect(result).toHaveProperty("lists");
  });

  it("returns errors for invalid input", async () => {
    mockVerifySession.mockResolvedValue({ userId: "user-1" });
    const result = await reorderListsAction({ boardId: "bad", orderedListIds: [] });
    expect(result).toHaveProperty("errors");
  });

  it("returns an error when the data layer rejects duplicate ids", async () => {
    mockVerifySession.mockResolvedValue({ userId: "user-1" });
    mockReorderLists.mockRejectedValue(new Error("orderedListIds must not contain duplicates"));
    const result = await reorderListsAction({
      boardId: "11111111-1111-1111-1111-111111111111",
      orderedListIds: [
        "22222222-2222-2222-2222-222222222222",
        "22222222-2222-2222-2222-222222222222",
      ],
    });
    expect(result).toHaveProperty("errors");
  });

  it("emits LIST_REORDERED after a successful reorder", async () => {
    mockVerifySession.mockResolvedValue({ userId: "user-1" });
    mockReorderLists.mockResolvedValue([
      { id: "l2", boardId: "b1", position: 0, title: "B" },
      { id: "l1", boardId: "b1", position: 1, title: "A" },
    ]);

    const boardId = "11111111-1111-1111-1111-111111111111";
    const orderedListIds = [
      "22222222-2222-2222-2222-222222222222",
      "33333333-3333-3333-3333-333333333333",
    ];

    const result = await reorderListsAction({ boardId, orderedListIds });

    expect(result).toHaveProperty("lists");
    expect(emitToBoard).toHaveBeenCalledWith(boardId, REALTIME_EVENTS.LIST_REORDERED, {
      boardId,
      orderedListIds,
    });
  });

  it("does not emit LIST_REORDERED on validation error", async () => {
    mockVerifySession.mockResolvedValue({ userId: "user-1" });
    const result = await reorderListsAction({ boardId: "bad", orderedListIds: [] });
    expect(result).toHaveProperty("errors");
    expect(emitToBoard).not.toHaveBeenCalled();
  });

  it("does not emit LIST_REORDERED when the data layer throws", async () => {
    mockVerifySession.mockResolvedValue({ userId: "user-1" });
    mockReorderLists.mockRejectedValue(new Error("orderedListIds must not contain duplicates"));
    const result = await reorderListsAction({
      boardId: "11111111-1111-1111-1111-111111111111",
      orderedListIds: [
        "22222222-2222-2222-2222-222222222222",
        "22222222-2222-2222-2222-222222222222",
      ],
    });
    expect(result).toHaveProperty("errors");
    expect(emitToBoard).not.toHaveBeenCalled();
  });
});
