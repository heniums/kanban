import { eq, and, ne, count } from "drizzle-orm";
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
    const [ownerCount] = await db
      .select({ count: count() })
      .from(boardMembers)
      .where(
        and(
          eq(boardMembers.boardId, boardId),
          eq(boardMembers.role, "owner"),
          ne(boardMembers.userId, userId),
        ),
      );

    if (!ownerCount || ownerCount.count === 0) {
      return { error: "Cannot remove the last owner of the board" };
    }
  }

  await db
    .delete(boardMembers)
    .where(and(eq(boardMembers.boardId, boardId), eq(boardMembers.userId, userId)));

  return { success: true };
}
