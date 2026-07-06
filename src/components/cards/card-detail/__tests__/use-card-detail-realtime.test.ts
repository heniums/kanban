import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useBoardCardStore } from "@/lib/realtime/board-store";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}));

vi.mock("next-auth", () => ({
  default: vi.fn(() => ({
    handlers: { GET: vi.fn(), POST: vi.fn() },
    signIn: vi.fn(),
    signOut: vi.fn(),
    auth: vi.fn(),
  })),
  handlers: { GET: vi.fn(), POST: vi.fn() },
  signIn: vi.fn(),
  signOut: vi.fn(),
  auth: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

const { mockUpdateCardAction } = vi.hoisted(() => ({
  mockUpdateCardAction: vi.fn(),
}));

vi.mock("@/lib/actions/cards", () => ({
  updateCardAction: mockUpdateCardAction,
}));

vi.mock("@/lib/realtime/use-board-socket", () => ({
  useBoardSocket: () => ({ current: null }),
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

const baseCardDetail = {
  card: {
    id: "c1",
    listId: "l1",
    boardId: "b1",
    title: "Test Card",
    description: "Test description",
    dueDate: null,
    position: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  labels: [],
  boardLabels: [],
  assignees: [],
  checklists: [],
  comments: [],
  boardMembers: [],
};

describe("useCardDetail real-time updates", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useBoardCardStore.setState({
      boardId: null,
      cardsByList: {},
      lists: [],
      cardsNeedingChecklistRefresh: new Set(),
      cardsNeedingCommentsRefresh: new Set(),
      labelUpdatedEvent: null,
      labelDeletedEvent: null,
      cardToOpen: null,
    });
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => baseCardDetail,
    });
  });

  it("updates card data when CARD_UPDATED event is received for the open card", async () => {
    const { useCardDetail } = await import("@/components/cards/card-detail/use-card-detail");
    const { result } = renderHook(() =>
      useCardDetail({ boardId: "b1", lists: [{ id: "l1", title: "To Do" }] }),
    );

    useBoardCardStore
      .getState()
      .setInitial(
        "b1",
        [{ id: "l1", title: "To Do", position: 0 }],
        [{ ...baseCardDetail.card, title: "Test Card" }],
      );

    await act(async () => {
      useBoardCardStore.getState().openCard("c1");
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    expect(result.current.data?.card.title).toBe("Test Card");

    act(() => {
      useBoardCardStore.getState().updateCard({
        ...baseCardDetail.card,
        title: "Updated Title",
      });
    });

    expect(result.current.data?.card.title).toBe("Updated Title");
  });

  it("preserves dirty draft fields when remote update arrives", async () => {
    const { useCardDetail } = await import("@/components/cards/card-detail/use-card-detail");
    const { result } = renderHook(() =>
      useCardDetail({ boardId: "b1", lists: [{ id: "l1", title: "To Do" }] }),
    );

    await act(async () => {
      useBoardCardStore.getState().openCard("c1");
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    act(() => {
      result.current.setDraft({
        title: "User's draft title",
        description: "User's draft description",
        dueDate: null,
        labelIds: [],
        assigneeIds: [],
      });
    });

    expect(result.current.isDirty).toBe(true);

    act(() => {
      useBoardCardStore.getState().updateCard({
        ...baseCardDetail.card,
        title: "Remote Updated Title",
        description: "Remote updated description",
      });
    });

    expect(result.current.draft?.title).toBe("User's draft title");
    expect(result.current.draft?.description).toBe("User's draft description");
  });

  it("updates clean fields when remote update arrives", async () => {
    const { useCardDetail } = await import("@/components/cards/card-detail/use-card-detail");
    const { result } = renderHook(() =>
      useCardDetail({ boardId: "b1", lists: [{ id: "l1", title: "To Do" }] }),
    );

    useBoardCardStore
      .getState()
      .setInitial(
        "b1",
        [{ id: "l1", title: "To Do", position: 0 }],
        [{ ...baseCardDetail.card, dueDate: null }],
      );

    await act(async () => {
      useBoardCardStore.getState().openCard("c1");
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    expect(result.current.data?.card.dueDate).toBeNull();

    act(() => {
      useBoardCardStore.getState().updateCard({
        ...baseCardDetail.card,
        dueDate: new Date("2026-12-31"),
      });
    });

    expect(result.current.data?.card.dueDate).toEqual(new Date("2026-12-31"));
  });

  it("does not update when a different card is updated", async () => {
    const { useCardDetail } = await import("@/components/cards/card-detail/use-card-detail");
    const { result } = renderHook(() =>
      useCardDetail({ boardId: "b1", lists: [{ id: "l1", title: "To Do" }] }),
    );

    await act(async () => {
      useBoardCardStore.getState().openCard("c1");
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    const originalTitle = result.current.data?.card.title;

    act(() => {
      useBoardCardStore.getState().updateCard({
        ...baseCardDetail.card,
        id: "c2",
        title: "Different Card Update",
      });
    });

    expect(result.current.data?.card.title).toBe(originalTitle);
  });
});
