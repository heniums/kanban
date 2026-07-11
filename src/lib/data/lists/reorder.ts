import { sql } from "drizzle-orm";
import { createDbClient } from "@/lib/db/client";
import { lists, type List } from "@/lib/db/schema/lists";
import { boards } from "@/lib/db/schema/boards";

export async function reorderLists(boardId: string, orderedListIds: string[]): Promise<List[]> {
  if (orderedListIds.length === 0) return [];

  if (new Set(orderedListIds).size !== orderedListIds.length) {
    throw new Error("orderedListIds must not contain duplicates");
  }

  const db = createDbClient();
  return db.transaction(async (tx) => {
    const ids = sql.join(
      orderedListIds.map((id) => sql`${id}`),
      sql`, `,
    );
    const whenThenNeg = sql.join(
      orderedListIds.map((id, i) => sql`WHEN ${id} THEN ${-(i + 1)}::int`),
      sql` `,
    );
    const whenThenFin = sql.join(
      orderedListIds.map((id, i) => sql`WHEN ${id} THEN ${i}::int`),
      sql` `,
    );
    const whereClause = sql`id IN (${ids}) AND board_id = ${boardId} AND board_id IN (SELECT id FROM ${boards} WHERE ${boards.deletedAt} IS NULL)`;

    await tx
      .update(lists)
      .set({ position: sql`CASE id ${whenThenNeg} END` })
      .where(whereClause);

    const result = await tx
      .update(lists)
      .set({ position: sql`CASE id ${whenThenFin} END` })
      .where(whereClause)
      .returning();

    const rowsById = new Map<string, List>(result.map((r) => [r.id, r] as const));
    return orderedListIds.map((id) => rowsById.get(id)).filter((r): r is List => r !== undefined);
  });
}
