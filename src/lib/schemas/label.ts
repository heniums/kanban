import { z } from "zod";

const uuid = z.string().uuid();
const hexColor = z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Color must be a hex code");

export const createLabelSchema = z.object({
  boardId: uuid,
  name: z.string().min(1).max(50),
  color: hexColor,
});

export const updateLabelSchema = z.object({
  labelId: uuid,
  name: z.string().min(1).max(50).optional(),
  color: hexColor.optional(),
});

export const deleteLabelSchema = z.object({
  labelId: uuid,
});
