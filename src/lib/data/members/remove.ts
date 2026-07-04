import { eq, and, sql } from "drizzle-orm";
import { createDbClient } from "@/lib/db/client";
import { boardMembers } from "@/lib/db/schema/board-members";

export async function removeMember(boardId: string, userId: string) {
  const db = createDbClient();

  const [memberToRemove] = await db
    .select()
    .from(boardMembers)
    .where(and(eq(boardMembers.boardId, boardId), eq(boardMembers.userId, userId)));

  if (!memberToRemove) {
    return { error: "User is not a member of this board" };
  }

  if (memberToRemove.role === "owner") {
    const [otherOwner] = await db
      .select()
      .from(boardMembers)
      .where(
        and(
          eq(boardMembers.boardId, boardId),
          eq(boardMembers.role, "owner"),
          sql`user_id != ${userId}`,
        ),
      );

    if (!otherOwner) {
      return { error: "Cannot remove the last owner of the board" };
    }
  }

  await db
    .delete(boardMembers)
    .where(and(eq(boardMembers.boardId, boardId), eq(boardMembers.userId, userId)));

  return { success: true };
}
