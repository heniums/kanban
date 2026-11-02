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

    const columns = result.rows
      .map((row: Record<string, unknown>) => ({
        name: row["column_name"] as string,
        type: row["data_type"] as string,
        nullable: row["is_nullable"] as string,
      }))
      // ordinal_position reflects physical DDL order, which differs between
      // freshly-pushed and incrementally-ALTERed databases — compare by content.
      .sort((a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name));

    expect(columns).toEqual(
      [
        { name: "id", type: "uuid", nullable: "NO" },
        { name: "email", type: "text", nullable: "NO" },
        { name: "password_hash", type: "text", nullable: "NO" },
        { name: "name", type: "text", nullable: "NO" },
        { name: "avatar_url", type: "text", nullable: "YES" },
        { name: "avatar_public_id", type: "text", nullable: "YES" },
        { name: "created_at", type: "timestamp without time zone", nullable: "NO" },
        { name: "updated_at", type: "timestamp without time zone", nullable: "NO" },
      ].sort((a, b) => a.name.localeCompare(b.name)),
    );
  });
});
