"use server";

import { revalidatePath } from "next/cache";
import { verifySession } from "@/lib/dal";
import { createList } from "@/lib/data/lists";
import { createListSchema } from "@/lib/schemas/list";
import { assertBoardPermission } from "@/lib/actions/guards";
import { BoardPermission } from "@/lib/permissions";

type CreateListResult =
  | { list: NonNullable<Awaited<ReturnType<typeof createList>>> }
  | { errors: Array<{ field: string; message: string }> };

export async function createListAction(input: {
  boardId: string;
  title: string;
}): Promise<CreateListResult> {
  const { userId } = await verifySession();

  const parsed = createListSchema.safeParse(input);

  if (!parsed.success) {
    return {
      errors: parsed.error.errors.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      })),
    };
  }

  const hasAccess = await assertBoardPermission(
    parsed.data.boardId,
    userId,
    BoardPermission.EDIT_CONTENT,
  );
  if (!hasAccess) {
    return { errors: [{ field: "", message: "Board not found or insufficient permissions" }] };
  }

  try {
    const list = await createList(parsed.data);
    revalidatePath(`/boards/${input.boardId}`);
    return { list };
  } catch {
    return { errors: [{ field: "", message: "Failed to create list" }] };
  }
}
