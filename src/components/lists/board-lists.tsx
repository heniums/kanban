"use client";

import { useState } from "react";
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { List } from "@/lib/db/schema/lists";
import { ListColumn } from "@/components/lists/list-column";
import { AddListForm } from "@/components/lists/add-list-form";
import { cn } from "@/lib/utils";

interface BoardListsProps {
  lists: List[];
  onAdd: (title: string) => Promise<void> | void;
  onRename: (listId: string, title: string) => Promise<void> | void;
  onDelete: (listId: string) => Promise<void> | void;
  onReorder: (orderedListIds: string[]) => Promise<void> | void;
}

export function BoardLists({ lists, onAdd, onRename, onDelete, onReorder }: BoardListsProps) {
  const [optimisticLists, setOptimisticLists] = useState(lists);

  if (optimisticLists.map((l) => l.id).join() !== lists.map((l) => l.id).join()) {
    setOptimisticLists(lists);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = optimisticLists.findIndex((l) => l.id === active.id);
    const newIndex = optimisticLists.findIndex((l) => l.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(optimisticLists, oldIndex, newIndex);
    setOptimisticLists(next);
    const orderedIds = next.map((l) => l.id);
    Promise.resolve(onReorder(orderedIds)).catch(() => {
      // Rollback to server state on error
      setOptimisticLists(lists);
    });
  };

  const handleAdd = async (title: string) => {
    await onAdd(title);
  };

  const handleRename = async (listId: string, title: string) => {
    await onRename(listId, title);
    setOptimisticLists((prev) => prev.map((l) => (l.id === listId ? { ...l, title } : l)));
  };

  const handleDelete = async (listId: string) => {
    await onDelete(listId);
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext
        items={optimisticLists.map((l) => l.id)}
        strategy={horizontalListSortingStrategy}
      >
        <div
          data-testid="board-lists"
          className={cn(
            "flex h-full items-start gap-3 overflow-x-auto pb-4",
            "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
          )}
        >
          {optimisticLists.map((list) => (
            <SortableListColumn
              key={list.id}
              list={list}
              onRename={(title) => handleRename(list.id, title)}
              onDelete={() => handleDelete(list.id)}
            />
          ))}
          <div className="shrink-0">
            <AddListForm onAdd={handleAdd} />
          </div>
        </div>
      </SortableContext>
    </DndContext>
  );
}

function SortableListColumn({
  list,
  onRename,
  onDelete,
}: {
  list: List;
  onRename: (title: string) => Promise<void> | void;
  onDelete: () => Promise<void> | void;
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
    <div ref={setNodeRef} style={style} {...attributes}>
      <ListColumn list={list} onRename={onRename} onDelete={onDelete} dragHandleProps={listeners} />
    </div>
  );
}
