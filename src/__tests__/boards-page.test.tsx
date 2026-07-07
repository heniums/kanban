import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import type { Board } from "@/lib/db/schema/boards";

const { mockVerifySession, mockListBoardsAction } = vi.hoisted(() => ({
  mockVerifySession: vi.fn(),
  mockListBoardsAction: vi.fn(),
}));

vi.mock("@/lib/dal", () => ({
  verifySession: mockVerifySession,
}));

vi.mock("@/lib/actions/boards", () => ({
  listBoardsAction: mockListBoardsAction,
}));

import BoardsPage from "@/app/boards/page";

const sampleBoards: Board[] = [
  {
    id: "board-1",
    title: "Product Roadmap",
    description: "Q3 plans",
    background: "#1a1a2e",
    backgroundImageUrl: null,
    backgroundImagePublicId: null,
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
    backgroundImageUrl: null,
    backgroundImagePublicId: null,
    ownerId: "user-1",
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  },
];

describe("BoardsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockVerifySession.mockRejectedValue(
      Object.assign(new Error("NEXT_REDIRECT"), {
        digest: "NEXT_REDIRECT;/login",
      }),
    );
  });

  it("redirects unauthenticated users to /login", async () => {
    await expect(BoardsPage()).rejects.toMatchObject({
      digest: expect.stringContaining("NEXT_REDIRECT;/login"),
    });
    expect(mockListBoardsAction).not.toHaveBeenCalled();
  });

  it("renders owned boards under the 'My Boards' section", async () => {
    mockVerifySession.mockResolvedValue({ userId: "user-1" });
    mockListBoardsAction.mockResolvedValue({
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
    mockVerifySession.mockResolvedValue({ userId: "user-1" });
    mockListBoardsAction.mockResolvedValue({
      owned: [],
      shared: [],
    });

    const jsx = await BoardsPage();
    render(jsx);

    expect(screen.getByText(/no boards yet\. create one to get started\./i)).toBeTruthy();
  });

  it("always renders the 'Shared with me' section with its empty state", async () => {
    mockVerifySession.mockResolvedValue({ userId: "user-1" });
    mockListBoardsAction.mockResolvedValue({
      owned: sampleBoards,
      shared: [],
    });

    const jsx = await BoardsPage();
    render(jsx);

    expect(screen.getByRole("heading", { name: /shared with me/i })).toBeTruthy();
    expect(screen.getByText(/no boards shared with you yet/i)).toBeTruthy();
  });

  it("renders shared boards under the 'Shared with me' section", async () => {
    mockVerifySession.mockResolvedValue({ userId: "user-1" });
    mockListBoardsAction.mockResolvedValue({
      owned: [],
      shared: sampleBoards,
    });

    const jsx = await BoardsPage();
    render(jsx);

    expect(screen.getByRole("heading", { name: /shared with me/i })).toBeTruthy();
    expect(screen.getByText("Product Roadmap")).toBeTruthy();
    expect(screen.getByText("Sprint Board")).toBeTruthy();
  });

  it("renders a link to /boards/new for creating a board", async () => {
    mockVerifySession.mockResolvedValue({ userId: "user-1" });
    mockListBoardsAction.mockResolvedValue({
      owned: [],
      shared: [],
    });

    const jsx = await BoardsPage();
    render(jsx);

    const createLinks = screen.getAllByRole("link", { name: /create board/i });
    expect(createLinks.length).toBeGreaterThan(0);
    expect(createLinks[0].getAttribute("href")).toBe("/boards/new");
  });

  it("calls verifySession (not auth directly)", async () => {
    mockVerifySession.mockResolvedValue({ userId: "user-1" });
    mockListBoardsAction.mockResolvedValue({ owned: [], shared: [] });
    await BoardsPage();
    expect(mockVerifySession).toHaveBeenCalledTimes(1);
    expect(mockListBoardsAction).toHaveBeenCalledTimes(1);
  });
});
