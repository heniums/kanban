import { eq } from "drizzle-orm";
import { createDbClient } from "@/lib/db/client";
import { boardMembers } from "@/lib/db/schema/board-members";
import { users } from "@/lib/db/schema/users";

export async function getBoardMembers(boardId: string) {
  const db = createDbClient();

  const members = await db
    .select({
      userId: boardMembers.userId,
      role: boardMembers.role,
      joinedAt: boardMembers.joinedAt,
      user: {
        id: users.id,
        email: users.email,
        name: users.name,
        avatarUrl: users.avatarUrl,
      },
    })
    .from(boardMembers)
    .innerJoin(users, eq(boardMembers.userId, users.id))
    .where(eq(boardMembers.boardId, boardId));

  return members;
}
