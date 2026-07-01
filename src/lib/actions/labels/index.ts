"use server";

import { revalidatePath } from "next/cache";
import { verifySession } from "@/lib/dal";
import { createLabel } from "@/lib/data/labels";
import { createLabelSchema } from "@/lib/schemas/label";
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
