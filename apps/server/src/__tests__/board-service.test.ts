import { describe, expect, it, vi, beforeEach } from "vitest";
import { boards } from "../schema/boards.js";
import { createBoardService } from "../services/board-service.js";

function createMockDb() {
  return {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
  };
}

describe("Board Service", () => {
  let mockDb: ReturnType<typeof createMockDb>;

  beforeEach(() => {
    mockDb = createMockDb();
  });

  describe("create", () => {
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
      mockDb.insert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockBoard]),
        }),
      });

      const service = createBoardService(mockDb as any);
      const result = await service.create({
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

      const service = createBoardService(mockDb as any);
      await service.create({
        title: "Test",
        description: "A desc",
        background: "#1a1a2e",
        ownerId: "user-1",
      });

      expect(valuesMock.mock.calls[0][0]).toMatchObject({ description: "A desc" });
    });
  });

  describe("getById", () => {
    it("returns the board when it belongs to the owner and is not deleted", async () => {
      const mockBoard = { id: "board-1", title: "Test", ownerId: "user-1" };
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([mockBoard]),
        }),
      });

      const service = createBoardService(mockDb as any);
      const result = await service.getById("board-1", "user-1");

      expect(result).toEqual(mockBoard);
    });

    it("returns null when the board does not exist", async () => {
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      });

      const service = createBoardService(mockDb as any);
      const result = await service.getById("nonexistent", "user-1");

      expect(result).toBeNull();
    });

    it("returns null when the board belongs to a different owner", async () => {
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      });

      const service = createBoardService(mockDb as any);
      const result = await service.getById("board-1", "wrong-user");

      expect(result).toBeNull();
    });
  });

  describe("listOwned", () => {
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

      const service = createBoardService(mockDb as any);
      const result = await service.listOwned("user-1");

      expect(result).toEqual(mockBoards);
      expect(result).toHaveLength(2);
    });

    it("returns empty array when user owns no boards", async () => {
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      });

      const service = createBoardService(mockDb as any);
      const result = await service.listOwned("user-1");

      expect(result).toEqual([]);
    });
  });

  describe("listShared", () => {
    it("returns an empty array (stub for future sharing track)", async () => {
      const service = createBoardService(mockDb as any);
      const result = await service.listShared("user-1");

      expect(result).toEqual([]);
      expect(mockDb.select).not.toHaveBeenCalled();
    });
  });

  describe("update", () => {
    it("updates board metadata and returns the updated board", async () => {
      const mockBoard = { id: "board-1", title: "Updated", ownerId: "user-1" };
      const setMock = vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockBoard]),
        }),
      });
      mockDb.update.mockReturnValue({ set: setMock });

      const service = createBoardService(mockDb as any);
      const result = await service.update("board-1", "user-1", {
        title: "Updated",
      });

      expect(result).toEqual(mockBoard);
      expect(mockDb.update).toHaveBeenCalledWith(boards);
      expect(setMock.mock.calls[0][0]).toMatchObject({ title: "Updated" });
    });

    it("returns null when board does not exist or not owned by user", async () => {
      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      const service = createBoardService(mockDb as any);
      const result = await service.update("board-1", "wrong-user", {
        title: "Updated",
      });

      expect(result).toBeNull();
    });
  });

  describe("softDelete", () => {
    it("sets deletedAt and returns the deleted board", async () => {
      const mockBoard = { id: "board-1", title: "Test", ownerId: "user-1", deletedAt: new Date() };
      const setMock = vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockBoard]),
        }),
      });
      mockDb.update.mockReturnValue({ set: setMock });

      const service = createBoardService(mockDb as any);
      const result = await service.softDelete("board-1", "user-1");

      expect(result).toEqual(mockBoard);
      expect(setMock.mock.calls[0][0]).toHaveProperty("deletedAt");
      expect(setMock.mock.calls[0][0].deletedAt).toBeInstanceOf(Date);
    });

    it("returns null when board does not exist or not owned by user", async () => {
      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      const service = createBoardService(mockDb as any);
      const result = await service.softDelete("board-1", "wrong-user");

      expect(result).toBeNull();
    });
  });

  describe("restore", () => {
    it("nulls deletedAt and returns the restored board", async () => {
      const mockBoard = { id: "board-1", title: "Test", ownerId: "user-1", deletedAt: null };
      const setMock = vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockBoard]),
        }),
      });
      mockDb.update.mockReturnValue({ set: setMock });

      const service = createBoardService(mockDb as any);
      const result = await service.restore("board-1", "user-1");

      expect(result).toEqual(mockBoard);
      expect(setMock.mock.calls[0][0]).toHaveProperty("deletedAt", null);
    });

    it("returns null when board does not exist or not owned by user", async () => {
      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      const service = createBoardService(mockDb as any);
      const result = await service.restore("board-1", "wrong-user");

      expect(result).toBeNull();
    });
  });
});
