import { describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
// @vitest-environment node
import { createDbClient } from "@/lib/db/client";

const db = createDbClient();

describe("Users table", () => {
  it("has the expected columns", async () => {
    const result = await db.execute(sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `);

    const columns = result.rows.map((row: Record<string, unknown>) => ({
      name: row["column_name"],
      type: row["data_type"],
      nullable: row["is_nullable"],
    }));

    expect(columns).toEqual([
      { name: "id", type: "uuid", nullable: "NO" },
      { name: "email", type: "text", nullable: "NO" },
      { name: "password_hash", type: "text", nullable: "NO" },
      { name: "name", type: "text", nullable: "NO" },
      { name: "avatar_url", type: "text", nullable: "YES" },
      { name: "created_at", type: "timestamp without time zone", nullable: "NO" },
      { name: "updated_at", type: "timestamp without time zone", nullable: "NO" },
    ]);
  });
});
