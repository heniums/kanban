import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
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
  moveCardAction: vi.fn().mockResolvedValue({ data: {} }),
  copyCardAction: vi.fn().mockResolvedValue({ data: {} }),
}));

vi.mock("@/lib/actions/labels", () => ({
  createLabelAction: mockCreateLabelAction,
}));

vi.mock("@/lib/actions/checklists", () => ({
  createChecklistAction: vi.fn().mockResolvedValue({ data: { id: "cl1", cardId: "c1" } }),
  deleteChecklistAction: vi.fn().mockResolvedValue({ data: { cardId: "c1" } }),
  createChecklistItemAction: vi.fn().mockResolvedValue({ data: { id: "i1", checklistId: "cl1" } }),
  updateChecklistItemAction: vi.fn().mockResolvedValue({ data: { id: "i1" } }),
  deleteChecklistItemAction: vi.fn().mockResolvedValue({ data: { id: "i1" } }),
}));

vi.mock("@/lib/actions/comments", () => ({
  createCommentAction: vi.fn().mockResolvedValue({ data: { id: "cm1" } }),
  updateCommentAction: vi.fn().mockResolvedValue({ data: { id: "cm1" } }),
  deleteCommentAction: vi.fn().mockResolvedValue({ data: { cardId: "c1" } }),
}));

vi.mock("@/lib/realtime/use-board-socket", () => ({
  useBoardSocket: () => ({ current: null }),
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
  assignees: [],
  checklists: [],
  comments: [],
  boardMembers: [
    { id: "u1", name: "Alice", email: "alice@example.com" },
    { id: "u2", name: "Bob", email: "bob@example.com" },
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
  it("renders at the full available width (no sm:max-w-sm constraint)", async () => {
    render(<CardDetail boardId="b1" lists={[{ id: "l1", title: "To Do" }]} />);
    await openModal();
    const dialog = screen.getByRole("dialog");
    expect(dialog.className).toMatch(/w-\[min\(96vw,1280px\)\]/);
    expect(dialog.className).toMatch(/max-w-none/);
    expect(dialog.className).toMatch(/sm:max-w-none/);
  });

  it("does not render a built-in X close button inside the dialog", async () => {
    render(<CardDetail boardId="b1" lists={[{ id: "l1", title: "To Do" }]} />);
    await openModal();
    const dialog = screen.getByRole("dialog");
    const closeBtn = dialog.querySelector('[aria-label="Close"]');
    expect(closeBtn).toBeNull();
  });

  it("renders the 'Due date' and 'Labels' text labels", async () => {
    render(<CardDetail boardId="b1" lists={[{ id: "l1", title: "To Do" }]} />);
    await openModal();
    expect(screen.getByText("Due date")).toBeDefined();
    expect(screen.getByText("Labels")).toBeDefined();
  });

  it("places 'Due date' and 'Labels' on the same horizontal bar", async () => {
    render(<CardDetail boardId="b1" lists={[{ id: "l1", title: "To Do" }]} />);
    await openModal();
    const dueDateField = screen.getByText("Due date").closest("div[class*='flex-col']")!;
    const labelsField = screen.getByText("Labels").closest("div[class*='flex-col']")!;
    // Both fields share the same parent bar
    expect(dueDateField.parentElement).toBe(labelsField.parentElement);
    const bar = dueDateField.parentElement!;
    expect(bar.className).toMatch(/flex/);
    // The bar wraps so future modules can be added inline
    expect(bar.className).toMatch(/flex-wrap/);
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

  it("keeps the label list, the trigger, and the create form in one unified section", async () => {
    const user = userEvent.setup();
    render(<CardDetail boardId="b1" lists={[{ id: "l1", title: "To Do" }]} />);
    await openModal();

    // The trigger and the attached chip are siblings in the same section
    const attached = screen.getByTestId("attached-label");
    const trigger = screen.getByRole("button", { name: /add or create label/i });
    expect(attached.parentElement).toBe(trigger.parentElement);

    // Open the popover and find both the list AND the create form in the same content
    await user.click(trigger);
    const searchInput = await screen.findByRole("textbox", { name: /search labels/i });
    const popoverRoot = searchInput.closest('[data-slot="popover-content"]') as HTMLElement;
    expect(popoverRoot.textContent).toContain("Labels");
    expect(popoverRoot.textContent).toContain("Create new label");
  });

  it("opens a label picker popover with only available (unselected) labels", async () => {
    const user = userEvent.setup();
    render(<CardDetail boardId="b1" lists={[{ id: "l1", title: "To Do" }]} />);
    await openModal();
    await user.click(screen.getByRole("button", { name: /add or create label/i }));
    const searchInput = await screen.findByRole("textbox", { name: /search labels/i });
    const popoverRoot = searchInput.closest('[data-slot="popover-content"]') as HTMLElement;
    expect(popoverRoot.textContent).toContain("Feature");
    expect(popoverRoot.textContent).toContain("Chore");
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
    await user.click(screen.getByRole("button", { name: /add or create label/i }));
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

  it("expands the inline create-new-label form inside the popover and creates on submit", async () => {
    const user = userEvent.setup();
    render(<CardDetail boardId="b1" lists={[{ id: "l1", title: "To Do" }]} />);
    await openModal();
    await user.click(screen.getByRole("button", { name: /add or create label/i }));
    await user.click(await screen.findByText("Create new label"));
    const nameInput = await screen.findByPlaceholderText(/label name/i);
    await user.type(nameInput, "Urgent");
    await user.click(screen.getByRole("button", { name: /^create$/i }));
    await waitFor(() => {
      expect(mockCreateLabelAction).toHaveBeenCalledWith({
        boardId: "b1",
        name: "Urgent",
        color: expect.any(String),
      });
    });
  });
});
