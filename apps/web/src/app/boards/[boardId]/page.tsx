import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  createDbClient,
  boards,
} from "@kanban/shared";
import { eq, and, isNull } from "drizzle-orm";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface BoardPageProps {
  params: Promise<{ boardId: string }>;
}

async function getBoard(boardId: string) {
  const db = createDbClient();
  const result = await db
    .select()
    .from(boards)
    .where(and(eq(boards.id, boardId), isNull(boards.deletedAt)));
  return result[0] ?? null;
}

export default async function BoardPage({ params }: BoardPageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const { boardId } = await params;
  const board = await getBoard(boardId);

  if (!board) {
    notFound();
  }

  if (board.ownerId !== session.user.id) {
    return (
      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Forbidden</h1>
          <p className="text-muted-foreground">
            You do not have access to this board.
          </p>
          <Button asChild>
            <Link href="/boards">Back to boards</Link>
          </Button>
        </div>
      </main>
    );
  }

  return (
    <div
      className="min-h-[calc(100vh-4rem)]"
      style={{ background: board.background }}
    >
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
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
