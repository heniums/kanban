"use server";

import { revalidatePath } from "next/cache";
import { verifySession } from "@/lib/dal";
import { renameList } from "@/lib/data/lists";
import { renameListSchema } from "@/lib/schemas/list";

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

  const list = await renameList(
    parsed.data.listId,
    { title: parsed.data.title },
    { ownerId: userId },
  );
  if (!list) {
    return { errors: [{ field: "", message: "List not found" }] };
  }

  revalidatePath(`/boards/${list.boardId}`);
  return { list };
}
