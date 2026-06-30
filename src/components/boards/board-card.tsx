import Link from "next/link";
import type { Board } from "@/lib/db/schema/boards";

interface BoardCardProps {
  board: Board;
}

export function BoardCard({ board }: BoardCardProps) {
  return (
    <Link
      href={`/boards/${board.id}`}
      className="group border-border bg-card focus-visible:ring-ring block rounded-lg border transition-shadow hover:shadow-md focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
    >
      <div className="h-24 rounded-t-lg" style={{ background: board.background }} />
      <div className="p-4">
        <h3 className="truncate font-semibold">{board.title}</h3>
        {board.description && (
          <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">{board.description}</p>
        )}
      </div>
    </Link>
  );
}

export function BoardCardSkeleton() {
  return (
    <div className="border-border bg-card rounded-lg border">
      <div className="bg-muted h-24 animate-pulse rounded-t-lg" />
      <div className="space-y-2 p-4">
        <div className="bg-muted h-5 w-3/4 animate-pulse rounded" />
        <div className="bg-muted h-4 w-1/2 animate-pulse rounded" />
      </div>
    </div>
  );
}
