"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Board } from "@/lib/db/schema/boards";

import { deleteBoardAction, restoreBoardAction } from "@/lib/actions/boards";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { BoardSettings } from "./board-settings";

type BoardActionsVariant = "default" | "overlay";

interface BoardActionsProps {
  board: Board;
  variant?: BoardActionsVariant;
}

const UNDO_DURATION_MS = 5000;

const OVERLAY_BUTTON_CLASS =
  "border border-white/30 bg-black/20 text-white backdrop-blur-sm hover:bg-black/30";

export function BoardActions({ board, variant = "default" }: BoardActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [inFlight, setInFlight] = useState(false);

  const isOverlay = variant === "overlay";
  const settingsClass = isOverlay ? OVERLAY_BUTTON_CLASS : undefined;
  const deleteClass = isOverlay ? OVERLAY_BUTTON_CLASS : undefined;

  const handleDelete = () => {
    if (inFlight) return;
    setInFlight(true);
    startTransition(async () => {
      try {
        const result = await deleteBoardAction(board.id);
        if (result && "error" in result) {
          toast.error("Failed to delete board.");
          return;
        }
        setDeleteOpen(false);
        toast("Board deleted.", {
          duration: UNDO_DURATION_MS,
          action: {
            label: "Undo",
            onClick: async () => {
              try {
                await restoreBoardAction(board.id);
                router.refresh();
              } catch {
                toast.error("Failed to restore board.");
              }
            },
          },
        });
        router.push("/boards");
      } finally {
        setInFlight(false);
      }
    });
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={isOverlay ? "ghost" : "outline"}
        className={settingsClass}
        onClick={() => setSettingsOpen(true)}
      >
        Settings
      </Button>

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Board settings</DialogTitle>
            <DialogDescription>
              Update your board&apos;s title, description, and background.
            </DialogDescription>
          </DialogHeader>
          <BoardSettings board={board} onClose={() => setSettingsOpen(false)} />
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" className={deleteClass}>
            Delete
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this board?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The board will be removed from your dashboard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={inFlight}>Cancel</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isPending || inFlight}
            >
              {isPending || inFlight ? "Deleting..." : "Delete"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
