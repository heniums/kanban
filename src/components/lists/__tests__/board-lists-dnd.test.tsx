import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { BoardLists } from "@/components/lists/board-lists";
import type { List } from "@/lib/db/schema/lists";
import { reorderListsAction } from "@/lib/actions/lists";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn(),
    push: vi.fn(),
  }),
}));

vi.mock("@/lib/actions/lists", () => ({
  createListAction: vi.fn().mockResolvedValue({ list: {} }),
  renameListAction: vi.fn().mockResolvedValue({ list: {} }),
  deleteListAction: vi.fn().mockResolvedValue({ success: true }),
  reorderListsAction: vi.fn().mockResolvedValue({ lists: [] }),
}));

vi.mock("sonner", () => {
  const toast = Object.assign(vi.fn(), { error: vi.fn() });
  return { toast };
});

const sampleLists: List[] = [
  {
    id: "l1",
    boardId: "board-1",
    title: "To Do",
    position: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "l2",
    boardId: "board-1",
    title: "Doing",
    position: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "l3",
    boardId: "board-1",
    title: "Done",
    position: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

function dragHandleOrder(container: HTMLElement): string[] {
  return Array.from(container.querySelectorAll("[data-list-id]")).map(
    (el) => (el as HTMLElement).dataset.listId ?? "",
  );
}

function pointerEvent(type: string, clientX: number, clientY: number) {
  return new PointerEvent(type, {
    bubbles: true,
    cancelable: true,
    composed: true,
    clientX,
    clientY,
    pointerId: 1,
    pointerType: "mouse",
    isPrimary: true,
    button: 0,
  });
}

describe("BoardLists drag-and-drop", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the lists in a horizontally scrollable container", () => {
    render(<BoardLists boardId="board-1" initialLists={sampleLists} />);
    const container = screen.getByTestId("board-lists");
    expect(container.className).toMatch(/overflow-x-auto/);
  });

  it("renders all list columns from the provided lists", () => {
    render(<BoardLists boardId="board-1" initialLists={sampleLists} />);
    expect(screen.getByText("To Do")).toBeDefined();
    expect(screen.getByText("Doing")).toBeDefined();
    expect(screen.getByText("Done")).toBeDefined();
  });

  it("exposes a move-list handle for each list (drag affordance)", () => {
    render(<BoardLists boardId="board-1" initialLists={sampleLists} />);
    const handles = screen.getAllByRole("button", { name: /move list/i });
    expect(handles).toHaveLength(sampleLists.length);
  });

  it("preserves the optimistic order through a re-render (no revert flicker)", async () => {
    const { container, rerender } = render(
      <BoardLists boardId="board-1" initialLists={sampleLists} />,
    );

    const handles = Array.from(
      container.querySelectorAll('[aria-label="Move list"]'),
    ) as HTMLElement[];
    expect(handles).toHaveLength(3);
    const sourceHandle = handles[1] as HTMLElement;

    act(() => {
      sourceHandle.dispatchEvent(pointerEvent("pointerdown", 100, 100));
    });
    act(() => {
      document.dispatchEvent(pointerEvent("pointermove", 110, 100));
    });
    act(() => {
      document.dispatchEvent(pointerEvent("pointermove", 50, 100));
    });
    act(() => {
      document.dispatchEvent(pointerEvent("pointerup", 50, 100));
    });

    expect(reorderListsAction).toHaveBeenCalledWith({
      boardId: "board-1",
      orderedListIds: ["l2", "l1", "l3"],
    });
    expect(dragHandleOrder(container)).toEqual(["l2", "l1", "l3"]);

    rerender(<BoardLists boardId="board-1" initialLists={sampleLists} />);

    expect(dragHandleOrder(container)).toEqual(["l2", "l1", "l3"]);
  });
});
