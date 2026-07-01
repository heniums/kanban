import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import type { Board } from "@/lib/db/schema/boards";
import type { List } from "@/lib/db/schema/lists";

const { mockVerifySession, mockGetBoardById, mockGetListsByBoardId } = vi.hoisted(() => ({
  mockVerifySession: vi.fn(),
  mockGetBoardById: vi.fn(),
  mockGetListsByBoardId: vi.fn(),
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

vi.mock("@/lib/data/lists", () => ({
  getListsByBoardId: mockGetListsByBoardId,
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

const baseLists: List[] = [
  {
    id: "list-1",
    boardId: "test-id",
    title: "To Do",
    position: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

describe("BoardPage text color", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockVerifySession.mockResolvedValue({ userId: "user-1" });
    mockGetListsByBoardId.mockResolvedValue(baseLists);
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

describe("BoardPage hero section", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockVerifySession.mockResolvedValue({ userId: "user-1" });
    mockGetListsByBoardId.mockResolvedValue(baseLists);
  });

  it("renders a hero region with an aria-label derived from the board title", async () => {
    mockGetBoardById.mockResolvedValue(baseBoard);
    const jsx = await BoardPage({
      params: Promise.resolve({ boardId: "test-id" }),
    });
    render(jsx);
    const hero = screen.getByRole("region", { name: /my test board board header/i });
    expect(hero).toBeDefined();
  });

  it("applies the board background to the hero (not the page wrapper)", async () => {
    mockGetBoardById.mockResolvedValue({ ...baseBoard, background: "#1a1a2e" });
    const jsx = await BoardPage({
      params: Promise.resolve({ boardId: "test-id" }),
    });
    const { container } = render(jsx);
    const hero = screen.getByRole("region", { name: /my test board board header/i });
    const heroStyle = hero.getAttribute("style") ?? "";
    // The hero should carry the board background
    expect(heroStyle.includes("1a1a2e") || heroStyle.includes("26, 26, 46")).toBe(true);
    // No ancestor element outside the hero should also carry the board background
    const allWithBg = container.querySelectorAll('[style*="background"]');
    const nonHeroWithBoardBg = Array.from(allWithBg).filter((el) => {
      if (el === hero || hero.contains(el)) return false;
      const s = el.getAttribute("style") ?? "";
      return s.includes("1a1a2e") || s.includes("26, 26, 46");
    });
    expect(nonHeroWithBoardBg).toHaveLength(0);
  });

  it("renders the h1 title inside the hero (not outside)", async () => {
    mockGetBoardById.mockResolvedValue(baseBoard);
    const jsx = await BoardPage({
      params: Promise.resolve({ boardId: "test-id" }),
    });
    render(jsx);
    const hero = screen.getByRole("region", { name: /my test board board header/i });
    const h1 = screen.getByRole("heading", { level: 1, name: "My Test Board" });
    expect(hero.contains(h1)).toBe(true);
  });

  it("renders the description inside the hero when present", async () => {
    mockGetBoardById.mockResolvedValue(baseBoard);
    const jsx = await BoardPage({
      params: Promise.resolve({ boardId: "test-id" }),
    });
    render(jsx);
    const hero = screen.getByRole("region", { name: /my test board board header/i });
    const desc = screen.getByText("A description");
    expect(hero.contains(desc)).toBe(true);
  });

  it("renders board actions (Settings, Delete) inside the hero", async () => {
    mockGetBoardById.mockResolvedValue(baseBoard);
    const jsx = await BoardPage({
      params: Promise.resolve({ boardId: "test-id" }),
    });
    render(jsx);
    const hero = screen.getByRole("region", { name: /my test board board header/i });
    const settings = screen.getByRole("button", { name: /^settings$/i });
    const del = screen.getByRole("button", { name: /^delete$/i });
    expect(hero.contains(settings)).toBe(true);
    expect(hero.contains(del)).toBe(true);
  });

  it("renders the board lists below the hero (not inside it)", async () => {
    mockGetBoardById.mockResolvedValue(baseBoard);
    const jsx = await BoardPage({
      params: Promise.resolve({ boardId: "test-id" }),
    });
    render(jsx);
    const hero = screen.getByRole("region", { name: /my test board board header/i });
    const lists = screen.getByTestId("board-lists");
    expect(lists).toBeDefined();
    expect(hero.contains(lists)).toBe(false);
  });
});
