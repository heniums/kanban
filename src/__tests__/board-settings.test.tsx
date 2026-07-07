import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Board } from "@/lib/db/schema/boards";
import { BACKGROUNDS } from "@/components/boards/background-picker";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn(),
    push: vi.fn(),
  }),
}));

vi.mock("@/lib/actions/boards", () => ({
  updateBoardAction: vi.fn(),
}));

import { updateBoardAction } from "@/lib/actions/boards";
import { BoardSettings } from "@/components/boards/board-settings";

const baseBoard: Board = {
  id: "board-1",
  title: "Test Board",
  description: "A test board description",
  background: "#1a1a2e",
  backgroundImageUrl: null,
  backgroundImagePublicId: null,
  ownerId: "user-1",
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

describe("BoardSettings background picker", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("keeps the BackgroundPicker swatch in sync with form state via Controller", async () => {
    const user = userEvent.setup();
    render(<BoardSettings board={baseBoard} onClose={vi.fn()} />);

    const swatches = screen.getAllByRole("radio");
    expect(swatches[0].getAttribute("aria-checked")).toBe("true");

    await user.click(swatches[3]);

    expect(swatches[3].getAttribute("aria-checked")).toBe("true");
    expect(swatches[0].getAttribute("aria-checked")).toBe("false");
  });

  it("submits the Controller-managed background value", async () => {
    const user = userEvent.setup();
    vi.mocked(updateBoardAction).mockResolvedValue({
      board: { ...baseBoard, background: BACKGROUNDS[3].value },
    });

    render(<BoardSettings board={baseBoard} onClose={vi.fn()} />);

    const swatches = screen.getAllByRole("radio");
    await user.click(swatches[3]);

    const submitButton = screen.getByRole("button", { name: /save changes/i });
    await user.click(submitButton);

    expect(updateBoardAction).toHaveBeenCalledTimes(1);
    const callArgs = vi.mocked(updateBoardAction).mock.calls[0];
    expect(callArgs[0]).toBe("test-id");
    const formData = callArgs[1] as FormData;
    expect(formData.get("background")).toBe(BACKGROUNDS[3].value);
  });
});

describe("BoardSettings input accessibility", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sets aria-invalid and aria-describedby on title when validation fails", async () => {
    const user = userEvent.setup();
    render(<BoardSettings board={baseBoard} onClose={vi.fn()} />);

    const titleInput = screen.getByLabelText(/title/i);
    await user.clear(titleInput);

    const submitButton = screen.getByRole("button", { name: /save changes/i });
    await user.click(submitButton);

    expect(titleInput.getAttribute("aria-invalid")).toBe("true");
    const describedBy = titleInput.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();
    const errorEl = document.getElementById(describedBy!);
    expect(errorEl).toBeTruthy();
    expect(errorEl!.textContent).toMatch(/title is required/i);
  });

  it("does not set aria-invalid when no error exists", () => {
    render(<BoardSettings board={baseBoard} onClose={vi.fn()} />);

    const titleInput = screen.getByLabelText(/title/i);
    expect(titleInput.getAttribute("aria-invalid")).toBeFalsy();
  });
});
