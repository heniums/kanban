"use client";

import { useState, useEffect, useCallback } from "react";
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

const COUNTDOWN_SECONDS = 5;

export function TrashBoardList({ boards }: TrashBoardListProps) {
  const [deleteTarget, setDeleteTarget] = useState<Board | null>(null);
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);

  useEffect(() => {
    if (!deleteTarget || countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [deleteTarget, countdown]);

  const handleOpenChange = useCallback((open: boolean) => {
    if (!open) {
      setDeleteTarget(null);
      setCountdown(COUNTDOWN_SECONDS);
    }
  }, []);

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

      <AlertDialog open={!!deleteTarget} onOpenChange={handleOpenChange}>
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
            <Button variant="destructive" disabled={countdown > 0}>
              {countdown > 0 ? `Delete permanently (${countdown}s)` : "Delete permanently"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
