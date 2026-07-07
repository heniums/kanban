"use server";

import { verifySession } from "@/lib/dal";
import { updateUserAvatar, getUserById } from "@/lib/data/auth";
import { deleteCloudinaryAsset } from "@/lib/cloudinary";
import { z } from "zod";

const updateAvatarSchema = z.object({
  avatarUrl: z.string().url(),
  avatarPublicId: z.string().min(1),
});

export async function updateUserAvatarAction(input: unknown) {
  const { userId: currentUserId } = await verifySession();

  const parsed = updateAvatarSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Invalid input" };
  }

  const currentUser = await getUserById(currentUserId);
  if (!currentUser) {
    return { error: "User not found" };
  }

  // Delete old avatar from Cloudinary if exists
  if (currentUser.avatarPublicId) {
    await deleteCloudinaryAsset(currentUser.avatarPublicId);
  }

  const user = await updateUserAvatar(
    currentUserId,
    parsed.data.avatarUrl,
    parsed.data.avatarPublicId,
  );

  return { user };
}

export async function deleteUserAvatarAction() {
  const { userId: currentUserId } = await verifySession();

  const currentUser = await getUserById(currentUserId);
  if (!currentUser) {
    return { error: "User not found" };
  }

  // Delete old avatar from Cloudinary if exists
  if (currentUser.avatarPublicId) {
    await deleteCloudinaryAsset(currentUser.avatarPublicId);
  }

  const user = await updateUserAvatar(currentUserId, null, null);

  return { user };
}
