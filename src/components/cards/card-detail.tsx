"use client";

import { useEffect, useState, useTransition, useRef, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Tag, Trash2, Plus, X, Check } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
  const [newlyCreatedLabelIds, setNewlyCreatedLabelIds] = useState<string[]>([]);
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
        setNewlyCreatedLabelIds([]);
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
    setNewlyCreatedLabelIds([]);
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
      const newLabel = result.data as Label;
      setData((prev) => (prev ? { ...prev, boardLabels: [...prev.boardLabels, newLabel] } : prev));
      setNewlyCreatedLabelIds((prev) => [...prev, newLabel.id]);
      setDraft((prev) => (prev ? { ...prev, labelIds: [...prev.labelIds, newLabel.id] } : prev));
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
      <DialogContent
        className="max-h-[92vh] w-[min(96vw,1100px)] max-w-none overflow-y-auto p-0 sm:rounded-xl"
        showCloseButton={false}
      >
        {data && draft && (
          <div className="flex flex-col gap-6 p-7">
            <div className="flex items-start justify-between gap-3">
              <TitleEditor
                value={draft.title}
                onChange={(title) => setDraft({ ...draft, title })}
                disabled={isPending}
              />
              <DeleteCardButton onClick={() => setDeleteOpen(true)} disabled={isPending} />
            </div>

            <div className="text-muted-foreground -mt-4 text-xs">
              in list{" "}
              <span className="font-medium">
                {lists.find((l) => l.id === data.card.listId)?.title ?? "—"}
              </span>
            </div>

            <MetadataBar>
              <MetadataField label="Due date" icon={<Calendar className="size-3.5" />}>
                <DueDateEditor
                  value={draft.dueDate}
                  onChange={(dueDate) => setDraft({ ...draft, dueDate })}
                  disabled={isPending}
                />
              </MetadataField>
              <MetadataField icon={<Tag className="size-3.5" />}>
                <LabelPicker
                  boardLabels={data.boardLabels}
                  selectedIds={draft.labelIds}
                  onAdd={(labelId) =>
                    setDraft({ ...draft, labelIds: [...draft.labelIds, labelId] })
                  }
                  onCreateLabel={handleCreateLabel}
                  newlyCreatedIds={newlyCreatedLabelIds}
                  disabled={isPending}
                />
              </MetadataField>
            </MetadataBar>

            <AttachedLabels
              boardLabels={data.boardLabels}
              selectedIds={draft.labelIds}
              onRemove={(labelId) =>
                setDraft({ ...draft, labelIds: draft.labelIds.filter((id) => id !== labelId) })
              }
              newlyCreatedIds={newlyCreatedLabelIds}
            />

            <DescriptionEditor
              value={draft.description}
              onChange={(description) => setDraft({ ...draft, description })}
              disabled={isPending}
            />

            <div className="flex items-center justify-end gap-2 border-t pt-4">
              <Button type="button" variant="ghost" onClick={close} disabled={isPending}>
                Cancel
              </Button>
              <Button type="button" onClick={handleSave} disabled={isPending || !isDirty}>
                {isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this card?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The card and all of its data will be permanently
              removed.
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
    </Dialog>
  );
}

function DeleteCardButton({ onClick, disabled }: { onClick: () => void; disabled: boolean }) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      onClick={onClick}
      disabled={disabled}
      aria-label="Delete card"
      title="Delete card"
      className="text-muted-foreground hover:text-destructive shrink-0"
    >
      <Trash2 className="size-4" />
    </Button>
  );
}

function MetadataBar({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-start gap-x-8 gap-y-4">{children}</div>;
}

function MetadataField({
  label,
  icon,
  children,
}: {
  label?: string;
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
        {icon}
        {label && <span>{label}</span>}
      </div>
      <div>{children}</div>
    </div>
  );
}

function AttachedLabels({
  boardLabels,
  selectedIds,
  onRemove,
  newlyCreatedIds,
}: {
  boardLabels: Label[];
  selectedIds: string[];
  onRemove: (id: string) => void;
  newlyCreatedIds: string[];
}) {
  if (selectedIds.length === 0) return null;
  const byId = new Map(boardLabels.map((l) => [l.id, l] as const));
  return (
    <div className="flex flex-col gap-1.5">
      <div className="text-muted-foreground text-xs font-medium">Attached labels</div>
      <div className="flex flex-wrap items-center gap-1.5">
        {selectedIds.map((id) => {
          const l = byId.get(id);
          if (!l) return null;
          const isNew = newlyCreatedIds.includes(id);
          return (
            <span
              key={id}
              data-testid="attached-label"
              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs text-white ${isNew ? "ring-1 ring-emerald-400" : ""}`}
              style={{ backgroundColor: l.color }}
            >
              {l.name}
              <button
                type="button"
                onClick={() => onRemove(id)}
                aria-label={`Remove ${l.name}`}
                className="-mr-1 inline-flex size-4 items-center justify-center rounded-full hover:bg-white/20"
              >
                <X className="size-3" />
              </button>
            </span>
          );
        })}
      </div>
    </div>
  );
}

function LabelPicker({
  boardLabels,
  selectedIds,
  onAdd,
  onCreateLabel,
  newlyCreatedIds,
  disabled,
}: {
  boardLabels: Label[];
  selectedIds: string[];
  onAdd: (labelId: string) => void;
  onCreateLabel: (name: string, color: string) => Promise<Label | null>;
  newlyCreatedIds: string[];
  disabled: boolean;
}) {
  const selected = new Set(selectedIds);
  const available = boardLabels.filter((l) => !selected.has(l.id));
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#3b82f6");

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          aria-label="Add label"
        >
          <Plus className="size-3.5" /> Label
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64">
        {creating ? (
          <div className="flex flex-col gap-2">
            <div className="text-muted-foreground text-xs">Create a new label</div>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={newColor}
                onChange={(e) => setNewColor(e.target.value)}
                className="h-8 w-10 cursor-pointer rounded border"
                aria-label="Label color"
              />
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Label name"
                maxLength={50}
                autoFocus
                className="h-8"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (newName.trim()) {
                      void onCreateLabel(newName.trim(), newColor);
                      setNewName("");
                      setNewColor("#3b82f6");
                      setCreating(false);
                    }
                  } else if (e.key === "Escape") {
                    setCreating(false);
                  }
                }}
              />
            </div>
            <div className="flex items-center justify-end gap-1">
              <Button type="button" size="sm" variant="ghost" onClick={() => setCreating(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={async () => {
                  const name = newName.trim();
                  if (!name) return;
                  await onCreateLabel(name, newColor);
                  setNewName("");
                  setNewColor("#3b82f6");
                  setCreating(false);
                }}
                disabled={!newName.trim()}
              >
                Create
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            <div className="text-muted-foreground px-1 pb-1 text-[11px] font-medium tracking-wide uppercase">
              Available labels
            </div>
            <div className="max-h-56 overflow-y-auto">
              {available.length === 0 ? (
                <div className="text-muted-foreground px-2 py-3 text-center text-xs">
                  No labels left to add.
                </div>
              ) : (
                available.map((l) => {
                  const isNew = newlyCreatedIds.includes(l.id);
                  return (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => onAdd(l.id)}
                      className="hover:bg-muted flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs"
                    >
                      <span
                        className="inline-block h-3 w-3 shrink-0 rounded-sm"
                        style={{ backgroundColor: l.color }}
                      />
                      <span className="flex-1 truncate">{l.name}</span>
                      {isNew && <span className="text-muted-foreground text-[10px]">new</span>}
                      <Check className="text-muted-foreground size-3.5 opacity-0" />
                    </button>
                  );
                })
              )}
            </div>
            <div className="border-t pt-1">
              <button
                type="button"
                onClick={() => setCreating(true)}
                className="hover:bg-muted flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs"
              >
                <Plus className="size-3.5" />
                <span>Create new label</span>
              </button>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
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
      <label htmlFor="card-description" className="text-muted-foreground text-xs font-medium">
        Description
      </label>
      <textarea
        id="card-description"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        maxLength={5000}
        rows={6}
        aria-label="Card description"
        placeholder="Add a description..."
        className="border-input bg-background placeholder:text-muted-foreground w-full rounded-md border px-3 py-2 text-sm"
      />
    </div>
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
