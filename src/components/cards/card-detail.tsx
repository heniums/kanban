"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { useRouter } from "next/navigation";
import { marked } from "marked";
import {
  Calendar,
  Tag,
  Trash2,
  Plus,
  X,
  Users,
  ListChecks,
  MessageSquare,
  Copy,
  ArrowRightLeft,
  Check,
  Pencil,
} from "lucide-react";
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
} from "@/components/ui/alert-dialog";
import type { Card } from "@/lib/db/schema/cards";
import type { Label } from "@/lib/db/schema/labels";
import {
  updateCardAction,
  deleteCardAction,
  moveCardAction,
  copyCardAction,
} from "@/lib/actions/cards";
import { createLabelAction } from "@/lib/actions/labels";
import {
  createChecklistAction,
  deleteChecklistAction,
  createChecklistItemAction,
  updateChecklistItemAction,
  deleteChecklistItemAction,
} from "@/lib/actions/checklists";
import {
  createCommentAction,
  updateCommentAction,
  deleteCommentAction,
} from "@/lib/actions/comments";
import { cn } from "@/lib/utils";

export interface CardDetailData {
  card: Card;
  labels: { id: string; name: string; color: string }[];
  boardId: string;
  boardLabels: Label[];
  assignees: { id: string; name: string; email: string }[];
  checklists: Array<{
    id: string;
    cardId: string;
    title: string;
    position: number;
    items: Array<{
      id: string;
      checklistId: string;
      content: string;
      isCompleted: boolean;
      position: number;
    }>;
  }>;
  comments: Array<{
    id: string;
    cardId: string;
    userId: string;
    content: string;
    createdAt: Date | string;
    updatedAt: Date | string;
  }>;
  boardMembers: { id: string; name: string; email: string }[];
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
  assigneeIds: string[];
}

export function CardDetail({ boardId, lists }: CardDetailProps) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<CardDetailData | null>(null);
  const [draft, setDraft] = useState<DraftState | null>(null);
  const [isPending, startTransition] = useTransition();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [newlyCreatedLabelIds, setNewlyCreatedLabelIds] = useState<string[]>([]);
  const [moveOpen, setMoveOpen] = useState(false);
  const router = useRouter();

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
          assigneeIds: body.assignees.map((a) => a.id),
        });
        setNewlyCreatedLabelIds([]);
        setOpen(true);
      } catch {
        toast.error("Failed to load card");
      }
    }
    window.addEventListener("card:open", onOpen as EventListener);
    return () => window.removeEventListener("card:open", onOpen as EventListener);
  }, []);

  const dataRef = useRef<CardDetailData | null>(null);
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  async function refreshChecklists(cardId: string) {
    try {
      const res = await fetch(`/api/cards/${cardId}`);
      if (!res.ok) return;
      const body = (await res.json()) as CardDetailData;
      setData((prev) => (prev ? { ...prev, checklists: body.checklists } : prev));
    } catch {
      // ignore
    }
  }

  async function refreshComments(cardId: string) {
    try {
      const res = await fetch(`/api/cards/${cardId}`);
      if (!res.ok) return;
      const body = (await res.json()) as CardDetailData;
      setData((prev) => (prev ? { ...prev, comments: body.comments } : prev));
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    function onChecklistUpdate() {
      const d = dataRef.current;
      if (!d) return;
      void refreshChecklists(d.card.id);
    }
    function onCommentUpdate() {
      const d = dataRef.current;
      if (!d) return;
      void refreshComments(d.card.id);
    }
    window.addEventListener("board:checklist-updated", onChecklistUpdate);
    window.addEventListener("board:comment-updated", onCommentUpdate);
    return () => {
      window.removeEventListener("board:checklist-updated", onChecklistUpdate);
      window.removeEventListener("board:comment-updated", onCommentUpdate);
    };
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

  const isDirty = useMemo(() => {
    if (!data || !draft) return false;
    const titleDirty = draft.title !== data.card.title;
    const descriptionDirty = draft.description !== (data.card.description ?? "");
    const dueDateDirty =
      String(draft.dueDate?.getTime() ?? "") !==
      String(data.card.dueDate ? new Date(data.card.dueDate).getTime() : "");
    const currentSet = new Set(draft.labelIds);
    const originalSet = new Set(data.labels.map((l) => l.id));
    const labelsDirty =
      currentSet.size !== originalSet.size || ![...currentSet].every((id) => originalSet.has(id));
    const assigneeSet = new Set(draft.assigneeIds);
    const originalAssigneeSet = new Set(data.assignees.map((a) => a.id));
    const assigneesDirty =
      assigneeSet.size !== originalAssigneeSet.size ||
      ![...assigneeSet].every((id) => originalAssigneeSet.has(id));
    return titleDirty || descriptionDirty || dueDateDirty || labelsDirty || assigneesDirty;
  }, [data, draft]);

  const handleSave = () => {
    if (!data || !draft) return;
    startTransition(async () => {
      const result = await updateCardAction({
        cardId: data.card.id,
        title: draft.title.trim() || data.card.title,
        description: draft.description,
        dueDate: draft.dueDate,
        labelIds: draft.labelIds,
        assigneeIds: draft.assigneeIds,
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

  const handleMove = (targetListId: string) => {
    if (!data) return;
    if (targetListId === data.card.listId) {
      setMoveOpen(false);
      return;
    }
    startTransition(async () => {
      const targetList = lists.find((l) => l.id === targetListId);
      const result = await moveCardAction({
        cardId: data.card.id,
        targetListId,
        targetPosition: 0,
      });
      if ("errors" in result) {
        toast.error(result.errors.map((e) => e.message).join(", "));
        return;
      }
      toast.success(`Moved to "${targetList?.title ?? "list"}"`);
      setMoveOpen(false);
      router.refresh();
      close();
    });
  };

  const handleCopy = () => {
    if (!data) return;
    startTransition(async () => {
      const result = await copyCardAction({ cardId: data.card.id });
      if ("errors" in result) {
        toast.error(result.errors.map((e) => e.message).join(", "));
        return;
      }
      toast.success("Card copied");
      router.refresh();
    });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? setOpen(true) : close())}>
      <DialogContent
        className="max-h-[92vh] w-[min(96vw,1280px)] max-w-none overflow-y-auto p-0 sm:max-w-none sm:rounded-xl"
        showCloseButton={false}
      >
        {data && draft && (
          <div className="flex flex-col gap-6 p-8">
            <div className="flex items-start justify-between gap-3">
              <TitleEditor
                value={draft.title}
                onChange={(title) => setDraft({ ...draft, title })}
                disabled={isPending}
              />
              <div className="flex items-center gap-1">
                <ActionButton
                  icon={<Copy className="size-4" />}
                  label="Copy card"
                  onClick={handleCopy}
                  disabled={isPending}
                />
                <Popover open={moveOpen} onOpenChange={setMoveOpen}>
                  <PopoverTrigger asChild>
                    <ActionButton
                      icon={<ArrowRightLeft className="size-4" />}
                      label="Move card"
                      onClick={() => setMoveOpen(true)}
                      disabled={isPending}
                    />
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-64 p-0">
                    <div className="border-b px-3 py-2">
                      <div className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
                        Move to list
                      </div>
                    </div>
                    <div className="max-h-56 overflow-y-auto p-1">
                      {lists.map((l) => (
                        <button
                          key={l.id}
                          type="button"
                          onClick={() => handleMove(l.id)}
                          disabled={l.id === data.card.listId}
                          className="hover:bg-muted flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-xs disabled:opacity-50"
                        >
                          <span className="truncate">{l.title}</span>
                          {l.id === data.card.listId && (
                            <span className="text-muted-foreground text-[10px]">current</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
                <DeleteCardButton onClick={() => setDeleteOpen(true)} disabled={isPending} />
              </div>
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
              <MetadataField
                label="Labels"
                icon={<Tag className="size-3.5" />}
                className="min-w-0 flex-1"
              >
                <LabelsControl
                  boardLabels={data.boardLabels}
                  selectedIds={draft.labelIds}
                  onToggle={(labelId) => {
                    const has = draft.labelIds.includes(labelId);
                    setDraft({
                      ...draft,
                      labelIds: has
                        ? draft.labelIds.filter((id) => id !== labelId)
                        : [...draft.labelIds, labelId],
                    });
                  }}
                  onCreateLabel={handleCreateLabel}
                  newlyCreatedIds={newlyCreatedLabelIds}
                  disabled={isPending}
                />
              </MetadataField>
              <MetadataField
                label="Assignees"
                icon={<Users className="size-3.5" />}
                className="min-w-0 flex-1"
              >
                <AssigneesControl
                  boardMembers={data.boardMembers}
                  selectedIds={draft.assigneeIds}
                  onToggle={(userId) => {
                    const has = draft.assigneeIds.includes(userId);
                    setDraft({
                      ...draft,
                      assigneeIds: has
                        ? draft.assigneeIds.filter((id) => id !== userId)
                        : [...draft.assigneeIds, userId],
                    });
                  }}
                  byId={Object.fromEntries(data.assignees.map((a) => [a.id, a]))}
                  disabled={isPending}
                />
              </MetadataField>
            </MetadataBar>

            <DescriptionEditor
              value={draft.description}
              onChange={(description) => setDraft({ ...draft, description })}
              disabled={isPending}
            />

            {data.checklists.length > 0 && (
              <ChecklistsSection
                checklists={data.checklists}
                disabled={isPending}
                onChange={(next) =>
                  setData((prev) =>
                    prev
                      ? {
                          ...prev,
                          checklists: typeof next === "function" ? next(prev.checklists) : next,
                        }
                      : prev,
                  )
                }
              />
            )}
            <AddChecklistButton
              cardId={data.card.id}
              onAdd={(cl) =>
                setData((prev) => (prev ? { ...prev, checklists: [...prev.checklists, cl] } : prev))
              }
              disabled={isPending}
            />

            <CommentsSection
              cardId={data.card.id}
              comments={data.comments}
              boardMembers={data.boardMembers}
              onChange={(next) =>
                setData((prev) =>
                  prev
                    ? { ...prev, comments: typeof next === "function" ? next(prev.comments) : next }
                    : prev,
                )
              }
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

function ActionButton({
  icon,
  label,
  onClick,
  disabled,
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="text-muted-foreground hover:text-foreground shrink-0"
    >
      {icon}
    </Button>
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
  className,
  children,
}: {
  label?: string;
  icon?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
        {icon}
        {label && <span>{label}</span>}
      </div>
      <div>{children}</div>
    </div>
  );
}

function LabelsControl({
  boardLabels,
  selectedIds,
  onToggle,
  onCreateLabel,
  newlyCreatedIds,
  disabled,
}: {
  boardLabels: Label[];
  selectedIds: string[];
  onToggle: (labelId: string) => void;
  onCreateLabel: (name: string, color: string) => Promise<Label | null>;
  newlyCreatedIds: string[];
  disabled: boolean;
}) {
  const selected = new Set(selectedIds);
  const byId = new Map(boardLabels.map((l) => [l.id, l] as const));
  const attached = selectedIds.map((id) => byId.get(id)).filter((l): l is Label => !!l);
  const available = boardLabels.filter((l) => !selected.has(l.id));

  const [name, setName] = useState("");
  const [color, setColor] = useState("#3b82f6");
  const [createOpen, setCreateOpen] = useState(false);

  const submitCreate = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const created = await onCreateLabel(trimmed, color);
    if (created) {
      setName("");
      setColor("#3b82f6");
      setCreateOpen(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {attached.length === 0 && (
        <span className="text-muted-foreground text-xs">No labels attached.</span>
      )}
      {attached.map((l) => {
        const isNew = newlyCreatedIds.includes(l.id);
        return (
          <span
            key={l.id}
            data-testid="attached-label"
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs text-white ${isNew ? "ring-1 ring-emerald-400" : ""}`}
            style={{ backgroundColor: l.color }}
          >
            {l.name}
            <button
              type="button"
              onClick={() => onToggle(l.id)}
              disabled={disabled}
              aria-label={`Remove ${l.name}`}
              className="-mr-1 inline-flex size-4 items-center justify-center rounded-full hover:bg-white/20"
            >
              <X className="size-3" />
            </button>
          </span>
        );
      })}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            aria-label="Add or create label"
            title="Add or create label"
          >
            <Plus className="size-3.5" /> Add label
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-80 p-0">
          <div className="flex flex-col">
            <div className="border-b px-3 py-2">
              <div className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
                Available labels
              </div>
            </div>
            <div className="max-h-56 overflow-y-auto p-1">
              {available.length === 0 ? (
                <div className="text-muted-foreground px-2 py-6 text-center text-xs">
                  Every board label is already attached.
                </div>
              ) : (
                available.map((l) => {
                  const isNew = newlyCreatedIds.includes(l.id);
                  return (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => onToggle(l.id)}
                      className="hover:bg-muted flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs"
                    >
                      <span
                        className="inline-block h-3 w-3 shrink-0 rounded-sm"
                        style={{ backgroundColor: l.color }}
                      />
                      <span className="flex-1 truncate">{l.name}</span>
                      {isNew && <span className="text-muted-foreground text-[10px]">new</span>}
                    </button>
                  );
                })
              )}
            </div>
            <div className="bg-muted/30 border-t p-3">
              {createOpen ? (
                <div className="flex flex-col gap-2">
                  <div className="text-foreground text-[11px] font-medium tracking-wide uppercase">
                    Create new label
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="h-8 w-10 shrink-0 cursor-pointer rounded border"
                      aria-label="Label color"
                    />
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Label name"
                      maxLength={50}
                      autoFocus
                      className="h-8"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          void submitCreate();
                        } else if (e.key === "Escape") {
                          e.preventDefault();
                          setCreateOpen(false);
                        }
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setCreateOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="button" size="sm" onClick={submitCreate} disabled={!name.trim()}>
                      Create
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setCreateOpen(true)}
                  className="hover:bg-muted flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs"
                >
                  <Plus className="size-3.5" />
                  <span>Create new label</span>
                </button>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

function AssigneesControl({
  boardMembers,
  selectedIds,
  onToggle,
  byId,
  disabled,
}: {
  boardMembers: { id: string; name: string; email: string }[];
  selectedIds: string[];
  onToggle: (userId: string) => void;
  byId: Record<string, { id: string; name: string; email: string }>;
  disabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const selected = new Set(selectedIds);
  const attached = selectedIds
    .map((id) => byId[id])
    .filter((u): u is { id: string; name: string; email: string } => !!u);
  const filtered = boardMembers.filter((m) => {
    if (selected.has(m.id)) return false;
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q);
  });
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {attached.length === 0 && (
        <span className="text-muted-foreground text-xs">No assignees.</span>
      )}
      {attached.map((u) => (
        <span
          key={u.id}
          data-testid="attached-assignee"
          className="bg-muted text-foreground inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs"
        >
          {u.name}
          <button
            type="button"
            onClick={() => onToggle(u.id)}
            disabled={disabled}
            aria-label={`Unassign ${u.name}`}
            className="hover:bg-background -mr-1 inline-flex size-4 items-center justify-center rounded-full"
          >
            <X className="size-3" />
          </button>
        </span>
      ))}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            aria-label="Add assignee"
            title="Add assignee"
          >
            <Plus className="size-3.5" /> Assign
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-72 p-0">
          <div className="border-b p-2">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search members…"
              className="h-8"
              autoFocus
            />
          </div>
          <div className="max-h-56 overflow-y-auto p-1">
            {filtered.length === 0 ? (
              <div className="text-muted-foreground px-2 py-6 text-center text-xs">
                {boardMembers.length === 0
                  ? "No other registered users to assign."
                  : "No matching members."}
              </div>
            ) : (
              filtered.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    onToggle(m.id);
                    setSearch("");
                  }}
                  className="hover:bg-muted flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs"
                >
                  <span className="bg-muted text-foreground inline-flex size-5 items-center justify-center rounded-full text-[10px] font-semibold">
                    {m.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="flex-1 truncate">{m.name}</span>
                  <span className="text-muted-foreground truncate text-[10px]">{m.email}</span>
                </button>
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
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
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const html = useMemo(() => {
    if (!value.trim()) return "";
    try {
      return marked.parse(value, { async: false }) as string;
    } catch {
      return `<p>${value.replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" })[c] ?? c)}</p>`;
    }
  }, [value]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label htmlFor="card-description" className="text-muted-foreground text-xs font-medium">
          Description (markdown supported)
        </label>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            size="sm"
            variant={mode === "edit" ? "secondary" : "ghost"}
            onClick={() => setMode("edit")}
            disabled={disabled}
          >
            <Pencil className="mr-1 size-3" /> Edit
          </Button>
          <Button
            type="button"
            size="sm"
            variant={mode === "preview" ? "secondary" : "ghost"}
            onClick={() => setMode("preview")}
            disabled={disabled}
          >
            Preview
          </Button>
        </div>
      </div>
      {mode === "edit" ? (
        <textarea
          id="card-description"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          maxLength={5000}
          rows={6}
          aria-label="Card description"
          placeholder="Add a description. Markdown is supported: **bold**, *italic*, `code`, [link](url), - lists"
          className="border-input bg-background placeholder:text-muted-foreground w-full rounded-md border px-3 py-2 font-mono text-sm"
        />
      ) : (
        <div
          data-testid="description-preview"
          className="border-input bg-background min-h-[6rem] w-full rounded-md border px-3 py-2 text-sm"
        >
          {html ? (
            <div className="markdown-preview" dangerouslySetInnerHTML={{ __html: html }} />
          ) : (
            <p className="text-muted-foreground">No description yet.</p>
          )}
        </div>
      )}
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

function AddChecklistButton({
  cardId,
  onAdd,
  disabled,
}: {
  cardId: string;
  onAdd: (cl: {
    id: string;
    cardId: string;
    title: string;
    position: number;
    items: never[];
  }) => void;
  disabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("Checklist");
  return (
    <div className="flex flex-col gap-2">
      {open ? (
        <div className="flex flex-col gap-2 rounded-md border p-3">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Checklist title"
            maxLength={200}
            autoFocus
            onKeyDown={async (e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                const trimmed = title.trim();
                if (!trimmed) return;
                const result = await createChecklistAction({ cardId, title: trimmed });
                if ("errors" in result) {
                  toast.error(result.errors.map((e) => e.message).join(", "));
                  return;
                }
                onAdd({ id: result.data.id, cardId, title: trimmed, position: 0, items: [] });
                setTitle("Checklist");
                setOpen(false);
              } else if (e.key === "Escape") {
                setOpen(false);
              }
            }}
          />
          <div className="flex justify-end gap-2">
            <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={!title.trim() || disabled}
              onClick={async () => {
                const trimmed = title.trim();
                if (!trimmed) return;
                const result = await createChecklistAction({ cardId, title: trimmed });
                if ("errors" in result) {
                  toast.error(result.errors.map((e) => e.message).join(", "));
                  return;
                }
                onAdd({ id: result.data.id, cardId, title: trimmed, position: 0, items: [] });
                setTitle("Checklist");
                setOpen(false);
              }}
            >
              Add
            </Button>
          </div>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setOpen(true)}
          disabled={disabled}
          className="self-start"
        >
          <ListChecks className="mr-1 size-3.5" /> Add checklist
        </Button>
      )}
    </div>
  );
}

function ChecklistsSection({
  checklists,
  disabled,
  onChange,
}: {
  checklists: CardDetailData["checklists"];
  disabled: boolean;
  onChange: Dispatch<SetStateAction<CardDetailData["checklists"]>>;
}) {
  return (
    <div className="flex flex-col gap-3">
      {checklists.map((cl) => (
        <Checklist key={cl.id} checklist={cl} disabled={disabled} onChange={onChange} />
      ))}
    </div>
  );
}

function Checklist({
  checklist,
  disabled,
  onChange,
}: {
  checklist: CardDetailData["checklists"][number];
  disabled: boolean;
  onChange: Dispatch<SetStateAction<CardDetailData["checklists"]>>;
}) {
  const completed = checklist.items.filter((i) => i.isCompleted).length;
  const total = checklist.items.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  const handleDelete = async () => {
    const result = await deleteChecklistAction({ checklistId: checklist.id });
    if ("errors" in result) {
      toast.error(result.errors.map((e) => e.message).join(", "));
      return;
    }
    onChange((prev) => prev.filter((c) => c.id !== checklist.id));
  };

  return (
    <div className="flex flex-col gap-2 rounded-md border p-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">{checklist.title}</h4>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={handleDelete}
          disabled={disabled}
          aria-label="Delete checklist"
          title="Delete checklist"
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>
      {total > 0 && (
        <div className="flex flex-col gap-1">
          <div className="text-muted-foreground text-xs">
            {completed}/{total} ({pct}%)
          </div>
          <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
            <div className="bg-primary h-full transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}
      <div className="flex flex-col gap-1">
        {checklist.items.map((item) => (
          <ChecklistItem
            key={item.id}
            item={item}
            checklistId={checklist.id}
            disabled={disabled}
            onChange={onChange}
          />
        ))}
      </div>
      <AddChecklistItem
        checklistId={checklist.id}
        disabled={disabled}
        onAdded={(item) =>
          onChange((prev) =>
            prev.map((c) => (c.id === checklist.id ? { ...c, items: [...c.items, item] } : c)),
          )
        }
      />
    </div>
  );
}

function ChecklistItem({
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

function AddChecklistItem({
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

function CommentsSection({
  cardId,
  comments,
  boardMembers,
  onChange,
}: {
  cardId: string;
  comments: CardDetailData["comments"];
  boardMembers: { id: string; name: string; email: string }[];
  onChange: Dispatch<SetStateAction<CardDetailData["comments"]>>;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
        <MessageSquare className="size-3.5" /> Comments
      </div>
      <div className="flex flex-col gap-2">
        {comments.length === 0 && <p className="text-muted-foreground text-xs">No comments yet.</p>}
        {comments.map((c) => (
          <CommentItem key={c.id} comment={c} boardMembers={boardMembers} onChange={onChange} />
        ))}
      </div>
      <AddComment cardId={cardId} onAdded={(c) => onChange([...comments, c])} />
    </div>
  );
}

function CommentItem({
  comment,
  boardMembers,
  onChange,
}: {
  comment: CardDetailData["comments"][number];
  boardMembers: { id: string; name: string; email: string }[];
  onChange: Dispatch<SetStateAction<CardDetailData["comments"]>>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(comment.content);
  const author = boardMembers.find((m) => m.id === comment.userId);
  const authorName = author?.name ?? "Unknown";

  const handleSave = async () => {
    const next = draft.trim();
    if (!next) return;
    if (next === comment.content) {
      setEditing(false);
      return;
    }
    onChange((prev) => prev.map((c) => (c.id === comment.id ? { ...c, content: next } : c)));
    setEditing(false);
    const result = await updateCommentAction({ commentId: comment.id, content: next });
    if ("errors" in result) {
      onChange((prev) =>
        prev.map((c) => (c.id === comment.id ? { ...c, content: comment.content } : c)),
      );
      toast.error(result.errors.map((e) => e.message).join(", "));
    }
  };

  const handleDelete = async () => {
    onChange((prev) => prev.filter((c) => c.id !== comment.id));
    const result = await deleteCommentAction({ commentId: comment.id });
    if ("errors" in result) {
      onChange((prev) => [...prev, comment]);
      toast.error(result.errors.map((e) => e.message).join(", "));
    }
  };

  const created = new Date(comment.createdAt);
  const createdStr = created.toLocaleString();

  return (
    <div className="group/comment flex flex-col gap-1 rounded-md border p-2">
      <div className="flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="bg-muted text-foreground inline-flex size-5 items-center justify-center rounded-full text-[10px] font-semibold">
            {authorName.charAt(0).toUpperCase()}
          </span>
          <span className="font-medium">{authorName}</span>
          <span className="text-muted-foreground">{createdStr}</span>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover/comment:opacity-100">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => {
              setDraft(comment.content);
              setEditing(true);
            }}
            aria-label="Edit comment"
            className="text-muted-foreground"
          >
            <Pencil className="size-3" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={handleDelete}
            aria-label="Delete comment"
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="size-3" />
          </Button>
        </div>
      </div>
      {editing ? (
        <div className="flex flex-col gap-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={2000}
            rows={3}
            autoFocus
            className="border-input bg-background w-full rounded-md border px-2 py-1 text-sm"
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                setDraft(comment.content);
                setEditing(false);
              }}
            >
              Cancel
            </Button>
            <Button type="button" size="sm" onClick={handleSave} disabled={!draft.trim()}>
              Save
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
      )}
    </div>
  );
}

function AddComment({
  cardId,
  onAdded,
}: {
  cardId: string;
  onAdded: (c: CardDetailData["comments"][number]) => void;
}) {
  const [content, setContent] = useState("");
  const [isPending, startTransition] = useTransition();
  const submit = () => {
    const trimmed = content.trim();
    if (!trimmed) return;
    startTransition(async () => {
      const result = await createCommentAction({ cardId, content: trimmed });
      if ("errors" in result) {
        toast.error(result.errors.map((e) => e.message).join(", "));
        return;
      }
      if (result.data) {
        onAdded({
          id: result.data.id,
          cardId: result.data.cardId,
          userId: result.data.userId,
          content: result.data.content,
          createdAt: result.data.createdAt,
          updatedAt: result.data.updatedAt,
        });
      }
      setContent("");
    });
  };
  return (
    <div className="flex flex-col gap-2">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write a comment…"
        maxLength={2000}
        rows={2}
        className="border-input bg-background placeholder:text-muted-foreground w-full rounded-md border px-3 py-2 text-sm"
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
            e.preventDefault();
            submit();
          }
        }}
      />
      <div className="flex justify-end">
        <Button type="button" size="sm" onClick={submit} disabled={!content.trim() || isPending}>
          {isPending ? "Posting…" : "Comment"}
        </Button>
      </div>
    </div>
  );
}
