"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { Label } from "@/lib/db/schema/labels";
import { createLabelAction, updateLabelAction, deleteLabelAction } from "@/lib/actions/labels";
import type { CardDetailData } from "./types";
import type { DraftState } from "./use-card-detail";

export function useCardLabels({
  boardId,
  setData,
  setDraft,
}: {
  boardId: string;
  setData: React.Dispatch<React.SetStateAction<CardDetailData | null>>;
  setDraft: React.Dispatch<React.SetStateAction<DraftState | null>>;
}) {
  const [newlyCreatedLabelIds, setNewlyCreatedLabelIds] = useState<string[]>([]);

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

  const handleUpdateLabel = async (labelId: string, name: string, color: string) => {
    const result = await updateLabelAction({ labelId, name, color });
    if ("errors" in result) {
      toast.error(result.errors.map((e) => e.message).join(", "));
      return false;
    }
    if (result.data) {
      const updated = result.data as Label;
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          boardLabels: prev.boardLabels.map((l) => (l.id === updated.id ? updated : l)),
          labels: prev.labels.map((l) => (l.id === updated.id ? updated : l)),
        };
      });
    }
    return true;
  };

  const handleDeleteLabel = async (labelId: string) => {
    const result = await deleteLabelAction({ labelId });
    if ("errors" in result) {
      toast.error(result.errors.map((e) => e.message).join(", "));
      return false;
    }
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        boardLabels: prev.boardLabels.filter((l) => l.id !== labelId),
        labels: prev.labels.filter((l) => l.id !== labelId),
      };
    });
    setDraft((prev) =>
      prev ? { ...prev, labelIds: prev.labelIds.filter((id) => id !== labelId) } : prev,
    );
    return true;
  };

  return {
    newlyCreatedLabelIds,
    setNewlyCreatedLabelIds,
    handleCreateLabel,
    handleUpdateLabel,
    handleDeleteLabel,
  };
}
