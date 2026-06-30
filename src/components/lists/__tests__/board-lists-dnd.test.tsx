import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { BoardLists } from "@/components/lists/board-lists";
import type { List } from "@/lib/db/schema/lists";

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
    render(
      <BoardLists
        lists={sampleLists}
        onAdd={vi.fn()}
        onRename={vi.fn()}
        onDelete={vi.fn()}
        onReorder={vi.fn()}
      />,
    );
    const container = screen.getByTestId("board-lists");
    expect(container.className).toMatch(/overflow-x-auto/);
  });

  it("renders all list columns from the provided lists", () => {
    render(
      <BoardLists
        lists={sampleLists}
        onAdd={vi.fn()}
        onRename={vi.fn()}
        onDelete={vi.fn()}
        onReorder={vi.fn()}
      />,
    );
    expect(screen.getByText("To Do")).toBeDefined();
    expect(screen.getByText("Doing")).toBeDefined();
    expect(screen.getByText("Done")).toBeDefined();
  });

  it("exposes a move-list handle for each list (drag affordance)", () => {
    render(
      <BoardLists
        lists={sampleLists}
        onAdd={vi.fn()}
        onRename={vi.fn()}
        onDelete={vi.fn()}
        onReorder={vi.fn()}
      />,
    );
    const handles = screen.getAllByRole("button", { name: /move list/i });
    expect(handles).toHaveLength(sampleLists.length);
  });

  it("preserves the optimistic order through a re-render (no revert flicker)", async () => {
    const onReorder = vi.fn().mockResolvedValue(undefined);
    const { container, rerender } = render(
      <BoardLists
        lists={sampleLists}
        onAdd={vi.fn()}
        onRename={vi.fn()}
        onDelete={vi.fn()}
        onReorder={onReorder}
      />,
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

    expect(onReorder).toHaveBeenCalledWith(["l2", "l1", "l3"]);
    expect(dragHandleOrder(container)).toEqual(["l2", "l1", "l3"]);

    rerender(
      <BoardLists
        lists={sampleLists}
        onAdd={vi.fn()}
        onRename={vi.fn()}
        onDelete={vi.fn()}
        onReorder={onReorder}
      />,
    );

    expect(dragHandleOrder(container)).toEqual(["l2", "l1", "l3"]);
  });
});
