import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BACKGROUNDS } from "@/components/boards/background-picker";

vi.mock("@/lib/actions/boards", () => ({
  createBoardAction: vi.fn(),
}));

import { createBoardAction } from "@/lib/actions/boards";
import NewBoardForm from "@/components/boards/new-board-form";

describe("NewBoardForm background picker", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses Controller to keep BackgroundPicker swatch in sync with form state", async () => {
    const user = userEvent.setup();
    render(<NewBoardForm />);

    const swatches = screen.getAllByRole("radio");
    expect(swatches[0].getAttribute("aria-checked")).toBe("true");

    await user.click(swatches[2]);

    expect(swatches[2].getAttribute("aria-checked")).toBe("true");
    expect(swatches[0].getAttribute("aria-checked")).toBe("false");
  });

  it("submits the selected background value via Controller", async () => {
    const user = userEvent.setup();
    vi.mocked(createBoardAction).mockResolvedValue({ errors: [] });

    render(<NewBoardForm />);

    const titleInput = screen.getByLabelText(/title/i);
    await user.type(titleInput, "My Board");

    const swatches = screen.getAllByRole("radio");
    await user.click(swatches[2]);

    const submitButton = screen.getByRole("button", { name: /create board/i });
    await user.click(submitButton);

    expect(createBoardAction).toHaveBeenCalledTimes(1);
    const call = vi.mocked(createBoardAction).mock.calls[0];
    const formData = call[0] as FormData;
    expect(formData.get("background")).toBe(BACKGROUNDS[2].value);
  });
});

describe("NewBoardForm input accessibility", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sets aria-invalid and aria-describedby on title when validation fails", async () => {
    const user = userEvent.setup();
    render(<NewBoardForm />);

    const submitButton = screen.getByRole("button", { name: /create board/i });
    await user.click(submitButton);

    const titleInput = screen.getByLabelText(/title/i);
    expect(titleInput.getAttribute("aria-invalid")).toBe("true");
    const describedBy = titleInput.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();
    expect(describedBy!.length).toBeGreaterThan(0);
    const errorEl = document.getElementById(describedBy!);
    expect(errorEl).toBeTruthy();
    expect(errorEl!.textContent).toMatch(/title is required/i);
  });

  it("does not set aria-invalid when no error exists", () => {
    render(<NewBoardForm />);

    const titleInput = screen.getByLabelText(/title/i);
    expect(titleInput.getAttribute("aria-invalid")).toBeFalsy();
  });
});
