import { sql } from "drizzle-orm";
import { createDbClient } from "@/lib/db/client";
import { lists, type List } from "@/lib/db/schema/lists";
import { boards } from "@/lib/db/schema/boards";
import { cards } from "@/lib/db/schema/cards";
import { listAttachmentsByCardId } from "@/lib/data/attachments";
import { deleteCloudinaryAsset } from "@/lib/cloudinary";

export async function deleteList(listId: string): Promise<List | null> {
  const db = createDbClient();

  const cardIds = await db
    .select({ id: cards.id })
    .from(cards)
    .where(sql`${cards.listId} = ${listId}`);

  for (const { id } of cardIds) {
    const attachments = await listAttachmentsByCardId(id);
    for (const att of attachments) {
      try {
        await deleteCloudinaryAsset(att.publicId);
      } catch {
        // Best-effort cleanup
      }
    }
  }

  return db.transaction(async (tx) => {
    const [deleted] = await tx
      .delete(lists)
      .where(
        sql`${lists.id} = ${listId} AND ${lists.boardId} IN (SELECT id FROM ${boards} WHERE ${boards.deletedAt} IS NULL)`,
      )
      .returning();
    if (!deleted) return null;
    await tx.execute(
      sql`UPDATE lists SET position = position - 1 WHERE board_id = ${deleted.boardId} AND position > ${deleted.position}`,
    );
    return deleted;
  });
}
