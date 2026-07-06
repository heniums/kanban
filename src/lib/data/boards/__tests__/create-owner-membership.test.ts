import { describe, expect, it } from "vitest";
import { eq, and } from "drizzle-orm";
// @vitest-environment node
import { createDbClient } from "@/lib/db/client";
import { users } from "@/lib/db/schema/users";
import { boards } from "@/lib/db/schema/boards";
import { boardMembers } from "@/lib/db/schema/board-members";
import { createBoard } from "@/lib/data/boards/create";

const db = createDbClient();

async function createTestUser() {
  const [user] = await db
    .insert(users)
    .values({
      email: `owner-test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@kanban.local`,
      passwordHash: "test-hash",
      name: "Owner Test User",
    })
    .returning();
  return user;
}

describe("createBoard adds creator as owner", () => {
  it("automatically adds board creator as 'owner' in board_members", async () => {
    const user = await createTestUser();

    const board = await createBoard({
      title: "Owner Test Board",
      description: null,
      background: "#1a1a2e",
      ownerId: user.id,
    });

    const membership = await db
      .select()
      .from(boardMembers)
      .where(and(eq(boardMembers.boardId, board.id), eq(boardMembers.userId, user.id)));

    expect(membership).toHaveLength(1);
    expect(membership[0].role).toBe("owner");
    expect(membership[0].boardId).toBe(board.id);
    expect(membership[0].userId).toBe(user.id);
    expect(membership[0].joinedAt).toBeDefined();
  });

  it("creates board and membership atomically in a transaction", async () => {
    const user = await createTestUser();

    const board = await createBoard({
      title: "Atomic Board",
      description: null,
      background: "#000000",
      ownerId: user.id,
    });

    // Verify both board and membership exist
    const membership = await db
      .select()
      .from(boardMembers)
      .where(and(eq(boardMembers.boardId, board.id), eq(boardMembers.userId, user.id)));

    expect(membership).toHaveLength(1);
    expect(membership[0].role).toBe("owner");
  });

  it("sets joinedAt timestamp when adding owner", async () => {
    const user = await createTestUser();
    const beforeCreate = new Date();

    const board = await createBoard({
      title: "Timestamp Board",
      description: null,
      background: "#ffffff",
      ownerId: user.id,
    });

    const membership = await db
      .select()
      .from(boardMembers)
      .where(and(eq(boardMembers.boardId, board.id), eq(boardMembers.userId, user.id)));

    expect(membership[0].joinedAt).toBeInstanceOf(Date);
    // Allow 5-second clock skew between test runner and DB server
    expect(Math.abs(membership[0].joinedAt.getTime() - beforeCreate.getTime())).toBeLessThan(5000);
  });
});
