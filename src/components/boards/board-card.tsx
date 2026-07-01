import Link from "next/link";
import type { Board } from "@/lib/db/schema/boards";
import { BoardHero } from "@/components/boards/board-hero";

interface BoardCardProps {
  board: Board;
}

export function BoardCard({ board }: BoardCardProps) {
  return (
    <Link
      href={`/boards/${board.id}`}
      className="border-border bg-card focus-visible:ring-ring block overflow-hidden rounded-lg border transition-shadow hover:shadow-md focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
    >
      <BoardHero board={board} variant="compact" />
    </Link>
  );
}

export function BoardCardSkeleton() {
  return (
    <div className="border-border bg-card overflow-hidden rounded-lg border">
      <div className="bg-muted h-24 animate-pulse" />
      <div className="space-y-2 p-4">
        <div className="bg-muted h-5 w-3/4 animate-pulse rounded" />
        <div className="bg-muted h-4 w-1/2 animate-pulse rounded" />
      </div>
    </div>
  );
}
