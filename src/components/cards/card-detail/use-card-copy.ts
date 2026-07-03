"use client";

import { type useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { copyCardAction } from "@/lib/actions/cards";
import type { CardDetailData } from "./types";

export function useCardCopy({
  data,
  startTransition,
  router,
}: {
  data: CardDetailData | null;
  startTransition: ReturnType<typeof useTransition>[1];
  router: ReturnType<typeof useRouter>;
}) {
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

  return { handleCopy };
}
