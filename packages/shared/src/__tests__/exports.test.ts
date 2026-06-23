import { describe, expect, it } from "vitest";

describe("Shared package exports", () => {
  it("exports boards schema", async () => {
    const mod = await import("../schema/boards");
    expect(mod.boards).toBeDefined();
    expect(typeof mod.boards).toBe("object");
  });

  it("exports users schema", async () => {
    const mod = await import("../schema/users");
    expect(mod.users).toBeDefined();
    expect(typeof mod.users).toBe("object");
  });

  it("exports createDbClient", async () => {
    const mod = await import("../db");
    expect(mod.createDbClient).toBeDefined();
    expect(typeof mod.createDbClient).toBe("function");
  });

  it("exports client-safe schemas and types from index", async () => {
    const mod = await import("../index");
    expect(mod.loginSchema).toBeDefined();
    expect(mod.registerUserSchema).toBeDefined();
    expect(mod.createBoardSchema).toBeDefined();
    expect(mod.updateBoardSchema).toBeDefined();
  });

  it("does not export server-only db client from index", async () => {
    const mod = await import("../index") as Record<string, unknown>;
    expect(mod.createDbClient).toBeUndefined();
    expect(mod.boards).toBeUndefined();
    expect(mod.users).toBeUndefined();
  });

  it("exports server-only db client and tables from server entry", async () => {
    const mod = await import("../server");
    expect(mod.createDbClient).toBeDefined();
    expect(typeof mod.createDbClient).toBe("function");
    expect(mod.boards).toBeDefined();
    expect(mod.users).toBeDefined();
  });
});
