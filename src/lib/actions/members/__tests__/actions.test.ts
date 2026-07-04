import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  mockVerifySession,
  mockSearchUsers,
  mockAddMember,
  mockRemoveMember,
  mockGetBoardMembers,
  mockHasPermission,
} = vi.hoisted(() => ({
  mockVerifySession: vi.fn(),
  mockSearchUsers: vi.fn(),
  mockAddMember: vi.fn(),
  mockRemoveMember: vi.fn(),
  mockGetBoardMembers: vi.fn(),
  mockHasPermission: vi.fn(),
}));

vi.mock("@/lib/dal", () => ({
  verifySession: mockVerifySession,
}));

vi.mock("@/lib/data/members", () => ({
  searchUsers: mockSearchUsers,
  addMember: mockAddMember,
  removeMember: mockRemoveMember,
  getBoardMembers: mockGetBoardMembers,
}));

vi.mock("@/lib/permissions", () => ({
  hasPermission: mockHasPermission,
  BoardPermission: {
    MANAGE_MEMBERS: "manage_members",
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { searchUsersAction } from "../search";
import { addMemberAction } from "../add";
import { removeMemberAction } from "../remove";
import { getBoardMembersAction } from "../list";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("searchUsersAction", () => {
  it("returns matching users excluding existing board members", async () => {
    mockVerifySession.mockResolvedValue({ userId: "user-1" });
    mockHasPermission.mockResolvedValue(true);
    mockSearchUsers.mockResolvedValue([
      { id: "user-2", email: "test2@kanban.local", name: "Test User 2" },
      { id: "user-3", email: "test3@kanban.local", name: "Test User 3" },
    ]);

    const result = await searchUsersAction("board-1", "test");

    expect(result).toEqual({
      users: [
        { id: "user-2", email: "test2@kanban.local", name: "Test User 2" },
        { id: "user-3", email: "test3@kanban.local", name: "Test User 3" },
      ],
    });
    expect(mockSearchUsers).toHaveBeenCalledWith("board-1", "test");
  });

  it("returns error when user lacks manage_members permission", async () => {
    mockVerifySession.mockResolvedValue({ userId: "user-1" });
    mockHasPermission.mockResolvedValue(false);

    const result = await searchUsersAction("board-1", "test");

    expect(result).toHaveProperty("error");
    expect(result.error).toContain("permission");
    expect(mockSearchUsers).not.toHaveBeenCalled();
  });

  it("returns error when query is too short", async () => {
    mockVerifySession.mockResolvedValue({ userId: "user-1" });
    mockHasPermission.mockResolvedValue(true);

    const result = await searchUsersAction("board-1", "a");

    expect(result).toHaveProperty("error");
    expect(result.error).toContain("at least 2 characters");
    expect(mockSearchUsers).not.toHaveBeenCalled();
  });
});

describe("addMemberAction", () => {
  it("adds a user as member to the board", async () => {
    mockVerifySession.mockResolvedValue({ userId: "user-1" });
    mockHasPermission.mockResolvedValue(true);
    mockAddMember.mockResolvedValue({ success: true });

    const result = await addMemberAction("board-1", "user-2");

    expect(result).toEqual({ success: true });
    expect(mockAddMember).toHaveBeenCalledWith("board-1", "user-2");
  });

  it("returns error when user lacks manage_members permission", async () => {
    mockVerifySession.mockResolvedValue({ userId: "user-1" });
    mockHasPermission.mockResolvedValue(false);

    const result = await addMemberAction("board-1", "user-2");

    expect(result).toHaveProperty("error");
    expect(result.error).toContain("permission");
    expect(mockAddMember).not.toHaveBeenCalled();
  });

  it("returns error when user is already a member", async () => {
    mockVerifySession.mockResolvedValue({ userId: "user-1" });
    mockHasPermission.mockResolvedValue(true);
    mockAddMember.mockResolvedValue({ error: "User is already a member of this board" });

    const result = await addMemberAction("board-1", "user-2");

    expect(result).toHaveProperty("error");
    expect(result.error).toContain("already a member");
  });
});

describe("removeMemberAction", () => {
  it("removes a member from the board", async () => {
    mockVerifySession.mockResolvedValue({ userId: "user-1" });
    mockHasPermission.mockResolvedValue(true);
    mockRemoveMember.mockResolvedValue({ success: true });

    const result = await removeMemberAction("board-1", "user-2");

    expect(result).toEqual({ success: true });
    expect(mockRemoveMember).toHaveBeenCalledWith("board-1", "user-2");
  });

  it("returns error when user lacks manage_members permission", async () => {
    mockVerifySession.mockResolvedValue({ userId: "user-1" });
    mockHasPermission.mockResolvedValue(false);

    const result = await removeMemberAction("board-1", "user-2");

    expect(result).toHaveProperty("error");
    expect(result.error).toContain("permission");
    expect(mockRemoveMember).not.toHaveBeenCalled();
  });

  it("returns error when trying to remove the last owner", async () => {
    mockVerifySession.mockResolvedValue({ userId: "user-1" });
    mockHasPermission.mockResolvedValue(true);
    mockRemoveMember.mockResolvedValue({ error: "Cannot remove the last owner of the board" });

    const result = await removeMemberAction("board-1", "user-2");

    expect(result).toHaveProperty("error");
    expect(result.error).toContain("last owner");
  });
});

describe("getBoardMembersAction", () => {
  it("returns all members with user details", async () => {
    mockVerifySession.mockResolvedValue({ userId: "user-1" });
    mockHasPermission.mockResolvedValue(true);
    mockGetBoardMembers.mockResolvedValue([
      {
        userId: "user-1",
        role: "owner",
        joinedAt: new Date(),
        user: { id: "user-1", email: "owner@kanban.local", name: "Owner" },
      },
      {
        userId: "user-2",
        role: "member",
        joinedAt: new Date(),
        user: { id: "user-2", email: "member@kanban.local", name: "Member" },
      },
    ]);

    const result = await getBoardMembersAction("board-1");

    expect(result).toHaveProperty("members");
    expect(result.members).toHaveLength(2);
    expect(mockGetBoardMembers).toHaveBeenCalledWith("board-1");
  });

  it("returns error when user lacks view permission", async () => {
    mockVerifySession.mockResolvedValue({ userId: "user-1" });
    mockHasPermission.mockResolvedValue(false);

    const result = await getBoardMembersAction("board-1");

    expect(result).toHaveProperty("error");
    expect(result.error).toContain("permission");
    expect(mockGetBoardMembers).not.toHaveBeenCalled();
  });
});
