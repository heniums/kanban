import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import type { Board } from "@/lib/db/schema/boards";

const { mockVerifySession, mockGetBoardById } = vi.hoisted(() => ({
  mockVerifySession: vi.fn(),
  mockGetBoardById: vi.fn(),
}));

vi.mock("@/lib/dal", () => ({
  verifySession: mockVerifySession,
}));

vi.mock("next/navigation", () => ({
  notFound: vi.fn(),
  redirect: vi.fn(),
  useRouter: () => ({
    refresh: vi.fn(),
    push: vi.fn(),
  }),
}));

vi.mock("@/lib/data/boards", () => ({
  getBoardById: mockGetBoardById,
}));

vi.mock("@/lib/actions/boards", () => ({
  deleteBoardAction: vi.fn(),
  restoreBoardAction: vi.fn(),
  updateBoardAction: vi.fn(),
  getBoardAction: vi.fn(),
  listBoardsAction: vi.fn(),
  createBoardAction: vi.fn(),
}));

import BoardPage from "@/app/boards/[boardId]/page";

const baseBoard: Board = {
  id: "test-id",
  title: "My Test Board",
  description: "A description",
  background: "#1a1a2e",
  ownerId: "user-1",
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

describe("BoardPage text color", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockVerifySession.mockResolvedValue({ userId: "user-1" });
  });

  it("uses white text on dark backgrounds", async () => {
    mockGetBoardById.mockResolvedValue({
      ...baseBoard,
      background: "#1a1a2e",
    });

    const jsx = await BoardPage({
      params: Promise.resolve({ boardId: "test-id" }),
    });
    render(jsx);

    const title = screen.getByRole("heading", { level: 1 });
    expect(title.style.color).toBe("white");
  });

  it("uses dark text on light backgrounds", async () => {
    mockGetBoardById.mockResolvedValue({
      ...baseBoard,
      background: "#f5f5f5",
    });

    const jsx = await BoardPage({
      params: Promise.resolve({ boardId: "test-id" }),
    });
    render(jsx);

    const title = screen.getByRole("heading", { level: 1 });
    expect(title.style.color).toBe("rgb(10, 10, 10)");
  });

  it("calls verifySession and forwards userId to getBoardById", async () => {
    mockGetBoardById.mockResolvedValue(baseBoard);
    await BoardPage({
      params: Promise.resolve({ boardId: "test-id" }),
    });
    expect(mockVerifySession).toHaveBeenCalledTimes(1);
    expect(mockGetBoardById).toHaveBeenCalledWith("test-id", {
      ownerId: "user-1",
    });
  });
});
