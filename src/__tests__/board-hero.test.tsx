import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BoardHero } from "@/components/boards/board-hero";
import { BACKGROUNDS } from "@/components/boards/background-picker";
import type { Board } from "@/lib/db/schema/boards";

const baseBoard: Board = {
  id: "board-1",
  title: "Test Board",
  description: "A test board description",
  background: "#1a1a2e",
  ownerId: "user-1",
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

describe("BoardHero", () => {
  it("renders the board title as a heading in the full variant", () => {
    render(<BoardHero board={baseBoard} variant="full" />);
    expect(screen.getByRole("heading", { level: 1, name: "Test Board" })).toBeDefined();
  });

  it("renders the board description when present in the full variant", () => {
    render(<BoardHero board={baseBoard} variant="full" />);
    expect(screen.getByText("A test board description")).toBeDefined();
  });

  it("renders the board title in the compact variant", () => {
    render(<BoardHero board={baseBoard} variant="compact" />);
    expect(screen.getByText("Test Board")).toBeDefined();
  });

  it("applies the board background as inline style (solid color)", () => {
    const { container } = render(<BoardHero board={baseBoard} variant="full" />);
    const hero = container.firstElementChild as HTMLElement;
    const styleAttr = hero.getAttribute("style") ?? "";
    // Browsers normalize #1a1a2e to rgb(26, 26, 46); accept either form
    expect(styleAttr.includes("1a1a2e") || styleAttr.includes("26, 26, 46")).toBe(true);
  });

  it("applies the board background as inline style (gradient)", () => {
    const gradient = "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";
    const { container } = render(
      <BoardHero board={{ ...baseBoard, background: gradient }} variant="full" />,
    );
    const hero = container.firstElementChild as HTMLElement;
    const styleAttr = hero.getAttribute("style") ?? "";
    expect(styleAttr).toContain("linear-gradient");
  });

  it("uses white text on dark backgrounds (full variant)", () => {
    const { container } = render(<BoardHero board={baseBoard} variant="full" />);
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading.style.color).toBe("white");
    // The container should have an aria label
    const hero = container.firstElementChild as HTMLElement;
    expect(hero.getAttribute("aria-label")).toBeTruthy();
  });

  it("uses dark text on light backgrounds (full variant)", () => {
    render(<BoardHero board={{ ...baseBoard, background: "#f5f5f5" }} variant="full" />);
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading.style.color).toBe("rgb(10, 10, 10)");
  });

  it("uses white text on gradient backgrounds (compact variant)", () => {
    render(
      <BoardHero
        board={{ ...baseBoard, background: "linear-gradient(135deg, #000, #fff)" }}
        variant="compact"
      />,
    );
    const title = screen.getByText("Test Board");
    expect(title.style.color).toBe("white");
  });

  it("full variant has approximately 200px height", () => {
    const { container } = render(<BoardHero board={baseBoard} variant="full" />);
    const hero = container.firstElementChild as HTMLElement;
    // Full variant should declare a fixed min-height of 200px via class
    expect(hero.className).toMatch(/min-h-\[200px\]|h-48|h-52/);
  });

  it("compact variant has a smaller height than full variant", () => {
    const { container: fullContainer } = render(<BoardHero board={baseBoard} variant="full" />);
    const { container: compactContainer } = render(
      <BoardHero board={baseBoard} variant="compact" />,
    );
    const fullHero = fullContainer.firstElementChild as HTMLElement;
    const compactHero = compactContainer.firstElementChild as HTMLElement;
    // Compact must NOT carry the full-variant ~200px class
    expect(fullHero.className).not.toBe(compactHero.className);
    expect(compactHero.className).toMatch(/h-24|h-20|h-16/);
  });

  it("renders children (e.g. actions) inside the hero", () => {
    render(
      <BoardHero board={baseBoard} variant="full">
        <button type="button">Edit</button>
      </BoardHero>,
    );
    expect(screen.getByRole("button", { name: "Edit" })).toBeDefined();
  });

  it("renders a region landmark with accessible name", () => {
    const { container } = render(<BoardHero board={baseBoard} variant="full" />);
    const hero = container.firstElementChild as HTMLElement;
    // The hero should be a region with an aria-label derived from the board title
    expect(hero.tagName).toBe("SECTION");
    expect(hero.getAttribute("aria-label")).toBe("Test Board board header");
  });

  it("does not render the description in the compact variant", () => {
    render(<BoardHero board={baseBoard} variant="compact" />);
    expect(screen.queryByText("A test board description")).toBeNull();
  });
});

describe("BoardHero migration: all built-in backgrounds render correctly", () => {
  for (const option of BACKGROUNDS) {
    it(`renders the hero with background '${option.label}' without throwing`, () => {
      expect(() =>
        render(<BoardHero board={{ ...baseBoard, background: option.value }} variant="full" />),
      ).not.toThrow();
    });

    it(`overlaid text on '${option.label}' has a readable color (white or near-black)`, () => {
      render(<BoardHero board={{ ...baseBoard, background: option.value }} variant="full" />);
      const heading = screen.getByRole("heading", { level: 1 });
      const color = heading.style.color;
      // getTextColor returns either "white" or "#0a0a0a" — both are high contrast
      expect(color === "white" || color === "rgb(10, 10, 10)").toBe(true);
    });
  }
});
