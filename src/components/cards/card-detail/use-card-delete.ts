"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { deleteCardAction } from "@/lib/actions/cards";
import type { CardDetailData } from "./types";

export function useCardDelete({
  data,
  startTransition,
  router,
  close,
}: {
  data: CardDetailData | null;
  startTransition: (fn: () => void) => void;
  router: { refresh: () => void };
  close: () => void;
}) {
  const [deleteOpen, setDeleteOpen] = useState(false);

  const handleDelete = useCallback(() => {
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
  }, [data, startTransition, router, close]);

  return { deleteOpen, setDeleteOpen, handleDelete };
}
