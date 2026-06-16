import { describe, expect, it, afterAll } from "vitest";
import request from "supertest";
import { eq } from "drizzle-orm";
import { createApp } from "../app.js";
import { createDbClient } from "../db.js";
import { users } from "../schema/users.js";

const app = createApp();
const db = createDbClient();
const createdEmails: string[] = [];

afterAll(async () => {
  for (const email of createdEmails) {
    await db.delete(users).where(eq(users.email, email));
  }
});

describe("POST /api/auth/register", () => {
  it("registers a new user and returns public user data", async () => {
    const email = `test-${Date.now()}@example.com`;
    createdEmails.push(email);

    const response = await request(app)
      .post("/api/auth/register")
      .send({ email, password: "password123", name: "Test User" });

    expect(response.status).toBe(201);
    expect(response.body.user.email).toBe(email);
    expect(response.body.user.name).toBe("Test User");
    expect(response.body.user.passwordHash).toBeUndefined();
    expect(response.body.user.id).toBeDefined();
  });

  it("rejects duplicate email", async () => {
    const email = `dup-${Date.now()}@example.com`;
    createdEmails.push(email);

    await request(app).post("/api/auth/register").send({
      email,
      password: "password123",
      name: "First User",
    });

    const response = await request(app).post("/api/auth/register").send({
      email,
      password: "password456",
      name: "Second User",
    });

    expect(response.status).toBe(409);
    expect(response.body.error).toContain("email");
  });

  it("rejects invalid input", async () => {
    const response = await request(app).post("/api/auth/register").send({
      email: "not-an-email",
      password: "short",
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toBeDefined();
  });
});
