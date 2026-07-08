"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getTextColor } from "@/lib/text-color";
import type { Board } from "@/lib/db/schema/boards";
import type { BoardCapabilities } from "@/lib/capabilities";

import { deleteBoardAction, restoreBoardAction } from "@/lib/actions/boards";
import { Button } from "@/components/ui/button";
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

type BoardActionsVariant = "default" | "overlay";

interface BoardActionsProps {
  board: Board;
  variant?: BoardActionsVariant;
  capabilities?: BoardCapabilities;
}

const UNDO_DURATION_MS = 5000;

export function BoardActions({ board, variant = "default", capabilities }: BoardActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [inFlight, setInFlight] = useState(false);

  const isOverlay = variant === "overlay";
  const isDarkBg = isOverlay && getTextColor(board.background) === "white";

  const settingsClass = isOverlay
    ? cn(
        "border backdrop-blur-sm",
        isDarkBg
          ? "border-white/30 bg-black/20 text-white hover:bg-black/30"
          : "border-black/20 bg-white/20 text-black hover:bg-white/30",
      )
    : undefined;
  const deleteClass = isOverlay
    ? cn(
        "border backdrop-blur-sm",
        isDarkBg
          ? "border-red-300/40 bg-red-500/30 text-white hover:bg-red-500/40"
          : "border-red-300/40 bg-red-100/60 text-red-800 hover:bg-red-100/80",
      )
    : undefined;

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
      {capabilities?.settings && (
        <Button asChild variant={isOverlay ? "ghost" : "outline"} className={settingsClass}>
          <Link href={`/boards/${board.id}/settings`}>Settings</Link>
        </Button>
      )}

      {capabilities?.delete && (
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
      )}
    </div>
  );
}
