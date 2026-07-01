"use client";

import { create } from "zustand";
import type { Card } from "@/lib/db/schema/cards";

type RealtimeCard = Card;

interface BoardCardState {
  boardId: string | null;
  cardsByList: Record<string, RealtimeCard[]>;
  lists: { id: string; title: string; position: number }[];
  setInitial: (boardId: string, lists: BoardCardState["lists"], cards: RealtimeCard[]) => void;
  addCard: (card: RealtimeCard) => void;
  updateCard: (card: RealtimeCard) => void;
  deleteCard: (cardId: string, listId: string) => void;
  moveCard: (cardId: string, targetListId: string, targetPosition: number) => void;
  reorderLists: (orderedListIds: string[]) => void;
}

export const useBoardCardStore = create<BoardCardState>((set) => ({
  boardId: null,
  cardsByList: {},
  lists: [],
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
          const next = [...list[listId]];
          next[idx] = card;
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
      for (const listId of Object.keys(list)) {
        const idx = list[listId].findIndex((c) => c.id === cardId);
        if (idx >= 0) {
          movedCard = { ...list[listId][idx], listId: targetListId, position: targetPosition };
          list[listId] = list[listId].filter((c) => c.id !== cardId);
          break;
        }
      }
      if (!movedCard) return s;
      if (!list[targetListId]) list[targetListId] = [];
      const arr = [...list[targetListId]];
      arr.splice(targetPosition, 0, movedCard);
      arr.forEach((c, i) => (c.position = i));
      list[targetListId] = arr;
      for (const listId of Object.keys(list)) {
        list[listId].forEach((c, i) => (c.position = i));
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
}));
