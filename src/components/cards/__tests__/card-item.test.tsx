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

  it("renders label chips when labels are present", () => {
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
    expect(screen.getAllByTestId("card-label")).toHaveLength(2);
  });

  it("renders due date badge when dueDate is set", () => {
    const future = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
    render(<CardItem card={{ ...baseCard, dueDate: future }} />);
    expect(screen.getByLabelText(/due/i)).toBeDefined();
  });

  it("renders overdue style for past due dates", () => {
    const past = new Date(Date.now() - 24 * 60 * 60 * 1000);
    render(<CardItem card={{ ...baseCard, dueDate: past }} />);
    expect(screen.getByLabelText(/overdue/i)).toBeDefined();
  });

  it("renders checklist progress when present", () => {
    render(<CardItem card={{ ...baseCard, checklistProgress: { total: 5, completed: 3 } }} />);
    expect(screen.getByLabelText(/3 of 5/i)).toBeDefined();
  });

  it("renders comment count when present", () => {
    render(<CardItem card={{ ...baseCard, commentCount: 7 }} />);
    expect(screen.getByLabelText(/7 comments/i)).toBeDefined();
  });

  it("renders assignee initials when assignees are present", () => {
    render(
      <CardItem
        card={{
          ...baseCard,
          assignees: [
            { id: "u1", name: "Alice" },
            { id: "u2", name: "Bob" },
          ],
        }}
      />,
    );
    expect(screen.getByLabelText("Alice")).toBeDefined();
    expect(screen.getByLabelText("Bob")).toBeDefined();
  });

  it("calls onOpen when the card body is clicked", () => {
    const onOpen = vi.fn();
    render(<CardItem card={baseCard} onOpen={onOpen} />);
    fireEvent.click(screen.getByTestId("card-item"));
    expect(onOpen).toHaveBeenCalled();
  });
});
