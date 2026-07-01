import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CardDetail } from "@/components/cards/card-detail";
import type { CardDetailData } from "@/components/cards/card-detail";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}));

const { mockUpdateCardAction, mockDeleteCardAction, mockCreateLabelAction } = vi.hoisted(() => ({
  mockUpdateCardAction: vi.fn(),
  mockDeleteCardAction: vi.fn(),
  mockCreateLabelAction: vi.fn(),
}));

vi.mock("@/lib/actions/cards", () => ({
  updateCardAction: mockUpdateCardAction,
  deleteCardAction: mockDeleteCardAction,
}));

vi.mock("@/lib/actions/labels", () => ({
  createLabelAction: mockCreateLabelAction,
}));

const baseCardDetail: CardDetailData = {
  card: {
    id: "c1",
    listId: "l1",
    boardId: "b1",
    title: "Buy groceries",
    description: "Need milk",
    dueDate: new Date("2026-07-15T00:00:00Z"),
    position: 0,
    createdAt: new Date("2026-07-01T00:00:00Z"),
    updatedAt: new Date("2026-07-01T00:00:00Z"),
  },
  labels: [{ id: "lbl1", name: "Bug", color: "#ff0000" }],
  boardId: "b1",
  boardLabels: [
    { id: "lbl1", boardId: "b1", name: "Bug", color: "#ff0000" },
    { id: "lbl2", boardId: "b1", name: "Feature", color: "#00ff00" },
    { id: "lbl3", boardId: "b1", name: "Chore", color: "#3b82f6" },
  ],
};

async function openModal() {
  const detail = new CustomEvent("card:open", { detail: { cardId: "c1" } });
  window.dispatchEvent(detail);
  await waitFor(() => {
    expect(screen.getByLabelText(/card title/i)).toBeDefined();
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => baseCardDetail,
  }) as unknown as typeof fetch;
  mockUpdateCardAction.mockResolvedValue({ data: baseCardDetail.card });
  mockDeleteCardAction.mockResolvedValue({ data: { boardId: "b1" } });
  mockCreateLabelAction.mockResolvedValue({
    data: { id: "lbl-new", boardId: "b1", name: "New label", color: "#abcdef" },
  });
});

describe("CardDetail modal", () => {
  it("uses a wide layout (much wider than 2xl)", async () => {
    render(<CardDetail boardId="b1" lists={[{ id: "l1", title: "To Do" }]} />);
    await openModal();
    const titleInput = screen.getByLabelText(/card title/i);
    const dialog = titleInput.closest('[role="dialog"]');
    expect(dialog).toBeTruthy();
    expect(dialog!.className).toMatch(/w-\[min\(96vw,1100px\)\]/);
  });

  it("does not render a built-in X close button inside the dialog", async () => {
    render(<CardDetail boardId="b1" lists={[{ id: "l1", title: "To Do" }]} />);
    await openModal();
    const dialog = screen.getByRole("dialog");
    const closeBtn = dialog.querySelector('[aria-label="Close"]');
    expect(closeBtn).toBeNull();
  });

  it("renders the 'Due date' text label", async () => {
    render(<CardDetail boardId="b1" lists={[{ id: "l1", title: "To Do" }]} />);
    await openModal();
    expect(screen.getByText("Due date")).toBeDefined();
  });

  it("does not render a 'Labels' text label (icon only)", async () => {
    render(<CardDetail boardId="b1" lists={[{ id: "l1", title: "To Do" }]} />);
    await openModal();
    expect(screen.queryByText("Labels")).toBeNull();
  });

  it("renders the title, description and due date inputs", async () => {
    render(<CardDetail boardId="b1" lists={[{ id: "l1", title: "To Do" }]} />);
    await openModal();
    expect((screen.getByLabelText(/card title/i) as HTMLInputElement).value).toBe("Buy groceries");
    expect((screen.getByLabelText(/card description/i) as HTMLTextAreaElement).value).toBe(
      "Need milk",
    );
    expect(screen.getByLabelText(/due date/i)).toBeDefined();
  });

  it("shows the save button as disabled when nothing is dirty", async () => {
    render(<CardDetail boardId="b1" lists={[{ id: "l1", title: "To Do" }]} />);
    await openModal();
    const save = screen.getByRole("button", { name: /^save$/i }) as HTMLButtonElement;
    expect(save.disabled).toBe(true);
  });

  it("enables the save button after a change is made", async () => {
    const user = userEvent.setup();
    render(<CardDetail boardId="b1" lists={[{ id: "l1", title: "To Do" }]} />);
    await openModal();
    const titleInput = screen.getByLabelText(/card title/i);
    await user.clear(titleInput);
    await user.type(titleInput, "Updated title");
    const save = screen.getByRole("button", { name: /^save$/i }) as HTMLButtonElement;
    expect(save.disabled).toBe(false);
  });

  it("submits all dirty fields on save", async () => {
    const user = userEvent.setup();
    render(<CardDetail boardId="b1" lists={[{ id: "l1", title: "To Do" }]} />);
    await openModal();
    const titleInput = screen.getByLabelText(/card title/i);
    await user.clear(titleInput);
    await user.type(titleInput, "Updated");
    const save = screen.getByRole("button", { name: /^save$/i });
    await user.click(save);
    await waitFor(() => {
      expect(mockUpdateCardAction).toHaveBeenCalled();
    });
    const call = mockUpdateCardAction.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(call.cardId).toBe("c1");
    expect(call.title).toBe("Updated");
    expect(call.description).toBe("Need milk");
    expect(call.labelIds).toEqual(["lbl1"]);
  });

  it("renders the delete control as a subtle icon button, not a prominent red button", async () => {
    render(<CardDetail boardId="b1" lists={[{ id: "l1", title: "To Do" }]} />);
    await openModal();
    const deleteBtn = screen.getByRole("button", { name: /delete card/i });
    expect(deleteBtn).toBeDefined();
    expect(deleteBtn.className).not.toMatch(/bg-destructive/);
  });

  it("opens a delete confirmation that requires explicit confirm", async () => {
    const user = userEvent.setup();
    render(<CardDetail boardId="b1" lists={[{ id: "l1", title: "To Do" }]} />);
    await openModal();
    await user.click(screen.getByRole("button", { name: /delete card/i }));
    const confirm = await screen.findByRole("button", { name: /^delete$/i });
    await user.click(confirm);
    await waitFor(() => {
      expect(mockDeleteCardAction).toHaveBeenCalledWith({ cardId: "c1" });
    });
  });

  it("opens a label picker popover with only available (unselected) labels", async () => {
    const user = userEvent.setup();
    render(<CardDetail boardId="b1" lists={[{ id: "l1", title: "To Do" }]} />);
    await openModal();
    await user.click(screen.getByRole("button", { name: /^add label$/i }));
    // Wait for the popover to appear
    const popover = await screen.findByText("Available labels");
    const popoverRoot = popover.closest('[data-slot="popover-content"]') as HTMLElement;
    expect(popoverRoot).toBeTruthy();
    expect(popoverRoot.textContent).toContain("Feature");
    expect(popoverRoot.textContent).toContain("Chore");
    // "Bug" is already attached and should NOT appear in the popover
    expect(popoverRoot.textContent).not.toContain("Bug");
  });

  it("shows attached labels as removable chips", async () => {
    render(<CardDetail boardId="b1" lists={[{ id: "l1", title: "To Do" }]} />);
    await openModal();
    const attached = screen.getAllByTestId("attached-label");
    expect(attached).toHaveLength(1);
    expect(attached[0].textContent).toContain("Bug");
    expect(screen.getByRole("button", { name: /remove bug/i })).toBeDefined();
  });

  it("adds a label when clicking an available label in the popover", async () => {
    const user = userEvent.setup();
    render(<CardDetail boardId="b1" lists={[{ id: "l1", title: "To Do" }]} />);
    await openModal();
    await user.click(screen.getByRole("button", { name: /^add label$/i }));
    await user.click(await screen.findByText("Feature"));
    await waitFor(() => {
      const attached = screen.getAllByTestId("attached-label");
      expect(attached.map((el) => el.textContent)).toContain("Feature");
    });
  });

  it("removes a label via the X on the attached chip", async () => {
    const user = userEvent.setup();
    render(<CardDetail boardId="b1" lists={[{ id: "l1", title: "To Do" }]} />);
    await openModal();
    await user.click(screen.getByRole("button", { name: /remove bug/i }));
    await waitFor(() => {
      expect(screen.queryByTestId("attached-label")).toBeNull();
    });
  });
});
