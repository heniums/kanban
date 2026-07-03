import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCardDelete } from "@/components/cards/card-detail/use-card-delete";

const { mockDeleteCardAction } = vi.hoisted(() => ({
  mockDeleteCardAction: vi.fn(),
}));

vi.mock("@/lib/actions/cards", () => ({
  deleteCardAction: mockDeleteCardAction,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}));

describe("useCardDelete", () => {
  const mockData = {
    card: { id: "c1", listId: "l1", boardId: "b1", title: "Test" },
  } as any;
  const startTransition = vi.fn((fn: () => Promise<void>) => fn());
  const router = { refresh: vi.fn(), push: vi.fn() };
  const close = vi.fn();

  it("returns deleteOpen, setDeleteOpen, handleDelete", () => {
    const { result } = renderHook(() =>
      useCardDelete({ data: mockData, startTransition, router, close }),
    );
    expect(result.current).toHaveProperty("deleteOpen");
    expect(result.current).toHaveProperty("setDeleteOpen");
    expect(result.current).toHaveProperty("handleDelete");
    expect(result.current.deleteOpen).toBe(false);
  });

  it("handleDelete calls deleteCardAction with cardId", async () => {
    mockDeleteCardAction.mockResolvedValue({ data: {} });
    const { result } = renderHook(() =>
      useCardDelete({ data: mockData, startTransition, router, close }),
    );
    await act(async () => {
      result.current.handleDelete();
    });
    expect(mockDeleteCardAction).toHaveBeenCalledWith({ cardId: "c1" });
    expect(close).toHaveBeenCalled();
  });
});
