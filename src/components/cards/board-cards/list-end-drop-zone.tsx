"use client";

import { useDroppable } from "@dnd-kit/core";

export function ListEndDropZone() {
  const { setNodeRef, isOver } = useDroppable({ id: "list-drop-end", data: { type: "list-end" } });
  return (
    <div
      ref={setNodeRef}
      data-testid="list-drop-end"
      className={`h-full min-h-[120px] w-4 shrink-0 rounded transition-colors ${isOver ? "bg-primary/20" : "bg-transparent"}`}
    />
  );
}
