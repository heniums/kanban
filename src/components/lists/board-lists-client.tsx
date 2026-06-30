"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { List } from "@/lib/db/schema/lists";
import { BoardLists } from "@/components/lists/board-lists";
import {
  createListAction,
  renameListAction,
  deleteListAction,
  reorderListsAction,
} from "@/lib/actions/lists";

interface BoardListsClientProps {
  boardId: string;
  initialLists: List[];
}

export function BoardListsClient({ boardId, initialLists }: BoardListsClientProps) {
  const router = useRouter();

  const handleAdd = async (title: string) => {
    const result = await createListAction({ boardId, title });
    if ("errors" in result) {
      toast.error(result.errors.map((e) => e.message).join(", "));
      return;
    }
    router.refresh();
  };

  const handleRename = async (listId: string, title: string) => {
    const result = await renameListAction({ listId, title });
    if ("errors" in result) {
      toast.error(result.errors.map((e) => e.message).join(", "));
      return;
    }
    router.refresh();
  };

  const handleDelete = async (listId: string) => {
    const result = await deleteListAction({ listId });
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    router.refresh();
  };

  const handleReorder = async (orderedListIds: string[]) => {
    const result = await reorderListsAction({ boardId, orderedListIds });
    if ("errors" in result) {
      toast.error(result.errors.map((e) => e.message).join(", "));
      throw new Error("reorder failed");
    }
    router.refresh();
  };

  return (
    <BoardLists
      lists={initialLists}
      onAdd={handleAdd}
      onRename={handleRename}
      onDelete={handleDelete}
      onReorder={handleReorder}
    />
  );
}
