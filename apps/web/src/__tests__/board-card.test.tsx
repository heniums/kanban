import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BoardCard, BoardCardSkeleton } from "@/components/boards/board-card";
import type { Board } from "@kanban/shared";

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

  it("renders the description when present", () => {
    render(<BoardCard board={baseBoard} />);
    expect(screen.getByText("A description")).toBeDefined();
  });

  it("links to the board page", () => {
    render(<BoardCard board={baseBoard} />);
    const link = screen.getByRole("link");
    expect(link.getAttribute("href")).toBe("/boards/test-id");
  });

  it("renders the background on the preview swatch", () => {
    render(<BoardCard board={baseBoard} />);
    const swatch = document.querySelector('[style*="background"]');
    expect(swatch).toBeTruthy();
  });
});

describe("BoardCardSkeleton", () => {
  it("renders a placeholder with pulse animation", () => {
    const { container } = render(<BoardCardSkeleton />);
    const animated = container.querySelector(".animate-pulse");
    expect(animated).toBeTruthy();
  });
});
