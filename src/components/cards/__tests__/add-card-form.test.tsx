import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AddCardForm } from "@/components/cards/add-card-form";

function deferred<T>() {
  const { promise, resolve, reject } = Promise.withResolvers<T>();
  return { promise, resolve, reject };
}

describe("AddCardForm duplicate-submit guard", () => {
  it("fires onAdd once when Enter is followed by blur while the request is in flight", async () => {
    const user = userEvent.setup();
    const d = deferred<void>();
    const onAdd = vi.fn().mockReturnValue(d.promise);
    render(<AddCardForm onAdd={onAdd} />);

    await user.click(screen.getByRole("button", { name: /add card/i }));
    const input = await screen.findByPlaceholderText("Card title");
    await user.type(input, "Todo");
    await user.type(input, "{Enter}");
    // Browsers blur a focused element when it becomes disabled; jsdom does not.
    fireEvent.blur(input);

    expect(onAdd).toHaveBeenCalledTimes(1);
    expect(onAdd).toHaveBeenCalledWith("Todo");

    d.resolve();
    await waitFor(() => {
      expect(screen.queryByPlaceholderText("Card title")).toBeNull();
    });
  });

  it("fires onAdd once and disables the Add button on repeated clicks while in flight", async () => {
    const user = userEvent.setup();
    const d = deferred<void>();
    const onAdd = vi.fn().mockReturnValue(d.promise);
    render(<AddCardForm onAdd={onAdd} />);

    await user.click(screen.getByRole("button", { name: /add card/i }));
    const input = await screen.findByPlaceholderText("Card title");
    await user.type(input, "Todo");

    const addBtn = screen.getByRole("button", { name: /^add card$/i }) as HTMLButtonElement;
    // Two clicks inside one tick: must not outrun React's re-render and double-submit.
    fireEvent.click(addBtn);
    fireEvent.click(addBtn);

    expect(onAdd).toHaveBeenCalledTimes(1);
    expect(addBtn.disabled).toBe(true);
    expect(addBtn.textContent).toBe("Adding...");

    d.resolve();
    await waitFor(() => {
      expect(screen.queryByPlaceholderText("Card title")).toBeNull();
    });
  });
});
