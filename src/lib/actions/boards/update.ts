"use server";

import { updateBoardSchema } from "@/lib/schemas/board";
import { revalidatePath } from "next/cache";

import { verifySession } from "@/lib/dal";
import { updateBoard } from "@/lib/data/boards";
import { assertBoardPermission } from "@/lib/actions/guards";
import { BoardPermission } from "@/lib/permissions";

type UpdateResult =
  | { board: NonNullable<Awaited<ReturnType<typeof updateBoard>>> }
  | { errors: Array<{ field: string; message: string }> };

export async function updateBoardAction(id: string, formData: FormData): Promise<UpdateResult> {
  const { userId } = await verifySession();

  const allowed = await assertBoardPermission(id, userId, BoardPermission.MANAGE_SETTINGS);
  if (!allowed) {
    return { errors: [{ field: "", message: "Forbidden" }] };
  }

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

  const updated = await updateBoard(id, parsed.data);

  if (!updated) {
    return { errors: [{ field: "", message: "Board not found" }] };
  }

  revalidatePath(`/boards/${id}`);
  revalidatePath("/boards");

  return { board: updated };
}
