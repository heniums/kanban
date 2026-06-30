import { describe, expect, it, afterAll } from "vitest";
import { eq } from "drizzle-orm";
// @vitest-environment node
import { createDbClient } from "@/lib/db/client";
import { users } from "@/lib/db/schema/users";
import { boards } from "@/lib/db/schema/boards";
import { seed } from "../seed";

const db = createDbClient();

afterAll(async () => {
  const [demoUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, "demo@kanban.local"));
  if (demoUser) {
    await db.delete(boards).where(eq(boards.ownerId, demoUser.id));
  }
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

  it("creates demo boards with varied backgrounds for the demo user", async () => {
    await seed();

    const [demoUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, "demo@kanban.local"));

    const demoBoards = await db
      .select()
      .from(boards)
      .where(eq(boards.ownerId, demoUser!.id));

    expect(demoBoards.length).toBeGreaterThanOrEqual(3);
    expect(demoBoards.every((b) => b.ownerId === demoUser!.id)).toBe(true);
    expect(demoBoards.every((b) => b.deletedAt === null)).toBe(true);
    const backgrounds = demoBoards.map((b) => b.background);
    expect(new Set(backgrounds).size).toBeGreaterThan(1);
  });
});
