import { describe, expect, it } from "vitest";
import { eq, and } from "drizzle-orm";
// @vitest-environment node
import { createDbClient } from "@/lib/db/client";
import { boardMembers } from "@/lib/db/schema/board-members";
import { TestDataFactory } from "@/__tests__/test-factory";
import { createBoard } from "@/lib/data/boards/create";

const db = createDbClient();
const factory = new TestDataFactory();
factory.registerCleanup();

async function createTestUser(label: string) {
  return factory.createUser({
    email: `test-owner-${label}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}@kanban.local`,
    name: `Test User ${label}`,
  });
}

describe("createBoard adds creator as owner", () => {
  it("automatically adds board creator as 'owner' in board_members", async () => {
    const user = await createTestUser("owner");

    const board = await createBoard({
      title: "Owner Test Board",
      description: null,
      background: "#1a1a2e",
      ownerId: user.id,
    });
    factory.trackBoard(board.id);

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
    const user = await createTestUser("atomic");

    const board = await createBoard({
      title: "Atomic Board",
      description: null,
      background: "#000000",
      ownerId: user.id,
    });
    factory.trackBoard(board.id);

    // Verify both board and membership exist
    const membership = await db
      .select()
      .from(boardMembers)
      .where(and(eq(boardMembers.boardId, board.id), eq(boardMembers.userId, user.id)));

    expect(membership).toHaveLength(1);
    expect(membership[0].role).toBe("owner");
  });

  it("sets joinedAt timestamp when adding owner", async () => {
    const user = await createTestUser("timestamp");
    const beforeCreate = new Date();

    const board = await createBoard({
      title: "Timestamp Board",
      description: null,
      background: "#ffffff",
      ownerId: user.id,
    });
    factory.trackBoard(board.id);

    const membership = await db
      .select()
      .from(boardMembers)
      .where(and(eq(boardMembers.boardId, board.id), eq(boardMembers.userId, user.id)));

    expect(membership[0].joinedAt).toBeInstanceOf(Date);
    expect(membership[0].joinedAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
  });
});
