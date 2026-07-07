import { describe, it, expect, vi, beforeEach } from "vitest";

const USER_1 = "00000000-0000-0000-0000-000000000001";

const { mockVerifySession, mockUpdateUserAvatar, mockGetUserById, mockDeleteCloudinaryAsset } =
  vi.hoisted(() => ({
    mockVerifySession: vi.fn(),
    mockUpdateUserAvatar: vi.fn(),
    mockGetUserById: vi.fn(),
    mockDeleteCloudinaryAsset: vi.fn(),
  }));

vi.mock("@/lib/dal", () => ({
  verifySession: mockVerifySession,
}));

vi.mock("@/lib/data/auth", () => ({
  updateUserAvatar: mockUpdateUserAvatar,
  getUserById: mockGetUserById,
}));

vi.mock("@/lib/cloudinary", () => ({
  deleteCloudinaryAsset: mockDeleteCloudinaryAsset,
}));

import { updateUserAvatarAction, deleteUserAvatarAction } from "../avatar";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("updateUserAvatarAction", () => {
  it("updates avatar and deletes old one", async () => {
    mockVerifySession.mockResolvedValue({ userId: USER_1 });
    mockGetUserById.mockResolvedValue({
      id: USER_1,
      avatarPublicId: "old_public_id",
    });
    mockDeleteCloudinaryAsset.mockResolvedValue(undefined);
    mockUpdateUserAvatar.mockResolvedValue({
      id: USER_1,
      avatarUrl: "https://example.com/new.jpg",
      avatarPublicId: "new_public_id",
    });

    const result = await updateUserAvatarAction({
      avatarUrl: "https://example.com/new.jpg",
      avatarPublicId: "new_public_id",
    });

    expect(result).toHaveProperty("user");
    expect(mockDeleteCloudinaryAsset).toHaveBeenCalledWith("old_public_id");
    expect(mockUpdateUserAvatar).toHaveBeenCalledWith(
      USER_1,
      "https://example.com/new.jpg",
      "new_public_id",
    );
  });

  it("returns error for invalid input", async () => {
    mockVerifySession.mockResolvedValue({ userId: USER_1 });

    const result = await updateUserAvatarAction({ avatarUrl: "not-a-url" });

    expect(result).toHaveProperty("error");
    expect(result.error).toContain("Invalid input");
  });
});

describe("deleteUserAvatarAction", () => {
  it("clears avatar and deletes old one", async () => {
    mockVerifySession.mockResolvedValue({ userId: USER_1 });
    mockGetUserById.mockResolvedValue({
      id: USER_1,
      avatarPublicId: "old_public_id",
    });
    mockDeleteCloudinaryAsset.mockResolvedValue(undefined);
    mockUpdateUserAvatar.mockResolvedValue({
      id: USER_1,
      avatarUrl: null,
      avatarPublicId: null,
    });

    const result = await deleteUserAvatarAction();

    expect(result).toHaveProperty("user");
    expect(mockDeleteCloudinaryAsset).toHaveBeenCalledWith("old_public_id");
    expect(mockUpdateUserAvatar).toHaveBeenCalledWith(USER_1, null, null);
  });
});
