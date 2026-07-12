import { sql } from "drizzle-orm";
import { createDbClient } from "@/lib/db/client";
import { lists, type List } from "@/lib/db/schema/lists";
import { boards } from "@/lib/db/schema/boards";
import { cards } from "@/lib/db/schema/cards";
import { attachments } from "@/lib/db/schema/attachments";
import { cardAttachments } from "@/lib/db/schema/card-attachments";
import { deleteCloudinaryAsset } from "@/lib/cloudinary";

export async function deleteList(listId: string): Promise<List | null> {
  const db = createDbClient();

  const attachmentsInList = await db
    .select({ publicId: attachments.publicId })
    .from(cards)
    .innerJoin(cardAttachments, sql`${cardAttachments.cardId} = ${cards.id}`)
    .innerJoin(attachments, sql`${attachments.id} = ${cardAttachments.attachmentId}`)
    .where(sql`${cards.listId} = ${listId}`);

  if (attachmentsInList.length > 0) {
    await Promise.allSettled(attachmentsInList.map((att) => deleteCloudinaryAsset(att.publicId)));
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
