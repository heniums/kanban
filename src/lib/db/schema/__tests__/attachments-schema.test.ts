import { describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
// @vitest-environment node
import { createDbClient } from "@/lib/db/client";
import { attachments } from "@/lib/db/schema/attachments";

const db = createDbClient();

describe("Attachments table", () => {
  it("has the expected columns", async () => {
    const result = await db.execute(sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'attachments'
      ORDER BY ordinal_position
    `);

    const columns = result.rows.map((row: Record<string, unknown>) => ({
      name: row["column_name"],
      type: row["data_type"],
      nullable: row["is_nullable"],
    }));

    expect(columns).toEqual([
      { name: "id", type: "uuid", nullable: "NO" },
      { name: "public_id", type: "text", nullable: "NO" },
      { name: "url", type: "text", nullable: "NO" },
      { name: "format", type: "text", nullable: "YES" },
      { name: "width", type: "integer", nullable: "YES" },
      { name: "height", type: "integer", nullable: "YES" },
      { name: "bytes", type: "integer", nullable: "YES" },
      { name: "resource_type", type: "text", nullable: "YES" },
      { name: "created_by", type: "uuid", nullable: "NO" },
      { name: "created_at", type: "timestamp without time zone", nullable: "NO" },
    ]);
  });

  it("has a unique constraint on public_id", async () => {
    const result = await db.execute(sql`
      SELECT tc.constraint_name, tc.constraint_type
      FROM information_schema.table_constraints tc
      WHERE tc.table_name = 'attachments'
      AND tc.constraint_type = 'UNIQUE'
    `);

    const constraints = result.rows.map((row: Record<string, unknown>) => row["constraint_name"]);
    expect(constraints).toContain("attachments_public_id_unique");
  });

  it("has a foreign key to users", async () => {
    const result = await db.execute(sql`
      SELECT
        kcu.column_name,
        ccu.table_name AS foreign_table,
        ccu.column_name AS foreign_column
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.table_name = 'attachments'
      AND tc.constraint_type = 'FOREIGN KEY'
    `);

    const fks = result.rows.map((row: Record<string, unknown>) => ({
      column: row["column_name"],
      foreignTable: row["foreign_table"],
      foreignColumn: row["foreign_column"],
    }));

    expect(fks).toContainEqual({
      column: "created_by",
      foreignTable: "users",
      foreignColumn: "id",
    });
  });

  it("exports a defined pgTable", () => {
    expect(attachments).toBeDefined();
    expect(typeof attachments).toBe("object");
  });
});
