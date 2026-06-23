import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import type { Board } from "@kanban/shared";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    const err: Error & { digest?: string } = new Error("NEXT_REDIRECT");
    err.digest = `NEXT_REDIRECT;${url}`;
    throw err;
  }),
}));

vi.mock("@/lib/actions/boards", () => ({
  listBoardsAction: vi.fn(),
}));

import { auth } from "@/auth";
import { listBoardsAction } from "@/lib/actions/boards";
import BoardsPage from "@/app/boards/page";

const sampleBoards: Board[] = [
  {
    id: "board-1",
    title: "Product Roadmap",
    description: "Q3 plans",
    background: "#1a1a2e",
    ownerId: "user-1",
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  },
  {
    id: "board-2",
    title: "Sprint Board",
    description: null,
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    ownerId: "user-1",
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  },
];

describe("BoardsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue(
      undefined as unknown as Awaited<ReturnType<typeof auth>>
    );
  });

  it("redirects unauthenticated users to /login", async () => {
    await expect(BoardsPage()).rejects.toThrow("NEXT_REDIRECT");
    expect(listBoardsAction).not.toHaveBeenCalled();
  });

  it("renders owned boards under the 'My Boards' section", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "user-1", email: "u@example.com" },
      expires: "2099-01-01",
    } as unknown as Awaited<ReturnType<typeof auth>>);
    vi.mocked(listBoardsAction).mockResolvedValue({
      owned: sampleBoards,
      shared: [],
    });

    const jsx = await BoardsPage();
    render(jsx);

    expect(screen.getByRole("heading", { name: /my boards/i })).toBeTruthy();
    expect(screen.getByText("Product Roadmap")).toBeTruthy();
    expect(screen.getByText("Sprint Board")).toBeTruthy();
  });

  it("renders the 'No boards yet' empty state when the user owns no boards", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "user-1", email: "u@example.com" },
      expires: "2099-01-01",
    } as unknown as Awaited<ReturnType<typeof auth>>);
    vi.mocked(listBoardsAction).mockResolvedValue({
      owned: [],
      shared: [],
    });

    const jsx = await BoardsPage();
    render(jsx);

    expect(
      screen.getByText(/no boards yet\. create one to get started\./i)
    ).toBeTruthy();
  });

  it("always renders the 'Shared with me' section with its empty state", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "user-1", email: "u@example.com" },
      expires: "2099-01-01",
    } as unknown as Awaited<ReturnType<typeof auth>>);
    vi.mocked(listBoardsAction).mockResolvedValue({
      owned: sampleBoards,
      shared: [],
    });

    const jsx = await BoardsPage();
    render(jsx);

    expect(screen.getByRole("heading", { name: /shared with me/i })).toBeTruthy();
    expect(
      screen.getByText(/no boards shared with you yet/i)
    ).toBeTruthy();
  });

  it("renders a link to /boards/new for creating a board", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "user-1", email: "u@example.com" },
      expires: "2099-01-01",
    } as unknown as Awaited<ReturnType<typeof auth>>);
    vi.mocked(listBoardsAction).mockResolvedValue({
      owned: [],
      shared: [],
    });

    const jsx = await BoardsPage();
    render(jsx);

    const createLinks = screen.getAllByRole("link", { name: /create board/i });
    expect(createLinks.length).toBeGreaterThan(0);
    expect(createLinks[0].getAttribute("href")).toBe("/boards/new");
  });
});
