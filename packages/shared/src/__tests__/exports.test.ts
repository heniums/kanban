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

  it("exports from index", async () => {
    const mod = await import("../index");
    expect(mod.boards).toBeDefined();
    expect(mod.users).toBeDefined();
    expect(mod.createDbClient).toBeDefined();
  });
});
