import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BoardCard, BoardCardSkeleton } from "@/components/boards/board-card";
import type { Board } from "@/lib/db/schema/boards";

const baseBoard: Board = {
  id: "test-id",
  title: "My Test Board",
  description: "A description",
  background: "#1a1a2e",
  ownerId: "user-1",
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

describe("BoardCard", () => {
  it("renders the board title", () => {
    render(<BoardCard board={baseBoard} />);
    expect(screen.getByText("My Test Board")).toBeDefined();
  });

  it("links to the board page", () => {
    render(<BoardCard board={baseBoard} />);
    const link = screen.getByRole("link");
    expect(link.getAttribute("href")).toBe("/boards/test-id");
  });

  it("renders a compact hero region on the card", () => {
    render(<BoardCard board={baseBoard} />);
    const hero = screen.getByRole("region", { name: /my test board board header/i });
    expect(hero).toBeDefined();
  });

  it("renders the board title inside the hero", () => {
    render(<BoardCard board={baseBoard} />);
    const hero = screen.getByRole("region", { name: /my test board board header/i });
    expect(hero.textContent).toContain("My Test Board");
  });

  it("applies the board background to the hero", () => {
    render(<BoardCard board={baseBoard} />);
    const hero = screen.getByRole("region", { name: /my test board board header/i });
    const styleAttr = hero.getAttribute("style") ?? "";
    expect(styleAttr.includes("1a1a2e") || styleAttr.includes("26, 26, 46")).toBe(true);
  });

  it("the whole card navigates to the board page when clicked (hero is inside the link)", () => {
    render(<BoardCard board={baseBoard} />);
    const hero = screen.getByRole("region", { name: /my test board board header/i });
    const link = hero.closest("a");
    expect(link).toBeTruthy();
    expect(link!.getAttribute("href")).toBe("/boards/test-id");
  });
});

describe("BoardCardSkeleton", () => {
  it("renders a placeholder with pulse animation", () => {
    const { container } = render(<BoardCardSkeleton />);
    const animated = container.querySelector(".animate-pulse");
    expect(animated).toBeTruthy();
  });
});
