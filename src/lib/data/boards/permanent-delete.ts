import { sql } from "drizzle-orm";
import { createDbClient } from "@/lib/db/client";
import { boards } from "@/lib/db/schema/boards";
import { cards } from "@/lib/db/schema/cards";
import { attachments } from "@/lib/db/schema/attachments";
import { cardAttachments } from "@/lib/db/schema/card-attachments";
import { eq, and, isNotNull, inArray } from "drizzle-orm";

export async function getBoardAttachmentPublicIds(boardId: string): Promise<string[]> {
  const db = createDbClient();
  const rows = await db
    .select({ publicId: attachments.publicId })
    .from(attachments)
    .innerJoin(cardAttachments, sql`${cardAttachments.attachmentId} = ${attachments.id}`)
    .innerJoin(cards, sql`${cards.id} = ${cardAttachments.cardId}`)
    .where(eq(cards.boardId, boardId));
  return rows.map((r) => r.publicId);
}

export async function deleteAttachmentsByBoardId(boardId: string): Promise<void> {
  const db = createDbClient();
  const cardIds = await db.select({ id: cards.id }).from(cards).where(eq(cards.boardId, boardId));

  if (cardIds.length === 0) return;

  const ids = cardIds.map((c) => c.id);

  const attachmentRows = await db
    .select({ attachmentId: cardAttachments.attachmentId })
    .from(cardAttachments)
    .where(inArray(cardAttachments.cardId, ids));

  if (attachmentRows.length === 0) return;

  const attachmentIds = attachmentRows.map((r) => r.attachmentId);
  await db.delete(attachments).where(inArray(attachments.id, attachmentIds));
}

export async function hardDeleteBoard(id: string): Promise<boolean> {
  const db = createDbClient();
  const [deleted] = await db
    .delete(boards)
    .where(and(eq(boards.id, id), isNotNull(boards.deletedAt)))
    .returning();
  return !!deleted;
}
