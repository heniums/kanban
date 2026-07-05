"use server";

import { revalidatePath } from "next/cache";
import { verifySession } from "@/lib/dal";
import { reorderLists } from "@/lib/data/lists";
import { reorderListsSchema } from "@/lib/schemas/list";
import { emitToBoard, REALTIME_EVENTS } from "@/lib/realtime/events";
import { assertBoardPermission } from "@/lib/actions/guards";
import { BoardPermission } from "@/lib/permissions";

type ReorderListsResult =
  | { lists: Awaited<ReturnType<typeof reorderLists>> }
  | { errors: Array<{ field: string; message: string }> };

export async function reorderListsAction(input: {
  boardId: string;
  orderedListIds: string[];
}): Promise<ReorderListsResult> {
  const { userId } = await verifySession();

  const parsed = reorderListsSchema.safeParse(input);
  if (!parsed.success) {
    return {
      errors: parsed.error.errors.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      })),
    };
  }

  const allowed = await assertBoardPermission(
    parsed.data.boardId,
    userId,
    BoardPermission.EDIT_CONTENT,
  );
  if (!allowed) {
    return { errors: [{ field: "", message: "Forbidden" }] };
  }

  try {
    const lists = await reorderLists(parsed.data.boardId, parsed.data.orderedListIds);
    revalidatePath(`/boards/${parsed.data.boardId}`);
    emitToBoard(parsed.data.boardId, REALTIME_EVENTS.LIST_REORDERED, {
      boardId: parsed.data.boardId,
      orderedListIds: parsed.data.orderedListIds,
    });
    return { lists };
  } catch (error) {
    return {
      errors: [
        {
          field: "orderedListIds",
          message: error instanceof Error ? error.message : "Failed to reorder lists",
        },
      ],
    };
  }
}
