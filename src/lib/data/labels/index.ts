import { sql } from "drizzle-orm";
import { createDbClient } from "@/lib/db/client";
import { labels, type Label } from "@/lib/db/schema/labels";
import { boards } from "@/lib/db/schema/boards";

export async function createLabel(
  data: { boardId: string; name: string; color: string },
  options: { ownerId: string },
): Promise<Label> {
  const db = createDbClient();
  return db.transaction(async (tx) => {
    const [board] = await tx
      .select({ id: boards.id })
      .from(boards)
      .where(
        sql`${boards.id} = ${data.boardId} AND ${boards.ownerId} = ${options.ownerId} AND ${boards.deletedAt} IS NULL`,
      );
    if (!board) {
      throw new Error("Board not found or not owned");
    }
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
  return db.transaction(async (tx) => {
    const [row] = await tx
      .select({ id: labels.id })
      .from(labels)
      .innerJoin(boards, sql`${boards.id} = ${labels.boardId}`)
      .where(
        sql`${labels.id} = ${labelId} AND ${boards.ownerId} = ${options.ownerId} AND ${boards.deletedAt} IS NULL`,
      );
    if (!row) {
      throw new Error("Label not found or board not owned");
    }
    const [updated] = await tx
      .update(labels)
      .set(data)
      .where(sql`${labels.id} = ${labelId}`)
      .returning();
    return updated;
  });
}

export async function deleteLabel(labelId: string, options: { ownerId: string }): Promise<Label> {
  const db = createDbClient();
  return db.transaction(async (tx) => {
    const [row] = await tx
      .select({ id: labels.id })
      .from(labels)
      .innerJoin(boards, sql`${boards.id} = ${labels.boardId}`)
      .where(
        sql`${labels.id} = ${labelId} AND ${boards.ownerId} = ${options.ownerId} AND ${boards.deletedAt} IS NULL`,
      );
    if (!row) {
      throw new Error("Label not found or board not owned");
    }
    const [deleted] = await tx
      .delete(labels)
      .where(sql`${labels.id} = ${labelId}`)
      .returning();
    return deleted;
  });
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
