import { createDbClient } from "@/lib/db/client";
import { boardMembers } from "@/lib/db/schema/board-members";

export async function addMember(boardId: string, userId: string) {
  const db = createDbClient();

  try {
    await db.insert(boardMembers).values({
      boardId,
      userId,
      role: "member",
    });
  } catch {
    return { error: "User is already a member of this board" };
  }

  return { success: true };
}
