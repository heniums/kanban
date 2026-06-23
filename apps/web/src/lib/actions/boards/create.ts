"use server";

import { createBoardSchema } from "@kanban/shared";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getSessionUserId } from "./auth";
import { createBoard } from "@/lib/data/boards";

export async function createBoardAction(formData: FormData) {
  const userId = await getSessionUserId();

  const raw = {
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    background: formData.get("background"),
  };

  const parsed = createBoardSchema.safeParse(raw);

  if (!parsed.success) {
    const errors = parsed.error.errors.map((e) => ({
      field: e.path.join("."),
      message: e.message,
    }));
    return { errors };
  }

  const board = await createBoard({ ...parsed.data, ownerId: userId });

  revalidatePath("/boards");
  redirect(`/boards/${board.id}`);
}
