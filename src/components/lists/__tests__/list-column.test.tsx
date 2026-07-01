import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ListColumn } from "@/components/lists/list-column";
import type { List } from "@/lib/db/schema/lists";

const baseList: List = {
  id: "list-1",
  boardId: "board-1",
  title: "To Do",
  position: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("ListColumn", () => {
  it("renders the list title", () => {
    render(<ListColumn list={baseList} onRename={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByRole("heading", { name: "To Do" })).toBeDefined();
  });

  it("renders the cards placeholder area", () => {
    render(<ListColumn list={baseList} onRename={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText(/cards will appear here/i)).toBeDefined();
  });

  it("enters rename mode on title click and saves on Enter", async () => {
    const user = userEvent.setup();
    const onRename = vi.fn().mockResolvedValue(undefined);

    render(<ListColumn list={baseList} onRename={onRename} onDelete={vi.fn()} />);

    const title = screen.getByRole("heading", { name: "To Do" });
    await user.click(title);

    const input = screen.getByDisplayValue("To Do") as HTMLInputElement;
    await user.clear(input);
    await user.type(input, "Renamed{Enter}");

    await waitFor(() => {
      expect(onRename).toHaveBeenCalledWith("Renamed");
    });
  });

  it("cancels rename on Escape and does not call onRename", async () => {
    const user = userEvent.setup();
    const onRename = vi.fn().mockResolvedValue(undefined);

    render(<ListColumn list={baseList} onRename={onRename} onDelete={vi.fn()} />);

    const title = screen.getByRole("heading", { name: "To Do" });
    await user.click(title);

    const input = screen.getByDisplayValue("To Do") as HTMLInputElement;
    await user.clear(input);
    await user.type(input, "Should not save{Escape}");

    expect(onRename).not.toHaveBeenCalled();
  });

  it("saves rename on blur", async () => {
    const user = userEvent.setup();
    const onRename = vi.fn().mockResolvedValue(undefined);

    render(<ListColumn list={baseList} onRename={onRename} onDelete={vi.fn()} />);

    const title = screen.getByRole("heading", { name: "To Do" });
    await user.click(title);

    const input = screen.getByDisplayValue("To Do") as HTMLInputElement;
    await user.clear(input);
    await user.type(input, "Blurred");
    fireEvent.blur(input);

    await waitFor(() => {
      expect(onRename).toHaveBeenCalledWith("Blurred");
    });
  });

  it("opens a delete confirmation and calls onDelete on confirm", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn().mockResolvedValue(undefined);

    render(<ListColumn list={baseList} onRename={vi.fn()} onDelete={onDelete} />);

    const deleteButton = screen.getByRole("button", { name: /delete list/i });
    await user.click(deleteButton);

    const confirmButton = await screen.findByRole("button", { name: /^delete$/i });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(onDelete).toHaveBeenCalled();
    });
  });

  it("exposes a drag handle for keyboard accessibility", () => {
    render(<ListColumn list={baseList} onRename={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByRole("button", { name: /move list/i })).toBeDefined();
  });
});
