"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface Member {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
}

export function AssigneesControl({
  boardMembers,
  selectedIds,
  onToggle,
  byId,
  disabled,
}: {
  boardMembers: Member[];
  selectedIds: string[];
  onToggle: (userId: string) => void;
  byId: Record<string, Member>;
  disabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const selected = new Set(selectedIds);
  const attached = selectedIds.map((id) => byId[id]).filter((u): u is Member => !!u);
  const filtered = boardMembers.filter((m) => {
    if (selected.has(m.id)) return false;
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q);
  });

  const renderAvatar = (u: Member) => {
    const className =
      "inline-flex size-5 items-center justify-center rounded-full border text-[10px] font-semibold";
    if (u.avatarUrl) {
      return <img src={u.avatarUrl} alt={u.name} className={`${className} object-cover`} />;
    }
    return (
      <span className={`bg-muted text-foreground ${className}`}>
        {u.name.charAt(0).toUpperCase()}
      </span>
    );
  };

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
          {renderAvatar(u)}
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
                  {renderAvatar(m)}
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
