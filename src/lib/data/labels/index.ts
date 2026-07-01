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
