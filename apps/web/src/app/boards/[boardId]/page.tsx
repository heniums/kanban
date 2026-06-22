import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BoardActions } from "@/components/boards/board-actions";
import { getBoardById } from "@/lib/data/boards";

interface BoardPageProps {
  params: Promise<{ boardId: string }>;
}

export default async function BoardPage({ params }: BoardPageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const { boardId } = await params;
  const board = await getBoardById(boardId, { ownerId: session.user.id });

  if (!board) {
    notFound();
  }

  return (
    <div
      className="min-h-[calc(100vh-4rem)]"
      style={{ background: board.background }}
    >
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <Link
              href="/boards"
              className="mb-2 inline-block text-sm text-white/70 hover:text-white"
            >
              &larr; All boards
            </Link>
            <h1 className="text-3xl font-bold text-white">{board.title}</h1>
            {board.description && (
              <p className="mt-1 text-white/80">{board.description}</p>
            )}
          </div>
          <BoardActions board={board} />
        </div>

        <div className="rounded-lg border border-white/10 bg-white/5 p-12 text-center backdrop-blur-sm">
          <h2 className="text-lg font-semibold text-white">No lists yet</h2>
          <p className="mt-1 text-white/70">
            Create a list to start organizing your cards.
          </p>
        </div>
      </div>
    </div>
  );
}
