import { describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
// @vitest-environment node
import { createDbClient } from "@/lib/db/client";
import { labels } from "@/lib/db/schema/labels";

const db = createDbClient();

describe("Labels table", () => {
  it("has the expected columns", async () => {
    const result = await db.execute(sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'labels'
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
      { name: "name", type: "text", nullable: "NO" },
      { name: "color", type: "text", nullable: "NO" },
    ]);
  });

  it("exports a defined pgTable", () => {
    expect(labels).toBeDefined();
    expect(typeof labels).toBe("object");
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
        AND tc.table_name = 'labels'
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
