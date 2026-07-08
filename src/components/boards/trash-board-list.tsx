"use client";

import { useState } from "react";
import Link from "next/link";
import type { Board } from "@/lib/db/schema/boards";
import { DeletedBoardCard } from "@/components/boards/deleted-board-card";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface TrashBoardListProps {
  boards: Board[];
}

export function TrashBoardList({ boards }: TrashBoardListProps) {
  const [deleteTarget, setDeleteTarget] = useState<Board | null>(null);

  if (boards.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <p className="text-muted-foreground">No deleted boards.</p>
        <Link
          href="/"
          className="text-muted-foreground hover:text-foreground mt-2 inline-block text-sm underline-offset-4 hover:underline"
        >
          Back to dashboard
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {boards.map((board) => (
          <DeletedBoardCard
            key={board.id}
            board={board}
            onPermanentDelete={(b) => setDeleteTarget(b)}
          />
        ))}
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this board permanently?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. All lists, cards, labels, and attachments will be
              permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button variant="destructive" disabled>
              Delete permanently
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
