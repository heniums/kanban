import { eq, or, like, sql } from "drizzle-orm";
import { createDbClient } from "@/lib/db/client";
import { users } from "@/lib/db/schema/users";
import { boardMembers } from "@/lib/db/schema/board-members";

export async function searchUsers(boardId: string, query: string) {
  const db = createDbClient();

  const existingMemberIds = await db
    .select({ userId: boardMembers.userId })
    .from(boardMembers)
    .where(eq(boardMembers.boardId, boardId));

  const excludeIds = existingMemberIds.map((m) => m.userId);

  const conditions = [
    like(sql`lower(${users.email})`, sql`lower(${`%${query}%`})`),
    like(sql`lower(${users.name})`, sql`lower(${`%${query}%`})`),
  ];

  const results = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
    })
    .from(users)
    .where(or(...conditions))
    .limit(10);

  return results.filter((user) => !excludeIds.includes(user.id));
}
