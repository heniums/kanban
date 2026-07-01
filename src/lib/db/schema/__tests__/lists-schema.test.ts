import { describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
// @vitest-environment node
import { createDbClient } from "@/lib/db/client";
import { lists } from "@/lib/db/schema/lists";

const db = createDbClient();

describe("Lists table", () => {
  it("has the expected columns", async () => {
    const result = await db.execute(sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'lists'
      ORDER BY ordinal_position
    `);

    const columns = result.rows.map((row: Record<string, unknown>) => ({
      name: row["column_name"],
      type: row["data_type"],
      nullable: row["is_nullable"],
    }));

    expect(columns).toEqual([
      { name: "id", type: "uuid", nullable: "NO" },
      { name: "board_id", type: "uuid", nullable: "NO" },
      { name: "title", type: "text", nullable: "NO" },
      { name: "position", type: "integer", nullable: "NO" },
      { name: "created_at", type: "timestamp without time zone", nullable: "NO" },
      { name: "updated_at", type: "timestamp without time zone", nullable: "NO" },
    ]);
  });

  it("exports a defined pgTable", () => {
    expect(lists).toBeDefined();
    expect(typeof lists).toBe("object");
  });

  it("enforces unique (board_id, position)", async () => {
    const [{ exists }] = (
      await db.execute(sql`
      SELECT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'lists_board_id_position_unique'
      ) as exists
    `)
    ).rows as Array<{ exists: boolean }>;

    expect(exists).toBe(true);
  });

  it("has a foreign key from board_id to boards.id with cascade delete", async () => {
    const rows = (
      await db.execute(sql`
      SELECT
        tc.constraint_name,
        rc.delete_rule,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.referential_constraints AS rc
        ON tc.constraint_name = rc.constraint_name
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = 'lists'
        AND kcu.column_name = 'board_id'
    `)
    ).rows as Array<{
      constraint_name: string;
      delete_rule: string;
      column_name: string;
      foreign_table_name: string;
      foreign_column_name: string;
    }>;

    expect(rows.length).toBe(1);
    expect(rows[0].foreign_table_name).toBe("boards");
    expect(rows[0].foreign_column_name).toBe("id");
    expect(rows[0].delete_rule).toBe("CASCADE");
  });
});
