import type { CardDetailData } from "./types";

interface RealtimeCard {
  id: string;
  title: string;
  description: string | null;
  dueDate: Date | null;
  updatedAt: Date;
  checklistProgress?: { total: number; completed: number } | null;
  commentCount?: number;
  labels?: { id: string; name: string; color: string }[];
}

export function mergeCardUpdate(prev: CardDetailData, updatedCard: RealtimeCard): CardDetailData {
  return {
    ...prev,
    card: {
      ...prev.card,
      title: updatedCard.title,
      description: updatedCard.description,
      dueDate: updatedCard.dueDate,
      updatedAt: updatedCard.updatedAt,
      checklistProgress:
        updatedCard.checklistProgress ??
        (prev.card as { checklistProgress?: { total: number; completed: number } | null })
          .checklistProgress,
      commentCount:
        updatedCard.commentCount ?? (prev.card as { commentCount?: number }).commentCount,
    } as CardDetailData["card"],
    labels: updatedCard.labels ?? prev.labels,
  };
}

export function mergeLabelUpdate(
  prev: CardDetailData,
  label: { id: string; name: string; color: string },
): CardDetailData {
  const mapLabel = <T extends { id: string; name: string; color: string }>(l: T) =>
    l.id === label.id ? { ...l, name: label.name, color: label.color } : l;

  return {
    ...prev,
    boardLabels: prev.boardLabels.map(mapLabel),
    labels: prev.labels.map(mapLabel),
  };
}

export function mergeLabelDeletion(prev: CardDetailData, labelId: string): CardDetailData {
  return {
    ...prev,
    boardLabels: prev.boardLabels.filter((l) => l.id !== labelId),
    labels: prev.labels.filter((l) => l.id !== labelId),
  };
}

export function mergeRefreshedSections(
  prev: CardDetailData,
  body: Pick<CardDetailData, "checklists" | "comments">,
): CardDetailData {
  return {
    ...prev,
    checklists: body.checklists,
    comments: body.comments,
  };
}
