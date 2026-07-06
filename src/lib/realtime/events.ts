import type { Server as IOServer } from "socket.io";

export { REALTIME_EVENTS } from "@/lib/realtime/types";

declare global {
  var __io: IOServer | null;
}

export function setSocketServer(server: IOServer): void {
  globalThis.__io = server;
}

export function emitToBoard(boardId: string, event: string, payload: unknown): void {
  if (globalThis.__io) {
    globalThis.__io.to(`board:${boardId}`).emit(event, payload);
  }
}
