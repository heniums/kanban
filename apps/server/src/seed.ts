import "dotenv/config";
import { hash } from "bcryptjs";
import { createDbClient } from "./db.js";
import { users } from "./schema/users.js";

export async function seed() {
  const db = createDbClient();

  const passwordHash = await hash("password123", 12);

  const [user] = await db
    .insert(users)
    .values({
      email: "demo@kanban.local",
      passwordHash,
      name: "Demo User",
    })
    .onConflictDoNothing()
    .returning();

  return user ?? null;
}
