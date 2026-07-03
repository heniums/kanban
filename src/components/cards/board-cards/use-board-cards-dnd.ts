"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { moveCardAction, reorderCardsAction } from "@/lib/actions/cards";
import { reorderListsAction } from "@/lib/actions/lists";
import { useBoardCardStore } from "@/lib/realtime/board-store";
import type { CardSummary } from "@/components/cards/card-item";

export function useBoardCardsDnd({ boardId }: { boardId: string }) {
  const router = useRouter();
  const [activeCard, setActiveCard] = useState<CardSummary | null>(null);
  const [activeListId, setActiveListId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    const id = String(event.active.id);
    const state = useBoardCardStore.getState();
    if (state.lists.some((l) => l.id === id)) {
      setActiveListId(id);
      return;
    }
    for (const listId of Object.keys(state.cardsByList)) {
      const found = state.cardsByList[listId].find((c) => c.id === id);
      if (found) {
        setActiveCard(found);
        return;
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveCard(null);
    setActiveListId(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    const state = useBoardCardStore.getState();

    if (state.lists.some((l) => l.id === activeId)) {
      handleListReorder({ activeId, overId, state, boardId, router });
      return;
    }

    handleCardDrop({ activeId, overId, state, router });
  };

  return {
    sensors,
    activeCard,
    activeListId,
    handleDragStart,
    handleDragEnd,
  };
}

function handleListReorder({
  activeId,
  overId,
  state,
  boardId,
  router,
}: {
  activeId: string;
  overId: string;
  state: ReturnType<typeof useBoardCardStore.getState>;
  boardId: string;
  router: ReturnType<typeof useRouter>;
}) {
  if (activeId === overId) return;
  const oldIndex = state.lists.findIndex((l) => l.id === activeId);
  if (oldIndex < 0) return;
  let newIndex: number;
  if (overId === "list-drop-end") {
    newIndex = state.lists.length - 1;
  } else {
    newIndex = state.lists.findIndex((l) => l.id === overId);
  }
  if (newIndex < 0) return;
  const next = arrayMove(state.lists, oldIndex, newIndex);
  state.reorderLists(next.map((l) => l.id));
  reorderListsAction({ boardId, orderedListIds: next.map((l) => l.id) })
    .then((result) => {
      if ("errors" in result) {
        toast.error(result.errors.map((e) => e.message).join(", "));
        router.refresh();
      }
    })
    .catch(() => {
      toast.error("Failed to reorder lists");
      router.refresh();
    });
}

function handleCardDrop({
  activeId,
  overId,
  state,
  router,
}: {
  activeId: string;
  overId: string;
  state: ReturnType<typeof useBoardCardStore.getState>;
  router: ReturnType<typeof useRouter>;
}) {
  let sourceListId: string | null = null;
  let activeCardObj: CardSummary | null = null;
  for (const listId of Object.keys(state.cardsByList)) {
    const found = state.cardsByList[listId].find((c) => c.id === activeId);
    if (found) {
      sourceListId = listId;
      activeCardObj = found;
      break;
    }
  }
  if (!sourceListId || !activeCardObj) return;

  let targetListId: string | null = null;
  let targetIndex = 0;

  if (overId.startsWith("list-drop-")) {
    targetListId = overId.replace("list-drop-", "");
    targetIndex = state.cardsByList[targetListId]?.length ?? 0;
  } else {
    for (const listId of Object.keys(state.cardsByList)) {
      const idx = state.cardsByList[listId].findIndex((c) => c.id === overId);
      if (idx >= 0) {
        targetListId = listId;
        targetIndex = idx;
        break;
      }
    }
  }
  if (!targetListId) return;

  if (sourceListId === targetListId && activeCardObj.position === targetIndex) return;

  state.moveCard(activeId, targetListId, targetIndex);

  if (sourceListId === targetListId) {
    const orderedIds = (state.cardsByList[targetListId] ?? []).map((c) => c.id);
    reorderCardsAction({ listId: targetListId, orderedCardIds: orderedIds })
      .then((result) => {
        if ("errors" in result) {
          toast.error(result.errors.map((e) => e.message).join(", "));
          router.refresh();
        }
      })
      .catch(() => {
        toast.error("Failed to reorder cards");
        router.refresh();
      });
  } else {
    moveCardAction({
      cardId: activeId,
      targetListId,
      targetPosition: targetIndex,
    })
      .then((result) => {
        if ("errors" in result) {
          toast.error(result.errors.map((e) => e.message).join(", "));
          router.refresh();
        }
      })
      .catch(() => {
        toast.error("Failed to move card");
        router.refresh();
      });
  }
}
