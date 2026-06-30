"use server";

import { updateBoardSchema } from "@/lib/schemas/board";
import { revalidatePath } from "next/cache";

import { verifySession } from "@/lib/dal";
import { updateBoard } from "@/lib/data/boards";

type UpdateResult =
  | { board: NonNullable<Awaited<ReturnType<typeof updateBoard>>> }
  | { errors: Array<{ field: string; message: string }> };

export async function updateBoardAction(id: string, formData: FormData): Promise<UpdateResult> {
  const { userId } = await verifySession();

  const raw: Record<string, unknown> = {};
  const title = formData.get("title");
  const description = formData.get("description");
  const background = formData.get("background");

  if (title !== null) raw.title = title || undefined;
  if (description !== null) raw.description = description || undefined;
  if (background !== null) raw.background = background;

  const parsed = updateBoardSchema.safeParse(raw);

  if (!parsed.success) {
    const errors = parsed.error.errors.map((e) => ({
      field: e.path.join("."),
      message: e.message,
    }));
    return { errors };
  }

  const updated = await updateBoard(id, parsed.data, { ownerId: userId });

  if (!updated) {
    return { errors: [{ field: "", message: "Board not found" }] };
  }

  revalidatePath(`/boards/${id}`);
  revalidatePath("/boards");

  return { board: updated };
}
