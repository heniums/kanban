import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BACKGROUNDS } from "@/components/boards/background-picker";

vi.mock("@/lib/actions/boards", () => ({
  createBoardAction: vi.fn(),
}));

import { createBoardAction } from "@/lib/actions/boards";
import NewBoardPage from "@/app/boards/new/page";

describe("NewBoardPage background picker", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses Controller to keep BackgroundPicker swatch in sync with form state", async () => {
    const user = userEvent.setup();
    render(<NewBoardPage />);

    const swatches = screen.getAllByRole("radio");
    expect(swatches[0].getAttribute("aria-checked")).toBe("true");

    await user.click(swatches[2]);

    expect(swatches[2].getAttribute("aria-checked")).toBe("true");
    expect(swatches[0].getAttribute("aria-checked")).toBe("false");
  });

  it("submits the selected background value via Controller", async () => {
    const user = userEvent.setup();
    vi.mocked(createBoardAction).mockResolvedValue({ errors: [] });

    render(<NewBoardPage />);

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
