"use client";

import { useEffect, useRef } from "react";
import { io, type Socket } from "socket.io-client";
import { useBoardCardStore } from "@/lib/realtime/board-store";
import {
  REALTIME_EVENTS,
  REALTIME_JOIN_BOARD,
  REALTIME_LEAVE_BOARD,
  type CardCreatedPayload,
  type CardUpdatedPayload,
  type CardDeletedPayload,
  type CardMovedPayload,
  type ChecklistUpdatedPayload,
  type CommentCreatedPayload,
  type CommentUpdatedPayload,
  type CommentDeletedPayload,
  type ListsReorderedPayload,
  type LabelUpdatedPayload,
  type LabelDeletedPayload,
} from "@/lib/realtime/types";

export function useBoardSocket(boardId: string | null) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!boardId) return;
    const socket = io({
      path: "/socket.io",
      transports: ["websocket", "polling"],
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit(REALTIME_JOIN_BOARD, boardId);
    });

    socket.on(REALTIME_EVENTS.CARD_CREATED, (payload: CardCreatedPayload) => {
      if (payload?.card?.boardId === boardId) {
        useBoardCardStore.getState().addCard(payload.card);
      }
    });
    socket.on(REALTIME_EVENTS.CARD_UPDATED, (payload: CardUpdatedPayload) => {
      if (payload?.card?.boardId === boardId) {
        useBoardCardStore.getState().updateCard(payload.card);
      }
    });
    socket.on(REALTIME_EVENTS.CARD_DELETED, (payload: CardDeletedPayload) => {
      if (payload?.boardId === boardId) {
        useBoardCardStore.getState().deleteCard(payload.cardId, payload.listId);
      }
    });
    socket.on(REALTIME_EVENTS.CARD_MOVED, (payload: CardMovedPayload) => {
      if (payload?.boardId === boardId) {
        useBoardCardStore
          .getState()
          .moveCard(payload.cardId, payload.targetListId, payload.targetPosition);
      }
    });
    socket.on(REALTIME_EVENTS.CHECKLIST_UPDATED, (payload: ChecklistUpdatedPayload) => {
      if (payload?.boardId === boardId) {
        useBoardCardStore.getState().markChecklistRefresh(payload.cardId);
      }
    });
    socket.on(REALTIME_EVENTS.COMMENT_CREATED, (payload: CommentCreatedPayload) => {
      if (payload?.boardId === boardId) {
        useBoardCardStore.getState().markCommentsRefresh(payload.cardId);
      }
    });
    socket.on(REALTIME_EVENTS.COMMENT_UPDATED, (payload: CommentUpdatedPayload) => {
      if (payload?.boardId === boardId) {
        useBoardCardStore.getState().markCommentsRefresh(payload.cardId);
      }
    });
    socket.on(REALTIME_EVENTS.COMMENT_DELETED, (payload: CommentDeletedPayload) => {
      if (payload?.boardId === boardId) {
        useBoardCardStore.getState().markCommentsRefresh(payload.cardId);
      }
    });
    socket.on(REALTIME_EVENTS.LIST_REORDERED, (payload: ListsReorderedPayload) => {
      if (payload?.boardId === boardId) {
        useBoardCardStore.getState().reorderLists(payload.orderedListIds);
      }
    });
    socket.on(REALTIME_EVENTS.LABEL_UPDATED, (payload: LabelUpdatedPayload) => {
      if (payload?.boardId === boardId) {
        useBoardCardStore.getState().setLabelUpdatedEvent(payload.label);
      }
    });
    socket.on(REALTIME_EVENTS.LABEL_DELETED, (payload: LabelDeletedPayload) => {
      if (payload?.boardId === boardId) {
        useBoardCardStore.getState().setLabelDeletedEvent(payload.labelId);
      }
    });

    return () => {
      socket.emit(REALTIME_LEAVE_BOARD, boardId);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [boardId]);

  return socketRef;
}
