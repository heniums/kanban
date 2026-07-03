"use server";

import { revalidatePath } from "next/cache";
import { verifySession } from "@/lib/dal";
import { createLabel, updateLabel, deleteLabel } from "@/lib/data/labels";
import { createLabelSchema, updateLabelSchema, deleteLabelSchema } from "@/lib/schemas/label";
import { emitToBoard, REALTIME_EVENTS } from "@/lib/realtime/events";
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
    const label = await createLabel(parsed.data);
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
  try {
    const { labelId, ...data } = parsed.data;
    const label = await updateLabel(labelId, data, { ownerId: userId });
    revalidatePath(`/boards/${label.boardId}`);
    emitToBoard(label.boardId, REALTIME_EVENTS.LABEL_UPDATED, {
      boardId: label.boardId,
      label: { id: label.id, name: label.name, color: label.color },
    });
    return { data: label };
  } catch (err) {
    return { errors: [{ field: "", message: err instanceof Error ? err.message : "Failed" }] };
  }
}

export async function deleteLabelAction(
  input: unknown,
): Promise<{ success: true } | { errors: Array<{ field: string; message: string }> }> {
  const { userId } = await verifySession();
  const parsed = deleteLabelSchema.safeParse(input);
  if (!parsed.success) return { errors: formatZodErrors(parsed.error) };
  try {
    const label = await deleteLabel(parsed.data.labelId, { ownerId: userId });
    revalidatePath(`/boards/${label.boardId}`);
    emitToBoard(label.boardId, REALTIME_EVENTS.LABEL_DELETED, {
      boardId: label.boardId,
      labelId: label.id,
    });
    return { success: true };
  } catch (err) {
    return { errors: [{ field: "", message: err instanceof Error ? err.message : "Failed" }] };
  }
}
