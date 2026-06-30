import "dotenv/config";
import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { createDbClient } from "@/lib/db/client";
import { users } from "@/lib/db/schema/users";
import { boards } from "@/lib/db/schema/boards";

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

  let demoUser = user;
  if (!demoUser) {
    const [existing] = await db
      .select()
      .from(users)
      .where(eq(users.email, "demo@kanban.local"));
    demoUser = existing ?? null;
  }

  if (demoUser) {
    const existingBoards = await db
      .select()
      .from(boards)
      .where(eq(boards.ownerId, demoUser.id));

    if (existingBoards.length === 0) {
      await db.insert(boards).values([
        {
          title: "Product Roadmap",
          description: "Quarterly product planning and milestones.",
          background: "#1a1a2e",
          ownerId: demoUser.id,
        },
        {
          title: "Sprint Board",
          description: "Current sprint tasks and progress.",
          background: "linear-gradient(135deg, #667eea, #764ba2)",
          ownerId: demoUser.id,
        },
        {
          title: "Backlog Refinement",
          description: "Triaging and estimating upcoming work.",
          background: "linear-gradient(135deg, #f093fb, #f5576c)",
          ownerId: demoUser.id,
        },
      ]);
    }
  }

  return demoUser ?? null;
}
