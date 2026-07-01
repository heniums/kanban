"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import type { Card } from "@/lib/db/schema/cards";
import type { Label } from "@/lib/db/schema/labels";
import { updateCardAction, deleteCardAction } from "@/lib/actions/cards";
import { createLabelAction } from "@/lib/actions/labels";

export interface CardDetailData {
  card: Card;
  labels: { id: string; name: string; color: string }[];
  boardId: string;
  boardLabels: Label[];
}

interface CardDetailProps {
  boardId: string;
  boardLabels: Label[];
  lists: { id: string; title: string }[];
}

export function CardDetail({ boardId, lists }: CardDetailProps) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<CardDetailData | null>(null);
  const [isPending, startTransition] = useTransition();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    function onOpen(e: Event) {
      const detail = (e as CustomEvent<{ cardId: string }>).detail;
      // Fetch card details via a small action (reuse getCardById via direct call)
      void loadCard(detail.cardId);
    }
    async function loadCard(cardId: string) {
      try {
        const res = await fetch(`/api/cards/${cardId}`);
        if (!res.ok) {
          toast.error("Failed to load card");
          return;
        }
        const body = (await res.json()) as CardDetailData;
        setData(body);
        setOpen(true);
      } catch {
        toast.error("Failed to load card");
      }
    }
    window.addEventListener("card:open", onOpen as EventListener);
    return () => window.removeEventListener("card:open", onOpen as EventListener);
  }, []);

  const close = () => {
    setOpen(false);
    setData(null);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("card");
      window.history.pushState({}, "", url);
    }
  };

  const patch = (fields: Record<string, unknown>) => {
    if (!data) return;
    startTransition(async () => {
      const result = await updateCardAction({ cardId: data.card.id, ...fields });
      if ("errors" in result) {
        toast.error(result.errors.map((e) => e.message).join(", "));
        return;
      }
      if ("data" in result) {
        setData({ ...data, card: { ...data.card, ...result.data } });
        router.refresh();
      }
    });
  };

  const handleCreateLabel = async (name: string, color: string) => {
    const result = await createLabelAction({ boardId, name, color });
    if ("errors" in result) {
      toast.error(result.errors.map((e) => e.message).join(", "));
      return null;
    }
    return result.data;
  };

  const handleDelete = () => {
    if (!data) return;
    startTransition(async () => {
      const result = await deleteCardAction({ cardId: data.card.id });
      if ("errors" in result) {
        toast.error(result.errors.map((e) => e.message).join(", "));
        return;
      }
      setDeleteOpen(false);
      setOpen(false);
      setData(null);
      router.refresh();
      toast.success("Card deleted");
    });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? setOpen(true) : close())}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        {data && (
          <>
            <DialogHeader>
              <div className="flex items-center justify-between gap-2">
                <DialogTitle className="sr-only">Card detail</DialogTitle>
                <Button variant="ghost" size="icon-sm" onClick={close} aria-label="Close card">
                  <X className="size-4" />
                </Button>
              </div>
            </DialogHeader>

            <CardTitleEditor
              title={data.card.title}
              isPending={isPending}
              onSave={(title) => patch({ title })}
            />

            <div className="text-muted-foreground text-xs">
              in list{" "}
              <span className="font-medium">
                {lists.find((l) => l.id === data.card.listId)?.title ?? "—"}
              </span>
            </div>

            <FieldRow label="Due date" icon={<Calendar className="size-4" />}>
              <DueDateEditor
                value={data.card.dueDate}
                onChange={(dueDate) => patch({ dueDate })}
                disabled={isPending}
              />
            </FieldRow>

            <FieldRow label="Labels" icon={<span aria-hidden>🏷</span>}>
              <LabelEditor
                boardLabels={data.boardLabels}
                cardLabels={data.labels}
                onChange={(labelIds) => patch({ labelIds })}
                onCreateLabel={handleCreateLabel}
                disabled={isPending}
              />
            </FieldRow>

            <FieldRow label="Description" icon={<span aria-hidden>≡</span>}>
              <DescriptionEditor
                value={data.card.description ?? ""}
                onSave={(description) => patch({ description })}
                disabled={isPending}
              />
            </FieldRow>

            <div className="border-t pt-4">
              <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="mr-1 size-3.5" /> Delete card
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this card?</AlertDialogTitle>
                    <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
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
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function FieldRow({
  label,
  icon,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="text-muted-foreground flex items-center gap-2 text-xs font-semibold tracking-wide uppercase">
        {icon}
        {label}
      </div>
      <div>{children}</div>
    </div>
  );
}

function CardTitleEditor({
  title,
  isPending,
  onSave,
}: {
  title: string;
  isPending: boolean;
  onSave: (title: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(title);

  if (editing) {
    return (
      <Input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          if (draft.trim() && draft.trim() !== title) onSave(draft.trim());
          setEditing(false);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            if (draft.trim() && draft.trim() !== title) onSave(draft.trim());
            setEditing(false);
          } else if (e.key === "Escape") {
            setDraft(title);
            setEditing(false);
          }
        }}
        autoFocus
        maxLength={200}
        disabled={isPending}
        aria-label="Card title"
        className="text-lg font-semibold"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        setDraft(title);
        setEditing(true);
      }}
      className="hover:bg-muted/40 -mx-1 rounded px-1 text-left text-lg font-semibold"
    >
      {title}
    </button>
  );
}

function DescriptionEditor({
  value,
  onSave,
  disabled,
}: {
  value: string;
  onSave: (description: string) => void;
  disabled: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  if (editing) {
    return (
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          if (draft !== value) onSave(draft);
          setEditing(false);
        }}
        autoFocus
        disabled={disabled}
        maxLength={5000}
        aria-label="Card description"
        rows={4}
        className="border-input bg-background placeholder:text-muted-foreground w-full rounded-md border px-3 py-2 text-sm"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        setDraft(value);
        setEditing(true);
      }}
      className="border-input hover:bg-muted/40 min-h-[60px] w-full rounded-md border border-dashed px-3 py-2 text-left text-sm"
    >
      {value ? value : "Add a description..."}
    </button>
  );
}

function DueDateEditor({
  value,
  onChange,
  disabled,
}: {
  value: Date | null;
  onChange: (date: Date | null) => void;
  disabled: boolean;
}) {
  const toDateInput = (d: Date | null) => {
    if (!d) return "";
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };
  return (
    <div className="flex items-center gap-2">
      <Input
        type="date"
        value={toDateInput(value)}
        onChange={(e) => onChange(e.target.value ? new Date(e.target.value) : null)}
        disabled={disabled}
        aria-label="Due date"
        className="w-44"
      />
      {value && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onChange(null)}
          disabled={disabled}
        >
          Clear
        </Button>
      )}
    </div>
  );
}

function LabelEditor({
  boardLabels,
  cardLabels,
  onChange,
  onCreateLabel,
  disabled,
}: {
  boardLabels: Label[];
  cardLabels: { id: string; name: string; color: string }[];
  onChange: (labelIds: string[]) => void;
  onCreateLabel: (name: string, color: string) => Promise<Label | null>;
  disabled: boolean;
}) {
  const cardLabelIds = new Set(cardLabels.map((l) => l.id));
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#3b82f6");

  const toggle = (id: string) => {
    if (disabled) return;
    const next = new Set(cardLabelIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange(Array.from(next));
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {boardLabels.length === 0 && (
          <span className="text-muted-foreground text-xs">No labels yet.</span>
        )}
        {boardLabels.map((l) => {
          const active = cardLabelIds.has(l.id);
          return (
            <button
              type="button"
              key={l.id}
              onClick={() => toggle(l.id)}
              disabled={disabled}
              className={`rounded-full border px-2 py-0.5 text-xs hover:opacity-90 ${active ? "ring-2 ring-offset-1" : "opacity-60"}`}
              style={{ backgroundColor: l.color, color: "white" }}
              aria-pressed={active}
            >
              {l.name}
            </button>
          );
        })}
        {creating ? (
          <div className="flex items-center gap-1">
            <input
              type="color"
              value={newColor}
              onChange={(e) => setNewColor(e.target.value)}
              className="h-7 w-7 cursor-pointer rounded border"
              aria-label="Label color"
            />
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Label name"
              maxLength={50}
              className="h-7 w-32 text-xs"
            />
            <Button
              type="button"
              size="sm"
              onClick={async () => {
                const name = newName.trim();
                if (!name) return;
                const created = await onCreateLabel(name, newColor);
                if (created) {
                  setNewName("");
                  setNewColor("#3b82f6");
                  setCreating(false);
                }
              }}
            >
              Add
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setCreating(false)}>
              Cancel
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setCreating(true)}
            disabled={disabled}
          >
            + New label
          </Button>
        )}
      </div>
    </div>
  );
}
