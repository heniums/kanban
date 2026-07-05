import { sql } from "drizzle-orm";
import { createDbClient } from "@/lib/db/client";
import { checklists } from "@/lib/db/schema/checklists";
import { checklistItems } from "@/lib/db/schema/checklist-items";
import { cards } from "@/lib/db/schema/cards";

export async function getChecklistProgressByBoardId(
  boardId: string,
): Promise<Record<string, { total: number; completed: number }>> {
  const db = createDbClient();
  const rows = (
    await db.execute(
      sql`SELECT c.id AS card_id,
                COALESCE(SUM(CASE WHEN ci.id IS NOT NULL THEN 1 ELSE 0 END), 0)::int AS total,
                COALESCE(SUM(CASE WHEN ci.is_completed = true THEN 1 ELSE 0 END), 0)::int AS completed
         FROM ${cards} c
         LEFT JOIN ${checklists} cl ON cl.card_id = c.id
         LEFT JOIN ${checklistItems} ci ON ci.checklist_id = cl.id
         WHERE c.board_id = ${boardId}
         GROUP BY c.id`,
    )
  ).rows as Array<{ card_id: string; total: number; completed: number }>;
  const out: Record<string, { total: number; completed: number }> = {};
  for (const r of rows) {
    if (r.total > 0) out[r.card_id] = { total: r.total, completed: r.completed };
  }
  return out;
}
