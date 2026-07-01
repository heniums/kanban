import { sql } from "drizzle-orm";
import { createDbClient } from "@/lib/db/client";
import { lists, type List } from "@/lib/db/schema/lists";
import { boards } from "@/lib/db/schema/boards";

export async function reorderLists(
  boardId: string,
  orderedListIds: string[],
  options: { ownerId: string },
): Promise<List[]> {
  if (orderedListIds.length === 0) return [];

  if (new Set(orderedListIds).size !== orderedListIds.length) {
    throw new Error("orderedListIds must not contain duplicates");
  }

  const db = createDbClient();
  return db.transaction(async (tx) => {
    const updated: List[] = [];
    for (let i = 0; i < orderedListIds.length; i++) {
      await tx
        .update(lists)
        .set({ position: -(i + 1) })
        .where(
          sql`${lists.id} = ${orderedListIds[i]} AND ${lists.boardId} = ${boardId} AND ${lists.boardId} IN (SELECT id FROM ${boards} WHERE ${boards.ownerId} = ${options.ownerId} AND ${boards.deletedAt} IS NULL)`,
        );
    }
    for (let i = 0; i < orderedListIds.length; i++) {
      const [row] = await tx
        .update(lists)
        .set({ position: i })
        .where(
          sql`${lists.id} = ${orderedListIds[i]} AND ${lists.boardId} = ${boardId} AND ${lists.boardId} IN (SELECT id FROM ${boards} WHERE ${boards.ownerId} = ${options.ownerId} AND ${boards.deletedAt} IS NULL)`,
        )
        .returning();
      if (row) updated.push(row);
    }
    return updated;
  });
}
