import { notFound } from "next/navigation";
import Link from "next/link";
import { BoardActions } from "@/components/boards/board-actions";
import { BoardHero } from "@/components/boards/board-hero";
import { PageContainer } from "@/components/layout/PageContainer";
import { BoardLists } from "@/components/lists/board-lists";
import { getBoardById } from "@/lib/data/boards";
import { getListsByBoardId } from "@/lib/data/lists";
import { verifySession } from "@/lib/dal";

interface BoardPageProps {
  params: Promise<{ boardId: string }>;
}

export default async function BoardPage({ params }: BoardPageProps) {
  const { userId } = await verifySession();

  const { boardId } = await params;
  const board = await getBoardById(boardId, { ownerId: userId });

  if (!board) {
    notFound();
  }

  const lists = await getListsByBoardId(boardId, { ownerId: userId });

  return (
    <div className="bg-background min-h-[calc(100vh-4rem)]">
      <PageContainer>
        <div className="py-4">
          <Link
            href="/boards"
            className="text-muted-foreground hover:text-foreground text-sm underline-offset-4 hover:underline"
          >
            &larr; All boards
          </Link>
        </div>
      </PageContainer>

      <BoardHero board={board} variant="full">
        <BoardActions board={board} variant="overlay" />
      </BoardHero>

      <PageContainer>
        <BoardLists boardId={board.id} initialLists={lists} />
      </PageContainer>
    </div>
  );
}
