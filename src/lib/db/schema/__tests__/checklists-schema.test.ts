import { describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
// @vitest-environment node
import { createDbClient } from "@/lib/db/client";
import { checklists } from "@/lib/db/schema/checklists";

const db = createDbClient();

describe("Checklists table", () => {
  it("has the expected columns", async () => {
    const result = await db.execute(sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'checklists'
      ORDER BY ordinal_position
    `);

    const columns = result.rows.map((row: Record<string, unknown>) => ({
      name: row["column_name"],
      type: row["data_type"],
      nullable: row["is_nullable"],
    }));

    expect(columns).toEqual([
      { name: "id", type: "uuid", nullable: "NO" },
      { name: "card_id", type: "uuid", nullable: "NO" },
      { name: "title", type: "text", nullable: "NO" },
      { name: "position", type: "integer", nullable: "NO" },
    ]);
  });

  it("exports a defined pgTable", () => {
    expect(checklists).toBeDefined();
    expect(typeof checklists).toBe("object");
  });

  it("cascades deletes from cards", async () => {
    const rows = (
      await db.execute(sql`
      SELECT rc.delete_rule
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.referential_constraints AS rc
        ON tc.constraint_name = rc.constraint_name
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = 'checklists'
        AND kcu.column_name = 'card_id'
    `)
    ).rows as Array<{ delete_rule: string }>;

    expect(rows[0].delete_rule).toBe("CASCADE");
  });
});
