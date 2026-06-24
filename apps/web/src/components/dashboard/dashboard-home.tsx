import Link from "next/link";
import type { Board } from "@kanban/shared";
import { BoardCard } from "@/components/boards/board-card";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/layout/PageContainer";

const MAX_RECENT_OWNED = 6;
const MAX_RECENT_SHARED = 3;

interface DashboardHomeProps {
  owned: Board[];
  shared: Board[];
}

export function DashboardHome({ owned, shared }: DashboardHomeProps) {
  const recentOwned = owned
    .slice()
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .slice(0, MAX_RECENT_OWNED);
  const recentShared = shared
    .slice()
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .slice(0, MAX_RECENT_SHARED);

  const ownedExtra = Math.max(0, owned.length - MAX_RECENT_OWNED);
  const sharedExtra = Math.max(0, shared.length - MAX_RECENT_SHARED);

  return (
    <PageContainer as="main">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex items-center gap-2">
          <Button asChild variant="secondary">
            <Link href="/boards">Go to boards</Link>
          </Button>
          <Button asChild>
            <Link href="/boards/new">Create board</Link>
          </Button>
        </div>
      </div>

      {owned.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-4 text-lg font-semibold">Recent boards</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recentOwned.map((board) => (
              <BoardCard key={board.id} board={board} />
            ))}
          </div>
          {ownedExtra > 0 && (
            <div className="mt-4">
              <Link
                href="/boards"
                className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                View all ({ownedExtra} more)
              </Link>
            </div>
          )}
        </section>
      )}

      {shared.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold">Shared with you</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recentShared.map((board) => (
              <BoardCard key={board.id} board={board} />
            ))}
          </div>
          {sharedExtra > 0 && (
            <div className="mt-4">
              <Link
                href="/boards"
                className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                View all ({sharedExtra} more)
              </Link>
            </div>
          )}
        </section>
      )}
    </PageContainer>
  );
}
