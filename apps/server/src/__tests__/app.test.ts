import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";

const app = createApp();

describe("Express server", () => {
  it("responds to health check with 200", async () => {
    const response = await request(app).get("/api/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok" });
  });

  it("responds with CORS headers", async () => {
    const response = await request(app).get("/api/health");

    expect(response.headers["access-control-allow-origin"]).toBe("*");
  });

  it("returns 404 for unknown routes", async () => {
    const response = await request(app).get("/api/nonexistent");

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty("error");
  });
});
