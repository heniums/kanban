import { describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
// @vitest-environment node
import { createDbClient } from "@/lib/db/client";
import { cardLabels } from "@/lib/db/schema/card-labels";

const db = createDbClient();

describe("card_labels junction table", () => {
  it("has the expected columns", async () => {
    const result = await db.execute(sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'card_labels'
      ORDER BY ordinal_position
    `);

    const columns = result.rows.map((row: Record<string, unknown>) => ({
      name: row["column_name"],
      type: row["data_type"],
      nullable: row["is_nullable"],
    }));

    expect(columns).toEqual([
      { name: "card_id", type: "uuid", nullable: "NO" },
      { name: "label_id", type: "uuid", nullable: "NO" },
    ]);
  });

  it("exports a defined pgTable", () => {
    expect(cardLabels).toBeDefined();
    expect(typeof cardLabels).toBe("object");
  });

  it("has composite primary key on (card_id, label_id)", async () => {
    const rows = (
      await db.execute(sql`
      SELECT
        tc.constraint_name,
        kcu.column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.constraint_type = 'PRIMARY KEY'
        AND tc.table_name = 'card_labels'
      ORDER BY kcu.ordinal_position
    `)
    ).rows as Array<{ constraint_name: string; column_name: string }>;

    expect(rows.length).toBe(2);
    expect(rows.map((r) => r.column_name)).toEqual(["card_id", "label_id"]);
  });

  it("cascades deletes from cards", async () => {
    const rows = (
      await db.execute(sql`
      SELECT
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
        AND tc.table_name = 'card_labels'
        AND kcu.column_name = 'card_id'
    `)
    ).rows as Array<{ delete_rule: string; foreign_table_name: string }>;

    expect(rows[0].delete_rule).toBe("CASCADE");
    expect(rows[0].foreign_table_name).toBe("cards");
  });

  it("cascades deletes from labels", async () => {
    const rows = (
      await db.execute(sql`
      SELECT
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
        AND tc.table_name = 'card_labels'
        AND kcu.column_name = 'label_id'
    `)
    ).rows as Array<{ delete_rule: string; foreign_table_name: string }>;

    expect(rows[0].delete_rule).toBe("CASCADE");
    expect(rows[0].foreign_table_name).toBe("labels");
  });
});
