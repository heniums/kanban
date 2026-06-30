import { describe, it, expect, vi, beforeEach } from "vitest";
// @vitest-environment node

const {
  mockCompare,
  mockHash,
  mockSelect,
  mockInsert,
  sharedInsertReturning,
} = vi.hoisted(() => {
  const sharedInsertReturning = vi.fn();
  return {
    mockCompare: vi.fn(),
    mockHash: vi.fn(),
    mockSelect: vi.fn(),
    mockInsert: vi.fn(),
    sharedInsertReturning,
  };
});

vi.mock("bcryptjs", () => ({
  compare: mockCompare,
  hash: mockHash,
}));

vi.mock("@/lib/db/client", () => ({
  createDbClient: () => ({
    select: mockSelect,
    insert: mockInsert,
  }),
}));

vi.mock("@/lib/db/schema/users", () => ({
  users: { _table: "users" },
}));

import { verifyCredentials, createUser } from "../index";

const mockUserRow = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  email: "test@example.com",
  passwordHash: "$2b$12$hashedpassword",
  name: "Test User",
  avatarUrl: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("verifyCredentials", () => {
  it("returns the public user when email and password match", async () => {
    const whereResult = [mockUserRow];
    mockSelect.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(whereResult),
      }),
    });
    mockCompare.mockResolvedValue(true);

    const result = await verifyCredentials("test@example.com", "correct-password");

    expect(result).not.toBeNull();
    expect(result?.email).toBe("test@example.com");
    expect((result as { passwordHash?: unknown })?.passwordHash).toBeUndefined();
  });

  it("returns null when the user is not found", async () => {
    mockSelect.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      }),
    });

    const result = await verifyCredentials("missing@example.com", "any");

    expect(result).toBeNull();
    expect(mockCompare).not.toHaveBeenCalled();
  });

  it("returns null when the password does not match", async () => {
    mockSelect.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([mockUserRow]),
      }),
    });
    mockCompare.mockResolvedValue(false);

    const result = await verifyCredentials("test@example.com", "wrong-password");

    expect(result).toBeNull();
  });
});

describe("createUser", () => {
  it("hashes the password and inserts the user, returning public data", async () => {
    mockHash.mockResolvedValue("$2b$12$hashedpassword");
    const insertedUser = {
      ...mockUserRow,
      email: "new@example.com",
      name: "New User",
    };
    sharedInsertReturning.mockResolvedValue([insertedUser]);
    mockInsert.mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: sharedInsertReturning,
      }),
    });

    const result = await createUser({
      email: "new@example.com",
      password: "password123",
      name: "New User",
    });

    expect(mockHash).toHaveBeenCalledWith("password123", 12);
    expect((result as { passwordHash?: unknown }).passwordHash).toBeUndefined();
    expect(result.email).toBe("new@example.com");
  });

  it("throws when the email is already taken (duplicate key error)", async () => {
    mockHash.mockResolvedValue("$2b$12$hashedpassword");
    const dbError = new Error("duplicate key value violates unique constraint") as Error & {
      code: string;
    };
    dbError.code = "23505";
    sharedInsertReturning.mockRejectedValue(dbError);
    mockInsert.mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: sharedInsertReturning,
      }),
    });

    await expect(
      createUser({
        email: "dup@example.com",
        password: "password123",
        name: "Dup User",
      }),
    ).rejects.toThrow();
  });
});
