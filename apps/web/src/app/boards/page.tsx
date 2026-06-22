import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { listBoardsAction } from "@/lib/actions/boards";
import { BoardCard } from "@/components/boards/board-card";
import { Button } from "@/components/ui/button";

export default async function BoardsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const { owned, shared } = await listBoardsAction();

  return (
    <main className="container py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Boards</h1>
          <p className="text-muted-foreground">
            Manage and organize your kanban boards.
          </p>
        </div>
        <Button asChild>
          <Link href="/boards/new">Create board</Link>
        </Button>
      </div>

      <section className="mb-10">
        <h2 className="mb-4 text-lg font-semibold">My Boards</h2>
        {owned.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center">
            <p className="text-muted-foreground">
              No boards yet. Create one to get started.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {owned.map((board) => (
              <BoardCard key={board.id} board={board} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold">Shared with me</h2>
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground">
            No boards shared with you yet. When someone invites you to their board, it will appear here.
          </p>
        </div>
      </section>
    </main>
  );
}
