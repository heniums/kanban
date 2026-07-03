import { sql } from "drizzle-orm";
import { createDbClient } from "@/lib/db/client";
import { labels, type Label } from "@/lib/db/schema/labels";
import { boards } from "@/lib/db/schema/boards";

export async function createLabel(data: {
  boardId: string;
  name: string;
  color: string;
}): Promise<Label> {
  const db = createDbClient();
  return db.transaction(async (tx) => {
    const [label] = await tx
      .insert(labels)
      .values({ boardId: data.boardId, name: data.name, color: data.color })
      .returning();
    return label;
  });
}

export async function getLabelsByBoardId(
  boardId: string,
  options: { ownerId: string },
): Promise<Label[]> {
  const db = createDbClient();
  const rows = await db
    .select({ label: labels })
    .from(labels)
    .innerJoin(boards, sql`${boards.id} = ${labels.boardId}`)
    .where(
      sql`${labels.boardId} = ${boardId} AND ${boards.ownerId} = ${options.ownerId} AND ${boards.deletedAt} IS NULL`,
    )
    .orderBy(sql`${labels.name} ASC`);
  return rows.map((r) => r.label);
}

export async function updateLabel(
  labelId: string,
  data: { name?: string; color?: string },
  options: { ownerId: string },
): Promise<Label> {
  const db = createDbClient();
  const [updated] = await db
    .update(labels)
    .set(data)
    .where(
      sql`${labels.id} = ${labelId} AND ${labels.boardId} IN (
        SELECT ${boards.id} FROM ${boards} WHERE ${boards.ownerId} = ${options.ownerId} AND ${boards.deletedAt} IS NULL
      )`,
    )
    .returning();
  if (!updated) {
    throw new Error("Label not found or board not owned");
  }
  return updated;
}

export async function deleteLabel(labelId: string, options: { ownerId: string }): Promise<Label> {
  const db = createDbClient();
  const [deleted] = await db
    .delete(labels)
    .where(
      sql`${labels.id} = ${labelId} AND ${labels.boardId} IN (
        SELECT ${boards.id} FROM ${boards} WHERE ${boards.ownerId} = ${options.ownerId} AND ${boards.deletedAt} IS NULL
      )`,
    )
    .returning();
  if (!deleted) {
    throw new Error("Label not found or board not owned");
  }
  return deleted;
}

export async function getLabelById(labelId: string, options: { ownerId: string }): Promise<Label> {
  const db = createDbClient();
  const rows = await db
    .select({ label: labels })
    .from(labels)
    .innerJoin(boards, sql`${boards.id} = ${labels.boardId}`)
    .where(
      sql`${labels.id} = ${labelId} AND ${boards.ownerId} = ${options.ownerId} AND ${boards.deletedAt} IS NULL`,
    );
  const row = rows[0];
  if (!row) {
    throw new Error("Label not found or board not owned");
  }
  return row.label;
}
