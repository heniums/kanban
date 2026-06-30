"use client";

import { useState, useTransition } from "react";
import { Trash2, GripVertical } from "lucide-react";
import type { List } from "@/lib/db/schema/lists";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ListColumnProps {
  list: List;
  onRename: (title: string) => Promise<void> | void;
  onDelete: () => Promise<void> | void;
  dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>;
}

export function ListColumn({ list, onRename, onDelete, dragHandleProps }: ListColumnProps) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [draftTitle, setDraftTitle] = useState(list.title);
  const [isPending, startTransition] = useTransition();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const beginRename = () => {
    setDraftTitle(list.title);
    setIsRenaming(true);
  };

  const cancelRename = () => {
    setDraftTitle(list.title);
    setIsRenaming(false);
  };

  const commitRename = () => {
    const next = draftTitle.trim();
    if (!next || next === list.title) {
      cancelRename();
      return;
    }
    startTransition(async () => {
      await onRename(next);
      setIsRenaming(false);
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      await onDelete();
      setDeleteOpen(false);
    });
  };

  return (
    <section
      aria-label={`List ${list.title}`}
      data-list-id={list.id}
      className="bg-muted/40 flex h-fit w-72 shrink-0 flex-col gap-3 rounded-lg p-3 backdrop-blur-sm"
    >
      <header className="flex items-center justify-between gap-2">
        <button
          type="button"
          aria-label="Move list"
          className="text-muted-foreground hover:text-foreground inline-flex h-6 w-6 items-center justify-center rounded focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          {...dragHandleProps}
        >
          <GripVertical className="size-4" />
        </button>
        {isRenaming ? (
          <Input
            value={draftTitle}
            onChange={(e) => setDraftTitle(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                commitRename();
              } else if (e.key === "Escape") {
                e.preventDefault();
                cancelRename();
              }
            }}
            disabled={isPending}
            aria-label="Rename list"
            className="h-7 text-sm font-semibold"
            autoFocus
            maxLength={100}
          />
        ) : (
          <h3
            className="flex-1 cursor-text rounded px-1 text-sm font-semibold select-none"
            onClick={beginRename}
            role="heading"
            aria-level={3}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                beginRename();
              }
            }}
          >
            {list.title}
          </h3>
        )}
        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Delete list"
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="size-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this list?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the list and any cards it contains.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  handleDelete();
                }}
                disabled={isPending}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isPending ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </header>
      <div className="text-muted-foreground rounded-md border border-dashed border-current/20 p-3 text-center text-xs">
        Cards will appear here.
      </div>
    </section>
  );
}
