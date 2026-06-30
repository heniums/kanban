import { describe, it, expect, vi, beforeEach } from "vitest";
// @vitest-environment node

const { mockCreateUser, mockRegisterUserSchema } = vi.hoisted(() => ({
  mockCreateUser: vi.fn(),
  mockRegisterUserSchema: { safeParse: vi.fn() },
}));

vi.mock("@/lib/schemas/user", () => ({
  registerUserSchema: mockRegisterUserSchema,
}));

vi.mock("@/lib/data/auth", () => ({
  createUser: mockCreateUser,
}));

vi.mock("server-only", () => ({}));

import { registerAction } from "../register";

beforeEach(() => {
  vi.clearAllMocks();
  mockRegisterUserSchema.safeParse.mockReturnValue({
    success: true,
    data: { email: "u@example.com", password: "pw12345678", name: "User" },
  });
});

describe("registerAction", () => {
  it("calls createUser with parsed data and returns ok: true on success", async () => {
    mockCreateUser.mockResolvedValue({});

    const result = await registerAction({
      email: "u@example.com",
      password: "pw12345678",
      name: "User",
    });

    expect(mockCreateUser).toHaveBeenCalledWith({
      email: "u@example.com",
      password: "pw12345678",
      name: "User",
    });
    expect(result).toEqual({ ok: true });
  });

  it("returns an error when Zod validation fails", async () => {
    mockRegisterUserSchema.safeParse.mockReturnValue({
      success: false,
      error: { errors: [{ message: "Invalid email" }] },
    });

    const result = await registerAction({
      email: "bad",
      password: "pw",
      name: "U",
    });

    expect(mockCreateUser).not.toHaveBeenCalled();
    expect(result).toEqual({ ok: false, error: "Invalid email" });
  });

  it("returns a friendly error on duplicate email (Postgres 23505)", async () => {
    const dbError = new Error("dup") as Error & { code: string };
    dbError.code = "23505";
    mockCreateUser.mockRejectedValue(dbError);

    const result = await registerAction({
      email: "dup@example.com",
      password: "pw12345678",
      name: "Dup",
    });

    expect(result).toEqual({
      ok: false,
      error: "A user with this email already exists",
    });
  });

  it("returns a generic error on other failures", async () => {
    mockCreateUser.mockRejectedValue(new Error("boom"));

    const result = await registerAction({
      email: "u@example.com",
      password: "pw12345678",
      name: "U",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Internal server error");
    }
  });
});
