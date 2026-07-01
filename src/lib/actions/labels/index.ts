"use server";

import { revalidatePath } from "next/cache";
import { verifySession } from "@/lib/dal";
import { createLabel, updateLabel, deleteLabel, getLabelsByBoardId } from "@/lib/data/labels";
import {
  createLabelSchema,
  updateLabelSchema,
  deleteLabelSchema,
  getLabelsByBoardIdSchema,
} from "@/lib/schemas/label";
import type { Label } from "@/lib/db/schema/labels";

type Result<T> = { data: T } | { errors: Array<{ field: string; message: string }> };

function formatZodErrors(error: import("zod").ZodError) {
  return error.errors.map((e) => ({ field: e.path.join("."), message: e.message }));
}

export async function createLabelAction(input: unknown): Promise<Result<Label>> {
  const { userId } = await verifySession();
  const parsed = createLabelSchema.safeParse(input);
  if (!parsed.success) return { errors: formatZodErrors(parsed.error) };
  try {
    const label = await createLabel(parsed.data, { ownerId: userId });
    revalidatePath(`/boards/${label.boardId}`);
    return { data: label };
  } catch (err) {
    return { errors: [{ field: "", message: err instanceof Error ? err.message : "Failed" }] };
  }
}

export async function updateLabelAction(input: unknown): Promise<Result<Label>> {
  const { userId } = await verifySession();
  const parsed = updateLabelSchema.safeParse(input);
  if (!parsed.success) return { errors: formatZodErrors(parsed.error) };
  const { labelId, ...patch } = parsed.data;
  try {
    const label = await updateLabel(labelId, patch, { ownerId: userId });
    if (!label) return { errors: [{ field: "", message: "Label not found" }] };
    revalidatePath(`/boards/${label.boardId}`);
    return { data: label };
  } catch (err) {
    return { errors: [{ field: "", message: err instanceof Error ? err.message : "Failed" }] };
  }
}

export async function deleteLabelAction(input: unknown): Promise<Result<{ boardId: string }>> {
  const { userId } = await verifySession();
  const parsed = deleteLabelSchema.safeParse(input);
  if (!parsed.success) return { errors: formatZodErrors(parsed.error) };
  try {
    const deleted = await deleteLabel(parsed.data.labelId, { ownerId: userId });
    if (!deleted) return { errors: [{ field: "", message: "Label not found" }] };
    revalidatePath(`/boards/${deleted.boardId}`);
    return { data: { boardId: deleted.boardId } };
  } catch (err) {
    return { errors: [{ field: "", message: err instanceof Error ? err.message : "Failed" }] };
  }
}

export async function getLabelsByBoardIdAction(input: unknown): Promise<Result<Label[]>> {
  const { userId } = await verifySession();
  const parsed = getLabelsByBoardIdSchema.safeParse(input);
  if (!parsed.success) return { errors: formatZodErrors(parsed.error) };
  const labels = await getLabelsByBoardId(parsed.data.boardId, { ownerId: userId });
  return { data: labels };
}
