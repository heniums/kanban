"use client";

import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { enableMapSet } from "immer";
import type { CardSummary } from "@/components/cards/card-item";

enableMapSet();

type RealtimeCard = CardSummary;

interface BoardCardState {
  boardId: string | null;
  cardsByList: Record<string, RealtimeCard[]>;
  lists: { id: string; title: string; position: number }[];
  cardsNeedingChecklistRefresh: Set<string>;
  cardsNeedingCommentsRefresh: Set<string>;
  labelUpdatedEvent: { label: { id: string; name: string; color: string } } | null;
  labelDeletedEvent: { labelId: string } | null;
  cardToOpen: string | null;
  attachmentsNeedingRefresh: Set<string>;
  setInitial: (boardId: string, lists: BoardCardState["lists"], cards: RealtimeCard[]) => void;
  addCard: (card: RealtimeCard) => void;
  updateCard: (card: RealtimeCard) => void;
  deleteCard: (cardId: string, listId: string) => void;
  moveCard: (cardId: string, targetListId: string, targetPosition: number) => void;
  reorderLists: (orderedListIds: string[]) => void;
  setLists: (lists: BoardCardState["lists"]) => void;
  markChecklistRefresh: (cardId: string) => void;
  clearChecklistRefresh: (cardId: string) => void;
  markCommentsRefresh: (cardId: string) => void;
  clearCommentsRefresh: (cardId: string) => void;
  setLabelUpdatedEvent: (label: { id: string; name: string; color: string }) => void;
  setLabelDeletedEvent: (labelId: string) => void;
  clearLabelEvents: () => void;
  markAttachmentRefresh: (cardId: string) => void;
  clearAttachmentRefresh: (cardId: string) => void;
  setCardAttachmentPreview: (cardId: string, url: string) => void;
  clearCardAttachmentPreview: (cardId: string) => void;
  openCard: (cardId: string) => void;
  clearCardToOpen: () => void;
}

export const useBoardCardStore = create<BoardCardState>()(
  immer((set) => ({
    boardId: null,
    cardsByList: {},
    lists: [],
    cardsNeedingChecklistRefresh: new Set(),
    cardsNeedingCommentsRefresh: new Set(),
    attachmentsNeedingRefresh: new Set(),
    labelUpdatedEvent: null,
    labelDeletedEvent: null,
    cardToOpen: null,

    setInitial: (boardId, lists, cards) =>
      set((draft) => {
        draft.boardId = boardId;
        draft.lists = lists;
        draft.cardsByList = {};
        for (const l of lists) draft.cardsByList[l.id] = [];
        for (const c of cards) {
          if (!draft.cardsByList[c.listId]) draft.cardsByList[c.listId] = [];
          draft.cardsByList[c.listId].push(c);
        }
        for (const list of Object.values(draft.cardsByList)) {
          list.sort((a, b) => a.position - b.position);
        }
      }),

    addCard: (card) =>
      set((draft) => {
        if (!draft.cardsByList[card.listId]) {
          draft.cardsByList[card.listId] = [];
        }
        if (draft.cardsByList[card.listId].some((c) => c.id === card.id)) return;
        draft.cardsByList[card.listId].push(card);
        draft.cardsByList[card.listId].sort((a, b) => a.position - b.position);
      }),

    updateCard: (card) =>
      set((draft) => {
        for (const list of Object.values(draft.cardsByList)) {
          const idx = list.findIndex((c) => c.id === card.id);
          if (idx >= 0) {
            list[idx] = {
              ...list[idx],
              ...card,
              labels: card.labels ?? list[idx].labels,
              assignees: card.assignees ?? list[idx].assignees,
              checklistProgress: card.checklistProgress ?? list[idx].checklistProgress,
              commentCount: card.commentCount ?? list[idx].commentCount,
            } as RealtimeCard;
            list.sort((a, b) => a.position - b.position);
            return;
          }
        }
      }),

    deleteCard: (cardId, listId) =>
      set((draft) => {
        if (draft.cardsByList[listId]) {
          draft.cardsByList[listId] = draft.cardsByList[listId].filter((c) => c.id !== cardId);
        }
      }),

    moveCard: (cardId, targetListId, targetPosition) =>
      set((draft) => {
        let movedCard: RealtimeCard | null = null;

        for (const list of Object.values(draft.cardsByList)) {
          const idx = list.findIndex((c) => c.id === cardId);
          if (idx >= 0) {
            movedCard = { ...list[idx], listId: targetListId, position: targetPosition };
            list.splice(idx, 1);
            break;
          }
        }

        if (!movedCard) return;

        if (!draft.cardsByList[targetListId]) {
          draft.cardsByList[targetListId] = [];
        }

        draft.cardsByList[targetListId].splice(targetPosition, 0, movedCard);

        for (const list of Object.values(draft.cardsByList)) {
          list.forEach((c, i) => {
            c.position = i;
          });
        }
      }),

    reorderLists: (orderedListIds) =>
      set((draft) => {
        const listMap = new Map(draft.lists.map((l) => [l.id, l]));
        draft.lists = orderedListIds
          .filter((id) => listMap.has(id))
          .map((id, index) => ({ ...listMap.get(id)!, position: index }));
      }),

    setLists: (lists) => set({ lists }),

    markChecklistRefresh: (cardId) =>
      set((draft) => {
        draft.cardsNeedingChecklistRefresh.add(cardId);
      }),

    clearChecklistRefresh: (cardId) =>
      set((draft) => {
        draft.cardsNeedingChecklistRefresh.delete(cardId);
      }),

    markCommentsRefresh: (cardId) =>
      set((draft) => {
        draft.cardsNeedingCommentsRefresh.add(cardId);
      }),

    clearCommentsRefresh: (cardId) =>
      set((draft) => {
        draft.cardsNeedingCommentsRefresh.delete(cardId);
      }),

    setLabelUpdatedEvent: (label) => set({ labelUpdatedEvent: { label } }),
    setLabelDeletedEvent: (labelId) => set({ labelDeletedEvent: { labelId } }),
    clearLabelEvents: () => set({ labelUpdatedEvent: null, labelDeletedEvent: null }),
    markAttachmentRefresh: (cardId) =>
      set((draft) => {
        draft.attachmentsNeedingRefresh.add(cardId);
      }),
    clearAttachmentRefresh: (cardId) =>
      set((draft) => {
        draft.attachmentsNeedingRefresh.delete(cardId);
      }),
    setCardAttachmentPreview: (cardId, url) =>
      set((draft) => {
        for (const list of Object.values(draft.cardsByList)) {
          const card = list.find((c) => c.id === cardId);
          if (card && !card.attachmentPreviewUrl) {
            card.attachmentPreviewUrl = url;
            return;
          }
        }
      }),
    clearCardAttachmentPreview: (cardId) =>
      set((draft) => {
        for (const list of Object.values(draft.cardsByList)) {
          const card = list.find((c) => c.id === cardId);
          if (card) {
            card.attachmentPreviewUrl = null;
            return;
          }
        }
      }),
    openCard: (cardId) => set({ cardToOpen: cardId }),
    clearCardToOpen: () => set({ cardToOpen: null }),
  })),
);
