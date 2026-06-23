import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import type { Board } from "@kanban/shared";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
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
  getBoardById: vi.fn(),
}));

import { auth } from "@/auth";
import { getBoardById } from "@/lib/data/boards";
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
    vi.mocked(auth).mockResolvedValue({
      user: { id: "user-1", email: "test@example.com" },
      expires: "2099-01-01",
    } as unknown as Awaited<ReturnType<typeof auth>>);
  });

  it("uses white text on dark backgrounds", async () => {
    vi.mocked(getBoardById).mockResolvedValue({
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
    vi.mocked(getBoardById).mockResolvedValue({
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
});
