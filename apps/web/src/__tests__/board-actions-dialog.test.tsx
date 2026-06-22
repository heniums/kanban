import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Board } from "@kanban/shared";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn(),
    push: vi.fn(),
  }),
}));

vi.mock("@/lib/actions/boards", () => ({
  deleteBoardAction: vi.fn(),
  restoreBoardAction: vi.fn(),
}));

vi.mock("sonner", () => {
  const toast = Object.assign(vi.fn(), {
    error: vi.fn(),
  });
  return { toast };
});

import { deleteBoardAction } from "@/lib/actions/boards";
import { toast } from "sonner";
import { BoardActions } from "@/components/boards/board-actions";

const baseBoard: Board = {
  id: "test-id",
  title: "Test Board",
  description: null,
  background: "#1a1a2e",
  ownerId: "user-1",
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

describe("BoardActions delete dialog state binding (FR4)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("closes the delete dialog after a successful delete", async () => {
    const user = userEvent.setup();
    let resolveDelete: (value: { success: true } | Promise<{ success: true }>) => void = () => {};
    const pending = new Promise<{ success: true }>((res) => {
      resolveDelete = res;
    });
    vi.mocked(deleteBoardAction).mockReturnValue(pending);

    render(<BoardActions board={baseBoard} />);

    const triggerButton = screen.getByRole("button", { name: /^delete$/i });
    await user.click(triggerButton);

    expect(
      await screen.findByText(/this action cannot be undone/i),
    ).toBeDefined();

    const confirmButton = await screen.findByRole("button", { name: /^delete$/i });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(
        screen.queryByText(/this action cannot be undone/i),
      ).not.toBeNull();
    });

    await act(async () => {
      resolveDelete({ success: true });
      await pending;
    });

    await waitFor(() => {
      expect(
        screen.queryByText(/this action cannot be undone/i),
      ).toBeNull();
    });
  });

  it("keeps the delete dialog open and shows an error toast on server failure", async () => {
    const user = userEvent.setup();
    vi.mocked(deleteBoardAction).mockResolvedValue({
      error: "Board not found or not owned",
    });

    render(<BoardActions board={baseBoard} />);

    const triggerButton = screen.getByRole("button", { name: /^delete$/i });
    await user.click(triggerButton);

    const confirmButton = await screen.findByRole("button", { name: /^delete$/i });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
    });

    expect(
      screen.queryByText(/this action cannot be undone/i),
    ).not.toBeNull();
  });
});

describe("BoardActions race condition guard (FR5)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("invokes deleteBoardAction only once on a rapid double-click", async () => {
    const user = userEvent.setup();
    let resolveDelete: (value: { success: true } | Promise<{ success: true }>) => void = () => {};
    const pending = new Promise<{ success: true }>((res) => {
      resolveDelete = res;
    });
    vi.mocked(deleteBoardAction).mockReturnValue(pending);

    render(<BoardActions board={baseBoard} />);

    const triggerButton = screen.getByRole("button", { name: /^delete$/i });
    await user.click(triggerButton);

    const confirmButton = await screen.findByRole("button", { name: /^delete$/i });
    await user.click(confirmButton);
    await user.click(confirmButton);
    await user.click(confirmButton);

    expect(deleteBoardAction).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveDelete({ success: true });
      await pending;
    });
  });
});
