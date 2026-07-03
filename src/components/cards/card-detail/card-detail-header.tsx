import { type ReactNode } from "react";
import { ArrowRightLeft, Calendar, Copy, Tag, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { Label } from "@/lib/db/schema/labels";
import { LabelsControl } from "./card-detail-labels";
import { AssigneesControl } from "./card-detail-assignees";
import type { CardDetailData } from "./types";

export interface CardDetailHeaderProps {
  data: CardDetailData;
  draft: {
    title: string;
    labelIds: string[];
    assigneeIds: string[];
  };
  lists: { id: string; title: string }[];
  isPending: boolean;
  onTitleChange: (title: string) => void;
  onCopy: () => void;
  onMoveRequest: () => void;
  moveOpen: boolean;
  onMoveOpenChange: (open: boolean) => void;
  onMove: (targetListId: string) => void;
  onDeleteRequest: () => void;
  onLabelToggle: (labelId: string) => void;
  onCreateLabel: (name: string, color: string) => Promise<Label | null | undefined>;
  newlyCreatedLabelIds: string[];
  onAssigneeToggle: (userId: string) => void;
  onDueDateChange: (date: Date | null) => void;
}

export function CardDetailHeader(props: CardDetailHeaderProps) {
  const {
    data,
    draft,
    lists,
    isPending,
    onTitleChange,
    onCopy,
    onMoveRequest,
    moveOpen,
    onMoveOpenChange,
    onMove,
    onDeleteRequest,
    onLabelToggle,
    onCreateLabel,
    newlyCreatedLabelIds,
    onAssigneeToggle,
    onDueDateChange,
  } = props;

  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <TitleEditor value={draft.title} onChange={onTitleChange} disabled={isPending} />
        <div className="flex items-center gap-1">
          <ActionButton
            icon={<Copy className="size-4" />}
            label="Copy card"
            onClick={onCopy}
            disabled={isPending}
          />
          <Popover open={moveOpen} onOpenChange={onMoveOpenChange}>
            <PopoverTrigger asChild>
              <ActionButton
                icon={<ArrowRightLeft className="size-4" />}
                label="Move card"
                onClick={onMoveRequest}
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
                    onClick={() => onMove(l.id)}
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
          <DeleteCardButton onClick={onDeleteRequest} disabled={isPending} />
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
            value={data.card.dueDate ? new Date(data.card.dueDate) : null}
            onChange={onDueDateChange}
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
            onToggle={onLabelToggle}
            onCreateLabel={onCreateLabel}
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
            onToggle={onAssigneeToggle}
            byId={Object.fromEntries(data.assignees.map((a) => [a.id, a]))}
            disabled={isPending}
          />
        </MetadataField>
      </MetadataBar>
    </>
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

function toDateInput(d: Date | null): string {
  if (!d) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
