import type { Server as IOServer } from "socket.io";

export { REALTIME_EVENTS } from "@/lib/realtime/types";

let io: IOServer | null = null;

export function setSocketServer(server: IOServer): void {
  io = server;
}

export function emitToBoard(boardId: string, event: string, payload: unknown): void {
  if (io) {
    io.to(`board:${boardId}`).emit(event, payload);
  }
}
