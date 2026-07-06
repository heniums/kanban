import { describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
// @vitest-environment node
import { createDbClient } from "@/lib/db/client";
import { users } from "@/lib/db/schema/users";
import { boards } from "@/lib/db/schema/boards";
import { boardMembers } from "@/lib/db/schema/board-members";
import { lists } from "@/lib/db/schema/lists";
import { createBoard } from "@/lib/data/boards/create";

const db = createDbClient();

async function createTestUser() {
  const [user] = await db
    .insert(users)
    .values({
      email: `default-list-test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@kanban.local`,
      passwordHash: "test-hash",
      name: "Default List Test User",
    })
    .returning();
  return user;
}

describe("createBoard default list side effect", () => {
  it("creates a default 'To Do' list with position 0 atomically", async () => {
    const user = await createTestUser();

    const board = await createBoard({
      title: "My New Board",
      description: null,
      background: "#1a1a2e",
      ownerId: user.id,
    });

    const boardLists = await db.select().from(lists).where(eq(lists.boardId, board.id));

    expect(boardLists).toHaveLength(1);
    expect(boardLists[0].title).toBe("To Do");
    expect(boardLists[0].position).toBe(0);
    expect(boardLists[0].boardId).toBe(board.id);
  });

  it("creates the default list even when the board has a description", async () => {
    const user = await createTestUser();

    const board = await createBoard({
      title: "Described Board",
      description: "A board with a description",
      background: "linear-gradient(135deg, #000, #fff)",
      ownerId: user.id,
    });

    const boardLists = await db.select().from(lists).where(eq(lists.boardId, board.id));

    expect(boardLists).toHaveLength(1);
    expect(boardLists[0].title).toBe("To Do");
  });
});
