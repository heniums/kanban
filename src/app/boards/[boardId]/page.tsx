import { notFound } from "next/navigation";
import Link from "next/link";
import { BoardActions } from "@/components/boards/board-actions";
import { BoardHero } from "@/components/boards/board-hero";
import { PageContainer } from "@/components/layout/PageContainer";
import { BoardLists } from "@/components/lists/board-lists";
import { getBoardById } from "@/lib/data/boards";
import { getListsByBoardId } from "@/lib/data/lists";
import { getTextColor } from "@/lib/text-color";
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
  const textColor = getTextColor(board.background);

  return (
    <div className="bg-background min-h-[calc(100vh-4rem)]">
      <BoardHero board={board} variant="full">
        <Link
          href="/boards"
          className="rounded-md px-2 py-1 text-sm opacity-80 hover:opacity-100"
          style={{ color: textColor }}
        >
          &larr; All boards
        </Link>
        <BoardActions board={board} />
      </BoardHero>

      <PageContainer>
        <BoardLists boardId={board.id} initialLists={lists} />
      </PageContainer>
    </div>
  );
}
