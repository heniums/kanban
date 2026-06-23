import Link from "next/link";
import type { Board } from "@kanban/shared";

interface BoardCardProps {
  board: Board;
}

export function BoardCard({ board }: BoardCardProps) {
  return (
    <Link
      href={`/boards/${board.id}`}
      className="group block rounded-lg border border-border bg-card transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <div
        className="h-24 rounded-t-lg"
        style={{ background: board.background }}
      />
      <div className="p-4">
        <h3 className="font-semibold truncate">{board.title}</h3>
        {board.description && (
          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
            {board.description}
          </p>
        )}
      </div>
    </Link>
  );
}

export function BoardCardSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="h-24 animate-pulse rounded-t-lg bg-muted" />
      <div className="p-4 space-y-2">
        <div className="h-5 w-3/4 animate-pulse rounded bg-muted" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}
