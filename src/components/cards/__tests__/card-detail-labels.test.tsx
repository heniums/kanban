import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LabelsControl } from "@/components/cards/card-detail/card-detail-labels";
import type { Label } from "@/lib/db/schema/labels";

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const boardLabels: Label[] = [
  { id: "lbl1", boardId: "b1", name: "Bug", color: "#ff0000" },
  { id: "lbl2", boardId: "b1", name: "Feature", color: "#00ff00" },
];

function renderControl(overrides: Partial<Parameters<typeof LabelsControl>[0]> = {}) {
  const props = {
    boardLabels,
    selectedIds: [] as string[],
    onToggle: vi.fn(),
    onCreateLabel: vi.fn().mockResolvedValue(boardLabels[0]),
    onUpdateLabel: vi.fn().mockResolvedValue(true),
    onDeleteLabel: vi.fn().mockResolvedValue(true),
    newlyCreatedIds: [] as string[],
    disabled: false,
    ...overrides,
  };
  render(<LabelsControl {...props} />);
  return props;
}

describe("LabelsControl action guards", () => {
  it("fires exactly one onCreateLabel and marks the Create button aria-busy while in flight (FR-1, AC-1, NFR-1)", async () => {
    const user = userEvent.setup();
    const d = deferred<Label>();
    const onCreateLabel = vi.fn().mockReturnValue(d.promise);
    renderControl({ onCreateLabel });

    await user.click(screen.getByRole("button", { name: /add or create label/i }));
    await user.click(await screen.findByText("Create new label"));
    const nameInput = await screen.findByPlaceholderText(/label name/i);
    await user.type(nameInput, "Urgent");

    const createBtn = screen.getByRole("button", { name: /^create$/i }) as HTMLButtonElement;
    await user.click(createBtn);
    await user.click(createBtn);
    await user.click(createBtn);

    expect(onCreateLabel).toHaveBeenCalledTimes(1);
    expect(createBtn.getAttribute("aria-busy")).toBe("true");
    expect(createBtn.disabled).toBe(true);

    d.resolve(boardLabels[0]);
    await waitFor(() => {
      expect(screen.queryByRole("button", { name: /^create$/i })).toBeNull();
    });
  });

  it("resets creating state after failure so the control is usable again (FR-4, AC-3)", async () => {
    const user = userEvent.setup();
    const d = deferred<Label>();
    const onCreateLabel = vi.fn().mockReturnValue(d.promise);
    renderControl({ onCreateLabel });

    await user.click(screen.getByRole("button", { name: /add or create label/i }));
    await user.click(await screen.findByText("Create new label"));
    await user.type(await screen.findByPlaceholderText(/label name/i), "Urgent");

    const createBtn = screen.getByRole("button", { name: /^create$/i }) as HTMLButtonElement;
    await user.click(createBtn);
    expect(onCreateLabel).toHaveBeenCalledTimes(1);

    d.reject(new Error("boom"));
    await waitFor(() => {
      const btn = screen.getByRole("button", { name: /^create$/i }) as HTMLButtonElement;
      expect(btn.getAttribute("aria-busy")).toBe("false");
      expect(btn.disabled).toBe(false);
    });
  });

  it("fires exactly one onUpdateLabel while a Save is in flight (FR-2, AC-1)", async () => {
    const user = userEvent.setup();
    const d = deferred<boolean>();
    const onUpdateLabel = vi.fn().mockReturnValue(d.promise);
    renderControl({ onUpdateLabel });

    await user.click(screen.getByRole("button", { name: /add or create label/i }));
    await user.click(await screen.findByRole("button", { name: /edit feature/i }));
    const saveBtn = (await screen.findByRole("button", { name: /^save$/i })) as HTMLButtonElement;

    await user.click(saveBtn);
    await user.click(saveBtn);
    await user.click(saveBtn);

    expect(onUpdateLabel).toHaveBeenCalledTimes(1);
    expect(saveBtn.getAttribute("aria-busy")).toBe("true");
    expect(saveBtn.disabled).toBe(true);

    d.resolve(true);
  });

  it("fires exactly one onDeleteLabel while a delete is in flight (FR-3, AC-1)", async () => {
    const user = userEvent.setup();
    const d = deferred<boolean>();
    const onDeleteLabel = vi.fn().mockReturnValue(d.promise);
    renderControl({ onDeleteLabel });

    await user.click(screen.getByRole("button", { name: /add or create label/i }));
    await user.click(await screen.findByRole("button", { name: /edit feature/i }));
    await user.click(await screen.findByRole("button", { name: /delete label/i }));
    const confirmBtn = (await screen.findByRole("button", {
      name: /^delete$/i,
    })) as HTMLButtonElement;

    await user.click(confirmBtn);
    await user.click(confirmBtn);
    await user.click(confirmBtn);

    expect(onDeleteLabel).toHaveBeenCalledTimes(1);

    d.resolve(true);
  });

  it("does not fire any action when disabled (FR-5, AC-4)", async () => {
    const onCreateLabel = vi.fn().mockResolvedValue(boardLabels[0]);
    renderControl({ disabled: true, onCreateLabel });
    const trigger = screen.getByRole("button", {
      name: /add or create label/i,
    }) as HTMLButtonElement;
    expect(trigger.disabled).toBe(true);
  });
});
