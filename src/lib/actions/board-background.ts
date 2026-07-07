"use server";

import { verifySession } from "@/lib/dal";
import { hasPermission, BoardPermission } from "@/lib/permissions";
import { sql } from "drizzle-orm";
import { createDbClient } from "@/lib/db/client";
import { boards } from "@/lib/db/schema/boards";
import { deleteCloudinaryAsset } from "@/lib/cloudinary";
import { z } from "zod";

const updateBoardBackgroundSchema = z.object({
  boardId: z.string().uuid(),
  backgroundImageUrl: z.string().url(),
  backgroundImagePublicId: z.string().min(1),
});

const deleteBoardBackgroundSchema = z.object({
  boardId: z.string().uuid(),
});

export async function updateBoardBackgroundImageAction(input: unknown) {
  const { userId: currentUserId } = await verifySession();

  const parsed = updateBoardBackgroundSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Invalid input" };
  }

  const canManage = await hasPermission(
    currentUserId,
    parsed.data.boardId,
    BoardPermission.MANAGE_SETTINGS,
  );
  if (!canManage) {
    return { error: "You do not have permission to update this board" };
  }

  const db = createDbClient();

  // Delete old background from Cloudinary if exists
  const [current] = await db
    .select({ backgroundImagePublicId: boards.backgroundImagePublicId })
    .from(boards)
    .where(sql`${boards.id} = ${parsed.data.boardId}`);

  if (current?.backgroundImagePublicId) {
    await deleteCloudinaryAsset(current.backgroundImagePublicId);
  }

  const [board] = await db
    .update(boards)
    .set({
      backgroundImageUrl: parsed.data.backgroundImageUrl,
      backgroundImagePublicId: parsed.data.backgroundImagePublicId,
    })
    .where(sql`${boards.id} = ${parsed.data.boardId}`)
    .returning();

  return { board };
}

export async function deleteBoardBackgroundImageAction(input: unknown) {
  const { userId: currentUserId } = await verifySession();

  const parsed = deleteBoardBackgroundSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Invalid input" };
  }

  const canManage = await hasPermission(
    currentUserId,
    parsed.data.boardId,
    BoardPermission.MANAGE_SETTINGS,
  );
  if (!canManage) {
    return { error: "You do not have permission to update this board" };
  }

  const db = createDbClient();

  // Delete old background from Cloudinary if exists
  const [current] = await db
    .select({ backgroundImagePublicId: boards.backgroundImagePublicId })
    .from(boards)
    .where(sql`${boards.id} = ${parsed.data.boardId}`);

  if (current?.backgroundImagePublicId) {
    await deleteCloudinaryAsset(current.backgroundImagePublicId);
  }

  const [board] = await db
    .update(boards)
    .set({ backgroundImageUrl: null, backgroundImagePublicId: null })
    .where(sql`${boards.id} = ${parsed.data.boardId}`)
    .returning();

  return { board };
}
