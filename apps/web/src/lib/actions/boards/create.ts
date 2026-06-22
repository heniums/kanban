"use server";

import { createDbClient, boards, createBoardSchema } from "@kanban/shared";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getSessionUserId } from "./auth";

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

  const db = createDbClient();
  const [board] = await db
    .insert(boards)
    .values({ ...parsed.data, ownerId: userId })
    .returning();

  revalidatePath("/boards");
  redirect(`/boards/${board.id}`);
}
