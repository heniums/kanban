"use client";

import { useState } from "react";
import { Loader2, Pencil, Plus, Search, Trash2, X } from "lucide-react";
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
import type { Label } from "@/lib/db/schema/labels";

const LABEL_PALETTE = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#06b6d4",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#6b7280",
  "#1f2937",
] as const;

export function LabelsControl({
  boardLabels,
  selectedIds,
  onToggle,
  onCreateLabel,
  onUpdateLabel,
  onDeleteLabel,
  newlyCreatedIds,
  disabled,
}: {
  boardLabels: Label[];
  selectedIds: string[];
  onToggle: (labelId: string) => void;
  onCreateLabel: (name: string, color: string) => Promise<Label | null | undefined>;
  onUpdateLabel?: (labelId: string, name: string, color: string) => Promise<boolean>;
  onDeleteLabel?: (labelId: string) => Promise<boolean>;
  newlyCreatedIds: string[];
  disabled: boolean;
}) {
  const selected = new Set(selectedIds);
  const byId = new Map(boardLabels.map((l) => [l.id, l] as const));
  const attached = selectedIds.map((id) => byId.get(id)).filter((l): l is Label => !!l);

  const [name, setName] = useState("");
  const [color, setColor] = useState("#3b82f6");
  const [createOpen, setCreateOpen] = useState(false);

  const [search, setSearch] = useState("");
  const lower = search.toLowerCase();
  const available = boardLabels.filter(
    (l) => !selected.has(l.id) && (!search || l.name.toLowerCase().includes(lower)),
  );

  const [editLabelId, setEditLabelId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("#3b82f6");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLabelId, setDeleteLabelId] = useState<string | null>(null);

  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const submitCreate = async () => {
    const trimmed = name.trim();
    if (!trimmed || isCreating || disabled) return;
    setIsCreating(true);
    try {
      const created = await onCreateLabel(trimmed, color);
      if (created) {
        setName("");
        setColor("#3b82f6");
        setCreateOpen(false);
      }
    } finally {
      setIsCreating(false);
    }
  };

  const startEdit = (label: Label) => {
    setEditLabelId(label.id);
    setEditName(label.name);
    setEditColor(label.color);
  };

  const cancelEdit = () => {
    setEditLabelId(null);
    setEditName("");
    setEditColor("#3b82f6");
  };

  const submitEdit = async () => {
    if (!editLabelId || !onUpdateLabel || !editName.trim() || isUpdating || disabled) return;
    setIsUpdating(true);
    try {
      const ok = await onUpdateLabel(editLabelId, editName.trim(), editColor);
      if (ok) cancelEdit();
    } finally {
      setIsUpdating(false);
    }
  };

  const requestDelete = (labelId: string) => {
    setDeleteLabelId(labelId);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteLabelId || !onDeleteLabel || isDeleting || disabled) return;
    setIsDeleting(true);
    try {
      await onDeleteLabel(deleteLabelId);
      setDeleteOpen(false);
      setDeleteLabelId(null);
      setEditLabelId(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
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
              className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs text-white ${isNew ? "ring-1 ring-emerald-400" : ""}`}
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
                  Labels
                </div>
              </div>
              <div className="px-3 py-2">
                <div className="relative">
                  <Search className="text-muted-foreground absolute top-1/2 left-2 size-3.5 -translate-y-1/2" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search labels..."
                    className="h-8 pl-7 text-xs"
                    aria-label="Search labels"
                  />
                </div>
              </div>
              <div className="max-h-56 overflow-y-auto p-1">
                {boardLabels.length === 0 && (
                  <div className="text-muted-foreground px-2 py-6 text-center text-xs">
                    No labels on this board yet.
                  </div>
                )}
                {boardLabels.length > 0 && available.length === 0 && search && (
                  <div className="text-muted-foreground px-2 py-6 text-center text-xs">
                    No matching labels.
                  </div>
                )}
                {available.map((l) => {
                  const isNew = newlyCreatedIds.includes(l.id);
                  const isEditing = editLabelId === l.id;
                  return (
                    <div key={l.id}>
                      {isEditing ? (
                        <div className="flex flex-col gap-2 rounded border p-2">
                          <Input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            placeholder="Label name"
                            maxLength={50}
                            autoFocus
                            className="h-7 text-xs"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                void submitEdit();
                              } else if (e.key === "Escape") {
                                e.preventDefault();
                                cancelEdit();
                              }
                            }}
                          />
                          <div className="flex flex-wrap gap-1.5">
                            {LABEL_PALETTE.map((c) => (
                              <button
                                key={c}
                                type="button"
                                onClick={() => setEditColor(c)}
                                aria-label={`Color ${c}`}
                                className={`size-5 rounded-full border-2 transition-colors ${
                                  editColor === c
                                    ? "border-foreground ring-foreground ring-2 ring-offset-1"
                                    : "border-transparent"
                                }`}
                                style={{ backgroundColor: c }}
                              />
                            ))}
                          </div>
                          <div className="flex items-center justify-between">
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="text-destructive h-7 text-xs"
                              onClick={() => requestDelete(l.id)}
                              disabled={disabled || isDeleting}
                              aria-label={`Delete label ${l.name}`}
                            >
                              <Trash2 className="size-3" />
                            </Button>
                            <div className="flex items-center gap-1">
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                className="h-7 text-xs"
                                onClick={cancelEdit}
                              >
                                Cancel
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={submitEdit}
                                disabled={!editName.trim() || isUpdating || disabled}
                                aria-busy={isUpdating}
                              >
                                {isUpdating && <Loader2 className="size-3 animate-spin" />}
                                Save
                              </Button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onToggle(l.id)}
                          className="hover:bg-muted group/label flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs"
                        >
                          <span
                            className="inline-block h-3 w-3 shrink-0 rounded-full"
                            style={{ backgroundColor: l.color }}
                          />
                          <span className="flex-1 truncate">{l.name}</span>
                          {isNew && <span className="text-muted-foreground text-[10px]">new</span>}
                          {onUpdateLabel && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                startEdit(l);
                              }}
                              aria-label={`Edit ${l.name}`}
                              className="text-muted-foreground hover:text-foreground shrink-0 rounded p-0.5 opacity-0 group-hover/label:opacity-100 focus-visible:opacity-100"
                            >
                              <Pencil className="size-3" />
                            </button>
                          )}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="bg-muted/30 border-t p-3">
                {createOpen ? (
                  <div className="flex flex-col gap-2">
                    <div className="text-foreground text-[11px] font-medium tracking-wide uppercase">
                      Create new label
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex flex-wrap gap-1">
                        {LABEL_PALETTE.map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setColor(c)}
                            aria-label={`Color ${c}`}
                            className={`size-5 rounded-full border-2 transition-colors ${
                              color === c
                                ? "border-foreground ring-foreground ring-2 ring-offset-1"
                                : "border-transparent"
                            }`}
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-block h-6 w-6 shrink-0 rounded-full border"
                        style={{ backgroundColor: color }}
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
                      <Button
                        type="button"
                        size="sm"
                        onClick={submitCreate}
                        disabled={!name.trim() || isCreating || disabled}
                        aria-busy={isCreating}
                      >
                        {isCreating && <Loader2 className="size-3.5 animate-spin" />}
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

      <AlertDialog open={deleteOpen} onOpenChange={(open) => !isDeleting && setDeleteOpen(open)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this label?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the label from all cards on this board. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void confirmDelete();
              }}
              disabled={isDeleting || disabled}
              aria-busy={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="size-3.5 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
