import { describe, it, expect, vi, beforeEach } from "vitest";

const USER_1 = "00000000-0000-0000-0000-000000000001";
const BOARD_ID = "00000000-0000-0000-0000-000000000010";

const { mockVerifySession, mockHasPermission, mockDeleteCloudinaryAsset } = vi.hoisted(() => ({
  mockVerifySession: vi.fn(),
  mockHasPermission: vi.fn(),
  mockDeleteCloudinaryAsset: vi.fn(),
}));

vi.mock("@/lib/dal", () => ({
  verifySession: mockVerifySession,
}));

vi.mock("@/lib/permissions", () => ({
  hasPermission: mockHasPermission,
  BoardPermission: {
    VIEW: "view",
    EDIT_CONTENT: "edit_content",
    MANAGE_SETTINGS: "manage_settings",
    MANAGE_MEMBERS: "manage_members",
  },
}));

vi.mock("@/lib/cloudinary", () => ({
  deleteCloudinaryAsset: mockDeleteCloudinaryAsset,
}));

// Need to mock db for board background actions since they use createDbClient directly
const mockSelect = vi.fn();
const mockUpdate = vi.fn();
const mockDb = {
  select: mockSelect,
  update: mockUpdate,
};

vi.mock("@/lib/db/client", () => ({
  createDbClient: vi.fn(() => mockDb),
}));

import {
  updateBoardBackgroundImageAction,
  deleteBoardBackgroundImageAction,
} from "../board-background";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("updateBoardBackgroundImageAction", () => {
  it("updates board background and deletes old one", async () => {
    mockVerifySession.mockResolvedValue({ userId: USER_1 });
    mockHasPermission.mockResolvedValue(true);
    mockDeleteCloudinaryAsset.mockResolvedValue(undefined);

    mockSelect.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{ backgroundImagePublicId: "old_id" }]),
      }),
    });

    const returningMock = vi.fn().mockResolvedValue([
      {
        id: BOARD_ID,
        backgroundImageUrl: "https://example.com/bg.jpg",
        backgroundImagePublicId: "new_id",
      },
    ]);

    mockUpdate.mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: returningMock,
        }),
      }),
    });

    const result = await updateBoardBackgroundImageAction({
      boardId: BOARD_ID,
      backgroundImageUrl: "https://example.com/bg.jpg",
      backgroundImagePublicId: "new_id",
    });

    expect(result).toHaveProperty("board");
    expect(mockDeleteCloudinaryAsset).toHaveBeenCalledWith("old_id");
  });

  it("returns error when user lacks permission", async () => {
    mockVerifySession.mockResolvedValue({ userId: USER_1 });
    mockHasPermission.mockResolvedValue(false);

    const result = await updateBoardBackgroundImageAction({
      boardId: BOARD_ID,
      backgroundImageUrl: "https://example.com/bg.jpg",
      backgroundImagePublicId: "new_id",
    });

    expect(result).toHaveProperty("error");
    expect(result.error).toContain("permission");
  });
});

describe("deleteBoardBackgroundImageAction", () => {
  it("clears board background and deletes old one", async () => {
    mockVerifySession.mockResolvedValue({ userId: USER_1 });
    mockHasPermission.mockResolvedValue(true);
    mockDeleteCloudinaryAsset.mockResolvedValue(undefined);

    mockSelect.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{ backgroundImagePublicId: "old_id" }]),
      }),
    });

    const returningMock = vi.fn().mockResolvedValue([
      {
        id: BOARD_ID,
        backgroundImageUrl: null,
        backgroundImagePublicId: null,
      },
    ]);

    mockUpdate.mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: returningMock,
        }),
      }),
    });

    const result = await deleteBoardBackgroundImageAction({ boardId: BOARD_ID });

    expect(result).toHaveProperty("board");
    expect(mockDeleteCloudinaryAsset).toHaveBeenCalledWith("old_id");
  });
});
