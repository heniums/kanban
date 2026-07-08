import { describe, it, expect, vi, beforeEach } from "vitest";
import { updateProfileAction, updatePasswordAction } from "@/lib/actions/profile";
import { verifySession } from "@/lib/dal";
import { updateUserProfile, updateUserPassword } from "@/lib/data/auth";

vi.mock("@/lib/dal", () => ({
  verifySession: vi.fn(),
}));

vi.mock("@/lib/data/auth", () => ({
  updateUserProfile: vi.fn(),
  updateUserPassword: vi.fn(),
}));

describe("profile actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("updateProfileAction", () => {
    it("updates the user's name", async () => {
      vi.mocked(verifySession).mockResolvedValue({ userId: "u1" });
      vi.mocked(updateUserProfile).mockResolvedValue({
        id: "u1",
        name: "New Name",
        email: "a@b.com",
        avatarUrl: null,
        avatarPublicId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await updateProfileAction({ name: "New Name" });

      expect(updateUserProfile).toHaveBeenCalledWith("u1", { name: "New Name" });
      expect(result).toHaveProperty("user");
      expect("error" in result).toBe(false);
    });

    it("returns error for invalid input", async () => {
      vi.mocked(verifySession).mockResolvedValue({ userId: "u1" });

      const result = await updateProfileAction({ name: "" });

      expect("error" in result).toBe(true);
    });
  });

  describe("updatePasswordAction", () => {
    it("updates password when inputs are valid", async () => {
      vi.mocked(verifySession).mockResolvedValue({ userId: "u1" });
      vi.mocked(updateUserPassword).mockResolvedValue({ success: true });

      const result = await updatePasswordAction({
        currentPassword: "oldpass",
        newPassword: "newpass123",
        confirmPassword: "newpass123",
      });

      expect(updateUserPassword).toHaveBeenCalledWith("u1", "oldpass", "newpass123");
      expect("error" in result).toBe(false);
      expect(result).toHaveProperty("success");
    });

    it("returns error when passwords do not match", async () => {
      vi.mocked(verifySession).mockResolvedValue({ userId: "u1" });

      const result = await updatePasswordAction({
        currentPassword: "oldpass",
        newPassword: "newpass123",
        confirmPassword: "different",
      });

      expect("error" in result).toBe(true);
      expect(result.error).toBe("New passwords do not match");
    });

    it("returns error when current password is wrong", async () => {
      vi.mocked(verifySession).mockResolvedValue({ userId: "u1" });
      vi.mocked(updateUserPassword).mockResolvedValue({ error: "Current password is incorrect" });

      const result = await updatePasswordAction({
        currentPassword: "wrong",
        newPassword: "newpass123",
        confirmPassword: "newpass123",
      });

      expect("error" in result).toBe(true);
      expect(result.error).toBe("Current password is incorrect");
    });
  });
});
