import { inArray, sql } from "drizzle-orm";
import { createDbClient } from "@/lib/db/client";
import { users, type User } from "@/lib/db/schema/users";

export async function getAllUsers(options: { userId: string }): Promise<User[]> {
  const db = createDbClient();
  const rows = await db
    .select()
    .from(users)
    .where(sql`${users.id} != ${options.userId}`)
    .orderBy(sql`${users.name} ASC`);
  return rows;
}

export async function getUsersByIds(ids: string[]): Promise<User[]> {
  if (ids.length === 0) return [];
  const db = createDbClient();
  return db.select().from(users).where(inArray(users.id, ids));
}
