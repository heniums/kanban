import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Board } from "@/lib/db/schema/boards";

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

import { deleteBoardAction, restoreBoardAction } from "@/lib/actions/boards";
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

describe("BoardActions undo toast", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows an error toast when the restore action throws", async () => {
    const user = userEvent.setup();
    vi.mocked(deleteBoardAction).mockResolvedValue({ success: true });
    vi.mocked(restoreBoardAction).mockRejectedValue(new Error("network down"));

    render(<BoardActions board={baseBoard} />);

    const deleteButton = screen.getByRole("button", { name: /^delete$/i });
    await user.click(deleteButton);

    const confirmButton = await screen.findByRole("button", { name: /^delete$/i });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(toast).toHaveBeenCalled();
    });

    const toastCall = vi.mocked(toast).mock.calls[0];
    const opts = toastCall[1] as unknown as { action: { onClick: () => Promise<void> } };
    await act(async () => {
      await opts.action.onClick();
    });

    expect(toast.error).toHaveBeenCalledWith("Failed to restore board.");
  });

  it("does not show an error toast on a successful restore", async () => {
    const user = userEvent.setup();
    vi.mocked(deleteBoardAction).mockResolvedValue({ success: true });
    vi.mocked(restoreBoardAction).mockResolvedValue({ success: true });

    render(<BoardActions board={baseBoard} />);

    const deleteButton = screen.getByRole("button", { name: /^delete$/i });
    await user.click(deleteButton);

    const confirmButton = await screen.findByRole("button", { name: /^delete$/i });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(toast).toHaveBeenCalled();
    });

    const toastCall = vi.mocked(toast).mock.calls[0];
    const opts = toastCall[1] as unknown as { action: { onClick: () => Promise<void> } };
    await act(async () => {
      await opts.action.onClick();
    });

    expect(toast.error).not.toHaveBeenCalled();
  });
});
