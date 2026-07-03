import { eq, max } from "drizzle-orm";
import { createDbClient } from "@/lib/db/client";
import { lists, type List } from "@/lib/db/schema/lists";

export async function createList(data: { boardId: string; title: string }): Promise<List> {
  const db = createDbClient();
  return db.transaction(async (tx) => {
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
