import { eq, and, or, like, sql, notInArray } from "drizzle-orm";
import { createDbClient } from "@/lib/db/client";
import { users } from "@/lib/db/schema/users";
import { boardMembers } from "@/lib/db/schema/board-members";

export async function searchUsers(boardId: string, query: string) {
  const db = createDbClient();

  const existingMemberIds = db
    .select({ userId: boardMembers.userId })
    .from(boardMembers)
    .where(eq(boardMembers.boardId, boardId));

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
    .where(and(or(...conditions), notInArray(users.id, existingMemberIds)))
    .limit(10);

  return results;
}
