"use server";

import { createDbClient, boards, updateBoardSchema } from "@kanban/shared";
import { eq, and, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { getSessionUserId } from "./auth";

export async function updateBoardAction(id: string, formData: FormData) {
  const userId = await getSessionUserId();

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

  const db = createDbClient();

  const [existing] = await db
    .select()
    .from(boards)
    .where(and(eq(boards.id, id), isNull(boards.deletedAt)));

  if (!existing) {
    return { errors: [{ field: "", message: "Board not found" }] };
  }

  if (existing.ownerId !== userId) {
    throw new Error("Forbidden");
  }

  const [updated] = await db
    .update(boards)
    .set(parsed.data)
    .where(and(eq(boards.id, id), isNull(boards.deletedAt)))
    .returning();

  revalidatePath(`/boards/${id}`);
  revalidatePath("/boards");

  return { board: updated };
}
