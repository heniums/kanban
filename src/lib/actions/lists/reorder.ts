"use server";

import { revalidatePath } from "next/cache";
import { verifySession } from "@/lib/dal";
import { reorderLists } from "@/lib/data/lists";
import { reorderListsSchema } from "@/lib/schemas/list";

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

  try {
    const lists = await reorderLists(parsed.data.boardId, parsed.data.orderedListIds, {
      ownerId: userId,
    });
    revalidatePath(`/boards/${parsed.data.boardId}`);
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
