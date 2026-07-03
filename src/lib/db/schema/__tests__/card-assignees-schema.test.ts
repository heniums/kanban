import { describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
// @vitest-environment node
import { createDbClient } from "@/lib/db/client";
import { cardAssignees } from "@/lib/db/schema/card-assignees";

const db = createDbClient();

describe("card_assignees junction table", () => {
  it("has the expected columns", async () => {
    const result = await db.execute(sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'card_assignees'
      ORDER BY ordinal_position
    `);

    const columns = result.rows.map((row: Record<string, unknown>) => ({
      name: row["column_name"],
      type: row["data_type"],
      nullable: row["is_nullable"],
    }));

    expect(columns).toEqual([
      { name: "card_id", type: "uuid", nullable: "NO" },
      { name: "user_id", type: "uuid", nullable: "NO" },
    ]);
  });

  it("exports a defined pgTable", () => {
    expect(cardAssignees).toBeDefined();
    expect(typeof cardAssignees).toBe("object");
  });

  it("has composite primary key on (card_id, user_id)", async () => {
    const rows = (
      await db.execute(sql`
      SELECT
        tc.constraint_name,
        kcu.column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.constraint_type = 'PRIMARY KEY'
        AND tc.table_name = 'card_assignees'
      ORDER BY kcu.ordinal_position
    `)
    ).rows as Array<{ constraint_name: string; column_name: string }>;

    expect(rows.length).toBe(2);
    expect(rows.map((r) => r.column_name)).toEqual(["card_id", "user_id"]);
  });

  it("cascades deletes from cards and users", async () => {
    const rows = (
      await db.execute(sql`
      SELECT
        kcu.column_name,
        rc.delete_rule,
        ccu.table_name AS foreign_table_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.referential_constraints AS rc
        ON tc.constraint_name = rc.constraint_name
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = 'card_assignees'
      ORDER BY kcu.column_name
    `)
    ).rows as Array<{ column_name: string; delete_rule: string; foreign_table_name: string }>;

    expect(rows.length).toBe(2);
    for (const row of rows) {
      expect(row.delete_rule).toBe("CASCADE");
    }
    const tables = rows.map((r) => r.foreign_table_name).sort();
    expect(tables).toEqual(["cards", "users"]);
  });
});
