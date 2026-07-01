"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { moveCardAction, reorderCardsAction } from "@/lib/actions/cards";
import type { List } from "@/lib/db/schema/lists";
import { ListColumn } from "@/components/lists/list-column";
import { AddListForm } from "@/components/lists/add-list-form";
import { CardList } from "@/components/cards/card-list";
import { CardItem, type CardSummary } from "@/components/cards/card-item";
import { CardDetail } from "@/components/cards/card-detail";
import {
  createListAction,
  renameListAction,
  deleteListAction,
  reorderListsAction,
} from "@/lib/actions/lists";
import { cn } from "@/lib/utils";
import { useBoardCardStore } from "@/lib/realtime/board-store";
import { useBoardSocket } from "@/lib/realtime/use-board-socket";

interface BoardCardsProps {
  boardId: string;
  initialLists: List[];
  initialCardsByList: Record<string, CardSummary[]>;
}

export function BoardCards({ boardId, initialLists, initialCardsByList }: BoardCardsProps) {
  const router = useRouter();
  useBoardSocket(boardId);

  const setInitial = useBoardCardStore((s) => s.setInitial);
  const storeCardsByList = useBoardCardStore((s) => s.cardsByList);
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

  const [activeCard, setActiveCard] = useState<CardSummary | null>(null);
  const [activeListId, setActiveListId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    const id = String(event.active.id);
    if (storeLists.some((l) => l.id === id)) {
      setActiveListId(id);
      return;
    }
    for (const listId of Object.keys(storeCardsByList)) {
      const found = storeCardsByList[listId].find((c) => c.id === id);
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

    if (storeLists.some((l) => l.id === activeId)) {
      if (activeId === overId) return;
      const oldIndex = storeLists.findIndex((l) => l.id === activeId);
      if (oldIndex < 0) return;
      let newIndex: number;
      if (overId === "list-drop-end") {
        newIndex = storeLists.length - 1;
      } else {
        newIndex = storeLists.findIndex((l) => l.id === overId);
      }
      if (newIndex < 0) return;
      const next = arrayMove(storeLists, oldIndex, newIndex);
      useBoardCardStore.getState().reorderLists(next.map((l) => l.id));
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
      return;
    }

    let sourceListId: string | null = null;
    let activeCardObj: CardSummary | null = null;
    for (const listId of Object.keys(storeCardsByList)) {
      const found = storeCardsByList[listId].find((c) => c.id === activeId);
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
      targetIndex = storeCardsByList[targetListId]?.length ?? 0;
    } else {
      for (const listId of Object.keys(storeCardsByList)) {
        const idx = storeCardsByList[listId].findIndex((c) => c.id === overId);
        if (idx >= 0) {
          targetListId = listId;
          targetIndex = idx;
          break;
        }
      }
    }
    if (!targetListId) return;

    if (sourceListId === targetListId && activeCardObj.position === targetIndex) return;

    useBoardCardStore.getState().moveCard(activeId, targetListId, targetIndex);

    if (sourceListId === targetListId) {
      const orderedIds = (storeCardsByList[targetListId] ?? []).map((c) => c.id);
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
      collisionDetection={closestCenter}
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

function ListEndDropZone() {
  const { setNodeRef, isOver } = useDroppable({ id: "list-drop-end", data: { type: "list-end" } });
  return (
    <div
      ref={setNodeRef}
      data-testid="list-drop-end"
      className={`h-full min-h-[120px] w-4 shrink-0 rounded transition-colors ${isOver ? "bg-primary/20" : "bg-transparent"}`}
    />
  );
}

function SortableListColumn({
  list,
  onRename,
  onDelete,
  children,
}: {
  list: List;
  onRename: (title: string) => Promise<void> | void;
  onDelete: () => Promise<void> | void;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: list.id,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} data-testid={`sortable-list-${list.id}`}>
      <ListColumn list={list} onRename={onRename} onDelete={onDelete} dragHandleProps={listeners}>
        {children}
      </ListColumn>
    </div>
  );
}
