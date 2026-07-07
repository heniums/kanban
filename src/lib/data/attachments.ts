import { sql } from "drizzle-orm";
import { createDbClient } from "@/lib/db/client";
import { attachments, type Attachment, type NewAttachment } from "@/lib/db/schema/attachments";
import { cardAttachments, type CardAttachment } from "@/lib/db/schema/card-attachments";

export async function createAttachment(data: NewAttachment): Promise<Attachment> {
  const db = createDbClient();
  const [attachment] = await db.insert(attachments).values(data).returning();
  if (!attachment) throw new Error("Failed to create attachment");
  return attachment;
}

export async function deleteAttachment(attachmentId: string): Promise<Attachment | null> {
  const db = createDbClient();
  const [deleted] = await db
    .delete(attachments)
    .where(sql`${attachments.id} = ${attachmentId}`)
    .returning();
  return deleted ?? null;
}

export async function getAttachmentById(attachmentId: string): Promise<Attachment | null> {
  const db = createDbClient();
  const [attachment] = await db
    .select()
    .from(attachments)
    .where(sql`${attachments.id} = ${attachmentId}`);
  return attachment ?? null;
}

export async function listAttachmentsByCardId(cardId: string): Promise<Attachment[]> {
  const db = createDbClient();
  return db
    .select({
      id: attachments.id,
      publicId: attachments.publicId,
      url: attachments.url,
      format: attachments.format,
      width: attachments.width,
      height: attachments.height,
      bytes: attachments.bytes,
      resourceType: attachments.resourceType,
      createdBy: attachments.createdBy,
      createdAt: attachments.createdAt,
    })
    .from(cardAttachments)
    .innerJoin(attachments, sql`${attachments.id} = ${cardAttachments.attachmentId}`)
    .where(sql`${cardAttachments.cardId} = ${cardId}`)
    .orderBy(cardAttachments.displayOrder);
}

export async function attachImageToCard(
  cardId: string,
  attachmentId: string,
  displayOrder = 0,
): Promise<CardAttachment> {
  const db = createDbClient();
  const [link] = await db
    .insert(cardAttachments)
    .values({ cardId, attachmentId, displayOrder })
    .returning();
  if (!link) throw new Error("Failed to attach image to card");
  return link;
}

export async function detachImageFromCard(
  cardId: string,
  attachmentId: string,
): Promise<CardAttachment | null> {
  const db = createDbClient();
  const [deleted] = await db
    .delete(cardAttachments)
    .where(
      sql`${cardAttachments.cardId} = ${cardId} AND ${cardAttachments.attachmentId} = ${attachmentId}`,
    )
    .returning();
  return deleted ?? null;
}

export async function countAttachmentsByCardId(cardId: string): Promise<number> {
  const db = createDbClient();
  const [result] = await db
    .select({ count: sql<number>`COUNT(*)::int` })
    .from(cardAttachments)
    .where(sql`${cardAttachments.cardId} = ${cardId}`);
  return result?.count ?? 0;
}
