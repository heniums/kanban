import { z } from "zod";

export const createAttachmentSchema = z.object({
  publicId: z.string().min(1),
  url: z.string().url(),
  format: z.string().optional(),
  width: z.number().int().optional(),
  height: z.number().int().optional(),
  bytes: z.number().int().optional(),
  resourceType: z.string().optional(),
  cardId: z.string().uuid(),
  boardId: z.string().uuid(),
});

export const deleteAttachmentSchema = z.object({
  attachmentId: z.string().uuid(),
  cardId: z.string().uuid(),
  boardId: z.string().uuid(),
});

export const listCardAttachmentsSchema = z.object({
  cardId: z.string().uuid(),
  boardId: z.string().uuid(),
});
