"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { createCardAction } from "@/lib/actions/cards";
import { moveCardAction, reorderCardsAction } from "@/lib/actions/cards";
import type { Card } from "@/lib/db/schema/cards";
import type { List } from "@/lib/db/schema/lists";
import type { Label } from "@/lib/db/schema/labels";
import { ListColumn } from "@/components/lists/list-column";
import { AddListForm } from "@/components/lists/add-list-form";
import { CardList } from "@/components/cards/card-list";
import { CardItem, type CardSummary } from "@/components/cards/card-item";
import { CardDetail } from "@/components/cards/card-detail";
import { createListAction, renameListAction, deleteListAction } from "@/lib/actions/lists";
import { cn } from "@/lib/utils";

interface BoardCardsProps {
  boardId: string;
  initialLists: List[];
  initialCardsByList: Record<string, CardSummary[]>;
  boardLabels: Label[];
}

export function BoardCards({
  boardId,
  initialLists,
  initialCardsByList,
  boardLabels,
}: BoardCardsProps) {
  const router = useRouter();
  const [optimisticLists, setOptimisticLists] = useState(initialLists);
  const [optimisticCardsByList, setOptimisticCardsByList] = useState(initialCardsByList);
  const [activeCard, setActiveCard] = useState<CardSummary | null>(null);
  const [lastSynced, setLastSynced] = useState({ lists: initialLists, cards: initialCardsByList });
  if (lastSynced.lists !== initialLists || lastSynced.cards !== initialCardsByList) {
    setLastSynced({ lists: initialLists, cards: initialCardsByList });
    setOptimisticLists(initialLists);
    setOptimisticCardsByList(initialCardsByList);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    const id = String(event.active.id);
    for (const listId of Object.keys(optimisticCardsByList)) {
      const found = optimisticCardsByList[listId].find((c) => c.id === id);
      if (found) {
        setActiveCard(found);
        return;
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveCard(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    // Find source list
    let sourceListId: string | null = null;
    let activeCardObj: CardSummary | null = null;
    for (const listId of Object.keys(optimisticCardsByList)) {
      const found = optimisticCardsByList[listId].find((c) => c.id === activeId);
      if (found) {
        sourceListId = listId;
        activeCardObj = found;
        break;
      }
    }
    if (!sourceListId || !activeCardObj) return;

    // Determine target list + position
    let targetListId: string | null = null;
    let targetIndex = 0;

    if (overId.startsWith("list-drop-")) {
      targetListId = overId.replace("list-drop-", "");
      targetIndex = optimisticCardsByList[targetListId]?.length ?? 0;
    } else {
      // Dropped on a card
      for (const listId of Object.keys(optimisticCardsByList)) {
        const idx = optimisticCardsByList[listId].findIndex((c) => c.id === overId);
        if (idx >= 0) {
          targetListId = listId;
          targetIndex = idx;
          break;
        }
      }
    }
    if (!targetListId) return;

    if (sourceListId === targetListId && activeCardObj.position === targetIndex) return;

    // Optimistic update
    const next = { ...optimisticCardsByList };
    const sourceArr = [...(next[sourceListId] ?? [])];
    sourceArr.splice(
      sourceArr.findIndex((c) => c.id === activeId),
      1,
    );
    const targetArr = sourceListId === targetListId ? sourceArr : [...(next[targetListId] ?? [])];
    targetArr.splice(targetIndex, 0, { ...activeCardObj, listId: targetListId });
    next[sourceListId] = sourceArr;
    next[targetListId] = targetArr;
    setOptimisticCardsByList(next);

    if (sourceListId === targetListId) {
      const orderedIds = targetArr.map((c) => c.id);
      reorderCardsAction({ listId: targetListId, orderedCardIds: orderedIds })
        .then((result) => {
          if ("errors" in result) {
            toast.error(result.errors.map((e) => e.message).join(", "));
            setOptimisticCardsByList(initialCardsByList);
          } else {
            router.refresh();
          }
        })
        .catch(() => setOptimisticCardsByList(initialCardsByList));
    } else {
      moveCardAction({
        cardId: activeId,
        targetListId,
        targetPosition: targetIndex,
      })
        .then((result) => {
          if ("errors" in result) {
            toast.error(result.errors.map((e) => e.message).join(", "));
            setOptimisticCardsByList(initialCardsByList);
          } else {
            router.refresh();
          }
        })
        .catch(() => setOptimisticCardsByList(initialCardsByList));
    }
  };

  const handleAddList = async (title: string) => {
    const result = await createListAction({ boardId, title });
    if ("errors" in result) {
      toast.error(result.errors.map((e) => e.message).join(", "));
      return;
    }
    router.refresh();
  };

  const handleRenameList = async (listId: string, title: string) => {
    const result = await renameListAction({ listId, title });
    if ("errors" in result) {
      toast.error(result.errors.map((e) => e.message).join(", "));
      setOptimisticLists(initialLists);
      return;
    }
    router.refresh();
  };

  const handleDeleteList = async (listId: string) => {
    const result = await deleteListAction({ listId });
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    router.refresh();
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div
        data-testid="board-cards"
        className={cn(
          "flex h-full items-start gap-3 overflow-x-auto pb-4",
          "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
        )}
      >
        {optimisticLists.map((list) => (
          <ListColumn
            key={list.id}
            list={list}
            onRename={(title) => handleRenameList(list.id, title)}
            onDelete={() => handleDeleteList(list.id)}
          >
            <CardList
              listId={list.id}
              cards={optimisticCardsByList[list.id] ?? []}
              isDropTarget={activeCard !== null}
            />
          </ListColumn>
        ))}
        <div className="shrink-0">
          <AddListForm onAdd={handleAddList} />
        </div>
      </div>
      <DragOverlay>{activeCard ? <CardItem card={activeCard} hideDragHandle /> : null}</DragOverlay>
      <CardDetail
        boardId={boardId}
        boardLabels={boardLabels}
        lists={optimisticLists.map((l) => ({ id: l.id, title: l.title }))}
      />
    </DndContext>
  );
}
