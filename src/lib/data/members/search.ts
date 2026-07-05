import { eq, and, or, like, sql, notInArray } from "drizzle-orm";
import { createDbClient } from "@/lib/db/client";
import { users } from "@/lib/db/schema/users";
import { boardMembers } from "@/lib/db/schema/board-members";

function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, (match) => `\\${match}`);
}

export async function searchUsers(boardId: string, query: string) {
  const db = createDbClient();

  const existingMemberIds = db
    .select({ userId: boardMembers.userId })
    .from(boardMembers)
    .where(eq(boardMembers.boardId, boardId));

  const escaped = escapeLikePattern(query);
  const pattern = `%${escaped}%`;

  const conditions = [
    like(sql`lower(${users.email})`, sql`lower(${pattern})`),
    like(sql`lower(${users.name})`, sql`lower(${pattern})`),
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
