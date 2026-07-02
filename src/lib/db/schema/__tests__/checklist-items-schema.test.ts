import { describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
// @vitest-environment node
import { createDbClient } from "@/lib/db/client";
import { checklistItems } from "@/lib/db/schema/checklist-items";

const db = createDbClient();

describe("checklist_items table", () => {
  it("has the expected columns", async () => {
    const result = await db.execute(sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'checklist_items'
      ORDER BY ordinal_position
    `);

    const columns = result.rows.map((row: Record<string, unknown>) => ({
      name: row["column_name"],
      type: row["data_type"],
      nullable: row["is_nullable"],
    }));

    expect(columns).toEqual([
      { name: "id", type: "uuid", nullable: "NO" },
      { name: "checklist_id", type: "uuid", nullable: "NO" },
      { name: "content", type: "text", nullable: "NO" },
      { name: "is_completed", type: "boolean", nullable: "NO" },
      { name: "position", type: "integer", nullable: "NO" },
    ]);
  });

  it("exports a defined pgTable", () => {
    expect(checklistItems).toBeDefined();
    expect(typeof checklistItems).toBe("object");
  });

  it("cascades deletes from checklists", async () => {
    const rows = (
      await db.execute(sql`
      SELECT rc.delete_rule
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.referential_constraints AS rc
        ON tc.constraint_name = rc.constraint_name
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = 'checklist_items'
        AND kcu.column_name = 'checklist_id'
    `)
    ).rows as Array<{ delete_rule: string }>;

    expect(rows[0].delete_rule).toBe("CASCADE");
  });
});
