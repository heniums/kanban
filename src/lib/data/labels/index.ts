import { sql } from "drizzle-orm";
import { createDbClient } from "@/lib/db/client";
import { labels, type Label, type NewLabel } from "@/lib/db/schema/labels";
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

export async function updateLabel(
  labelId: string,
  data: { name?: string; color?: string },
  options: { ownerId: string },
): Promise<Label | null> {
  const db = createDbClient();
  const patch: Partial<NewLabel> = {};
  if (data.name !== undefined) patch.name = data.name;
  if (data.color !== undefined) patch.color = data.color;
  if (Object.keys(patch).length === 0) {
    return getLabelById(labelId, options);
  }
  const [updated] = await db
    .update(labels)
    .set(patch)
    .where(
      sql`${labels.id} = ${labelId} AND ${labels.boardId} IN (SELECT id FROM ${boards} WHERE ${boards.ownerId} = ${options.ownerId} AND ${boards.deletedAt} IS NULL)`,
    )
    .returning();
  return updated ?? null;
}

export async function deleteLabel(
  labelId: string,
  options: { ownerId: string },
): Promise<Label | null> {
  const db = createDbClient();
  const [deleted] = await db
    .delete(labels)
    .where(
      sql`${labels.id} = ${labelId} AND ${labels.boardId} IN (SELECT id FROM ${boards} WHERE ${boards.ownerId} = ${options.ownerId} AND ${boards.deletedAt} IS NULL)`,
    )
    .returning();
  return deleted ?? null;
}

export async function getLabelById(
  labelId: string,
  options: { ownerId: string },
): Promise<Label | null> {
  const db = createDbClient();
  const [label] = await db
    .select({ label: labels })
    .from(labels)
    .innerJoin(boards, sql`${boards.id} = ${labels.boardId}`)
    .where(
      sql`${labels.id} = ${labelId} AND ${boards.ownerId} = ${options.ownerId} AND ${boards.deletedAt} IS NULL`,
    );
  return label?.label ?? null;
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
