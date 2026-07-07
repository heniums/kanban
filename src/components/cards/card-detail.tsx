"use client";

import { Calendar, Tag, Users } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
import { TitleBar } from "./card-detail/card-detail-title-bar";
import { MovePopover } from "./card-detail/card-detail-move-popover";
import { DueDateField } from "./card-detail/card-detail-due-date";
import { LabelsControl } from "./card-detail/card-detail-labels";
import { AssigneesControl } from "./card-detail/card-detail-assignees";
import { MetadataBar, MetadataField } from "./card-detail/card-detail-metadata";
import { DescriptionEditor } from "./card-detail/card-detail-description";
import { AddChecklistButton, ChecklistsSection } from "./card-detail/card-detail-checklists";
import { CommentsSection } from "./card-detail/card-detail-comments";
import { CardDetailAttachments } from "./card-detail/card-detail-attachments";
import { useCardDetail } from "./card-detail/use-card-detail";

export type { CardDetailData } from "./card-detail/types";

interface CardDetailProps {
  boardId: string;
  lists: { id: string; title: string }[];
}

export function CardDetail({ boardId, lists }: CardDetailProps) {
  const {
    open,
    setOpen,
    data,
    draft,
    isPending,
    deleteOpen,
    newlyCreatedLabelIds,
    moveOpen,
    isDirty,
    setData,
    setDraft,
    setDeleteOpen,
    setMoveOpen,
    close,
    handleSave,
    handleCreateLabel,
    handleUpdateLabel,
    handleDeleteLabel,
    handleDelete,
    handleMove,
    handleCopy,
  } = useCardDetail({ boardId, lists });

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? setOpen(true) : close())}>
      <DialogContent
        className="max-h-[92vh] w-[min(96vw,1280px)] max-w-none overflow-y-auto p-0 sm:max-w-none sm:rounded-xl"
        showCloseButton={false}
      >
        {data && draft && (
          <div className="flex flex-col gap-6 p-8">
            <TitleBar
              title={draft.title}
              onTitleChange={(title) => setDraft({ ...draft, title })}
              onCopy={handleCopy}
              moveTrigger={
                <MovePopover
                  open={moveOpen}
                  onOpenChange={setMoveOpen}
                  lists={lists}
                  currentListId={data.card.listId}
                  onMove={handleMove}
                  isPending={isPending}
                />
              }
              onDeleteRequest={() => setDeleteOpen(true)}
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
                  value={draft.dueDate}
                  onChange={(dueDate) => setDraft({ ...draft, dueDate })}
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
                  onUpdateLabel={handleUpdateLabel}
                  onDeleteLabel={handleDeleteLabel}
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
                  byId={Object.fromEntries(
                    data.boardMembers
                      .filter((m) => draft.assigneeIds.includes(m.id))
                      .map((m) => [m.id, m]),
                  )}
                  disabled={isPending}
                />
              </MetadataField>
            </MetadataBar>

            <DescriptionEditor
              value={draft.description}
              onChange={(description) => setDraft({ ...draft, description })}
              disabled={isPending}
            />

            <CardDetailAttachments
              cardId={data.card.id}
              boardId={boardId}
              attachments={data.attachments}
              onChange={(next) => setData((prev) => (prev ? { ...prev, attachments: next } : prev))}
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
