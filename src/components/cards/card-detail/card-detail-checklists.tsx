"use client";

import { useState, type Dispatch, type SetStateAction } from "react";
import { ListChecks, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createChecklistAction, deleteChecklistAction } from "@/lib/actions/checklists";
import { ChecklistItem, AddChecklistItem } from "./card-detail-checklist-items";
import type { CardDetailData } from "./types";

export function ChecklistsSection({
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

export function AddChecklistButton({
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
