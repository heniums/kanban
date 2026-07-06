import { describe, it, expect, beforeEach, vi } from "vitest";
import { setSocketServer, emitToBoard } from "../events";

describe("events", () => {
  beforeEach(() => {
    // Reset globalThis.__io before each test
    (globalThis as Record<string, unknown>).__io = null;
  });

  describe("setSocketServer", () => {
    it("stores the Socket.io server instance on globalThis.__io", () => {
      const mockIo = {
        to: vi.fn().mockReturnThis(),
        emit: vi.fn(),
      } as unknown as import("socket.io").Server;

      setSocketServer(mockIo);

      expect((globalThis as Record<string, unknown>).__io).toBe(mockIo);
    });
  });

  describe("emitToBoard", () => {
    it("emits to the correct board room when globalThis.__io is set", () => {
      const mockEmit = vi.fn();
      const mockTo = vi.fn().mockReturnValue({ emit: mockEmit });
      const mockIo = {
        to: mockTo,
      } as unknown as import("socket.io").Server;

      setSocketServer(mockIo);

      const payload = { cardId: "test-card", boardId: "test-board" };
      emitToBoard("test-board", "card:updated", payload);

      expect(mockTo).toHaveBeenCalledWith("board:test-board");
      expect(mockEmit).toHaveBeenCalledWith("card:updated", payload);
    });

    it("does not throw when globalThis.__io is null", () => {
      expect(() => {
        emitToBoard("test-board", "card:updated", { test: "payload" });
      }).not.toThrow();
    });

    it("does not throw when globalThis.__io is undefined", () => {
      (globalThis as Record<string, unknown>).__io = undefined;

      expect(() => {
        emitToBoard("test-board", "card:updated", { test: "payload" });
      }).not.toThrow();
    });
  });
});
