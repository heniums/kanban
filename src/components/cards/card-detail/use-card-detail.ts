"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Label } from "@/lib/db/schema/labels";
import {
  copyCardAction,
  deleteCardAction,
  moveCardAction,
  updateCardAction,
} from "@/lib/actions/cards";
import { createLabelAction } from "@/lib/actions/labels";
import type { CardDetailData } from "./types";

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
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [newlyCreatedLabelIds, setNewlyCreatedLabelIds] = useState<string[]>([]);
  const [moveOpen, setMoveOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    function onOpen(e: Event) {
      const detail = (e as CustomEvent<{ cardId: string }>).detail;
      void loadCard(detail.cardId);
    }
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
    window.addEventListener("card:open", onOpen as EventListener);
    return () => window.removeEventListener("card:open", onOpen as EventListener);
  }, []);

  const dataRef = useRef<CardDetailData | null>(null);
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  async function refreshChecklists(cardId: string) {
    try {
      const res = await fetch(`/api/cards/${cardId}`);
      if (!res.ok) return;
      const body = (await res.json()) as CardDetailData;
      setData((prev) => (prev ? { ...prev, checklists: body.checklists } : prev));
    } catch {
      // ignore
    }
  }

  async function refreshComments(cardId: string) {
    try {
      const res = await fetch(`/api/cards/${cardId}`);
      if (!res.ok) return;
      const body = (await res.json()) as CardDetailData;
      setData((prev) => (prev ? { ...prev, comments: body.comments } : prev));
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    function onChecklistUpdate() {
      const d = dataRef.current;
      if (!d) return;
      void refreshChecklists(d.card.id);
    }
    function onCommentUpdate() {
      const d = dataRef.current;
      if (!d) return;
      void refreshComments(d.card.id);
    }
    window.addEventListener("board:checklist-updated", onChecklistUpdate);
    window.addEventListener("board:comment-updated", onCommentUpdate);
    return () => {
      window.removeEventListener("board:checklist-updated", onChecklistUpdate);
      window.removeEventListener("board:comment-updated", onCommentUpdate);
    };
  }, []);

  const close = () => {
    setOpen(false);
    setData(null);
    setDraft(null);
    setNewlyCreatedLabelIds([]);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("card");
      window.history.pushState({}, "", url);
    }
  };

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
      toast.success("Card saved");
      router.refresh();
      close();
    });
  };

  const handleCreateLabel = async (name: string, color: string) => {
    const result = await createLabelAction({ boardId, name, color });
    if ("errors" in result) {
      toast.error(result.errors.map((e) => e.message).join(", "));
      return null;
    }
    if (result.data) {
      const newLabel = result.data as Label;
      setData((prev) => (prev ? { ...prev, boardLabels: [...prev.boardLabels, newLabel] } : prev));
      setNewlyCreatedLabelIds((prev) => [...prev, newLabel.id]);
      setDraft((prev) => (prev ? { ...prev, labelIds: [...prev.labelIds, newLabel.id] } : prev));
    }
    return result.data;
  };

  const handleDelete = () => {
    if (!data) return;
    startTransition(async () => {
      const result = await deleteCardAction({ cardId: data.card.id });
      if ("errors" in result) {
        toast.error(result.errors.map((e) => e.message).join(", "));
        return;
      }
      setDeleteOpen(false);
      close();
      router.refresh();
      toast.success("Card deleted");
    });
  };

  const handleMove = (targetListId: string) => {
    if (!data) return;
    if (targetListId === data.card.listId) {
      setMoveOpen(false);
      return;
    }
    startTransition(async () => {
      const targetList = lists.find((l) => l.id === targetListId);
      const result = await moveCardAction({
        cardId: data.card.id,
        targetListId,
        targetPosition: 0,
      });
      if ("errors" in result) {
        toast.error(result.errors.map((e) => e.message).join(", "));
        return;
      }
      toast.success(`Moved to "${targetList?.title ?? "list"}"`);
      setMoveOpen(false);
      router.refresh();
      close();
    });
  };

  const handleCopy = () => {
    if (!data) return;
    startTransition(async () => {
      const result = await copyCardAction({ cardId: data.card.id });
      if ("errors" in result) {
        toast.error(result.errors.map((e) => e.message).join(", "));
        return;
      }
      toast.success("Card copied");
      router.refresh();
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
    handleDelete,
    handleMove,
    handleCopy,
  };
}
