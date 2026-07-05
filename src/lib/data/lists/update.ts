import { sql } from "drizzle-orm";
import { createDbClient } from "@/lib/db/client";
import { lists, type List } from "@/lib/db/schema/lists";
import { boards } from "@/lib/db/schema/boards";

export async function renameList(listId: string, data: { title: string }): Promise<List | null> {
  const db = createDbClient();
  const [updated] = await db
    .update(lists)
    .set({ title: data.title })
    .where(
      sql`${lists.id} = ${listId} AND ${lists.boardId} IN (SELECT id FROM ${boards} WHERE ${boards.deletedAt} IS NULL)`,
    )
    .returning();
  return updated ?? null;
}
