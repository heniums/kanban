"use client";

import { create } from "zustand";
import type { CardSummary } from "@/components/cards/card-item";

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
  openCard: (cardId: string) => void;
  clearCardToOpen: () => void;
}

export const useBoardCardStore = create<BoardCardState>((set) => ({
  boardId: null,
  cardsByList: {},
  lists: [],
  cardsNeedingChecklistRefresh: new Set(),
  cardsNeedingCommentsRefresh: new Set(),
  labelUpdatedEvent: null,
  labelDeletedEvent: null,
  cardToOpen: null,
  setInitial: (boardId, lists, cards) =>
    set(() => {
      const cardsByList: Record<string, RealtimeCard[]> = {};
      for (const l of lists) cardsByList[l.id] = [];
      for (const c of cards) {
        if (!cardsByList[c.listId]) cardsByList[c.listId] = [];
        cardsByList[c.listId].push(c);
      }
      for (const listId of Object.keys(cardsByList)) {
        cardsByList[listId].sort((a, b) => a.position - b.position);
      }
      return { boardId, cardsByList, lists };
    }),
  addCard: (card) =>
    set((s) => {
      const list = { ...s.cardsByList };
      if (!list[card.listId]) list[card.listId] = [];
      if (list[card.listId].some((c) => c.id === card.id)) return s;
      list[card.listId] = [...list[card.listId], card].sort((a, b) => a.position - b.position);
      return { cardsByList: list };
    }),
  updateCard: (card) =>
    set((s) => {
      const list = { ...s.cardsByList };
      for (const listId of Object.keys(list)) {
        const idx = list[listId].findIndex((c) => c.id === card.id);
        if (idx >= 0) {
          const existingCard = list[listId][idx];
          const next = [...list[listId]];
          next[idx] = {
            ...existingCard,
            ...card,
            labels: card.labels ?? existingCard.labels,
            assignees: card.assignees ?? existingCard.assignees,
            checklistProgress: card.checklistProgress ?? existingCard.checklistProgress,
            commentCount: card.commentCount ?? existingCard.commentCount,
          } as RealtimeCard;
          list[listId] = next.sort((a, b) => a.position - b.position);
          return { cardsByList: list };
        }
      }
      return s;
    }),
  deleteCard: (cardId, listId) =>
    set((s) => {
      const list = { ...s.cardsByList };
      if (list[listId]) {
        list[listId] = list[listId].filter((c) => c.id !== cardId);
      }
      return { cardsByList: list };
    }),
  moveCard: (cardId, targetListId, targetPosition) =>
    set((s) => {
      const list = { ...s.cardsByList };
      let movedCard: RealtimeCard | null = null;
      let sourceListId: string | null = null;
      for (const lid of Object.keys(list)) {
        const idx = list[lid].findIndex((c) => c.id === cardId);
        if (idx >= 0) {
          movedCard = { ...list[lid][idx], listId: targetListId, position: targetPosition };
          sourceListId = lid;
          list[lid] = list[lid].filter((c) => c.id !== cardId);
          break;
        }
      }
      if (!movedCard || !sourceListId) return s;
      if (!list[targetListId]) list[targetListId] = [];
      const arr = [...list[targetListId]];
      arr.splice(targetPosition, 0, movedCard);
      arr.forEach((c, i) => (c.position = i));
      list[targetListId] = arr;
      for (const lid of Object.keys(list)) {
        list[lid].forEach((c, i) => (c.position = i));
      }
      return { cardsByList: list };
    }),
  reorderLists: (orderedListIds) =>
    set((s) => {
      const listMap = new Map(s.lists.map((l) => [l.id, l]));
      const next = orderedListIds
        .filter((id) => listMap.has(id))
        .map((id, index) => ({ ...listMap.get(id)!, position: index }));
      return { lists: next };
    }),
  setLists: (lists) => set(() => ({ lists })),
  markChecklistRefresh: (cardId) =>
    set((s) => {
      const next = new Set(s.cardsNeedingChecklistRefresh);
      next.add(cardId);
      return { cardsNeedingChecklistRefresh: next };
    }),
  clearChecklistRefresh: (cardId) =>
    set((s) => {
      const next = new Set(s.cardsNeedingChecklistRefresh);
      next.delete(cardId);
      return { cardsNeedingChecklistRefresh: next };
    }),
  markCommentsRefresh: (cardId) =>
    set((s) => {
      const next = new Set(s.cardsNeedingCommentsRefresh);
      next.add(cardId);
      return { cardsNeedingCommentsRefresh: next };
    }),
  clearCommentsRefresh: (cardId) =>
    set((s) => {
      const next = new Set(s.cardsNeedingCommentsRefresh);
      next.delete(cardId);
      return { cardsNeedingCommentsRefresh: next };
    }),
  setLabelUpdatedEvent: (label) => set(() => ({ labelUpdatedEvent: { label } })),
  setLabelDeletedEvent: (labelId) => set(() => ({ labelDeletedEvent: { labelId } })),
  clearLabelEvents: () =>
    set(() => ({
      labelUpdatedEvent: null,
      labelDeletedEvent: null,
    })),
  openCard: (cardId) => set(() => ({ cardToOpen: cardId })),
  clearCardToOpen: () => set(() => ({ cardToOpen: null })),
}));
