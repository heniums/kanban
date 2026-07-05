import { eq, and, ne, count } from "drizzle-orm";
import { createDbClient } from "@/lib/db/client";
import { boardMembers } from "@/lib/db/schema/board-members";

export async function removeMember(boardId: string, userId: string, requestingUserId: string) {
  const db = createDbClient();

  if (userId === requestingUserId) {
    const [member] = await db
      .select()
      .from(boardMembers)
      .where(and(eq(boardMembers.boardId, boardId), eq(boardMembers.userId, userId)));

    if (member?.role === "owner") {
      return { error: "Owner cannot remove themselves from the board" };
    }
  }

  return db.transaction(async (tx) => {
    const [memberToRemove] = await tx
      .select()
      .from(boardMembers)
      .where(and(eq(boardMembers.boardId, boardId), eq(boardMembers.userId, userId)));

    if (!memberToRemove) {
      return { error: "User is not a member of this board" };
    }

    if (memberToRemove.role === "owner") {
      const [ownerCount] = await tx
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

    await tx
      .delete(boardMembers)
      .where(and(eq(boardMembers.boardId, boardId), eq(boardMembers.userId, userId)));

    return { success: true };
  });
}
