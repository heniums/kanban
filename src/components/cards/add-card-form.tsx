"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AddCardFormProps {
  onAdd: (title: string) => Promise<void> | void;
  disabled?: boolean;
}

export function AddCardForm({ onAdd, disabled }: AddCardFormProps) {
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
        disabled={disabled}
        className="text-muted-foreground hover:text-foreground hover:bg-muted/60 h-7 w-full justify-start gap-1.5 rounded-md px-2 text-xs"
      >
        <Plus className="size-3.5" /> Add card
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Card title"
        aria-label="Card title"
        autoFocus
        disabled={isPending}
        maxLength={200}
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
        onClick={(e) => e.stopPropagation()}
      />
      <div className="flex items-center gap-2">
        <Button type="button" size="sm" onClick={commit} disabled={isPending || !title.trim()}>
          {isPending ? "Adding..." : "Add card"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={reset} disabled={isPending}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
