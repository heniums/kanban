import { type ReactNode } from "react";
import { Calendar, Tag, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Label } from "@/lib/db/schema/labels";
import { LabelsControl } from "./card-detail-labels";
import { AssigneesControl } from "./card-detail-assignees";
import { TitleBar } from "./card-detail-title-bar";
import { MovePopover } from "./card-detail-move-popover";
import { DueDateField } from "./card-detail-due-date";
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
  onUpdateLabel?: (labelId: string, name: string, color: string) => Promise<boolean>;
  onDeleteLabel?: (labelId: string) => Promise<boolean>;
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
    moveOpen,
    onMoveOpenChange,
    onMove,
    onDeleteRequest,
    onLabelToggle,
    onCreateLabel,
    onUpdateLabel,
    onDeleteLabel,
    newlyCreatedLabelIds,
    onAssigneeToggle,
    onDueDateChange,
  } = props;

  return (
    <>
      <TitleBar
        title={draft.title}
        onTitleChange={onTitleChange}
        onCopy={onCopy}
        moveTrigger={
          <MovePopover
            open={moveOpen}
            onOpenChange={onMoveOpenChange}
            lists={lists}
            currentListId={data.card.listId}
            onMove={onMove}
            isPending={isPending}
          />
        }
        onDeleteRequest={onDeleteRequest}
        isPending={isPending}
      />

      <div className="text-muted-foreground -mt-4 text-xs">
        in list{" "}
        <span className="font-medium">
          {lists.find((l) => l.id === data.card.listId)?.title ?? "—"}
        </span>
      </div>

      <MetadataBar>
        <MetadataField label="Due date" icon={<Calendar className="size-3.5" />}>
          <DueDateField
            value={data.card.dueDate ? new Date(data.card.dueDate) : null}
            onChange={onDueDateChange}
            isPending={isPending}
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
            onUpdateLabel={onUpdateLabel}
            onDeleteLabel={onDeleteLabel}
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
