import { eq, max, sql } from "drizzle-orm";
import { createDbClient } from "@/lib/db/client";
import { lists, type List } from "@/lib/db/schema/lists";
import { boards } from "@/lib/db/schema/boards";

export async function createList(
  data: { boardId: string; title: string },
  options: { ownerId: string },
): Promise<List> {
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
    const [maxRow] = await tx
      .select({ value: max(lists.position) })
      .from(lists)
      .where(eq(lists.boardId, data.boardId));
    const nextPosition = (maxRow?.value ?? -1) + 1;
    const [list] = await tx
      .insert(lists)
      .values({ boardId: data.boardId, title: data.title, position: nextPosition })
      .returning();
    return list;
  });
}
