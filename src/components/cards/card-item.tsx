"use client";

import { useState, useTransition, type CSSProperties, type HTMLAttributes } from "react";
import { useRouter } from "next/navigation";
import { Calendar, MessageSquare, Pencil } from "lucide-react";
import type { Card } from "@/lib/db/schema/cards";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { updateCardAction } from "@/lib/actions/cards";

export type CardSummary = Card & {
  labels?: { id: string; name: string; color: string }[];
  assignees?: { id: string; name: string }[];
  checklistProgress?: { total: number; completed: number } | null;
  commentCount?: number;
};

export interface CardItemSortable {
  attributes: Record<string, unknown>;
  listeners: Record<string, unknown> | undefined;
  setNodeRef: (node: HTMLElement | null) => void;
  transform: { x: number; y: number; scaleX: number; scaleY: number } | null;
  transition: string | undefined;
  isDragging: boolean;
}

interface CardItemProps {
  card: CardSummary;
  onOpen?: (card: CardSummary) => void;
  sortable?: CardItemSortable;
  isDragging?: boolean;
}

function dueDateColor(dueDate: Date | null | undefined): { className: string; tooltip: string } {
  if (!dueDate) return { className: "hidden", tooltip: "" };
  const now = new Date();
  const due = new Date(dueDate);
  const diffMs = due.getTime() - now.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 0) {
    return {
      className: "bg-red-500/15 text-red-700 dark:text-red-300",
      tooltip: `Overdue · ${due.toLocaleDateString()}`,
    };
  }
  if (diffDays <= 2) {
    return {
      className: "bg-yellow-500/15 text-yellow-800 dark:text-yellow-300",
      tooltip: `Due soon · ${due.toLocaleDateString()}`,
    };
  }
  return {
    className: "bg-muted text-muted-foreground",
    tooltip: `Due · ${due.toLocaleDateString()}`,
  };
}

export function CardItem({
  card,
  onOpen,
  sortable,
  isDragging: externalIsDragging,
}: CardItemProps) {
  const router = useRouter();
  const [isRenaming, setIsRenaming] = useState(false);
  const [draftTitle, setDraftTitle] = useState(card.title);
  const [isPending, startTransition] = useTransition();
  const due = dueDateColor(card.dueDate);
  const labels = card.labels ?? [];
  const assignees = card.assignees ?? [];
  const progress = card.checklistProgress;
  const commentCount = card.commentCount ?? 0;
  const hasDescription = !!(card.description && card.description.trim().length > 0);

  const beginRename = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setDraftTitle(card.title);
    setIsRenaming(true);
  };

  const commitRename = (e?: React.MouseEvent | React.FocusEvent | React.KeyboardEvent) => {
    e?.stopPropagation();
    const next = draftTitle.trim();
    if (!next || next === card.title) {
      setIsRenaming(false);
      setDraftTitle(card.title);
      return;
    }
    startTransition(async () => {
      await updateCardAction({ cardId: card.id, title: next });
      setIsRenaming(false);
      router.refresh();
    });
  };

  const cancelRename = (e?: React.KeyboardEvent) => {
    e?.stopPropagation();
    setDraftTitle(card.title);
    setIsRenaming(false);
  };

  const openModal = (e: React.MouseEvent) => {
    e.stopPropagation();
    onOpen?.(card);
  };

  const handleClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button, input, textarea")) return;
    onOpen?.(card);
  };

  const style: CSSProperties = {};
  if (sortable) {
    if (sortable.transform) {
      style.transform = `translate3d(${sortable.transform.x}px, ${sortable.transform.y}px, 0) scaleX(${sortable.transform.scaleX}) scaleY(${sortable.transform.scaleY})`;
    }
    if (sortable.transition) {
      style.transition = sortable.transition;
    }
  }
  const isDragging = sortable?.isDragging ?? externalIsDragging ?? false;

  const ref = sortable?.setNodeRef;
  const attributes = sortable?.attributes as HTMLAttributes<HTMLElement> | undefined;
  const listeners = sortable?.listeners as HTMLAttributes<HTMLElement> | undefined;

  return (
    <article
      ref={ref}
      data-card-id={card.id}
      data-testid="card-item"
      onClick={handleClick}
      style={style}
      className={cn(
        "bg-card text-card-foreground group/card relative flex w-full cursor-pointer touch-none flex-col gap-2 rounded-md border p-2 text-sm shadow-sm",
        isDragging && "opacity-60",
        sortable && "cursor-grab active:cursor-grabbing",
      )}
      {...attributes}
      {...listeners}
    >
      <button
        type="button"
        onClick={openModal}
        aria-label="Edit card"
        title="Edit card"
        className="text-muted-foreground hover:text-foreground hover:bg-muted absolute top-1.5 right-1.5 inline-flex size-6 items-center justify-center rounded opacity-0 transition-opacity group-hover/card:opacity-100 focus-visible:opacity-100"
      >
        <Pencil className="size-3.5" />
      </button>

      {labels.length > 0 && (
        <div className="flex flex-wrap gap-1 pr-6">
          {labels.slice(0, 4).map((l) => (
            <span
              key={l.id}
              data-testid="card-label"
              className="rounded-full px-2 py-1 text-[10px] font-medium text-white"
              style={{ backgroundColor: l.color }}
              title={l.name}
            >
              {l.name}
            </span>
          ))}
          {labels.length > 4 && (
            <span
              className="text-muted-foreground text-[10px]"
              title={labels
                .slice(4)
                .map((l) => l.name)
                .join(", ")}
            >
              +{labels.length - 4}
            </span>
          )}
        </div>
      )}

      {isRenaming ? (
        <Input
          value={draftTitle}
          onChange={(e) => setDraftTitle(e.target.value)}
          onBlur={(e) => commitRename(e)}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === "Enter") {
              e.preventDefault();
              commitRename(e);
            } else if (e.key === "Escape") {
              cancelRename(e);
            }
          }}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          disabled={isPending}
          aria-label="Rename card"
          autoFocus
          maxLength={200}
          className="h-7 text-sm"
        />
      ) : (
        <h4
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            beginRename(e);
          }}
          className="cursor-text pr-6 leading-snug font-medium"
          role="heading"
          aria-level={4}
        >
          {card.title}
        </h4>
      )}

      {hasDescription && (
        <p
          className="text-muted-foreground line-clamp-3 text-xs"
          data-testid="card-description-preview"
        >
          {card.description}
        </p>
      )}

      <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-xs">
        {card.dueDate && (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px]",
              due.className,
            )}
            title={due.tooltip}
          >
            <Calendar className="size-3" /> {new Date(card.dueDate).toLocaleDateString()}
          </span>
        )}
        {progress && progress.total > 0 && (
          <span
            className="inline-flex items-center gap-1"
            title={`${progress.completed} of ${progress.total} checklist items completed`}
          >
            <span aria-hidden>☑</span>
            <span>
              {progress.completed}/{progress.total}
            </span>
            <span
              className="bg-muted-foreground/30 h-1 w-10 overflow-hidden rounded-full"
              aria-hidden
            >
              <span
                className="bg-foreground/60 block h-full"
                style={{
                  width: `${Math.round((progress.completed / progress.total) * 100)}%`,
                }}
              />
            </span>
          </span>
        )}
        {commentCount > 0 && (
          <span className="inline-flex items-center gap-1" title={`${commentCount} comments`}>
            <MessageSquare className="size-3" /> {commentCount}
          </span>
        )}
        {assignees.length > 0 && (
          <div className="ml-auto flex -space-x-1.5">
            {assignees.slice(0, 3).map((a) => (
              <span
                key={a.id}
                className="bg-muted text-foreground inline-flex size-5 items-center justify-center rounded-full border text-[10px] font-semibold"
                title={a.name}
              >
                {a.name.charAt(0).toUpperCase()}
              </span>
            ))}
            {assignees.length > 3 && (
              <span className="bg-muted text-foreground inline-flex size-5 items-center justify-center rounded-full border text-[10px] font-semibold">
                +{assignees.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
