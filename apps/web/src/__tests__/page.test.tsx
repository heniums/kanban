import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import type { Board } from "@kanban/shared";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

vi.mock("@/lib/actions/boards", () => ({
  listBoardsAction: vi.fn(),
}));

vi.mock("@/components/marketing/marketing-landing", () => ({
  MarketingLanding: () => <div data-testid="marketing-landing">Marketing</div>,
}));

vi.mock("@/components/dashboard/first-run-empty-state", () => ({
  FirstRunEmptyState: () => (
    <div data-testid="first-run-empty-state">FirstRunEmpty</div>
  ),
}));

vi.mock("@/components/dashboard/dashboard-home", () => ({
  DashboardHome: ({ owned, shared }: { owned: Board[]; shared: Board[] }) => (
    <div data-testid="dashboard-home" data-owned={owned.length} data-shared={shared.length}>
      DashboardHome
    </div>
  ),
}));

import { auth } from "@/auth";
import { listBoardsAction } from "@/lib/actions/boards";
import Home from "@/app/page";

const makeBoard = (id: string): Board => ({
  id,
  title: `Board ${id}`,
  description: null,
  background: "#000",
  ownerId: "user-1",
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
});

describe("Home page (app/page.tsx)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders MarketingLanding when the user is not authenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);
    vi.mocked(listBoardsAction).mockResolvedValue({ owned: [], shared: [] });

    const jsx = await Home();
    render(jsx);

    expect(screen.getByTestId("marketing-landing")).toBeDefined();
    expect(screen.queryByTestId("first-run-empty-state")).toBeNull();
    expect(screen.queryByTestId("dashboard-home")).toBeNull();
    expect(listBoardsAction).not.toHaveBeenCalled();
  });

  it("renders FirstRunEmptyState when authenticated with 0 owned boards", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "user-1", email: "test@example.com" },
      expires: "2099-01-01",
    } as never);
    vi.mocked(listBoardsAction).mockResolvedValue({ owned: [], shared: [] });

    const jsx = await Home();
    render(jsx);

    expect(screen.getByTestId("first-run-empty-state")).toBeDefined();
    expect(screen.queryByTestId("marketing-landing")).toBeNull();
    expect(screen.queryByTestId("dashboard-home")).toBeNull();
    expect(listBoardsAction).toHaveBeenCalledTimes(1);
  });

  it("renders DashboardHome with owned and shared props when authenticated with ≥1 owned board", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "user-1", email: "test@example.com" },
      expires: "2099-01-01",
    } as never);
    const owned = [makeBoard("b1"), makeBoard("b2")];
    const shared = [makeBoard("s1")];
    vi.mocked(listBoardsAction).mockResolvedValue({ owned, shared });

    const jsx = await Home();
    render(jsx);

    const dashboardHome = screen.getByTestId("dashboard-home");
    expect(dashboardHome).toBeDefined();
    expect(dashboardHome.getAttribute("data-owned")).toBe("2");
    expect(dashboardHome.getAttribute("data-shared")).toBe("1");
    expect(screen.queryByTestId("marketing-landing")).toBeNull();
    expect(screen.queryByTestId("first-run-empty-state")).toBeNull();
    expect(listBoardsAction).toHaveBeenCalledTimes(1);
  });
});
