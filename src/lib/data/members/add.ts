import { eq, and } from "drizzle-orm";
import { createDbClient } from "@/lib/db/client";
import { boardMembers } from "@/lib/db/schema/board-members";

export async function addMember(boardId: string, userId: string) {
  const db = createDbClient();

  const [existing] = await db
    .select()
    .from(boardMembers)
    .where(and(eq(boardMembers.boardId, boardId), eq(boardMembers.userId, userId)));

  if (existing) {
    return { error: "User is already a member of this board" };
  }

  await db.insert(boardMembers).values({
    boardId,
    userId,
    role: "member",
  });

  return { success: true };
}
