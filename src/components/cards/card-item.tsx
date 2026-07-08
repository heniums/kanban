"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Calendar, MessageSquare, Pencil } from "lucide-react";
import type { Card } from "@/lib/db/schema/cards";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { updateCardAction } from "@/lib/actions/cards";

export type CardSummary = Card & {
  labels?: { id: string; name: string; color: string }[];
  assignees?: { id: string; name: string; avatarUrl?: string | null }[];
  checklistProgress?: { total: number; completed: number } | null;
  commentCount?: number;
  attachmentPreviewUrl?: string | null;
};

interface CardItemProps {
  card: CardSummary;
  onOpen?: (card: CardSummary) => void;
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

export function CardItem({ card, onOpen, isDragging = false }: CardItemProps) {
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
  const attachmentPreviewUrl = card.attachmentPreviewUrl;

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

  return (
    <article
      data-card-id={card.id}
      data-testid="card-item"
      onClick={handleClick}
      className={cn(
        "bg-card text-card-foreground group/card relative flex w-full cursor-pointer flex-col gap-2 rounded-md border p-2 text-sm shadow-sm",
        isDragging && "opacity-60",
      )}
    >
      <button
        type="button"
        onClick={openModal}
        aria-label="Edit card"
        title="Edit card"
        className="text-muted-foreground hover:text-foreground bg-muted/80 hover:bg-muted absolute top-1.5 right-1.5 inline-flex size-6 items-center justify-center rounded opacity-0 transition-opacity group-hover/card:opacity-100 focus-visible:opacity-100"
      >
        <Pencil className="size-3.5" />
      </button>

      {attachmentPreviewUrl && (
        <div className="-mx-2 -mt-2 overflow-hidden rounded-t-md">
          <img
            src={attachmentPreviewUrl}
            alt=""
            className="h-24 w-full object-cover"
            loading="lazy"
          />
        </div>
      )}

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
            {assignees.slice(0, 3).map((a) =>
              a.avatarUrl ? (
                <img
                  key={a.id}
                  src={a.avatarUrl}
                  alt={a.name}
                  className="inline-flex size-5 items-center justify-center rounded-full border object-cover"
                  title={a.name}
                />
              ) : (
                <span
                  key={a.id}
                  className="bg-muted text-foreground inline-flex size-5 items-center justify-center rounded-full border text-[10px] font-semibold"
                  title={a.name}
                >
                  {a.name.charAt(0).toUpperCase()}
                </span>
              ),
            )}
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
