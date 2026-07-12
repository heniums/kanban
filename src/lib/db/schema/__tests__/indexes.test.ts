import { describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
// @vitest-environment node
import { createDbClient } from "@/lib/db/client";

const db = createDbClient();

async function getIndexNames(tableName: string): Promise<string[]> {
  const result = await db.execute(sql`
    SELECT indexname FROM pg_indexes
    WHERE schemaname = 'public' AND tablename = ${tableName}
  `);
  return result.rows.map((row: Record<string, unknown>) => row["indexname"] as string);
}

async function getIndexDef(indexName: string): Promise<string | undefined> {
  const result = await db.execute(sql`
    SELECT indexdef FROM pg_indexes
    WHERE schemaname = 'public' AND indexname = ${indexName}
  `);
  return (result.rows[0] as Record<string, unknown> | undefined)?.["indexdef"] as
    string | undefined;
}

describe("Database performance indexes", () => {
  it("cards table has an index on board_id", async () => {
    const indexNames = await getIndexNames("cards");
    expect(indexNames).toContain("cards_board_id_idx");
  });

  it("comments table has an index on card_id", async () => {
    const indexNames = await getIndexNames("comments");
    expect(indexNames).toContain("comments_card_id_idx");
  });

  it("comments table has an index on user_id", async () => {
    const indexNames = await getIndexNames("comments");
    expect(indexNames).toContain("comments_user_id_idx");
  });

  it("labels table has an index on board_id", async () => {
    const indexNames = await getIndexNames("labels");
    expect(indexNames).toContain("labels_board_id_idx");
  });

  it("checklists table has an index on card_id", async () => {
    const indexNames = await getIndexNames("checklists");
    expect(indexNames).toContain("checklists_card_id_idx");
  });

  it("checklist_items table has an index on checklist_id", async () => {
    const indexNames = await getIndexNames("checklist_items");
    expect(indexNames).toContain("checklist_items_checklist_id_idx");
  });

  it("attachments table has an index on created_by", async () => {
    const indexNames = await getIndexNames("attachments");
    expect(indexNames).toContain("attachments_created_by_idx");
  });

  it("boards table has an index on owner_id", async () => {
    const indexNames = await getIndexNames("boards");
    expect(indexNames).toContain("boards_owner_id_idx");
  });

  it("boards table has a partial index on deleted_at WHERE deleted_at IS NOT NULL", async () => {
    const indexDef = await getIndexDef("boards_deleted_at_idx");
    expect(indexDef).toBeDefined();
    expect(indexDef!.toLowerCase()).toContain("deleted_at");
    expect(indexDef!.toLowerCase()).toContain("where");
    expect(indexDef!.toLowerCase()).toContain("is not null");
  });
});
