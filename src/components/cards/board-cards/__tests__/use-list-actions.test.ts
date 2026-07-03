import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useListActions } from "@/components/cards/board-cards/use-list-actions";

const { mockCreateListAction, mockRenameListAction, mockDeleteListAction } = vi.hoisted(() => ({
  mockCreateListAction: vi.fn(),
  mockRenameListAction: vi.fn(),
  mockDeleteListAction: vi.fn(),
}));

vi.mock("@/lib/actions/lists", () => ({
  createListAction: mockCreateListAction,
  renameListAction: mockRenameListAction,
  deleteListAction: mockDeleteListAction,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useListActions", () => {
  it("returns handleAddList, handleRenameList, handleDeleteList", () => {
    const { result } = renderHook(() => useListActions({ boardId: "b1" }));
    expect(result.current).toHaveProperty("handleAddList");
    expect(result.current).toHaveProperty("handleRenameList");
    expect(result.current).toHaveProperty("handleDeleteList");
  });

  it("handleAddList calls createListAction with boardId and title", async () => {
    mockCreateListAction.mockResolvedValue({ data: {} });
    const { result } = renderHook(() => useListActions({ boardId: "b1" }));
    await act(async () => {
      await result.current.handleAddList("New List");
    });
    expect(mockCreateListAction).toHaveBeenCalledWith({ boardId: "b1", title: "New List" });
  });

  it("handleRenameList calls renameListAction with listId and title", async () => {
    mockRenameListAction.mockResolvedValue({ data: {} });
    const { result } = renderHook(() => useListActions({ boardId: "b1" }));
    await act(async () => {
      await result.current.handleRenameList("l1", "Renamed");
    });
    expect(mockRenameListAction).toHaveBeenCalledWith({ listId: "l1", title: "Renamed" });
  });

  it("handleDeleteList calls deleteListAction with listId", async () => {
    mockDeleteListAction.mockResolvedValue({ success: true });
    const { result } = renderHook(() => useListActions({ boardId: "b1" }));
    await act(async () => {
      await result.current.handleDeleteList("l1");
    });
    expect(mockDeleteListAction).toHaveBeenCalledWith({ listId: "l1" });
  });
});
