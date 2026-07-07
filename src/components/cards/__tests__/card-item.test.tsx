import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CardItem, type CardSummary } from "@/components/cards/card-item";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}));

vi.mock("@/lib/actions/cards", () => ({
  updateCardAction: vi.fn().mockResolvedValue({ data: { id: "c1" } }),
}));

const baseCard: CardSummary = {
  id: "c1",
  listId: "l1",
  boardId: "b1",
  title: "Hello world",
  description: null,
  dueDate: null,
  position: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
  labels: [],
  assignees: [],
  checklistProgress: null,
  commentCount: 0,
};

describe("CardItem", () => {
  it("renders the title", () => {
    render(<CardItem card={baseCard} />);
    expect(screen.getByRole("heading", { name: "Hello world" })).toBeDefined();
  });

  it("renders label names (not just color bars)", () => {
    render(
      <CardItem
        card={{
          ...baseCard,
          labels: [
            { id: "lbl1", name: "Bug", color: "#ff0000" },
            { id: "lbl2", name: "Feature", color: "#00ff00" },
          ],
        }}
      />,
    );
    expect(screen.getByText("Bug")).toBeDefined();
    expect(screen.getByText("Feature")).toBeDefined();
    expect(screen.getAllByTestId("card-label")).toHaveLength(2);
  });

  it("shows a +N indicator when there are more than 4 labels", () => {
    render(
      <CardItem
        card={{
          ...baseCard,
          labels: [
            { id: "l1", name: "A", color: "#000" },
            { id: "l2", name: "B", color: "#000" },
            { id: "l3", name: "C", color: "#000" },
            { id: "l4", name: "D", color: "#000" },
            { id: "l5", name: "E", color: "#000" },
          ],
        }}
      />,
    );
    expect(screen.getByText("+1")).toBeDefined();
  });

  it("renders due date badge when dueDate is set", () => {
    const future = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
    render(<CardItem card={{ ...baseCard, dueDate: future }} />);
    const badge = screen.getByText(new RegExp(future.getFullYear().toString()));
    expect(badge.title).toMatch(/^Due\b/);
  });

  it("renders overdue style for past due dates", () => {
    const past = new Date(Date.now() - 24 * 60 * 60 * 1000);
    render(<CardItem card={{ ...baseCard, dueDate: past }} />);
    const badge = screen.getByText(new RegExp(past.getFullYear().toString()));
    expect(badge.title).toMatch(/Overdue/);
  });

  it("renders checklist progress when present", () => {
    render(<CardItem card={{ ...baseCard, checklistProgress: { total: 5, completed: 3 } }} />);
    expect(screen.getByText("3/5")).toBeDefined();
  });

  it("renders comment count when present", () => {
    render(<CardItem card={{ ...baseCard, commentCount: 7 }} />);
    expect(screen.getByText("7")).toBeDefined();
  });

  it("renders assignee initials when assignees are present", () => {
    render(
      <CardItem
        card={{
          ...baseCard,
          assignees: [
            { id: "u1", name: "Alice", avatarUrl: null },
            { id: "u2", name: "Bob", avatarUrl: null },
          ],
        }}
      />,
    );
    expect(screen.getByText("A")).toBeDefined();
    expect(screen.getByText("B")).toBeDefined();
  });

  it("calls onOpen when the card body is clicked", () => {
    const onOpen = vi.fn();
    render(<CardItem card={baseCard} onOpen={onOpen} />);
    fireEvent.click(screen.getByTestId("card-item"));
    expect(onOpen).toHaveBeenCalled();
  });

  it("renders an edit (pencil) button that opens the modal", () => {
    const onOpen = vi.fn();
    render(<CardItem card={baseCard} onOpen={onOpen} />);
    const editButton = screen.getByRole("button", { name: /edit card/i });
    fireEvent.click(editButton);
    expect(onOpen).toHaveBeenCalled();
  });

  it("renders a description preview when description is present", () => {
    render(<CardItem card={{ ...baseCard, description: "Detailed notes here" }} />);
    expect(screen.getByTestId("card-description-preview")).toBeDefined();
    expect(screen.getByText("Detailed notes here")).toBeDefined();
  });

  it("does not render a description preview when description is empty", () => {
    render(<CardItem card={baseCard} />);
    expect(screen.queryByTestId("card-description-preview")).toBeNull();
  });

  it("has visible cursor-pointer on the card article", () => {
    render(<CardItem card={baseCard} />);
    const card = screen.getByTestId("card-item");
    expect(card.className).toMatch(/cursor-pointer/);
    expect(card.className).not.toMatch(/\bcursor-none\b/);
  });

  it("does not have touch-none or cursor-grab on the article (moved to sortable wrapper)", () => {
    render(<CardItem card={baseCard} />);
    const card = screen.getByTestId("card-item");
    expect(card.className).not.toMatch(/\btouch-none\b/);
    expect(card.className).not.toMatch(/\bcursor-grab\b/);
  });

  it("applies opacity-60 when isDragging is true", () => {
    render(<CardItem card={baseCard} isDragging />);
    const card = screen.getByTestId("card-item");
    expect(card.className).toMatch(/opacity-60/);
  });

  it("does not have inline style transform affecting cursor rendering", () => {
    render(<CardItem card={baseCard} />);
    const card = screen.getByTestId("card-item");
    expect(card.style.transform).toBe("");
    expect(card.style.transition).toBe("");
  });
});
