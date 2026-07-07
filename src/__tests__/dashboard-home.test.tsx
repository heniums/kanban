import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { Board } from "@/lib/db/schema/boards";

vi.mock("@/components/boards/board-card", () => ({
  BoardCard: ({ board }: { board: Board }) => (
    <div data-testid="board-card" data-board-id={board.id}>
      {board.title}
    </div>
  ),
}));

import { DashboardHome } from "@/components/dashboard/dashboard-home";

function makeBoard(id: string, title: string, updatedAt: Date): Board {
  return {
    id,
    title,
    description: null,
    background: "#000",
    backgroundImageUrl: null,
    backgroundImagePublicId: null,
    ownerId: "user-1",
    createdAt: updatedAt,
    updatedAt,
    deletedAt: null,
  };
}

describe("DashboardHome", () => {
  it("renders 'Dashboard' as the page h1", () => {
    render(<DashboardHome owned={[]} shared={[]} />);
    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1).toBeDefined();
    expect(h1.textContent).toMatch(/dashboard/i);
  });

  it("renders a primary 'Create board' button linking to /boards/new", () => {
    render(<DashboardHome owned={[]} shared={[]} />);
    const cta = screen.getByRole("link", { name: /create board/i });
    expect(cta).toBeDefined();
    expect(cta.getAttribute("href")).toBe("/boards/new");
  });

  it("renders a secondary 'Go to boards' button linking to /boards", () => {
    render(<DashboardHome owned={[]} shared={[]} />);
    const cta = screen.getByRole("link", { name: /go to boards/i });
    expect(cta).toBeDefined();
    expect(cta.getAttribute("href")).toBe("/boards");
  });

  it("always renders the 'Go to boards' button regardless of board count", () => {
    const { rerender } = render(<DashboardHome owned={[]} shared={[]} />);
    expect(screen.getByRole("link", { name: /go to boards/i })).toBeDefined();

    const owned = [makeBoard("b1", "B1", new Date())];
    rerender(<DashboardHome owned={owned} shared={[]} />);
    expect(screen.getByRole("link", { name: /go to boards/i })).toBeDefined();
  });

  it("renders at most 6 owned boards", () => {
    const owned = Array.from({ length: 8 }, (_, i) =>
      makeBoard(`b${i}`, `B${i}`, new Date(2024, 0, i + 1)),
    );
    render(<DashboardHome owned={owned} shared={[]} />);
    const cards = screen.getAllByTestId("board-card");
    expect(cards.length).toBe(6);
  });

  it("renders owned boards sorted by updatedAt descending", () => {
    const owned = [
      makeBoard("old", "Old", new Date(2024, 0, 1)),
      makeBoard("newest", "Newest", new Date(2024, 0, 10)),
      makeBoard("mid", "Mid", new Date(2024, 0, 5)),
    ];
    render(<DashboardHome owned={owned} shared={[]} />);
    const cards = screen.getAllByTestId("board-card");
    expect(cards.map((c) => c.getAttribute("data-board-id"))).toEqual(["newest", "mid", "old"]);
  });

  it("does not show a 'View all' link when owned.length <= 6", () => {
    const owned = Array.from({ length: 3 }, (_, i) =>
      makeBoard(`b${i}`, `B${i}`, new Date(2024, 0, i + 1)),
    );
    render(<DashboardHome owned={owned} shared={[]} />);
    expect(screen.queryByText(/view all/i)).toBeNull();
  });

  it("shows a 'View all' link with extra count when owned.length > 6", () => {
    const owned = Array.from({ length: 9 }, (_, i) =>
      makeBoard(`b${i}`, `B${i}`, new Date(2024, 0, i + 1)),
    );
    render(<DashboardHome owned={owned} shared={[]} />);
    const link = screen.getByRole("link", { name: /view all.*3 more/i });
    expect(link).toBeDefined();
    expect(link.getAttribute("href")).toBe("/boards");
  });

  it("hides the 'Shared with you' section when shared is empty", () => {
    render(<DashboardHome owned={[]} shared={[]} />);
    expect(screen.queryByText(/shared with you/i)).toBeNull();
  });

  it("shows up to 3 shared boards when shared has entries", () => {
    const shared = Array.from({ length: 5 }, (_, i) =>
      makeBoard(`s${i}`, `S${i}`, new Date(2024, 0, i + 1)),
    );
    render(<DashboardHome owned={[]} shared={shared} />);
    const heading = screen.getByText(/shared with you/i);
    expect(heading).toBeDefined();
    const sharedSection = heading.closest("section");
    expect(sharedSection).toBeDefined();
    const sharedCards = sharedSection!.querySelectorAll('[data-testid="board-card"]');
    expect(sharedCards.length).toBe(3);
  });

  it("shows a 'View all' link for shared when shared.length > 3", () => {
    const shared = Array.from({ length: 4 }, (_, i) =>
      makeBoard(`s${i}`, `S${i}`, new Date(2024, 0, i + 1)),
    );
    render(<DashboardHome owned={[]} shared={shared} />);
    const heading = screen.getByText(/shared with you/i);
    const sharedSection = heading.closest("section");
    const link = sharedSection!.querySelector('a[href="/boards"]');
    expect(link).toBeTruthy();
    expect(link!.textContent).toMatch(/view all.*1 more/i);
  });
});
