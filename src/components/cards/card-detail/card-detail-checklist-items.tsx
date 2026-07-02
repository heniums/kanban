"use client";

import { useState, type Dispatch, type SetStateAction } from "react";
import { Check, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createChecklistItemAction,
  deleteChecklistItemAction,
  updateChecklistItemAction,
} from "@/lib/actions/checklists";
import { cn } from "@/lib/utils";
import type { CardDetailData } from "./types";

export function ChecklistItem({
  item,
  checklistId,
  disabled,
  onChange,
}: {
  item: {
    id: string;
    checklistId: string;
    content: string;
    isCompleted: boolean;
    position: number;
  };
  checklistId: string;
  disabled: boolean;
  onChange: Dispatch<SetStateAction<CardDetailData["checklists"]>>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item.content);

  const handleToggle = async () => {
    const next = !item.isCompleted;
    onChange((prev) =>
      prev.map((c) =>
        c.id === checklistId
          ? {
              ...c,
              items: c.items.map((i) => (i.id === item.id ? { ...i, isCompleted: next } : i)),
            }
          : c,
      ),
    );
    const result = await updateChecklistItemAction({ itemId: item.id, isCompleted: next });
    if ("errors" in result) {
      onChange((prev) =>
        prev.map((c) =>
          c.id === checklistId
            ? {
                ...c,
                items: c.items.map((i) =>
                  i.id === item.id ? { ...i, isCompleted: item.isCompleted } : i,
                ),
              }
            : c,
        ),
      );
      toast.error(result.errors.map((e) => e.message).join(", "));
    }
  };

  const handleSave = async () => {
    const next = draft.trim();
    if (!next) return;
    if (next === item.content) {
      setEditing(false);
      return;
    }
    onChange((prev) =>
      prev.map((c) =>
        c.id === checklistId
          ? { ...c, items: c.items.map((i) => (i.id === item.id ? { ...i, content: next } : i)) }
          : c,
      ),
    );
    setEditing(false);
    const result = await updateChecklistItemAction({ itemId: item.id, content: next });
    if ("errors" in result) {
      onChange((prev) =>
        prev.map((c) =>
          c.id === checklistId
            ? {
                ...c,
                items: c.items.map((i) => (i.id === item.id ? { ...i, content: item.content } : i)),
              }
            : c,
        ),
      );
      toast.error(result.errors.map((e) => e.message).join(", "));
    }
  };

  const handleDelete = async () => {
    onChange((prev) =>
      prev.map((c) =>
        c.id === checklistId ? { ...c, items: c.items.filter((i) => i.id !== item.id) } : c,
      ),
    );
    const result = await deleteChecklistItemAction({ itemId: item.id });
    if ("errors" in result) {
      onChange((prev) =>
        prev.map((c) =>
          c.id === checklistId
            ? { ...c, items: c.items.map((i) => (i.id === item.id ? item : i)) }
            : c,
        ),
      );
      toast.error(result.errors.map((e) => e.message).join(", "));
    }
  };

  return (
    <div className="group/item hover:bg-muted/40 flex items-start gap-2 rounded px-1 py-0.5">
      <button
        type="button"
        role="checkbox"
        aria-checked={item.isCompleted}
        onClick={handleToggle}
        disabled={disabled}
        className="hover:bg-muted mt-0.5 inline-flex size-4 shrink-0 items-center justify-center rounded border"
      >
        {item.isCompleted && <Check className="size-3" />}
      </button>
      {editing ? (
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={handleSave}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void handleSave();
            } else if (e.key === "Escape") {
              setDraft(item.content);
              setEditing(false);
            }
          }}
          autoFocus
          maxLength={500}
          className="h-7 text-sm"
        />
      ) : (
        <span
          onClick={() => {
            setDraft(item.content);
            setEditing(true);
          }}
          className={cn(
            "flex-1 cursor-text text-sm",
            item.isCompleted && "text-muted-foreground line-through",
          )}
        >
          {item.content}
        </span>
      )}
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={handleDelete}
        disabled={disabled}
        aria-label="Delete item"
        className="text-muted-foreground hover:text-destructive opacity-0 group-hover/item:opacity-100"
      >
        <X className="size-3.5" />
      </Button>
    </div>
  );
}

export function AddChecklistItem({
  checklistId,
  disabled,
  onAdded,
}: {
  checklistId: string;
  disabled: boolean;
  onAdded: (item: {
    id: string;
    checklistId: string;
    content: string;
    isCompleted: boolean;
    position: number;
  }) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [content, setContent] = useState("");

  const submit = async () => {
    const trimmed = content.trim();
    if (!trimmed) return;
    const result = await createChecklistItemAction({ checklistId, content: trimmed });
    if ("errors" in result) {
      toast.error(result.errors.map((e) => e.message).join(", "));
      return;
    }
    if (result.data) {
      onAdded({
        id: result.data.id,
        checklistId,
        content: trimmed,
        isCompleted: false,
        position: 0,
      });
    }
    setContent("");
    setAdding(false);
  };

  if (!adding) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setAdding(true)}
        disabled={disabled}
        className="self-start"
      >
        <Plus className="mr-1 size-3.5" /> Add item
      </Button>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      <Input
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Item content"
        maxLength={500}
        autoFocus
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            void submit();
          } else if (e.key === "Escape") {
            setContent("");
            setAdding(false);
          }
        }}
      />
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => {
            setContent("");
            setAdding(false);
          }}
        >
          Cancel
        </Button>
        <Button type="button" size="sm" onClick={submit} disabled={!content.trim() || disabled}>
          Add
        </Button>
      </div>
    </div>
  );
}
