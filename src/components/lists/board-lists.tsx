"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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
import {
  createListAction,
  renameListAction,
  deleteListAction,
  reorderListsAction,
} from "@/lib/actions/lists";

interface BoardListsProps {
  boardId: string;
  initialLists: List[];
}

export function BoardLists({ boardId, initialLists }: BoardListsProps) {
  const router = useRouter();
  const [optimisticLists, setOptimisticLists] = useState(initialLists);
  const [lastSyncedLists, setLastSyncedLists] = useState(initialLists);
  if (lastSyncedLists !== initialLists) {
    setLastSyncedLists(initialLists);
    setOptimisticLists(initialLists);
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
    reorderListsAction({ boardId, orderedListIds: orderedIds })
      .then((result) => {
        if ("errors" in result) {
          toast.error(result.errors.map((e) => e.message).join(", "));
          setOptimisticLists(initialLists);
        } else {
          router.refresh();
        }
      })
      .catch(() => {
        setOptimisticLists(initialLists);
      });
  };

  const handleAdd = async (title: string) => {
    const tempId = crypto.randomUUID();
    const now = new Date();
    const tempList: List = {
      id: tempId,
      boardId,
      title,
      position: optimisticLists.length,
      createdAt: now,
      updatedAt: now,
    };
    setOptimisticLists((prev) => [...prev, tempList]);

    const result = await createListAction({ boardId, title });
    if ("errors" in result) {
      toast.error(result.errors.map((e) => e.message).join(", "));
      setOptimisticLists((prev) => prev.filter((l) => l.id !== tempId));
      return;
    }
    router.refresh();
  };

  const handleRename = async (listId: string, title: string) => {
    setOptimisticLists((prev) => prev.map((l) => (l.id === listId ? { ...l, title } : l)));
    const result = await renameListAction({ listId, title });
    if ("errors" in result) {
      toast.error(result.errors.map((e) => e.message).join(", "));
      setOptimisticLists(initialLists);
      return;
    }
    router.refresh();
  };

  const handleDelete = async (listId: string) => {
    setOptimisticLists((prev) => prev.filter((l) => l.id !== listId));

    const result = await deleteListAction({ listId });
    if ("error" in result) {
      toast.error(result.error);
      setOptimisticLists(initialLists);
      return;
    }
    router.refresh();
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
