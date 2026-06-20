import { describe, expect, it, vi, beforeEach } from "vitest";
import { boards } from "../schema/boards.js";
import { createBoard } from "../services/boards/create-board.js";
import { getBoardById } from "../services/boards/get-board-by-id.js";
import { listBoardsByOwner } from "../services/boards/list-boards-by-owner.js";
import { listSharedBoards } from "../services/boards/list-shared-boards.js";
import { updateBoard } from "../services/boards/update-board.js";
import { softDeleteBoard } from "../services/boards/soft-delete-board.js";
import { restoreBoard } from "../services/boards/restore-board.js";

function createMockDb() {
  return {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
  };
}

describe("Board services", () => {
  let mockDb: ReturnType<typeof createMockDb>;

  beforeEach(() => {
    mockDb = createMockDb();
  });

  describe("createBoard", () => {
    it("creates a board with the provided data and returns it", async () => {
      const mockBoard = {
        id: "board-1",
        title: "Test Board",
        description: null,
        background: "#1a1a2e",
        ownerId: "user-1",
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };
      const valuesMock = vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([mockBoard]),
      });
      mockDb.insert.mockReturnValue({ values: valuesMock });

      const result = await createBoard(mockDb as any, {
        title: "Test Board",
        background: "#1a1a2e",
        ownerId: "user-1",
      });

      expect(result).toEqual(mockBoard);
      expect(mockDb.insert).toHaveBeenCalledWith(boards);
    });

    it("creates a board with description when provided", async () => {
      const mockBoard = { id: "board-1", title: "Test", description: "A desc" };
      const valuesMock = vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([mockBoard]),
      });
      mockDb.insert.mockReturnValue({ values: valuesMock });

      await createBoard(mockDb as any, {
        title: "Test",
        description: "A desc",
        background: "#1a1a2e",
        ownerId: "user-1",
      });

      expect(valuesMock.mock.calls[0][0]).toMatchObject({ description: "A desc" });
    });
  });

  describe("getBoardById", () => {
    it("returns the board when it exists and is not deleted", async () => {
      const mockBoard = { id: "board-1", title: "Test", ownerId: "user-1" };
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([mockBoard]),
        }),
      });

      const result = await getBoardById(mockDb as any, "board-1");
      expect(result).toEqual(mockBoard);
    });

    it("returns null when the board does not exist", async () => {
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      });

      const result = await getBoardById(mockDb as any, "nonexistent");
      expect(result).toBeNull();
    });
  });

  describe("listBoardsByOwner", () => {
    it("returns all non-deleted boards owned by the user", async () => {
      const mockBoards = [
        { id: "board-1", title: "Board 1", ownerId: "user-1" },
        { id: "board-2", title: "Board 2", ownerId: "user-1" },
      ];
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(mockBoards),
        }),
      });

      const result = await listBoardsByOwner(mockDb as any, "user-1");
      expect(result).toEqual(mockBoards);
      expect(result).toHaveLength(2);
    });

    it("returns empty array when user owns no boards", async () => {
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      });

      const result = await listBoardsByOwner(mockDb as any, "user-1");
      expect(result).toEqual([]);
    });
  });

  describe("listSharedBoards", () => {
    it("returns an empty array (stub for future sharing track)", async () => {
      const result = await listSharedBoards(mockDb as any, "user-1");
      expect(result).toEqual([]);
      expect(mockDb.select).not.toHaveBeenCalled();
    });
  });

  describe("updateBoard", () => {
    it("updates board metadata and returns the updated board", async () => {
      const mockBoard = { id: "board-1", title: "Updated", ownerId: "user-1" };
      const setMock = vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockBoard]),
        }),
      });
      mockDb.update.mockReturnValue({ set: setMock });

      const result = await updateBoard(mockDb as any, "board-1", {
        title: "Updated",
      });

      expect(result).toEqual(mockBoard);
      expect(mockDb.update).toHaveBeenCalledWith(boards);
      expect(setMock.mock.calls[0][0]).toMatchObject({ title: "Updated" });
    });

    it("returns null when board does not exist", async () => {
      const setMock = vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([]),
        }),
      });
      mockDb.update.mockReturnValue({ set: setMock });

      const result = await updateBoard(mockDb as any, "nonexistent", {
        title: "Updated",
      });

      expect(result).toBeNull();
    });
  });

  describe("softDeleteBoard", () => {
    it("sets deletedAt and returns the deleted board", async () => {
      const mockBoard = {
        id: "board-1",
        title: "Test",
        ownerId: "user-1",
        deletedAt: new Date(),
      };
      const setMock = vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockBoard]),
        }),
      });
      mockDb.update.mockReturnValue({ set: setMock });

      const result = await softDeleteBoard(mockDb as any, "board-1");

      expect(result).toEqual(mockBoard);
      expect(setMock.mock.calls[0][0]).toHaveProperty("deletedAt");
      expect(setMock.mock.calls[0][0].deletedAt).toBeInstanceOf(Date);
    });

    it("returns null when board does not exist", async () => {
      const setMock = vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([]),
        }),
      });
      mockDb.update.mockReturnValue({ set: setMock });

      const result = await softDeleteBoard(mockDb as any, "nonexistent");
      expect(result).toBeNull();
    });
  });

  describe("restoreBoard", () => {
    it("nulls deletedAt and returns the restored board", async () => {
      const mockBoard = {
        id: "board-1",
        title: "Test",
        ownerId: "user-1",
        deletedAt: null,
      };
      const setMock = vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockBoard]),
        }),
      });
      mockDb.update.mockReturnValue({ set: setMock });

      const result = await restoreBoard(mockDb as any, "board-1");

      expect(result).toEqual(mockBoard);
      expect(setMock.mock.calls[0][0]).toHaveProperty("deletedAt", null);
    });

    it("returns null when board does not exist", async () => {
      const setMock = vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([]),
        }),
      });
      mockDb.update.mockReturnValue({ set: setMock });

      const result = await restoreBoard(mockDb as any, "nonexistent");
      expect(result).toBeNull();
    });
  });
});
