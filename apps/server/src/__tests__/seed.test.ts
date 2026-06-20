import { describe, expect, it, afterAll } from "vitest";
import { eq } from "drizzle-orm";

import { createDbClient } from "../db.js";
import { users } from "../schema/users.js";
import { seed } from "../seed.js";

const db = createDbClient();

afterAll(async () => {
  await db.delete(users).where(eq(users.email, "demo@kanban.local"));
});

describe("Seed script", () => {
  it("creates a demo user without errors", async () => {
    await seed();

    const [demoUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, "demo@kanban.local"));

    expect(demoUser).toBeDefined();
    expect(demoUser!.email).toBe("demo@kanban.local");
    expect(demoUser!.name).toBe("Demo User");
    expect(demoUser!.passwordHash).not.toBe("password123");
  });
});
