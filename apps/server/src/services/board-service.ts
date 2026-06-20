import { eq, and, isNull } from "drizzle-orm";
import { boards } from "../schema/boards.js";
import type { DbClient } from "../db.js";

export type Board = typeof boards.$inferSelect;
export type BoardInput = {
  title: string;
  description?: string;
  background: string;
  ownerId: string;
};
export type BoardUpdate = {
  title?: string;
  description?: string;
  background?: string;
};

export function createBoardService(db: DbClient) {
  return {
    async create(data: BoardInput): Promise<Board> {
      const [board] = await db.insert(boards).values(data).returning();
      return board;
    },

    async getById(id: string, ownerId: string): Promise<Board | null> {
      const result = await db
        .select()
        .from(boards)
        .where(
          and(
            eq(boards.id, id),
            eq(boards.ownerId, ownerId),
            isNull(boards.deletedAt),
          ),
        );
      return result[0] ?? null;
    },

    async listOwned(ownerId: string): Promise<Board[]> {
      return db
        .select()
        .from(boards)
        .where(and(eq(boards.ownerId, ownerId), isNull(boards.deletedAt)));
    },

    async listShared(_userId: string): Promise<Board[]> {
      return [];
    },

    async update(
      id: string,
      ownerId: string,
      data: BoardUpdate,
    ): Promise<Board | null> {
      const [board] = await db
        .update(boards)
        .set(data)
        .where(
          and(
            eq(boards.id, id),
            eq(boards.ownerId, ownerId),
            isNull(boards.deletedAt),
          ),
        )
        .returning();
      return board ?? null;
    },

    async softDelete(id: string, ownerId: string): Promise<Board | null> {
      const [board] = await db
        .update(boards)
        .set({ deletedAt: new Date() })
        .where(
          and(
            eq(boards.id, id),
            eq(boards.ownerId, ownerId),
            isNull(boards.deletedAt),
          ),
        )
        .returning();
      return board ?? null;
    },

    async restore(id: string, ownerId: string): Promise<Board | null> {
      const [board] = await db
        .update(boards)
        .set({ deletedAt: null })
        .where(and(eq(boards.id, id), eq(boards.ownerId, ownerId)))
        .returning();
      return board ?? null;
    },
  };
}

export type BoardService = ReturnType<typeof createBoardService>;
