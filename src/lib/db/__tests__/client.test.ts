import { describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
// @vitest-environment node
import { createDbClient } from "@/lib/db/client";

describe("createDbClient", () => {
  it("returns a drizzle client that connects and responds to a simple query", async () => {
    const db = createDbClient();
    const result = await db.execute(sql`SELECT 1 as one`);

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]).toEqual({ one: 1 });
  });

  it("supports parameterized queries", async () => {
    const db = createDbClient();
    const result = await db.execute(sql`SELECT ${"hello"}::text as greeting`);

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]).toEqual({ greeting: "hello" });
  });

  it("returns the same instance on repeated calls (singleton)", () => {
    const db1 = createDbClient();
    const db2 = createDbClient();
    expect(db1).toBe(db2);
  });
});
