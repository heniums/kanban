"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateCardAction } from "@/lib/actions/cards";
import { useBoardCardStore } from "@/lib/realtime/board-store";
import type { CardDetailData } from "./types";
import { useCardLabels } from "./use-card-labels";
import { useCardMove } from "./use-card-move";
import { useCardDelete } from "./use-card-delete";
import { useCardCopy } from "./use-card-copy";
import {
  mergeCardUpdate,
  mergeLabelDeletion,
  mergeLabelUpdate,
  mergeRefreshedSections,
} from "./merge-card-detail";

export interface DraftState {
  title: string;
  description: string;
  dueDate: Date | null;
  labelIds: string[];
  assigneeIds: string[];
}

export function useCardDetail({
  boardId,
  lists,
}: {
  boardId: string;
  lists: { id: string; title: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<CardDetailData | null>(null);
  const [draft, setDraft] = useState<DraftState | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const {
    newlyCreatedLabelIds,
    setNewlyCreatedLabelIds,
    handleCreateLabel,
    handleUpdateLabel,
    handleDeleteLabel,
  } = useCardLabels({ boardId, setData, setDraft });

  const close = useCallback(() => {
    setOpen(false);
    setData(null);
    setDraft(null);
    setNewlyCreatedLabelIds([]);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("card");
      window.history.pushState({}, "", url);
    }
  }, [setNewlyCreatedLabelIds]);

  const { moveOpen, setMoveOpen, handleMove } = useCardMove({
    data,
    lists,
    startTransition,
    router,
    close,
  });

  const { deleteOpen, setDeleteOpen, handleDelete } = useCardDelete({
    data,
    startTransition,
    router,
    close,
  });

  const { handleCopy } = useCardCopy({ data, startTransition, router });

  useEffect(() => {
    async function loadCard(cardId: string) {
      try {
        const res = await fetch(`/api/cards/${cardId}`);
        if (!res.ok) {
          toast.error("Failed to load card");
          return;
        }
        const body = (await res.json()) as CardDetailData;
        setData(body);
        setDraft({
          title: body.card.title,
          description: body.card.description ?? "",
          dueDate: body.card.dueDate ? new Date(body.card.dueDate) : null,
          labelIds: body.labels.map((l) => l.id),
          assigneeIds: body.assignees.map((a) => a.id),
        });
        setNewlyCreatedLabelIds([]);
        setOpen(true);
      } catch {
        toast.error("Failed to load card");
      }
    }

    const unsubscribe = useBoardCardStore.subscribe((state, prevState) => {
      if (state.cardToOpen && state.cardToOpen !== prevState.cardToOpen) {
        void loadCard(state.cardToOpen);
        useBoardCardStore.getState().clearCardToOpen();
      }
    });

    return () => {
      unsubscribe();
    };
  }, [setNewlyCreatedLabelIds]);

  const dataRef = useRef<CardDetailData | null>(null);
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  async function refreshCardDetail(cardId: string) {
    try {
      const res = await fetch(`/api/cards/${cardId}`);
      if (!res.ok) return;
      const body = (await res.json()) as CardDetailData;
      setData((prev) => (prev ? mergeRefreshedSections(prev, body) : prev));
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    const unsubscribe = useBoardCardStore.subscribe((state, prevState) => {
      const d = dataRef.current;
      if (!d) return;

      const cardId = d.card.id;

      const needsChecklistRefresh =
        state.cardsNeedingChecklistRefresh.has(cardId) &&
        !prevState.cardsNeedingChecklistRefresh.has(cardId);
      const needsCommentsRefresh =
        state.cardsNeedingCommentsRefresh.has(cardId) &&
        !prevState.cardsNeedingCommentsRefresh.has(cardId);
      const needsAttachmentRefresh =
        state.attachmentsNeedingRefresh.has(cardId) &&
        !prevState.attachmentsNeedingRefresh.has(cardId);

      if (needsChecklistRefresh || needsCommentsRefresh || needsAttachmentRefresh) {
        void refreshCardDetail(cardId);
        useBoardCardStore.getState().clearChecklistRefresh(cardId);
        useBoardCardStore.getState().clearCommentsRefresh(cardId);
        useBoardCardStore.getState().clearAttachmentRefresh(cardId);
      }

      const updatedCard = state.cardsByList[d.card.listId]?.find((c) => c.id === cardId);
      const prevCard = prevState.cardsByList[d.card.listId]?.find((c) => c.id === cardId);
      if (updatedCard && updatedCard !== prevCard) {
        setData((prev) => (prev ? mergeCardUpdate(prev, updatedCard) : prev));
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    const unsubscribe = useBoardCardStore.subscribe((state, prevState) => {
      if (state.labelUpdatedEvent && state.labelUpdatedEvent !== prevState.labelUpdatedEvent) {
        const label = state.labelUpdatedEvent.label;
        setData((prev) => (prev ? mergeLabelUpdate(prev, label) : prev));
        useBoardCardStore.getState().clearLabelEvents();
      }

      if (state.labelDeletedEvent && state.labelDeletedEvent !== prevState.labelDeletedEvent) {
        const labelId = state.labelDeletedEvent.labelId;
        setData((prev) => (prev ? mergeLabelDeletion(prev, labelId) : prev));
        setDraft((prev) =>
          prev ? { ...prev, labelIds: prev.labelIds.filter((id) => id !== labelId) } : prev,
        );
        useBoardCardStore.getState().clearLabelEvents();
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const isDirty = useMemo(() => {
    if (!data || !draft) return false;
    const titleDirty = draft.title !== data.card.title;
    const descriptionDirty = draft.description !== (data.card.description ?? "");
    const dueDateDirty =
      String(draft.dueDate?.getTime() ?? "") !==
      String(data.card.dueDate ? new Date(data.card.dueDate).getTime() : "");
    const currentSet = new Set(draft.labelIds);
    const originalSet = new Set(data.labels.map((l) => l.id));
    const labelsDirty =
      currentSet.size !== originalSet.size || ![...currentSet].every((id) => originalSet.has(id));
    const assigneeSet = new Set(draft.assigneeIds);
    const originalAssigneeSet = new Set(data.assignees.map((a) => a.id));
    const assigneesDirty =
      assigneeSet.size !== originalAssigneeSet.size ||
      ![...assigneeSet].every((id) => originalAssigneeSet.has(id));
    return titleDirty || descriptionDirty || dueDateDirty || labelsDirty || assigneesDirty;
  }, [data, draft]);

  const handleSave = () => {
    if (!data || !draft) return;
    startTransition(async () => {
      const result = await updateCardAction({
        cardId: data.card.id,
        title: draft.title.trim() || data.card.title,
        description: draft.description,
        dueDate: draft.dueDate,
        labelIds: draft.labelIds,
        assigneeIds: draft.assigneeIds,
      });
      if ("errors" in result) {
        toast.error(result.errors.map((e) => e.message).join(", "));
        return;
      }
      const existingCard = useBoardCardStore
        .getState()
        .cardsByList[data.card.listId]?.find((c) => c.id === data.card.id);
      const updatedCard = {
        ...data.card,
        title: draft.title.trim() || data.card.title,
        description: draft.description,
        dueDate: draft.dueDate,
        updatedAt: new Date(),
        labels: data.boardLabels
          .filter((l) => draft.labelIds.includes(l.id))
          .map((l) => ({ id: l.id, name: l.name, color: l.color })),
        assignees: data.boardMembers
          .filter((m) => draft.assigneeIds.includes(m.id))
          .map((m) => ({ id: m.id, name: m.name })),
        checklistProgress:
          (existingCard as { checklistProgress?: { total: number; completed: number } | null })
            ?.checklistProgress ?? null,
        commentCount: (existingCard as { commentCount?: number })?.commentCount ?? 0,
      };
      useBoardCardStore.getState().updateCard(updatedCard);
      toast.success("Card saved");
      router.refresh();
      close();
    });
  };

  return {
    open,
    setOpen,
    data,
    draft,
    isPending,
    deleteOpen,
    newlyCreatedLabelIds,
    moveOpen,
    isDirty,
    setData,
    setDraft,
    setDeleteOpen,
    setMoveOpen,
    close,
    handleSave,
    handleCreateLabel,
    handleUpdateLabel,
    handleDeleteLabel,
    handleDelete,
    handleMove,
    handleCopy,
  };
}
