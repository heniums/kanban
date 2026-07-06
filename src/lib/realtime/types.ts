import type { CardSummary } from "@/components/cards/card-item";

export type CardCreatedPayload = { card: CardSummary };
export type CardUpdatedPayload = { card: CardSummary };
export type CardDeletedPayload = { cardId: string; listId: string; boardId: string };
export type CardMovedPayload = {
  cardId: string;
  sourceListId: string;
  targetListId: string;
  targetPosition: number;
  boardId: string;
};
export type ChecklistUpdatedPayload = {
  cardId: string;
  boardId: string;
};
export type CommentCreatedPayload = {
  cardId: string;
  boardId: string;
};
export type CommentUpdatedPayload = {
  cardId: string;
  boardId: string;
};
export type CommentDeletedPayload = {
  cardId: string;
  boardId: string;
};
export type ListsReorderedPayload = {
  boardId: string;
  orderedListIds: string[];
};
export type LabelUpdatedPayload = {
  boardId: string;
  label: { id: string; name: string; color: string };
};
export type LabelDeletedPayload = {
  boardId: string;
  labelId: string;
};

export const REALTIME_EVENTS = {
  CARD_CREATED: "card:created",
  CARD_UPDATED: "card:updated",
  CARD_DELETED: "card:deleted",
  CARD_MOVED: "card:moved",
  CHECKLIST_UPDATED: "checklist:updated",
  COMMENT_CREATED: "comment:created",
  COMMENT_UPDATED: "comment:updated",
  COMMENT_DELETED: "comment:deleted",
  LIST_REORDERED: "list:reordered",
  LABEL_UPDATED: "label:updated",
  LABEL_DELETED: "label:deleted",
} as const;

export const REALTIME_JOIN_BOARD = "board:join" as const;
export const REALTIME_LEAVE_BOARD = "board:leave" as const;
