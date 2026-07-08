"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2, RotateCcw } from "lucide-react";
import type { Board } from "@/lib/db/schema/boards";
import { restoreBoardAction } from "@/lib/actions/boards";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";

interface DeletedBoardCardProps {
  board: Board;
  onPermanentDelete: (board: Board) => void;
}

function formatDeletedDate(date: Date | null): string {
  if (!date) return "";
  return new Date(date).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function DeletedBoardCard({ board, onPermanentDelete }: DeletedBoardCardProps) {
  const router = useRouter();
  const [isRestoring, startRestore] = useTransition();

  const handleRestore = () => {
    startRestore(async () => {
      try {
        const result = await restoreBoardAction(board.id);
        if (result && "error" in result) {
          toast.error("Failed to restore board.");
          return;
        }
        toast("Board restored.");
        router.refresh();
      } catch {
        toast.error("Failed to restore board.");
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{board.title}</CardTitle>
        {board.description && <CardDescription>{board.description}</CardDescription>}
        <CardDescription>Deleted {formatDeletedDate(board.deletedAt)}</CardDescription>
      </CardHeader>
      <CardFooter>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRestore}
          disabled={isRestoring}
          className="mr-2"
        >
          <RotateCcw className="mr-1 size-4" />
          {isRestoring ? "Restoring..." : "Restore"}
        </Button>
        <Button variant="destructive" size="sm" onClick={() => onPermanentDelete(board)}>
          <Trash2 className="mr-1 size-4" />
          Delete permanently
        </Button>
      </CardFooter>
    </Card>
  );
}
