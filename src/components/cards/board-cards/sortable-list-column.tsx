"use client";

import { type ReactNode } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ListColumn } from "@/components/lists/list-column";
import type { List } from "@/lib/db/schema/lists";

export function SortableListColumn({
  list,
  onRename,
  onDelete,
  children,
}: {
  list: List;
  onRename: (title: string) => Promise<void> | void;
  onDelete: () => Promise<void> | void;
  children: ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: list.id,
    data: { type: "list" },
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
