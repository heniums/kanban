"use client";

import { useState } from "react";
import { toast } from "sonner";
import { moveCardAction } from "@/lib/actions/cards";
import type { CardDetailData } from "./types";

export function useCardMove({
  data,
  lists,
  startTransition,
  router,
  close,
}: {
  data: CardDetailData | null;
  lists: { id: string; title: string }[];
  startTransition: (fn: () => void) => void;
  router: { refresh: () => void };
  close: () => void;
}) {
  const [moveOpen, setMoveOpen] = useState(false);

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

  return { moveOpen, setMoveOpen, handleMove };
}
