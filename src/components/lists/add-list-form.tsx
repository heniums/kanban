"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AddListFormProps {
  onAdd: (title: string) => Promise<void> | void;
}

export function AddListForm({ onAdd }: AddListFormProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [isPending, startTransition] = useTransition();

  const reset = () => {
    setTitle("");
    setIsEditing(false);
  };

  const commit = () => {
    const trimmed = title.trim();
    if (!trimmed) {
      reset();
      return;
    }
    startTransition(async () => {
      await onAdd(trimmed);
      reset();
    });
  };

  if (!isEditing) {
    return (
      <Button
        type="button"
        variant="ghost"
        onClick={() => setIsEditing(true)}
        className="bg-muted/40 hover:bg-muted/60 h-9 w-72 shrink-0 justify-start gap-2 rounded-lg text-sm"
      >
        <Plus className="size-4" /> Add list
      </Button>
    );
  }

  return (
    <div className="bg-muted/40 flex w-72 shrink-0 flex-col gap-2 rounded-lg p-3 backdrop-blur-sm">
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="List title"
        aria-label="List title"
        autoFocus
        disabled={isPending}
        maxLength={100}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
          } else if (e.key === "Escape") {
            e.preventDefault();
            reset();
          }
        }}
        onBlur={commit}
      />
      <div className="flex items-center gap-2">
        <Button type="button" size="sm" onClick={commit} disabled={isPending || !title.trim()}>
          {isPending ? "Adding..." : "Add list"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={reset} disabled={isPending}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
