import { describe, expect, it, vi, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";

vi.mock("../db.js", () => ({
  createDbClient: vi.fn(),
}));

vi.mock("../schema/users.js", () => ({
  users: {},
}));

vi.mock("bcryptjs", () => ({
  hash: vi.fn(() => Promise.resolve("mock-hash")),
  compare: vi.fn(() => Promise.resolve(true)),
}));

import { createDbClient } from "../db.js";
import { compare } from "bcryptjs";

const app = createApp();
const mockDb = {
  insert: vi.fn(),
  select: vi.fn(),
  transaction: vi.fn(),
};

describe("POST /api/auth/register", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createDbClient).mockReturnValue(mockDb as any);
  });

  it("registers a new user and returns public user data", async () => {
    const mockUser = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      email: "test@example.com",
      name: "Test User",
      passwordHash: "hashed",
    };

    mockDb.insert.mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([mockUser]),
      }),
    });

    const response = await request(app)
      .post("/api/auth/register")
      .send({ email: "test@example.com", password: "password123", name: "Test User" });

    expect(response.status).toBe(201);
    expect(response.body.user.email).toBe("test@example.com");
    expect(response.body.user.name).toBe("Test User");
    expect(response.body.user.passwordHash).toBeUndefined();
    expect(response.body.user.id).toBeDefined();
  });

  it("rejects duplicate email", async () => {
    const dbError = new Error("duplicate key value violates unique constraint") as Error & { code: string };
    dbError.code = "23505";

    mockDb.insert.mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockRejectedValue(dbError),
      }),
    });

    const response = await request(app)
      .post("/api/auth/register")
      .send({ email: "dup@example.com", password: "password123", name: "First User" });

    expect(response.status).toBe(409);
    expect(response.body.error).toContain("email");
  });

  it("rejects invalid input", async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .send({
        email: "not-an-email",
        password: "short",
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBeDefined();
  });
});
