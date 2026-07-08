import { describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
// @vitest-environment node
import { createDbClient } from "@/lib/db/client";
import { cardAttachments } from "@/lib/db/schema/card-attachments";

const db = createDbClient();

describe("Card Attachments table", () => {
  it("has the expected columns", async () => {
    const result = await db.execute(sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'card_attachments'
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
      { name: "attachment_id", type: "uuid", nullable: "NO" },
      { name: "display_order", type: "integer", nullable: "NO" },
    ]);
  });

  it("has a unique constraint on (card_id, attachment_id)", async () => {
    const result = await db.execute(sql`
      SELECT tc.constraint_name, tc.constraint_type
      FROM information_schema.table_constraints tc
      WHERE tc.table_name = 'card_attachments'
      AND tc.constraint_type = 'UNIQUE'
    `);

    const constraints = result.rows.map((row: Record<string, unknown>) => row["constraint_name"]);
    expect(constraints).toContain("card_attachments_card_id_attachment_id_unique");
  });

  it("has foreign keys to cards and attachments with cascade delete", async () => {
    const result = await db.execute(sql`
      SELECT
        kcu.column_name,
        ccu.table_name AS foreign_table,
        ccu.column_name AS foreign_column,
        rc.delete_rule
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage ccu
        ON ccu.constraint_name = tc.constraint_name
      JOIN information_schema.referential_constraints rc
        ON rc.constraint_name = tc.constraint_name
      WHERE tc.table_name = 'card_attachments'
      AND tc.constraint_type = 'FOREIGN KEY'
    `);

    const fks = result.rows.map((row: Record<string, unknown>) => ({
      column: row["column_name"],
      foreignTable: row["foreign_table"],
      foreignColumn: row["foreign_column"],
      deleteRule: row["delete_rule"],
    }));

    expect(fks).toContainEqual({
      column: "card_id",
      foreignTable: "cards",
      foreignColumn: "id",
      deleteRule: "CASCADE",
    });

    expect(fks).toContainEqual({
      column: "attachment_id",
      foreignTable: "attachments",
      foreignColumn: "id",
      deleteRule: "CASCADE",
    });
  });

  it("exports a defined pgTable", () => {
    expect(cardAttachments).toBeDefined();
    expect(typeof cardAttachments).toBe("object");
  });
});
