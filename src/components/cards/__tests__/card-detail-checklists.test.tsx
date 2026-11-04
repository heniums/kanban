import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AddChecklistButton } from "@/components/cards/card-detail/card-detail-checklists";
import { AddChecklistItem } from "@/components/cards/card-detail/card-detail-checklist-items";

function deferred<T>() {
  const { promise, resolve, reject } = Promise.withResolvers<T>();
  return { promise, resolve, reject };
}

vi.mock("@/lib/actions/checklists", () => ({
  createChecklistAction: vi.fn(),
  createChecklistItemAction: vi.fn(),
}));

import { createChecklistAction, createChecklistItemAction } from "@/lib/actions/checklists";

const mockedCreateItem = vi.mocked(createChecklistItemAction);
const mockedCreateChecklist = vi.mocked(createChecklistAction);

describe("AddChecklistItem duplicate-submit guard", () => {
  it("creates exactly one item when Add is clicked repeatedly while in flight", async () => {
    const user = userEvent.setup();
    const d = deferred<{ id: string; checklistId: string }>();
    const onAdded = vi.fn();
    mockedCreateItem.mockReturnValue(d.promise);
    render(<AddChecklistItem checklistId="cl1" disabled={false} onAdded={onAdded} />);

    await user.click(screen.getByRole("button", { name: /add item/i }));
    const input = await screen.findByPlaceholderText("Item content");
    await user.type(input, "Step 1");

    const addBtn = screen.getByRole("button", { name: /^add$/i }) as HTMLButtonElement;
    fireEvent.click(addBtn);
    fireEvent.click(addBtn);
    fireEvent.click(addBtn);

    expect(mockedCreateItem).toHaveBeenCalledTimes(1);
    expect(mockedCreateItem).toHaveBeenCalledWith({ checklistId: "cl1", content: "Step 1" });
    expect(addBtn.disabled).toBe(true);

    d.resolve({ data: { id: "i1", checklistId: "cl1" } });
    await waitFor(() => {
      expect(onAdded).toHaveBeenCalledWith({
        id: "i1",
        checklistId: "cl1",
        content: "Step 1",
        isCompleted: false,
        position: 0,
      });
    });
    expect(onAdded).toHaveBeenCalledTimes(1);
  });

  it("creates exactly one item on repeated Enter presses while in flight", async () => {
    const user = userEvent.setup();
    const d = deferred<{ id: string; checklistId: string }>();
    const onAdded = vi.fn();
    mockedCreateItem.mockReturnValue(d.promise);
    render(<AddChecklistItem checklistId="cl1" disabled={false} onAdded={onAdded} />);

    await user.click(screen.getByRole("button", { name: /add item/i }));
    const input = await screen.findByPlaceholderText("Item content");
    await user.type(input, "Step 1");
    await user.type(input, "{Enter}");
    await user.type(input, "{Enter}");

    expect(mockedCreateItem).toHaveBeenCalledTimes(1);

    d.resolve({ data: { id: "i2", checklistId: "cl1" } });
    await waitFor(() => {
      expect(onAdded).toHaveBeenCalledTimes(1);
    });
  });
});

describe("AddChecklistButton duplicate-submit guard", () => {
  it("creates exactly one checklist when Add is clicked repeatedly while in flight", async () => {
    const user = userEvent.setup();
    const d = deferred<{ id: string; cardId: string }>();
    const onAdd = vi.fn();
    mockedCreateChecklist.mockReturnValue(d.promise);
    render(<AddChecklistButton cardId="c1" onAdd={onAdd} disabled={false} />);

    await user.click(screen.getByRole("button", { name: /add checklist/i }));
    const input = await screen.findByPlaceholderText("Checklist title");
    await user.clear(input);
    await user.type(input, "QA");

    const addBtn = screen.getByRole("button", { name: /^add$/i }) as HTMLButtonElement;
    fireEvent.click(addBtn);
    fireEvent.click(addBtn);
    fireEvent.click(addBtn);

    expect(mockedCreateChecklist).toHaveBeenCalledTimes(1);
    expect(mockedCreateChecklist).toHaveBeenCalledWith({ cardId: "c1", title: "QA" });
    expect(addBtn.disabled).toBe(true);

    d.resolve({ data: { id: "cl1", cardId: "c1" } });
    await waitFor(() => {
      expect(onAdd).toHaveBeenCalledTimes(1);
    });
  });

  it("creates exactly one checklist on repeated Enter presses while in flight", async () => {
    const user = userEvent.setup();
    const d = deferred<{ id: string; cardId: string }>();
    const onAdd = vi.fn();
    mockedCreateChecklist.mockReturnValue(d.promise);
    render(<AddChecklistButton cardId="c1" onAdd={onAdd} disabled={false} />);

    await user.click(screen.getByRole("button", { name: /add checklist/i }));
    const input = await screen.findByPlaceholderText("Checklist title");
    await user.clear(input);
    await user.type(input, "QA");
    await user.type(input, "{Enter}");
    await user.type(input, "{Enter}");

    expect(mockedCreateChecklist).toHaveBeenCalledTimes(1);

    d.resolve({ data: { id: "cl2", cardId: "c1" } });
    await waitFor(() => {
      expect(onAdd).toHaveBeenCalledTimes(1);
    });
  });
});
