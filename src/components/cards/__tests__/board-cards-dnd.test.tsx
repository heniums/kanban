import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { BoardCards } from "@/components/cards/board-cards";
import { useBoardCardStore } from "@/lib/realtime/board-store";
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
  reorderListsAction: vi.fn().mockResolvedValue({ lists: [] }),
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

vi.mock("@/lib/actions/attachments", () => ({
  createAttachmentAction: vi
    .fn()
    .mockResolvedValue({ attachment: { id: "a1", createdBy: "u1", createdAt: new Date() } }),
  deleteAttachmentAction: vi.fn().mockResolvedValue({ success: true }),
  listCardAttachmentsAction: vi.fn().mockResolvedValue({ attachments: [] }),
}));

vi.mock("@/components/upload/image-upload", () => ({
  ImageUpload: () => null,
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

const originalGetBoundingClientRect = HTMLElement.prototype.getBoundingClientRect;

beforeAll(() => {
  HTMLElement.prototype.getBoundingClientRect = function () {
    const testId = this.getAttribute("data-testid");
    if (testId?.startsWith("sortable-list-")) {
      const id = testId.replace("sortable-list-", "");
      const index = baseLists.findIndex((l) => l.id === id);
      const x = index * 320;
      return {
        x,
        y: 0,
        width: 300,
        height: 200,
        top: 0,
        left: x,
        right: x + 300,
        bottom: 200,
        toJSON: () => ({}),
      } as DOMRect;
    }
    return {
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      toJSON: () => ({}),
    } as DOMRect;
  };
});

afterAll(() => {
  HTMLElement.prototype.getBoundingClientRect = originalGetBoundingClientRect;
});

beforeEach(() => {
  vi.clearAllMocks();
  cleanup();
  useBoardCardStore.setState({ boardId: null, cardsByList: {}, lists: [] });
});

describe("BoardCards drag-and-drop wiring", () => {
  it("marks every card wrapper as draggable (sortable) via dnd-kit's aria-roledescription", () => {
    render(
      <BoardCards boardId="b1" initialLists={baseLists} initialCardsByList={makeInitialCards()} />,
    );
    const cards = screen.getAllByTestId("card-item");
    expect(cards).toHaveLength(4);
    for (const c of cards) {
      const wrapper = c.parentElement;
      expect(wrapper).not.toBeNull();
      expect(wrapper!.getAttribute("aria-roledescription")).toBe("sortable");
      expect(wrapper!.getAttribute("role")).toBe("button");
    }
  });

  it("does not render the legacy hidden 'Move card' button as the only drag handle", () => {
    render(
      <BoardCards boardId="b1" initialLists={baseLists} initialCardsByList={makeInitialCards()} />,
    );
    const moveButtons = screen.queryAllByRole("button", { name: /move card/i });
    expect(moveButtons).toHaveLength(0);
  });

  it("makes the sortable wrapper the drag handle with cursor: grab", () => {
    render(
      <BoardCards boardId="b1" initialLists={baseLists} initialCardsByList={makeInitialCards()} />,
    );
    const cards = screen.getAllByTestId("card-item");
    for (const c of cards) {
      const wrapper = c.parentElement;
      expect(wrapper).not.toBeNull();
      expect(wrapper!.className).toMatch(/cursor-grab/);
    }
  });

  it("updates the store when initialLists changes after a server reorder", () => {
    const { rerender } = render(
      <BoardCards boardId="b1" initialLists={baseLists} initialCardsByList={makeInitialCards()} />,
    );
    expect(useBoardCardStore.getState().lists.map((l) => l.id)).toEqual(["l1", "l2"]);

    const reordered = [baseLists[1], baseLists[0]];
    rerender(
      <BoardCards boardId="b1" initialLists={reordered} initialCardsByList={makeInitialCards()} />,
    );
    expect(useBoardCardStore.getState().lists.map((l) => l.id)).toEqual(["l2", "l1"]);
  });

  it("reflects a renamed list in the store when initialLists changes", () => {
    const { rerender } = render(
      <BoardCards boardId="b1" initialLists={baseLists} initialCardsByList={makeInitialCards()} />,
    );
    expect(screen.getByRole("heading", { name: "To Do" })).toBeTruthy();

    const renamed = [{ ...baseLists[0], title: "Backlog" }, baseLists[1]];
    rerender(
      <BoardCards boardId="b1" initialLists={renamed} initialCardsByList={makeInitialCards()} />,
    );
    expect(useBoardCardStore.getState().lists[0].title).toBe("Backlog");
    expect(screen.getByRole("heading", { name: "Backlog" })).toBeTruthy();
  });

  it("removes a deleted list from the store when initialLists changes", () => {
    const { rerender } = render(
      <BoardCards boardId="b1" initialLists={baseLists} initialCardsByList={makeInitialCards()} />,
    );
    expect(screen.getByRole("heading", { name: "Doing" })).toBeTruthy();

    const afterDelete = [baseLists[0]];
    rerender(
      <BoardCards
        boardId="b1"
        initialLists={afterDelete}
        initialCardsByList={makeInitialCards()}
      />,
    );
    expect(useBoardCardStore.getState().lists.map((l) => l.id)).toEqual(["l1"]);
    expect(screen.queryByRole("heading", { name: "Doing" })).toBeNull();
  });
});
