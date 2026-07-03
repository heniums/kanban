import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCardCopy } from "@/components/cards/card-detail/use-card-copy";

const { mockCopyCardAction } = vi.hoisted(() => ({
  mockCopyCardAction: vi.fn(),
}));

vi.mock("@/lib/actions/cards", () => ({
  copyCardAction: mockCopyCardAction,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}));

describe("useCardCopy", () => {
  const mockData = {
    card: { id: "c1", listId: "l1", boardId: "b1", title: "Test" },
  } as any;
  const startTransition = vi.fn((fn: () => void) => {
    fn();
  });
  const router = { refresh: vi.fn(), push: vi.fn() };

  it("returns handleCopy", () => {
    const { result } = renderHook(() => useCardCopy({ data: mockData, startTransition, router }));
    expect(result.current).toHaveProperty("handleCopy");
  });

  it("handleCopy calls copyCardAction with cardId", async () => {
    mockCopyCardAction.mockResolvedValue({ data: {} });
    const { result } = renderHook(() => useCardCopy({ data: mockData, startTransition, router }));
    await act(async () => {
      result.current.handleCopy();
    });
    expect(mockCopyCardAction).toHaveBeenCalledWith({ cardId: "c1" });
    expect(router.refresh).toHaveBeenCalled();
  });
});
