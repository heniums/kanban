import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { BoardCards } from "@/components/cards/board-cards";
import type { List } from "@/lib/db/schema/lists";
import type { CardSummary } from "@/components/cards/card-item";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}));

vi.mock("@/lib/actions/cards", () => ({
  createCardAction: vi.fn().mockResolvedValue({ data: {} }),
  moveCardAction: vi.fn().mockResolvedValue({ data: {} }),
  reorderCardsAction: vi.fn().mockResolvedValue({ data: [] }),
  updateCardAction: vi.fn().mockResolvedValue({ data: {} }),
  deleteCardAction: vi.fn().mockResolvedValue({ data: { boardId: "b1" } }),
  copyCardAction: vi.fn().mockResolvedValue({ data: {} }),
}));

vi.mock("@/lib/actions/lists", () => ({
  createListAction: vi.fn().mockResolvedValue({ data: {} }),
  renameListAction: vi.fn().mockResolvedValue({ data: {} }),
  deleteListAction: vi.fn().mockResolvedValue({ success: true }),
  reorderListsAction: vi.fn().mockResolvedValue({ data: [] }),
}));

vi.mock("@/lib/actions/labels", () => ({
  createLabelAction: vi
    .fn()
    .mockResolvedValue({ data: { id: "x", boardId: "b1", name: "X", color: "#000" } }),
}));

vi.mock("@/lib/actions/checklists", () => ({
  createChecklistAction: vi.fn().mockResolvedValue({ data: { id: "cl1", cardId: "c1" } }),
  deleteChecklistAction: vi.fn().mockResolvedValue({ data: { cardId: "c1" } }),
  createChecklistItemAction: vi.fn().mockResolvedValue({ data: { id: "i1", checklistId: "cl1" } }),
  updateChecklistItemAction: vi.fn().mockResolvedValue({ data: { id: "i1" } }),
  deleteChecklistItemAction: vi.fn().mockResolvedValue({ data: { id: "i1" } }),
}));

vi.mock("@/lib/actions/comments", () => ({
  createCommentAction: vi.fn().mockResolvedValue({ data: { id: "cm1" } }),
  updateCommentAction: vi.fn().mockResolvedValue({ data: { id: "cm1" } }),
  deleteCommentAction: vi.fn().mockResolvedValue({ data: { cardId: "c1" } }),
}));

vi.mock("@/lib/realtime/use-board-socket", () => ({
  useBoardSocket: () => ({ current: null }),
}));

const baseLists: List[] = [
  {
    id: "l1",
    boardId: "b1",
    title: "To Do",
    position: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "l2",
    boardId: "b1",
    title: "Doing",
    position: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

function makeCard(id: string, listId: string, position: number, title: string): CardSummary {
  return {
    id,
    listId,
    boardId: "b1",
    title,
    description: null,
    dueDate: null,
    position,
    createdAt: new Date(),
    updatedAt: new Date(),
    labels: [],
    assignees: [],
    checklistProgress: null,
    commentCount: 0,
  };
}

function makeInitialCards(): Record<string, CardSummary[]> {
  return {
    l1: [
      makeCard("c1", "l1", 0, "Card 1"),
      makeCard("c2", "l1", 1, "Card 2"),
      makeCard("c3", "l1", 2, "Card 3"),
    ],
    l2: [makeCard("c4", "l2", 0, "Card 4")],
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  cleanup();
});

describe("BoardCards drag-and-drop wiring", () => {
  it("marks every card article as draggable (sortable) via dnd-kit's aria-roledescription", () => {
    render(
      <BoardCards boardId="b1" initialLists={baseLists} initialCardsByList={makeInitialCards()} />,
    );
    const cards = screen.getAllByTestId("card-item");
    expect(cards).toHaveLength(4);
    // dnd-kit's useSortable applies aria-roledescription="sortable" so the
    // entire card is exposed as a single drag handle, not a hidden button
    for (const c of cards) {
      expect(c.getAttribute("aria-roledescription")).toBe("sortable");
      expect(c.getAttribute("role")).toBe("button");
    }
  });

  it("does not render the legacy hidden 'Move card' button as the only drag handle", () => {
    render(
      <BoardCards boardId="b1" initialLists={baseLists} initialCardsByList={makeInitialCards()} />,
    );
    // The hidden sr-only button is gone — the article itself is the handle
    const moveButtons = screen.queryAllByRole("button", { name: /move card/i });
    expect(moveButtons).toHaveLength(0);
  });

  it("makes the article the pointer-event target for drag (cursor: grab)", () => {
    render(
      <BoardCards boardId="b1" initialLists={baseLists} initialCardsByList={makeInitialCards()} />,
    );
    const cards = screen.getAllByTestId("card-item");
    for (const c of cards) {
      expect(c.className).toMatch(/cursor-grab/);
    }
  });
});
