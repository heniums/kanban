import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  mockVerifySession,
  mockAssertBoardPermission,
  mockGetBoardAttachmentPublicIds,
  mockDeleteAttachmentsByBoardId,
  mockHardDeleteBoard,
  mockDeleteCloudinaryAsset,
} = vi.hoisted(() => ({
  mockVerifySession: vi.fn(),
  mockAssertBoardPermission: vi.fn(),
  mockGetBoardAttachmentPublicIds: vi.fn(),
  mockDeleteAttachmentsByBoardId: vi.fn(),
  mockHardDeleteBoard: vi.fn(),
  mockDeleteCloudinaryAsset: vi.fn(),
}));

vi.mock("@/lib/dal", () => ({
  verifySession: mockVerifySession,
}));

vi.mock("@/lib/actions/guards", () => ({
  assertBoardPermission: mockAssertBoardPermission,
}));

vi.mock("@/lib/data/boards/permanent-delete", () => ({
  getBoardAttachmentPublicIds: mockGetBoardAttachmentPublicIds,
  deleteAttachmentsByBoardId: mockDeleteAttachmentsByBoardId,
  hardDeleteBoard: mockHardDeleteBoard,
}));

vi.mock("@/lib/cloudinary", () => ({
  deleteCloudinaryAsset: mockDeleteCloudinaryAsset,
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { permanentDeleteBoardAction } from "../permanent-delete";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("permanentDeleteBoardAction", () => {
  it("deletes board and cloudinary assets when caller has permission", async () => {
    mockVerifySession.mockResolvedValue({ userId: "user-1" });
    mockAssertBoardPermission.mockResolvedValue(true);
    mockGetBoardAttachmentPublicIds.mockResolvedValue(["img_1", "img_2"]);
    mockDeleteCloudinaryAsset.mockResolvedValue(undefined);
    mockDeleteAttachmentsByBoardId.mockResolvedValue(undefined);
    mockHardDeleteBoard.mockResolvedValue(true);

    const result = await permanentDeleteBoardAction("board-1");
    expect(result).toEqual({ success: true });
    expect(mockDeleteCloudinaryAsset).toHaveBeenCalledWith("img_1");
    expect(mockDeleteCloudinaryAsset).toHaveBeenCalledWith("img_2");
    expect(mockDeleteAttachmentsByBoardId).toHaveBeenCalledWith("board-1");
    expect(mockHardDeleteBoard).toHaveBeenCalledWith("board-1");
  });

  it("returns forbidden when user lacks permission", async () => {
    mockVerifySession.mockResolvedValue({ userId: "user-1" });
    mockAssertBoardPermission.mockResolvedValue(false);

    const result = await permanentDeleteBoardAction("board-1");
    expect(result).toHaveProperty("error", "Forbidden");
    expect(mockHardDeleteBoard).not.toHaveBeenCalled();
  });

  it("returns error when board not found", async () => {
    mockVerifySession.mockResolvedValue({ userId: "user-1" });
    mockAssertBoardPermission.mockResolvedValue(true);
    mockGetBoardAttachmentPublicIds.mockResolvedValue([]);
    mockDeleteAttachmentsByBoardId.mockResolvedValue(undefined);
    mockHardDeleteBoard.mockResolvedValue(false);

    const result = await permanentDeleteBoardAction("board-1");
    expect(result).toHaveProperty("error", "Board not found");
  });

  it("checks permission including deleted boards", async () => {
    mockVerifySession.mockResolvedValue({ userId: "user-1" });
    mockAssertBoardPermission.mockResolvedValue(true);
    mockGetBoardAttachmentPublicIds.mockResolvedValue([]);
    mockDeleteAttachmentsByBoardId.mockResolvedValue(undefined);
    mockHardDeleteBoard.mockResolvedValue(true);

    await permanentDeleteBoardAction("board-1");
    expect(mockAssertBoardPermission).toHaveBeenCalledWith(
      "board-1",
      "user-1",
      expect.any(String),
      { includeDeleted: true },
    );
  });

  it("continues even if cloudinary deletion fails", async () => {
    mockVerifySession.mockResolvedValue({ userId: "user-1" });
    mockAssertBoardPermission.mockResolvedValue(true);
    mockGetBoardAttachmentPublicIds.mockResolvedValue(["img_1"]);
    mockDeleteCloudinaryAsset.mockRejectedValue(new Error("cloudinary down"));
    mockDeleteAttachmentsByBoardId.mockResolvedValue(undefined);
    mockHardDeleteBoard.mockResolvedValue(true);

    const result = await permanentDeleteBoardAction("board-1");
    expect(result).toEqual({ success: true });
  });
});
