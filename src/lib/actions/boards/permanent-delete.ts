"use server";

import { revalidatePath } from "next/cache";

import { verifySession } from "@/lib/dal";
import { assertBoardPermission } from "@/lib/actions/guards";
import { BoardPermission } from "@/lib/permissions";
import {
  getBoardAttachmentPublicIds,
  deleteAttachmentsByBoardId,
  hardDeleteBoard,
} from "@/lib/data/boards/permanent-delete";
import { deleteCloudinaryAsset } from "@/lib/cloudinary";

export async function permanentDeleteBoardAction(id: string) {
  const { userId } = await verifySession();

  const allowed = await assertBoardPermission(id, userId, BoardPermission.MANAGE_SETTINGS, {
    includeDeleted: true,
  });
  if (!allowed) {
    return { error: "Forbidden" };
  }

  const publicIds = await getBoardAttachmentPublicIds(id);

  await Promise.all(publicIds.map((publicId) => deleteCloudinaryAsset(publicId).catch(() => {})));

  await deleteAttachmentsByBoardId(id);

  const deleted = await hardDeleteBoard(id);
  if (!deleted) {
    return { error: "Board not found" };
  }

  revalidatePath("/boards");
  revalidatePath("/trash");

  return { success: true };
}
