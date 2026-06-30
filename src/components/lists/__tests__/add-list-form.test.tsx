import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AddListForm } from "@/components/lists/add-list-form";

describe("AddListForm", () => {
  it("renders an 'Add list' button by default", () => {
    render(<AddListForm onAdd={vi.fn()} />);
    expect(screen.getByRole("button", { name: /add list/i })).toBeDefined();
  });

  it("expands to show input on click", async () => {
    const user = userEvent.setup();
    render(<AddListForm onAdd={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /add list/i }));

    expect(screen.getByRole("textbox", { name: /list title/i })).toBeDefined();
  });

  it("calls onAdd with the title on Enter", async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn().mockResolvedValue(undefined);
    render(<AddListForm onAdd={onAdd} />);

    await user.click(screen.getByRole("button", { name: /add list/i }));
    const input = screen.getByRole("textbox", { name: /list title/i });
    await user.type(input, "Doing{Enter}");

    await waitFor(() => {
      expect(onAdd).toHaveBeenCalledWith("Doing");
    });
  });

  it("cancels on Escape and returns to button state", async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn().mockResolvedValue(undefined);
    render(<AddListForm onAdd={onAdd} />);

    await user.click(screen.getByRole("button", { name: /add list/i }));
    const input = screen.getByRole("textbox", { name: /list title/i });
    await user.type(input, "Nope{Escape}");

    expect(onAdd).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /add list/i })).toBeDefined();
  });

  it("does not call onAdd with an empty title", async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn().mockResolvedValue(undefined);
    render(<AddListForm onAdd={onAdd} />);

    await user.click(screen.getByRole("button", { name: /add list/i }));
    const input = screen.getByRole("textbox", { name: /list title/i });
    await user.type(input, "{Enter}");

    expect(onAdd).not.toHaveBeenCalled();
  });

  it("saves on blur", async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn().mockResolvedValue(undefined);
    render(<AddListForm onAdd={onAdd} />);

    await user.click(screen.getByRole("button", { name: /add list/i }));
    const input = screen.getByRole("textbox", { name: /list title/i });
    await user.type(input, "Blur title");
    fireEvent.blur(input);

    await waitFor(() => {
      expect(onAdd).toHaveBeenCalledWith("Blur title");
    });
  });
});
