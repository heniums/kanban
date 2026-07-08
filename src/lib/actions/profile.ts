"use server";

import { verifySession } from "@/lib/dal";
import { updateUserProfile, updateUserPassword } from "@/lib/data/auth";
import { z } from "zod";

const updateProfileSchema = z.object({
  name: z.string().min(1).max(100),
});

export async function updateProfileAction(input: unknown) {
  const { userId } = await verifySession();

  const parsed = updateProfileSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Invalid input" };
  }

  const user = await updateUserProfile(userId, parsed.data);
  if (!user) {
    return { error: "Failed to update profile" };
  }

  return { user };
}

const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
  confirmPassword: z.string().min(1),
});

export async function updatePasswordAction(input: unknown) {
  const { userId } = await verifySession();

  const parsed = updatePasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Invalid input" };
  }

  if (parsed.data.newPassword !== parsed.data.confirmPassword) {
    return { error: "New passwords do not match" };
  }

  const result = await updateUserPassword(
    userId,
    parsed.data.currentPassword,
    parsed.data.newPassword,
  );

  if ("error" in result) {
    return { error: result.error };
  }

  return { success: true };
}
