import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useBoardCardStore } from "@/lib/realtime/board-store";
import { useCardDetail } from "@/components/cards/card-detail/use-card-detail";

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

    act(() => {
      useBoardCardStore.getState().openCard("c1");
    });
    await waitFor(() => expect(result.current.data).not.toBeNull());

    expect(result.current.data?.card.title).toBe("Test Card");

    act(() => {
      useBoardCardStore.getState().updateCard({
        ...baseCardDetail.card,
        title: "Updated Title",
      });
    });

    await waitFor(() => expect(result.current.data?.card.title).toBe("Updated Title"));
  });

  it("preserves dirty draft fields when remote update arrives", async () => {
    const { result } = renderHook(() =>
      useCardDetail({ boardId: "b1", lists: [{ id: "l1", title: "To Do" }] }),
    );

    act(() => {
      useBoardCardStore.getState().openCard("c1");
    });
    await waitFor(() => expect(result.current.data).not.toBeNull());

    act(() => {
      result.current.setDraft({
        title: "User's draft title",
        description: "User's draft description",
        dueDate: null,
        labelIds: [],
        assigneeIds: [],
      });
    });

    await waitFor(() => expect(result.current.isDirty).toBe(true));

    act(() => {
      useBoardCardStore.getState().updateCard({
        ...baseCardDetail.card,
        title: "Remote Updated Title",
        description: "Remote updated description",
      });
    });

    await waitFor(() => expect(result.current.draft?.title).toBe("User's draft title"));
    expect(result.current.draft?.description).toBe("User's draft description");
  });

  it("updates clean fields when remote update arrives", async () => {
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

    act(() => {
      useBoardCardStore.getState().openCard("c1");
    });
    await waitFor(() => expect(result.current.data).not.toBeNull());

    expect(result.current.data?.card.dueDate).toBeNull();

    act(() => {
      useBoardCardStore.getState().updateCard({
        ...baseCardDetail.card,
        dueDate: new Date("2026-12-31"),
      });
    });

    await waitFor(() => expect(result.current.data?.card.dueDate).toEqual(new Date("2026-12-31")));
  });

  it("does not update when a different card is updated", async () => {
    const { result } = renderHook(() =>
      useCardDetail({ boardId: "b1", lists: [{ id: "l1", title: "To Do" }] }),
    );

    act(() => {
      useBoardCardStore.getState().openCard("c1");
    });
    await waitFor(() => expect(result.current.data).not.toBeNull());

    const originalTitle = result.current.data?.card.title;

    act(() => {
      useBoardCardStore.getState().updateCard({
        ...baseCardDetail.card,
        id: "c2",
        title: "Different Card Update",
      });
    });

    await waitFor(() => expect(result.current.data?.card.title).toBe(originalTitle));
  });

  it("does not crash when update arrives after card is closed", async () => {
    const { result } = renderHook(() =>
      useCardDetail({ boardId: "b1", lists: [{ id: "l1", title: "To Do" }] }),
    );

    act(() => {
      useBoardCardStore.getState().openCard("c1");
    });
    await waitFor(() => expect(result.current.data).not.toBeNull());

    expect(result.current.data?.card.title).toBe("Test Card");

    // Close the card
    act(() => {
      result.current.close();
    });
    await waitFor(() => expect(result.current.open).toBe(false));
    expect(result.current.data).toBeNull();

    // Update should not crash when card is closed
    act(() => {
      useBoardCardStore.getState().updateCard({
        ...baseCardDetail.card,
        title: "Updated After Close",
      });
    });

    // Modal should remain closed and data null
    await waitFor(() => expect(result.current.open).toBe(false));
    expect(result.current.data).toBeNull();
  });

  it("handles multiple rapid updates correctly", async () => {
    const { result } = renderHook(() =>
      useCardDetail({ boardId: "b1", lists: [{ id: "l1", title: "To Do" }] }),
    );

    useBoardCardStore
      .getState()
      .setInitial(
        "b1",
        [{ id: "l1", title: "To Do", position: 0 }],
        [{ ...baseCardDetail.card, title: "Initial Title" }],
      );

    act(() => {
      useBoardCardStore.getState().openCard("c1");
    });
    await waitFor(() => expect(result.current.data).not.toBeNull());

    // After opening, fetch returns baseCardDetail which has title "Test Card"
    expect(result.current.data?.card.title).toBe("Test Card");

    // Simulate multiple rapid updates
    act(() => {
      useBoardCardStore.getState().updateCard({
        ...baseCardDetail.card,
        title: "Update 1",
      });
    });

    act(() => {
      useBoardCardStore.getState().updateCard({
        ...baseCardDetail.card,
        title: "Update 2",
      });
    });

    act(() => {
      useBoardCardStore.getState().updateCard({
        ...baseCardDetail.card,
        title: "Update 3",
      });
    });

    // Should have the latest update
    await waitFor(() => expect(result.current.data?.card.title).toBe("Update 3"));
  });

  it("updates labels when remote update includes new labels", async () => {
    const { result } = renderHook(() =>
      useCardDetail({ boardId: "b1", lists: [{ id: "l1", title: "To Do" }] }),
    );

    useBoardCardStore
      .getState()
      .setInitial(
        "b1",
        [{ id: "l1", title: "To Do", position: 0 }],
        [{ ...baseCardDetail.card, labels: [] }],
      );

    act(() => {
      useBoardCardStore.getState().openCard("c1");
    });
    await waitFor(() => expect(result.current.data).not.toBeNull());

    expect(result.current.data?.labels).toEqual([]);

    act(() => {
      useBoardCardStore.getState().updateCard({
        ...baseCardDetail.card,
        labels: [{ id: "lbl1", name: "Bug", color: "#ff0000" }],
      });
    });

    await waitFor(() =>
      expect(result.current.data?.labels).toEqual([{ id: "lbl1", name: "Bug", color: "#ff0000" }]),
    );
  });
});
