"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createListAction, deleteListAction, renameListAction } from "@/lib/actions/lists";

export function useListActions({ boardId }: { boardId: string }) {
  const router = useRouter();

  const handleAddList = useCallback(
    async (title: string) => {
      const result = await createListAction({ boardId, title });
      if ("errors" in result) {
        toast.error(result.errors.map((e) => e.message).join(", "));
        return;
      }
      router.refresh();
    },
    [boardId, router],
  );

  const handleRenameList = useCallback(
    async (listId: string, title: string) => {
      const result = await renameListAction({ listId, title });
      if ("errors" in result) {
        toast.error(result.errors.map((e) => e.message).join(", "));
        return;
      }
      router.refresh();
    },
    [router],
  );

  const handleDeleteList = useCallback(
    async (listId: string) => {
      const result = await deleteListAction({ listId });
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      router.refresh();
    },
    [router],
  );

  return { handleAddList, handleRenameList, handleDeleteList };
}
