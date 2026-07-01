import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { BoardLists } from "@/components/lists/board-lists";
import type { List } from "@/lib/db/schema/lists";

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
];

describe("BoardLists", () => {
  it("renders all lists", () => {
    render(<BoardLists boardId="board-1" initialLists={sampleLists} />);
    expect(screen.getByRole("heading", { name: "To Do" })).toBeDefined();
    expect(screen.getByRole("heading", { name: "Doing" })).toBeDefined();
  });

  it("renders the AddListForm", () => {
    render(<BoardLists boardId="board-1" initialLists={sampleLists} />);
    expect(screen.getByRole("button", { name: /add list/i })).toBeDefined();
  });

  it("renders a placeholder when there are no lists", () => {
    render(<BoardLists boardId="board-1" initialLists={[]} />);
    expect(screen.queryByRole("heading")).toBeNull();
    expect(screen.getByRole("button", { name: /add list/i })).toBeDefined();
  });
});
