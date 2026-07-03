import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCardMove } from "@/components/cards/card-detail/use-card-move";

const { mockMoveCardAction } = vi.hoisted(() => ({
  mockMoveCardAction: vi.fn(),
}));

vi.mock("@/lib/actions/cards", () => ({
  moveCardAction: mockMoveCardAction,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}));

describe("useCardMove", () => {
  const mockData = {
    card: { id: "c1", listId: "l1", boardId: "b1", title: "Test" },
  } as any;
  const lists = [
    { id: "l1", title: "To Do" },
    { id: "l2", title: "Done" },
  ];
  const startTransition = vi.fn((fn: () => Promise<void>) => fn());
  const router = { refresh: vi.fn(), push: vi.fn() };
  const close = vi.fn();

  it("returns moveOpen, setMoveOpen, handleMove", () => {
    const { result } = renderHook(() =>
      useCardMove({ data: mockData, lists, startTransition, router, close }),
    );
    expect(result.current).toHaveProperty("moveOpen");
    expect(result.current).toHaveProperty("setMoveOpen");
    expect(result.current).toHaveProperty("handleMove");
    expect(result.current.moveOpen).toBe(false);
  });

  it("handleMove does nothing when target is the current list", () => {
    const { result } = renderHook(() =>
      useCardMove({ data: mockData, lists, startTransition, router, close }),
    );
    act(() => {
      result.current.handleMove("l1");
    });
    expect(mockMoveCardAction).not.toHaveBeenCalled();
    expect(result.current.moveOpen).toBe(false);
  });

  it("handleMove calls moveCardAction for a different list", async () => {
    mockMoveCardAction.mockResolvedValue({ data: {} });
    const { result } = renderHook(() =>
      useCardMove({ data: mockData, lists, startTransition, router, close }),
    );
    await act(async () => {
      result.current.handleMove("l2");
    });
    expect(mockMoveCardAction).toHaveBeenCalledWith({
      cardId: "c1",
      targetListId: "l2",
      targetPosition: 0,
    });
  });
});
