import { describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
// @vitest-environment node
import { TestDataFactory } from "./test-factory";
import { createDbClient } from "@/lib/db/client";
import { users } from "@/lib/db/schema/users";
import { boards } from "@/lib/db/schema/boards";
import { lists } from "@/lib/db/schema/lists";
import { cards } from "@/lib/db/schema/cards";

const db = createDbClient();

describe("TestDataFactory", () => {
  describe("createUser", () => {
    it("inserts a user with a generated email and tracks it for cleanup", async () => {
      const factory = new TestDataFactory();
      const user = await factory.createUser();

      expect(user.id).toBeDefined();
      expect(user.email).toMatch(/@kanban\.local$/);

      const [found] = await db.select().from(users).where(eq(users.id, user.id));
      expect(found).toBeDefined();
      expect(found!.email).toBe(user.email);

      await factory.cleanup();

      const [after] = await db.select().from(users).where(eq(users.id, user.id));
      expect(after).toBeUndefined();
    });

    it("accepts overrides for email, name, and passwordHash", async () => {
      const factory = new TestDataFactory();
      const user = await factory.createUser({
        email: "custom@kanban.local",
        name: "Custom",
        passwordHash: "custom-hash",
      });

      expect(user.email).toBe("custom@kanban.local");
      expect(user.name).toBe("Custom");
      expect(user.passwordHash).toBe("custom-hash");

      await factory.cleanup();
    });
  });

  describe("createBoard", () => {
    it("auto-creates a user when no ownerId is provided", async () => {
      const factory = new TestDataFactory();
      const board = await factory.createBoard({ title: "Auto Board" });

      expect(board.id).toBeDefined();
      expect(board.title).toBe("Auto Board");

      const [foundOwner] = await db.select().from(users).where(eq(users.id, board.ownerId));
      expect(foundOwner).toBeDefined();

      const [foundBoard] = await db.select().from(boards).where(eq(boards.id, board.id));
      expect(foundBoard).toBeDefined();

      await factory.cleanup();

      const [afterBoard] = await db.select().from(boards).where(eq(boards.id, board.id));
      expect(afterBoard).toBeUndefined();
      const [afterOwner] = await db.select().from(users).where(eq(users.id, board.ownerId));
      expect(afterOwner).toBeUndefined();
    });

    it("reuses a provided ownerId without creating a new user", async () => {
      const factory = new TestDataFactory();
      const user = await factory.createUser();
      const userIdsBefore = factory.getTrackedUserIds().length;

      const board = await factory.createBoard({ ownerId: user.id, title: "User Board" });
      expect(board.ownerId).toBe(user.id);

      const userIdsAfter = factory.getTrackedUserIds().length;
      expect(userIdsAfter).toBe(userIdsBefore);

      await factory.cleanup();
    });

    it("accepts background and description overrides", async () => {
      const factory = new TestDataFactory();
      const board = await factory.createBoard({
        title: "Described",
        description: "A test board",
        background: "#ff0000",
      });

      expect(board.title).toBe("Described");
      expect(board.description).toBe("A test board");
      expect(board.background).toBe("#ff0000");

      await factory.cleanup();
    });
  });

  describe("createList", () => {
    it("auto-creates a board and user when no boardId is provided", async () => {
      const factory = new TestDataFactory();
      const list = await factory.createList({ title: "Auto List" });

      expect(list.id).toBeDefined();
      expect(list.title).toBe("Auto List");

      const [foundList] = await db.select().from(lists).where(eq(lists.id, list.id));
      expect(foundList).toBeDefined();

      await factory.cleanup();

      const [afterList] = await db.select().from(lists).where(eq(lists.id, list.id));
      expect(afterList).toBeUndefined();
    });

    it("uses a provided boardId", async () => {
      const factory = new TestDataFactory();
      const user = await factory.createUser();
      const board = await factory.createBoard({ ownerId: user.id });

      const list = await factory.createList({ boardId: board.id, title: "Existing Board List" });
      expect(list.boardId).toBe(board.id);

      await factory.cleanup();
    });

    it("auto-assigns position when explicit position is not provided", async () => {
      const factory = new TestDataFactory();
      const list = await factory.createList({ position: 3 });
      expect(list.position).toBe(3);

      await factory.cleanup();
    });
  });

  describe("createCard", () => {
    it("auto-creates list, board, and user when no listId is provided", async () => {
      const factory = new TestDataFactory();
      const card = await factory.createCard({ title: "Auto Card" });

      expect(card.id).toBeDefined();
      expect(card.title).toBe("Auto Card");

      const [found] = await db.select().from(cards).where(eq(cards.id, card.id));
      expect(found).toBeDefined();

      await factory.cleanup();

      const [after] = await db.select().from(cards).where(eq(cards.id, card.id));
      expect(after).toBeUndefined();
    });

    it("uses a provided listId without auto-creating", async () => {
      const factory = new TestDataFactory();
      const user = await factory.createUser();
      const board = await factory.createBoard({ ownerId: user.id });
      const list = await factory.createList({ boardId: board.id });

      const card = await factory.createCard({ listId: list.id, title: "In List Card" });
      expect(card.listId).toBe(list.id);

      await factory.cleanup();
    });

    it("accepts description, position, and dueDate overrides", async () => {
      const factory = new TestDataFactory();
      const dueDate = new Date("2026-12-31");
      const card = await factory.createCard({
        title: "Full Card",
        description: "A full card",
        position: 2,
        dueDate,
      });

      expect(card.title).toBe("Full Card");
      expect(card.description).toBe("A full card");
      expect(card.position).toBe(2);

      await factory.cleanup();
    });
  });

  describe("cleanup", () => {
    it("deletes all tracked rows in FK-safe order (boards before users)", async () => {
      const factory = new TestDataFactory();

      const user1 = await factory.createUser({ email: "cleanup-1@kanban.local" });
      const user2 = await factory.createUser({ email: "cleanup-2@kanban.local" });
      const board1 = await factory.createBoard({ ownerId: user1.id, title: "Board 1" });
      const board2 = await factory.createBoard({ ownerId: user2.id, title: "Board 2" });
      const list = await factory.createList({ boardId: board1.id, title: "List 1" });
      const card = await factory.createCard({
        listId: list.id,
        boardId: board1.id,
        title: "Card 1",
      });

      await factory.cleanup();

      // All tracked rows should be deleted
      for (const id of [card.id, list.id, board1.id, board2.id, user1.id, user2.id]) {
        const [foundUser] = await db.select({ id: users.id }).from(users).where(eq(users.id, id));
        const [foundBoard] = await db
          .select({ id: boards.id })
          .from(boards)
          .where(eq(boards.id, id));
        const [foundList] = await db.select({ id: lists.id }).from(lists).where(eq(lists.id, id));
        const [foundCard] = await db.select({ id: cards.id }).from(cards).where(eq(cards.id, id));
        expect(foundUser ?? foundBoard ?? foundList ?? foundCard).toBeUndefined();
      }
    });

    it("does not throw if a row was already deleted externally", async () => {
      const factory = new TestDataFactory();
      const user = await factory.createUser();
      const board = await factory.createBoard({ ownerId: user.id });

      // Delete externally
      await db.delete(boards).where(eq(boards.id, board.id));
      await db.delete(users).where(eq(users.id, user.id));

      // Cleanup should not throw
      await factory.cleanup();
    });
  });
});
