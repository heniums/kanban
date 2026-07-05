import { describe, it, expect, beforeEach } from "vitest";
import { createDbClient } from "@/lib/db/client";
import { boardMembers } from "@/lib/db/schema/board-members";
import { eq } from "drizzle-orm";
import { TestDataFactory } from "@/__tests__/test-factory";
import { getBoardById } from "../get";
import { listBoardsByMember } from "../list";

describe("Board access control (membership-based)", () => {
  const factory = new TestDataFactory();
  factory.registerCleanup();

  let userId1: string;
  let userId2: string;
  let boardId1: string;
  let boardId2: string;

  beforeEach(async () => {
    const user1 = await factory.createUser();
    userId1 = user1.id;

    const user2 = await factory.createUser();
    userId2 = user2.id;

    const board1 = await factory.createBoard({ ownerId: userId1, title: "Board 1" });
    boardId1 = board1.id;

    const board2 = await factory.createBoard({ ownerId: userId2, title: "Board 2" });
    boardId2 = board2.id;

    const db = createDbClient();

    await db.insert(boardMembers).values({
      boardId: boardId1,
      userId: userId2,
      role: "member",
    });
  });

  describe("getBoardById", () => {
    it("returns board when user is owner", async () => {
      const board = await getBoardById(boardId1, { userId: userId1 });
      expect(board).not.toBeNull();
      expect(board?.id).toBe(boardId1);
    });

    it("returns board when user is member", async () => {
      const board = await getBoardById(boardId1, { userId: userId2 });
      expect(board).not.toBeNull();
      expect(board?.id).toBe(boardId1);
    });

    it("returns null when user is not a member", async () => {
      const board = await getBoardById(boardId2, { userId: userId1 });
      expect(board).toBeNull();
    });

    it("returns null for non-existent board", async () => {
      const board = await getBoardById("00000000-0000-0000-0000-000000000000", { userId: userId1 });
      expect(board).toBeNull();
    });
  });

  describe("listBoardsByMember", () => {
    it("returns boards where user is owner", async () => {
      const userBoards = await listBoardsByMember(userId2);
      expect(userBoards).toHaveLength(2);
      expect(userBoards.map((b) => b.id)).toContain(boardId1);
      expect(userBoards.map((b) => b.id)).toContain(boardId2);
    });

    it("returns boards where user is member", async () => {
      const userBoards = await listBoardsByMember(userId2);
      expect(userBoards).toHaveLength(2);
    });

    it("returns only boards for specific user", async () => {
      const userBoards = await listBoardsByMember(userId1);
      expect(userBoards).toHaveLength(1);
      expect(userBoards[0].id).toBe(boardId1);
    });

    it("returns empty array when user has no memberships", async () => {
      const db = createDbClient();
      await db.delete(boardMembers).where(eq(boardMembers.userId, userId1));
      const userBoards = await listBoardsByMember(userId1);
      expect(userBoards).toHaveLength(0);
    });
  });
});
