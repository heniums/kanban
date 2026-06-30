import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
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

describe("BoardLists drag-and-drop", () => {
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
});
