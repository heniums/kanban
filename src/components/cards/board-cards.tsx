"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { DndContext, closestCorners, DragOverlay, MeasuringStrategy } from "@dnd-kit/core";
import { SortableContext, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import { createListAction, deleteListAction, renameListAction } from "@/lib/actions/lists";
import type { List } from "@/lib/db/schema/lists";
import { ListColumn } from "@/components/lists/list-column";
import { AddListForm } from "@/components/lists/add-list-form";
import { CardList } from "@/components/cards/card-list";
import { CardItem, type CardSummary } from "@/components/cards/card-item";
import { CardDetail } from "@/components/cards/card-detail";
import { cn } from "@/lib/utils";
import { useBoardCardStore } from "@/lib/realtime/board-store";
import { useBoardSocket } from "@/lib/realtime/use-board-socket";
import { useBoardCardsDnd } from "./board-cards/use-board-cards-dnd";
import { ListEndDropZone } from "./board-cards/list-end-drop-zone";
import { SortableListColumn } from "./board-cards/sortable-list-column";

interface BoardCardsProps {
  boardId: string;
  initialLists: List[];
  initialCardsByList: Record<string, CardSummary[]>;
}

export function BoardCards({ boardId, initialLists, initialCardsByList }: BoardCardsProps) {
  const router = useRouter();
  useBoardSocket(boardId);

  const setInitial = useBoardCardStore((s) => s.setInitial);
  const storeLists = useBoardCardStore((s) => s.lists);

  useEffect(() => {
    const flatCards: CardSummary[] = [];
    for (const listId of Object.keys(initialCardsByList)) {
      for (const c of initialCardsByList[listId]) flatCards.push(c);
    }
    setInitial(
      boardId,
      initialLists.map((l) => ({ id: l.id, title: l.title, position: l.position })),
      flatCards,
    );
  }, [boardId, initialLists, initialCardsByList, setInitial]);

  const { sensors, activeCard, activeListId, handleDragStart, handleDragEnd } = useBoardCardsDnd({
    boardId,
  });

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
      measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={storeLists.map((l) => l.id)} strategy={horizontalListSortingStrategy}>
        <div
          data-testid="board-cards"
          className={cn(
            "flex h-full items-start gap-3 overflow-x-auto pb-4",
            "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
          )}
        >
          {storeLists.map((list) => (
            <SortableListColumn
              key={list.id}
              list={{
                id: list.id,
                boardId,
                title: list.title,
                position: list.position,
                createdAt: new Date(0),
                updatedAt: new Date(0),
              }}
              onRename={(title) => handleRenameList(list.id, title)}
              onDelete={() => handleDeleteList(list.id)}
            >
              <CardList listId={list.id} isDropTarget={activeCard !== null} />
            </SortableListColumn>
          ))}
          <div className="shrink-0">
            <AddListForm onAdd={handleAddList} />
          </div>
          <ListEndDropZone />
        </div>
      </SortableContext>
      <DragOverlay>
        {activeCard ? (
          <CardItem card={activeCard} />
        ) : activeListId ? (
          <ListColumn
            list={{
              id: activeListId,
              boardId,
              title: storeLists.find((l) => l.id === activeListId)?.title ?? "",
              position: 0,
              createdAt: new Date(0),
              updatedAt: new Date(0),
            }}
            onRename={() => {}}
            onDelete={() => {}}
          />
        ) : null}
      </DragOverlay>
      <CardDetail boardId={boardId} lists={storeLists.map((l) => ({ id: l.id, title: l.title }))} />
    </DndContext>
  );
}
