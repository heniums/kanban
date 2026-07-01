import type { Server as IOServer } from "socket.io";
import { REALTIME_EVENTS } from "@/lib/realtime/types";

export { REALTIME_EVENTS } from "@/lib/realtime/types";
export type {
  CardCreatedPayload,
  CardUpdatedPayload,
  CardDeletedPayload,
  CardMovedPayload,
  ChecklistUpdatedPayload,
  CommentCreatedPayload,
  CommentUpdatedPayload,
  CommentDeletedPayload,
} from "@/lib/realtime/types";
export { REALTIME_JOIN_BOARD, REALTIME_LEAVE_BOARD } from "@/lib/realtime/types";

let io: IOServer | null = null;

export function setSocketServer(server: IOServer): void {
  io = server;
}

export function getSocketServer(): IOServer | null {
  return io;
}

export function emitToBoard(boardId: string, event: string, payload: unknown): void {
  if (io) {
    io.to(`board:${boardId}`).emit(event, payload);
  }
}

void REALTIME_EVENTS;
