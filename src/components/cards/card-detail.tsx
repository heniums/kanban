"use client";

import { useEffect, useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Trash2, Tag } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent } from "@/components/ui/dialog";
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
  lists: { id: string; title: string }[];
}

interface DraftState {
  title: string;
  description: string;
  dueDate: Date | null;
  labelIds: string[];
}

export function CardDetail({ boardId, lists }: CardDetailProps) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<CardDetailData | null>(null);
  const [draft, setDraft] = useState<DraftState | null>(null);
  const [isPending, startTransition] = useTransition();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [newLabelIds, setNewLabelIds] = useState<string[]>([]);
  const router = useRouter();
  const lastSyncedCardId = useRef<string | null>(null);

  useEffect(() => {
    function onOpen(e: Event) {
      const detail = (e as CustomEvent<{ cardId: string }>).detail;
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
        setDraft({
          title: body.card.title,
          description: body.card.description ?? "",
          dueDate: body.card.dueDate ? new Date(body.card.dueDate) : null,
          labelIds: body.labels.map((l) => l.id),
        });
        setNewLabelIds([]);
        lastSyncedCardId.current = body.card.id;
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
    setDraft(null);
    setNewLabelIds([]);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("card");
      window.history.pushState({}, "", url);
    }
  };

  const isDirty = (() => {
    if (!data || !draft) return false;
    return (
      draft.title !== data.card.title ||
      draft.description !== (data.card.description ?? "") ||
      String(draft.dueDate?.getTime() ?? "") !==
        String(data.card.dueDate ? new Date(data.card.dueDate).getTime() : "") ||
      draft.labelIds.length !== data.labels.length ||
      draft.labelIds.some((id, i) => id !== data.labels[i]?.id)
    );
  })();

  const handleSave = () => {
    if (!data || !draft) return;
    startTransition(async () => {
      const result = await updateCardAction({
        cardId: data.card.id,
        title: draft.title.trim() || data.card.title,
        description: draft.description,
        dueDate: draft.dueDate,
        labelIds: draft.labelIds,
      });
      if ("errors" in result) {
        toast.error(result.errors.map((e) => e.message).join(", "));
        return;
      }
      toast.success("Card saved");
      router.refresh();
      close();
    });
  };

  const handleCreateLabel = async (name: string, color: string) => {
    const result = await createLabelAction({ boardId, name, color });
    if ("errors" in result) {
      toast.error(result.errors.map((e) => e.message).join(", "));
      return null;
    }
    if (result.data) {
      setData((prev) =>
        prev ? { ...prev, boardLabels: [...prev.boardLabels, result.data as Label] } : prev,
      );
      setNewLabelIds((prev) => [...prev, result.data!.id]);
      setDraft((prev) =>
        prev ? { ...prev, labelIds: [...prev.labelIds, result.data!.id] } : prev,
      );
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
      close();
      router.refresh();
      toast.success("Card deleted");
    });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? setOpen(true) : close())}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto p-0 sm:rounded-xl">
        {data && draft && (
          <div className="flex flex-col gap-5 p-6">
            <TitleEditor
              value={draft.title}
              onChange={(title) => setDraft({ ...draft, title })}
              disabled={isPending}
            />

            <div className="text-muted-foreground -mt-3 text-xs">
              in list{" "}
              <span className="font-medium">
                {lists.find((l) => l.id === data.card.listId)?.title ?? "—"}
              </span>
            </div>

            <div className="flex flex-wrap items-start gap-x-8 gap-y-4">
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="card-due-date"
                  className="text-muted-foreground flex items-center gap-1.5 text-xs"
                  title="Due date"
                >
                  <Calendar className="size-3.5" />
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    id="card-due-date"
                    type="date"
                    value={toDateInput(draft.dueDate)}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        dueDate: e.target.value ? new Date(e.target.value) : null,
                      })
                    }
                    disabled={isPending}
                    className="w-40"
                    aria-label="Due date"
                  />
                  {draft.dueDate && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setDraft({ ...draft, dueDate: null })}
                      disabled={isPending}
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <span
                  className="text-muted-foreground flex items-center gap-1.5 text-xs"
                  title="Labels (board-level, reusable across cards)"
                >
                  <Tag className="size-3.5" />
                </span>
                <LabelEditor
                  boardLabels={data.boardLabels}
                  selectedIds={draft.labelIds}
                  onChange={(labelIds) => setDraft({ ...draft, labelIds })}
                  onCreateLabel={handleCreateLabel}
                  newlyCreatedIds={newLabelIds}
                  disabled={isPending}
                />
              </div>
            </div>

            <DescriptionEditor
              value={draft.description}
              onChange={(description) => setDraft({ ...draft, description })}
              disabled={isPending}
            />

            <div className="flex items-center justify-between border-t pt-4">
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

              <div className="flex items-center gap-2">
                <Button type="button" variant="ghost" onClick={close} disabled={isPending}>
                  Cancel
                </Button>
                <Button type="button" onClick={handleSave} disabled={isPending || !isDirty}>
                  {isPending ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function toDateInput(d: Date | null): string {
  if (!d) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function TitleEditor({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
}) {
  return (
    <Input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      maxLength={200}
      aria-label="Card title"
      className="text-xl font-semibold"
      placeholder="Card title"
    />
  );
}

function DescriptionEditor({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor="card-description"
        className="text-muted-foreground text-xs"
        title="Description"
      >
        Description
      </label>
      <textarea
        id="card-description"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        maxLength={5000}
        rows={5}
        aria-label="Card description"
        placeholder="Add a description..."
        className="border-input bg-background placeholder:text-muted-foreground w-full rounded-md border px-3 py-2 text-sm"
      />
    </div>
  );
}

function LabelEditor({
  boardLabels,
  selectedIds,
  onChange,
  onCreateLabel,
  newlyCreatedIds,
  disabled,
}: {
  boardLabels: Label[];
  selectedIds: string[];
  onChange: (labelIds: string[]) => void;
  onCreateLabel: (name: string, color: string) => Promise<Label | null>;
  newlyCreatedIds: string[];
  disabled: boolean;
}) {
  const selected = new Set(selectedIds);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#3b82f6");

  const toggle = (id: string) => {
    if (disabled) return;
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange(Array.from(next));
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {boardLabels.length === 0 && !creating && (
        <span className="text-muted-foreground text-xs">No labels yet.</span>
      )}
      {boardLabels.map((l) => {
        const active = selected.has(l.id);
        const isNew = newlyCreatedIds.includes(l.id);
        return (
          <button
            type="button"
            key={l.id}
            onClick={() => toggle(l.id)}
            disabled={disabled}
            className={`rounded-full border px-2 py-0.5 text-xs transition-opacity hover:opacity-90 ${active ? "ring-2 ring-offset-1" : "opacity-50"} ${isNew ? "ring-1 ring-emerald-400" : ""}`}
            style={{ backgroundColor: l.color, color: "white" }}
            aria-pressed={active}
            title={l.name}
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
            autoFocus
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
  );
}
