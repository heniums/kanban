import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import type { Board } from "@/lib/db/schema/boards";

const {
  mockVerifySession,
  mockGetBoardById,
  mockGetUserRole,
  mockGetBoardMembers,
  mockRedirect,
  mockNotFound,
} = vi.hoisted(() => ({
  mockVerifySession: vi.fn(),
  mockGetBoardById: vi.fn(),
  mockGetUserRole: vi.fn(),
  mockGetBoardMembers: vi.fn(),
  mockRedirect: vi.fn(),
  mockNotFound: vi.fn(),
}));

vi.mock("@/lib/dal", () => ({
  verifySession: mockVerifySession,
}));

vi.mock("next/navigation", () => ({
  notFound: mockNotFound,
  redirect: mockRedirect,
  useRouter: () => ({
    refresh: vi.fn(),
    push: mockRedirect,
  }),
}));

vi.mock("@/lib/data/boards", () => ({
  getBoardById: mockGetBoardById,
}));

vi.mock("@/lib/permissions", () => ({
  getUserRole: mockGetUserRole,
  BoardPermission: {
    VIEW: "view",
    EDIT_CONTENT: "edit_content",
    MANAGE_SETTINGS: "manage_settings",
    MANAGE_MEMBERS: "manage_members",
  },
}));

vi.mock("@/lib/data/members", () => ({
  getBoardMembers: mockGetBoardMembers,
}));

vi.mock("@/lib/actions/boards", () => ({
  updateBoardAction: vi.fn(),
}));

import BoardSettingsPage from "@/app/boards/[boardId]/settings/page";

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

describe("BoardSettingsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockVerifySession.mockResolvedValue({ userId: "user-1" });
    mockGetBoardById.mockResolvedValue(baseBoard);
    mockGetUserRole.mockResolvedValue("owner");
    mockGetBoardMembers.mockResolvedValue([]);
  });

  it("renders the settings page with board title", async () => {
    const jsx = await BoardSettingsPage({
      params: Promise.resolve({ boardId: "test-id" }),
    });
    render(jsx);

    expect(screen.getByRole("heading", { level: 1, name: /my test board/i })).toBeDefined();
  });

  it("renders tab navigation with General and Members tabs", async () => {
    const jsx = await BoardSettingsPage({
      params: Promise.resolve({ boardId: "test-id" }),
    });
    render(jsx);

    expect(screen.getByRole("tab", { name: /general/i })).toBeDefined();
    expect(screen.getByRole("tab", { name: /members/i })).toBeDefined();
  });

  it("calls verifySession to check authentication", async () => {
    await BoardSettingsPage({
      params: Promise.resolve({ boardId: "test-id" }),
    });

    expect(mockVerifySession).toHaveBeenCalledTimes(1);
  });

  it("calls getBoardById with the correct boardId and userId", async () => {
    await BoardSettingsPage({
      params: Promise.resolve({ boardId: "test-id" }),
    });

    expect(mockGetBoardById).toHaveBeenCalledWith("test-id", { userId: "user-1" });
  });

  it("calls notFound when board does not exist", async () => {
    mockGetBoardById.mockResolvedValue(null);

    await BoardSettingsPage({
      params: Promise.resolve({ boardId: "non-existent" }),
    });

    expect(mockNotFound).toHaveBeenCalled();
  });

  it("calls getUserRole to check permissions", async () => {
    await BoardSettingsPage({
      params: Promise.resolve({ boardId: "test-id" }),
    });

    expect(mockGetUserRole).toHaveBeenCalledWith("user-1", "test-id");
  });

  it("redirects to dashboard when user lacks manage_settings permission", async () => {
    mockGetUserRole.mockResolvedValue("member");

    await BoardSettingsPage({
      params: Promise.resolve({ boardId: "test-id" }),
    });

    expect(mockRedirect).toHaveBeenCalledWith("/boards/test-id");
  });

  it("redirects to dashboard when user is not a board member", async () => {
    mockGetUserRole.mockResolvedValue(null);

    await BoardSettingsPage({
      params: Promise.resolve({ boardId: "test-id" }),
    });

    expect(mockRedirect).toHaveBeenCalledWith("/boards/test-id");
  });

  it("renders the page when user is owner", async () => {
    mockGetUserRole.mockResolvedValue("owner");

    const jsx = await BoardSettingsPage({
      params: Promise.resolve({ boardId: "test-id" }),
    });
    render(jsx);

    expect(screen.getByRole("heading", { level: 1 })).toBeDefined();
    expect(mockRedirect).not.toHaveBeenCalled();
  });
});
