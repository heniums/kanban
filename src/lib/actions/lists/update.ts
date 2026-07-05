"use server";

import { revalidatePath } from "next/cache";
import { verifySession } from "@/lib/dal";
import { renameList } from "@/lib/data/lists";
import { renameListSchema } from "@/lib/schemas/list";
import { assertListPermission } from "@/lib/actions/guards";
import { BoardPermission } from "@/lib/permissions";

type RenameListResult =
  | { list: NonNullable<Awaited<ReturnType<typeof renameList>>> }
  | { errors: Array<{ field: string; message: string }> };

export async function renameListAction(input: {
  listId: string;
  title: string;
}): Promise<RenameListResult> {
  const { userId } = await verifySession();

  const parsed = renameListSchema.safeParse(input);

  if (!parsed.success) {
    return {
      errors: parsed.error.errors.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      })),
    };
  }

  const allowed = await assertListPermission(
    parsed.data.listId,
    userId,
    BoardPermission.EDIT_CONTENT,
  );
  if (!allowed) {
    return { errors: [{ field: "", message: "Forbidden" }] };
  }

  const list = await renameList(parsed.data.listId, { title: parsed.data.title });
  if (!list) {
    return { errors: [{ field: "", message: "List not found" }] };
  }

  revalidatePath(`/boards/${list.boardId}`);
  return { list };
}
