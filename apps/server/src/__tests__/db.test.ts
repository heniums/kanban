import { describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
import { createDbClient } from "../db.js";
import { createDbClient as sharedCreateDbClient } from "@/lib/db/client";

describe("Database connection", () => {
  it("connects and responds to a simple query", async () => {
    const db = createDbClient();
    const result = await db.execute(sql`SELECT 1 as one`);

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]).toEqual({ one: 1 });
  });

  it("supports parameterized queries", async () => {
    const db = createDbClient();
    const result = await db.execute(
      sql`SELECT ${"hello"}::text as greeting`,
    );

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]).toEqual({ greeting: "hello" });
  });

  it("re-exports createDbClient from @kanban/shared", () => {
    expect(createDbClient).toBe(sharedCreateDbClient);
  });
});
