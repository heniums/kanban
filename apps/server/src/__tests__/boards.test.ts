import { describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
import { createDbClient } from "../db.js";

const db = createDbClient();

describe("Boards table", () => {
  it("has the expected columns", async () => {
    const result = await db.execute(sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'boards'
      ORDER BY ordinal_position
    `);

    const columns = result.rows.map((row: Record<string, unknown>) => ({
      name: row["column_name"],
      type: row["data_type"],
      nullable: row["is_nullable"],
    }));

    expect(columns).toEqual([
      { name: "id", type: "uuid", nullable: "NO" },
      { name: "title", type: "text", nullable: "NO" },
      { name: "description", type: "text", nullable: "YES" },
      { name: "background", type: "text", nullable: "NO" },
      { name: "owner_id", type: "uuid", nullable: "NO" },
      { name: "created_at", type: "timestamp without time zone", nullable: "NO" },
      { name: "updated_at", type: "timestamp without time zone", nullable: "NO" },
      { name: "deleted_at", type: "timestamp without time zone", nullable: "YES" },
    ]);
  });
});
