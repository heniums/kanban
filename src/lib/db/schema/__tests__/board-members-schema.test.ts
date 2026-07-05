import { describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
// @vitest-environment node
import { createDbClient } from "@/lib/db/client";
import { boardMembers } from "@/lib/db/schema/board-members";

const db = createDbClient();

describe("board_members table", () => {
  it("has the expected columns", async () => {
    const result = await db.execute(sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'board_members'
      ORDER BY ordinal_position
    `);

    const columns = result.rows.map((row: Record<string, unknown>) => ({
      name: row["column_name"],
      type: row["data_type"],
      nullable: row["is_nullable"],
    }));

    expect(columns).toEqual([
      { name: "board_id", type: "uuid", nullable: "NO" },
      { name: "user_id", type: "uuid", nullable: "NO" },
      { name: "role", type: "USER-DEFINED", nullable: "NO" },
      { name: "joined_at", type: "timestamp without time zone", nullable: "NO" },
    ]);
  });

  it("exports a defined pgTable", () => {
    expect(boardMembers).toBeDefined();
    expect(typeof boardMembers).toBe("object");
  });

  it("has composite primary key on (board_id, user_id)", async () => {
    const rows = (
      await db.execute(sql`
      SELECT
        tc.constraint_name,
        kcu.column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.constraint_type = 'PRIMARY KEY'
        AND tc.table_name = 'board_members'
      ORDER BY kcu.ordinal_position
    `)
    ).rows as Array<{ constraint_name: string; column_name: string }>;

    expect(rows.length).toBe(2);
    expect(rows.map((r) => r.column_name)).toEqual(["board_id", "user_id"]);
  });

  it("has foreign key constraint to boards table", async () => {
    const rows = (
      await db.execute(sql`
      SELECT
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        rc.delete_rule
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.referential_constraints AS rc
        ON tc.constraint_name = rc.constraint_name
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = 'board_members'
        AND kcu.column_name = 'board_id'
    `)
    ).rows as Array<{ column_name: string; foreign_table_name: string; delete_rule: string }>;

    expect(rows.length).toBe(1);
    expect(rows[0].foreign_table_name).toBe("boards");
    expect(rows[0].delete_rule).toBe("CASCADE");
  });

  it("has foreign key constraint to users table", async () => {
    const rows = (
      await db.execute(sql`
      SELECT
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        rc.delete_rule
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.referential_constraints AS rc
        ON tc.constraint_name = rc.constraint_name
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = 'board_members'
        AND kcu.column_name = 'user_id'
    `)
    ).rows as Array<{ column_name: string; foreign_table_name: string; delete_rule: string }>;

    expect(rows.length).toBe(1);
    expect(rows[0].foreign_table_name).toBe("users");
    expect(rows[0].delete_rule).toBe("CASCADE");
  });

  it("has role enum constraint with 'owner' and 'member' values", async () => {
    const result = await db.execute(sql`
      SELECT e.enumlabel
      FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      WHERE t.typname = 'board_member_role'
      ORDER BY e.enumsortorder
    `);

    const enumValues = result.rows.map((row: Record<string, unknown>) => row["enumlabel"]);
    expect(enumValues).toEqual(["owner", "member"]);
  });

  it("prevents duplicate membership (user can only be member of a board once)", async () => {
    const result = await db.execute(sql`
      SELECT
        tc.constraint_name,
        tc.constraint_type
      FROM information_schema.table_constraints AS tc
      WHERE tc.table_name = 'board_members'
        AND tc.constraint_type = 'PRIMARY KEY'
    `);

    expect(result.rows.length).toBe(1);
  });
});
