import { describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
// @vitest-environment node
import { getBoardMembers } from "@/lib/data/members/list";
import { createDbClient } from "@/lib/db/client";
import { users } from "@/lib/db/schema/users";
import { boards } from "@/lib/db/schema/boards";
import { boardMembers } from "@/lib/db/schema/board-members";

const db = createDbClient();

async function createTestUser(name: string) {
  const [user] = await db
    .insert(users)
    .values({
      email: `member-test-${name}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@kanban.local`,
      passwordHash: "test-hash",
      name,
    })
    .returning();
  return user;
}

async function createTestBoard(ownerId: string, title: string) {
  const [board] = await db
    .insert(boards)
    .values({
      title,
      background: "#000000",
      ownerId,
    })
    .returning();
  await db.insert(boardMembers).values({
    boardId: board.id,
    userId: ownerId,
    role: "owner",
  });
  return board;
}

describe("getBoardMembers", () => {
  it("returns only board members for a given boardId", async () => {
    const owner = await createTestUser("Owner");
    const member = await createTestUser("Member");
    const nonMember = await createTestUser("Non-Member");

    const board = await createTestBoard(owner.id, "Test Board");
    await db.insert(boardMembers).values({
      boardId: board.id,
      userId: member.id,
      role: "member",
    });

    const result = await getBoardMembers(board.id);

    const userIds = result.map((m) => m.user.id);
    expect(userIds).toContain(owner.id);
    expect(userIds).toContain(member.id);
    expect(userIds).not.toContain(nonMember.id);
    expect(result).toHaveLength(2);
  });

  it("excludes users not on the board", async () => {
    const owner = await createTestUser("Owner");
    const board = await createTestBoard(owner.id, "Solo Board");
    await createTestUser("Outsider");

    const result = await getBoardMembers(board.id);

    expect(result).toHaveLength(1);
    expect(result[0].user.id).toBe(owner.id);
  });

  it("returns the expected data shape for each member", async () => {
    const owner = await createTestUser("Alice");
    // Override email for this specific test
    await db.update(users).set({ email: "alice@kanban.local" }).where(eq(users.id, owner.id));
    const board = await createTestBoard(owner.id, "Alice's Board");

    const result = await getBoardMembers(board.id);

    expect(result).toHaveLength(1);
    const member = result[0];
    expect(member.userId).toBe(owner.id);
    expect(member.role).toBe("owner");
    expect(member.user).toEqual({
      id: owner.id,
      name: "Alice",
      email: "alice@kanban.local",
    });
    expect(member.joinedAt).toBeDefined();
  });
});
