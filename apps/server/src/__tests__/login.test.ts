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
  compare: vi.fn(),
}));

import { createDbClient } from "../db.js";
import { compare } from "bcryptjs";

const app = createApp();
const mockDb = {
  select: vi.fn(),
};

describe("POST /api/auth/login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createDbClient).mockReturnValue(mockDb as any);
  });

  it("authenticates with correct credentials", async () => {
    const mockUser = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      email: "login-test@example.com",
      passwordHash: "$2b$12$correcthash",
      name: "Login Tester",
    };

    mockDb.select.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([mockUser]),
      }),
    });

    vi.mocked(compare as any).mockResolvedValue(true);

    const response = await request(app).post("/api/auth/login").send({
      email: "login-test@example.com",
      password: "correct-password",
    });

    expect(response.status).toBe(200);
    expect(response.body.user.email).toBe("login-test@example.com");
    expect(response.body.user.name).toBe("Login Tester");
    expect(response.body.user.passwordHash).toBeUndefined();
  });

  it("rejects incorrect password", async () => {
    const mockUser = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      email: "login-test@example.com",
      passwordHash: "$2b$12$correcthash",
      name: "Login Tester",
    };

    mockDb.select.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([mockUser]),
      }),
    });

    vi.mocked(compare as any).mockResolvedValue(false);

    const response = await request(app).post("/api/auth/login").send({
      email: "login-test@example.com",
      password: "wrong-password",
    });

    expect(response.status).toBe(401);
    expect(response.body.error).toContain("Invalid");
  });

  it("rejects non-existent email", async () => {
    mockDb.select.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      }),
    });

    const response = await request(app).post("/api/auth/login").send({
      email: "nonexistent@example.com",
      password: "anything",
    });

    expect(response.status).toBe(401);
    expect(response.body.error).toContain("Invalid");
  });
});
