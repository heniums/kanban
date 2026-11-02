import { z } from "zod";

const uuid = z
  .string()
  .regex(
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/,
    "Invalid UUID",
  );

export const createAttachmentSchema = z.object({
  publicId: z.string().min(1),
  url: z.string().url(),
  format: z.string().optional(),
  width: z.number().int().optional(),
  height: z.number().int().optional(),
  bytes: z.number().int().optional(),
  resourceType: z.string().optional(),
  cardId: uuid,
  boardId: uuid,
});

export const deleteAttachmentSchema = z.object({
  attachmentId: uuid,
  cardId: uuid,
  boardId: uuid,
});

export const listCardAttachmentsSchema = z.object({
  cardId: uuid,
  boardId: uuid,
});
