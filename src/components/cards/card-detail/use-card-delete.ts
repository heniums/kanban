"use client";

import { useState, type useTransition } from "react";
import { useRouter } from "next/navigation";
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
  startTransition: ReturnType<typeof useTransition>[1];
  router: ReturnType<typeof useRouter>;
  close: () => void;
}) {
  const [deleteOpen, setDeleteOpen] = useState(false);

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

  return { deleteOpen, setDeleteOpen, handleDelete };
}
