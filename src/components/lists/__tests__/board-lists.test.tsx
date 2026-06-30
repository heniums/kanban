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
];

describe("BoardLists", () => {
  it("renders all lists", () => {
    render(
      <BoardLists
        lists={sampleLists}
        onAdd={vi.fn()}
        onRename={vi.fn()}
        onDelete={vi.fn()}
        onReorder={vi.fn()}
      />,
    );
    expect(screen.getByRole("heading", { name: "To Do" })).toBeDefined();
    expect(screen.getByRole("heading", { name: "Doing" })).toBeDefined();
  });

  it("renders the AddListForm alongside the lists", () => {
    render(
      <BoardLists
        lists={sampleLists}
        onAdd={vi.fn()}
        onRename={vi.fn()}
        onDelete={vi.fn()}
        onReorder={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: /add list/i })).toBeDefined();
  });

  it("renders a placeholder when there are no lists", () => {
    render(
      <BoardLists
        lists={[]}
        onAdd={vi.fn()}
        onRename={vi.fn()}
        onDelete={vi.fn()}
        onReorder={vi.fn()}
      />,
    );
    // No list headings; just the add button.
    expect(screen.queryByRole("heading")).toBeNull();
    expect(screen.getByRole("button", { name: /add list/i })).toBeDefined();
  });
});
