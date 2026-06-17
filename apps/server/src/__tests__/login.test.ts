import { describe, expect, it, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { eq } from "drizzle-orm";
import { createApp } from "../app.js";
import { createDbClient } from "../db.js";
import { users } from "../schema/users.js";

const app = createApp();
const db = createDbClient();
const testEmail = `login-test-${Date.now()}@example.com`;

beforeAll(async () => {
  const bcrypt = await import("bcryptjs");
  const passwordHash = await bcrypt.hash("correct-password", 12);

  await db.insert(users).values({
    email: testEmail,
    passwordHash,
    name: "Login Tester",
  });
});

afterAll(async () => {
  await db.delete(users).where(eq(users.email, testEmail));
});

describe("POST /api/auth/login", () => {
  it("authenticates with correct credentials", async () => {
    const response = await request(app).post("/api/auth/login").send({
      email: testEmail,
      password: "correct-password",
    });

    expect(response.status).toBe(200);
    expect(response.body.user.email).toBe(testEmail);
    expect(response.body.user.name).toBe("Login Tester");
    expect(response.body.user.passwordHash).toBeUndefined();
  });

  it("rejects incorrect password", async () => {
    const response = await request(app).post("/api/auth/login").send({
      email: testEmail,
      password: "wrong-password",
    });

    expect(response.status).toBe(401);
    expect(response.body.error).toContain("Invalid");
  });

  it("rejects non-existent email", async () => {
    const response = await request(app).post("/api/auth/login").send({
      email: "nonexistent@example.com",
      password: "anything",
    });

    expect(response.status).toBe(401);
    expect(response.body.error).toContain("Invalid");
  });
});
