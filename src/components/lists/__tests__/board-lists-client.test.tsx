import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { BoardListsClient } from "@/components/lists/board-lists-client";
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
];

describe("BoardListsClient", () => {
  it("renders initial lists", () => {
    render(<BoardListsClient boardId="board-1" initialLists={sampleLists} />);
    expect(screen.getByRole("heading", { name: "To Do" })).toBeDefined();
    expect(screen.getByRole("button", { name: /add list/i })).toBeDefined();
  });
});
