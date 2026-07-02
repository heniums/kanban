import { createDbClient } from "@/lib/db/client";
import { users, type User } from "@/lib/db/schema/users";
import { boards, type Board } from "@/lib/db/schema/boards";
import { lists, type List } from "@/lib/db/schema/lists";
import { cards, type Card } from "@/lib/db/schema/cards";
import { eq } from "drizzle-orm";
import { afterAll } from "vitest";

export class TestDataFactory {
  private db = createDbClient();
  private _userIds: string[] = [];
  private _boardIds: string[] = [];
  private _listIds: string[] = [];
  private _cardIds: string[] = [];

  async createUser(overrides?: Partial<typeof users.$inferInsert>): Promise<User> {
    const email =
      overrides?.email ??
      `tf-${Date.now()}-${Math.random().toString(36).slice(2, 10)}@kanban.local`;
    const data = {
      email,
      passwordHash: "test-hash",
      name: "Test User",
      ...overrides,
    };
    const [user] = await this.db.insert(users).values(data).returning();
    this._userIds.push(user.id);
    return user;
  }

  async createBoard(overrides?: Partial<typeof boards.$inferInsert>): Promise<Board> {
    let ownerId = overrides?.ownerId;
    if (!ownerId) {
      const user = await this.createUser();
      ownerId = user.id;
    }
    const data = {
      title: "Test Board",
      background: "#000000",
      ownerId,
      ...overrides,
    };
    const [board] = await this.db.insert(boards).values(data).returning();
    this._boardIds.push(board.id);
    return board;
  }

  async createList(overrides?: Partial<typeof lists.$inferInsert>): Promise<List> {
    let boardId = overrides?.boardId;
    if (!boardId) {
      const board = await this.createBoard();
      boardId = board.id;
    }
    const data = {
      title: "Test List",
      position: 0,
      boardId,
      ...overrides,
    };
    const [list] = await this.db.insert(lists).values(data).returning();
    this._listIds.push(list.id);
    return list;
  }

  async createCard(overrides?: Partial<typeof cards.$inferInsert>): Promise<Card> {
    let listId = overrides?.listId;
    let boardId = overrides?.boardId;
    if (!listId) {
      const list = await this.createList();
      listId = list.id;
      boardId = boardId ?? list.boardId;
    } else if (!boardId) {
      const [list] = await this.db
        .select({ boardId: lists.boardId })
        .from(lists)
        .where(eq(lists.id, listId));
      boardId = list?.boardId;
    }
    if (!boardId) {
      throw new Error("createCard: could not determine boardId");
    }
    const data = {
      title: "Test Card",
      position: 0,
      listId,
      boardId,
      ...overrides,
    };
    const [card] = await this.db.insert(cards).values(data).returning();
    this._cardIds.push(card.id);
    return card;
  }

  getTrackedUserIds(): string[] {
    return this._userIds;
  }

  async cleanup(): Promise<void> {
    for (const id of [...this._cardIds].reverse()) {
      await this.db
        .delete(cards)
        .where(eq(cards.id, id))
        .catch(() => {});
    }
    for (const id of [...this._listIds].reverse()) {
      await this.db
        .delete(lists)
        .where(eq(lists.id, id))
        .catch(() => {});
    }
    for (const id of [...this._boardIds].reverse()) {
      await this.db
        .delete(boards)
        .where(eq(boards.id, id))
        .catch(() => {});
    }
    for (const id of [...this._userIds].reverse()) {
      await this.db
        .delete(users)
        .where(eq(users.id, id))
        .catch(() => {});
    }
  }

  registerCleanup(): void {
    afterAll(async () => {
      await this.cleanup();
    });
  }
}
