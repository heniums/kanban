import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AddListForm } from "@/components/lists/add-list-form";

function deferred<T>() {
  const { promise, resolve, reject } = Promise.withResolvers<T>();
  return { promise, resolve, reject };
}

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

  it("closes the form after a successful add and returns to button state", async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn().mockResolvedValue(undefined);
    render(<AddListForm onAdd={onAdd} />);

    await user.click(screen.getByRole("button", { name: /add list/i }));
    const input = screen.getByRole("textbox", { name: /list title/i });
    await user.type(input, "Doing{Enter}");

    await waitFor(() => {
      expect(onAdd).toHaveBeenCalledWith("Doing");
    });
    expect(screen.queryByRole("textbox", { name: /list title/i })).toBeNull();
    expect(screen.getByRole("button", { name: /add list/i })).toBeDefined();
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

describe("AddListForm duplicate-submit guard", () => {
  it("fires onAdd once when Enter is followed by blur while the request is in flight", async () => {
    const user = userEvent.setup();
    const d = deferred<void>();
    const onAdd = vi.fn().mockReturnValue(d.promise);
    render(<AddListForm onAdd={onAdd} />);

    await user.click(screen.getByRole("button", { name: /add list/i }));
    const input = await screen.findByPlaceholderText("List title");
    await user.type(input, "Backlog");
    await user.type(input, "{Enter}");
    // Browsers blur a focused element when it becomes disabled; jsdom does not.
    fireEvent.blur(input);

    expect(onAdd).toHaveBeenCalledTimes(1);
    expect(onAdd).toHaveBeenCalledWith("Backlog");

    d.resolve();
    await waitFor(() => {
      expect(screen.queryByPlaceholderText("List title")).toBeNull();
    });
  });

  it("fires onAdd once and disables the Add button on repeated clicks while in flight", async () => {
    const user = userEvent.setup();
    const d = deferred<void>();
    const onAdd = vi.fn().mockReturnValue(d.promise);
    render(<AddListForm onAdd={onAdd} />);

    await user.click(screen.getByRole("button", { name: /add list/i }));
    const input = await screen.findByPlaceholderText("List title");
    await user.type(input, "Backlog");

    const addBtn = screen.getByRole("button", { name: /^add list$/i }) as HTMLButtonElement;
    fireEvent.click(addBtn);
    fireEvent.click(addBtn);

    expect(onAdd).toHaveBeenCalledTimes(1);
    expect(addBtn.disabled).toBe(true);
    expect(addBtn.textContent).toBe("Adding...");

    d.resolve();
    await waitFor(() => {
      expect(screen.queryByPlaceholderText("List title")).toBeNull();
    });
  });
});
