import "server-only";
import { hash, compare } from "bcryptjs";
import { eq } from "drizzle-orm";
import { createDbClient } from "@/lib/db/client";
import { users, type User } from "@/lib/db/schema/users";

export type PublicUser = Omit<User, "passwordHash">;

export async function verifyCredentials(
  email: string,
  password: string,
): Promise<PublicUser | null> {
  const db = createDbClient();
  const [user] = await db.select().from(users).where(eq(users.email, email));

  if (!user) {
    return null;
  }

  const valid = await compare(password, user.passwordHash);

  if (!valid) {
    return null;
  }

  const { passwordHash, ...publicUser } = user;
  void passwordHash;
  return publicUser;
}

export async function createUser(input: {
  email: string;
  password: string;
  name: string;
}): Promise<PublicUser> {
  const db = createDbClient();
  const passwordHash = await hash(input.password, 12);

  const [user] = await db
    .insert(users)
    .values({
      email: input.email,
      passwordHash,
      name: input.name,
    })
    .returning();

  const { passwordHash: removed, ...publicUser } = user;
  void removed;
  return publicUser;
}

export async function updateUserAvatar(
  userId: string,
  avatarUrl: string | null,
  avatarPublicId: string | null,
): Promise<PublicUser | null> {
  const db = createDbClient();
  const [user] = await db
    .update(users)
    .set({ avatarUrl, avatarPublicId })
    .where(eq(users.id, userId))
    .returning();

  if (!user) return null;
  const { passwordHash: removed, ...publicUser } = user;
  void removed;
  return publicUser;
}

export async function getUserById(userId: string): Promise<PublicUser | null> {
  const db = createDbClient();
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  if (!user) return null;
  const { passwordHash: removed, ...publicUser } = user;
  void removed;
  return publicUser;
}

export async function updateUserProfile(
  userId: string,
  data: { name: string },
): Promise<PublicUser | null> {
  const db = createDbClient();
  const [user] = await db
    .update(users)
    .set({ name: data.name })
    .where(eq(users.id, userId))
    .returning();

  if (!user) return null;
  const { passwordHash: removed, ...publicUser } = user;
  void removed;
  return publicUser;
}

export async function updateUserPassword(
  userId: string,
  oldPassword: string,
  newPassword: string,
): Promise<{ success: true } | { error: string }> {
  const db = createDbClient();
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  if (!user) {
    return { error: "User not found" };
  }

  const valid = await compare(oldPassword, user.passwordHash);
  if (!valid) {
    return { error: "Current password is incorrect" };
  }

  const newHash = await hash(newPassword, 12);
  await db.update(users).set({ passwordHash: newHash }).where(eq(users.id, userId));

  return { success: true };
}
