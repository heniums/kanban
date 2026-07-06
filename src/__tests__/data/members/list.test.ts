import { describe, expect, it } from "vitest";
// @vitest-environment node
import { TestDataFactory } from "../../test-factory";
import { getBoardMembers } from "@/lib/data/members/list";
import { createDbClient } from "@/lib/db/client";
import { boardMembers } from "@/lib/db/schema/board-members";

describe("getBoardMembers", () => {
  const factory = new TestDataFactory();
  factory.registerCleanup();

  it("returns only board members for a given boardId", async () => {
    const owner = await factory.createUser({ name: "Owner" });
    const member = await factory.createUser({ name: "Member" });
    const nonMember = await factory.createUser({ name: "Non-Member" });

    const board = await factory.createBoard({ ownerId: owner.id, title: "Test Board" });

    const db = createDbClient();
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
    const owner = await factory.createUser({ name: "Owner" });
    const board = await factory.createBoard({ ownerId: owner.id, title: "Solo Board" });
    await factory.createUser({ name: "Outsider" });

    const result = await getBoardMembers(board.id);

    expect(result).toHaveLength(1);
    expect(result[0].user.id).toBe(owner.id);
  });

  it("returns the expected data shape for each member", async () => {
    const owner = await factory.createUser({ name: "Alice", email: "alice@kanban.local" });
    const board = await factory.createBoard({ ownerId: owner.id });

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
