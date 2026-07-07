"use server";

import { verifySession } from "@/lib/dal";
import { hasPermission, BoardPermission } from "@/lib/permissions";
import {
  createAttachment,
  deleteAttachment as deleteAttachmentData,
  listAttachmentsByCardId,
  attachImageToCard,
  countAttachmentsByCardId,
} from "@/lib/data/attachments";
import { deleteCloudinaryAsset } from "@/lib/cloudinary";
import {
  createAttachmentSchema,
  deleteAttachmentSchema,
  listCardAttachmentsSchema,
} from "@/lib/schemas/attachment";
import { emitToBoard } from "@/lib/realtime/events";
import { REALTIME_EVENTS } from "@/lib/realtime/types";

export async function createAttachmentAction(input: unknown) {
  const { userId: currentUserId } = await verifySession();

  const parsed = createAttachmentSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Invalid input" };
  }

  const canEdit = await hasPermission(
    currentUserId,
    parsed.data.boardId,
    BoardPermission.EDIT_CONTENT,
  );
  if (!canEdit) {
    return { error: "You do not have permission to add attachments" };
  }

  const currentCount = await countAttachmentsByCardId(parsed.data.cardId);
  if (currentCount >= 10) {
    return { error: "Maximum 10 attachments per card" };
  }

  const attachment = await createAttachment({
    publicId: parsed.data.publicId,
    url: parsed.data.url,
    format: parsed.data.format ?? null,
    width: parsed.data.width ?? null,
    height: parsed.data.height ?? null,
    bytes: parsed.data.bytes ?? null,
    resourceType: parsed.data.resourceType ?? null,
    createdBy: currentUserId,
  });

  await attachImageToCard(parsed.data.cardId, attachment.id, currentCount);

  emitToBoard(parsed.data.boardId, REALTIME_EVENTS.ATTACHMENT_CREATED, {
    boardId: parsed.data.boardId,
    cardId: parsed.data.cardId,
    attachment: {
      id: attachment.id,
      url: attachment.url,
      publicId: attachment.publicId,
      width: attachment.width,
      height: attachment.height,
    },
  });

  return { attachment };
}

export async function deleteAttachmentAction(input: unknown) {
  const { userId: currentUserId } = await verifySession();

  const parsed = deleteAttachmentSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Invalid input" };
  }

  const canEdit = await hasPermission(
    currentUserId,
    parsed.data.boardId,
    BoardPermission.EDIT_CONTENT,
  );
  if (!canEdit) {
    return { error: "You do not have permission to delete attachments" };
  }

  const attachment = await deleteAttachmentData(parsed.data.attachmentId);
  if (!attachment) {
    return { error: "Attachment not found" };
  }

  await deleteCloudinaryAsset(attachment.publicId);

  emitToBoard(parsed.data.boardId, REALTIME_EVENTS.ATTACHMENT_DELETED, {
    boardId: parsed.data.boardId,
    cardId: parsed.data.cardId,
    attachmentId: parsed.data.attachmentId,
  });

  return { success: true };
}

export async function listCardAttachmentsAction(input: unknown) {
  const { userId: currentUserId } = await verifySession();

  const parsed = listCardAttachmentsSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Invalid input" };
  }

  const canView = await hasPermission(currentUserId, parsed.data.boardId, BoardPermission.VIEW);
  if (!canView) {
    return { error: "You do not have permission to view this card" };
  }

  const attachments = await listAttachmentsByCardId(parsed.data.cardId);
  return { attachments };
}
