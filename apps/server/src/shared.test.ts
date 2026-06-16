import { describe, expect, it } from "vitest";
import { loginSchema, registerUserSchema, userSchema } from "@kanban/shared";

describe("Shared schemas", () => {
  describe("userSchema", () => {
    it("accepts a valid user", () => {
      const result = userSchema.safeParse({
        id: "550e8400-e29b-41d4-a716-446655440000",
        email: "test@example.com",
        passwordHash: "hashed",
        name: "Test User",
        avatarUrl: null,
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("registerUserSchema", () => {
    it("accepts valid registration input", () => {
      const result = registerUserSchema.safeParse({
        email: "new@example.com",
        password: "password123",
        name: "New User",
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid email", () => {
      const result = registerUserSchema.safeParse({
        email: "not-an-email",
        password: "password123",
        name: "User",
      });
      expect(result.success).toBe(false);
    });

    it("rejects short password", () => {
      const result = registerUserSchema.safeParse({
        email: "test@example.com",
        password: "short",
        name: "User",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("loginSchema", () => {
    it("accepts valid login input", () => {
      const result = loginSchema.safeParse({
        email: "user@example.com",
        password: "anypassword",
      });
      expect(result.success).toBe(true);
    });

    it("rejects missing email", () => {
      const result = loginSchema.safeParse({
        password: "anypassword",
      });
      expect(result.success).toBe(false);
    });
  });
});
