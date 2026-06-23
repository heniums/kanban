import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FirstRunEmptyState } from "@/components/dashboard/first-run-empty-state";

describe("FirstRunEmptyState", () => {
  it("renders 'No boards yet.' as a prominent heading", () => {
    render(<FirstRunEmptyState />);
    const headings = screen.getAllByRole("heading");
    const titles = headings.map((h) => h.textContent ?? "");
    expect(titles.some((t) => /no boards yet/i.test(t))).toBe(true);
  });

  it("renders a supporting line encouraging the user to create a board", () => {
    render(<FirstRunEmptyState />);
    expect(
      screen.getByText(/create your first board to get started/i)
    ).toBeDefined();
  });

  it("renders a primary 'Create your first board' CTA linking to /boards/new", () => {
    render(<FirstRunEmptyState />);
    const cta = screen.getByRole("link", {
      name: /create your first board/i,
    });
    expect(cta).toBeDefined();
    expect(cta.getAttribute("href")).toBe("/boards/new");
  });

  it("renders a secondary 'Browse shared boards' link to /boards", () => {
    render(<FirstRunEmptyState />);
    const link = screen.getByRole("link", { name: /browse shared boards/i });
    expect(link).toBeDefined();
    expect(link.getAttribute("href")).toBe("/boards");
  });

  it("uses a logical heading hierarchy with exactly one h1", () => {
    render(<FirstRunEmptyState />);
    const h1s = screen.getAllByRole("heading", { level: 1 });
    expect(h1s.length).toBe(1);
  });
});
