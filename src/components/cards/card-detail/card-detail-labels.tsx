"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { Label } from "@/lib/db/schema/labels";

export function LabelsControl({
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
  onCreateLabel: (name: string, color: string) => Promise<Label | null | undefined>;
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
