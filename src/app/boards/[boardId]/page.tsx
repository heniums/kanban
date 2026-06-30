import { notFound } from "next/navigation";
import Link from "next/link";
import { BoardActions } from "@/components/boards/board-actions";
import { PageContainer } from "@/components/layout/PageContainer";
import { BoardListsClient } from "@/components/lists/board-lists-client";
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
    <div className="min-h-[calc(100vh-4rem)]" style={{ background: board.background }}>
      <PageContainer>
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <Link
              href="/boards"
              className="mb-2 inline-block text-sm opacity-70 hover:opacity-100"
              style={{ color: textColor }}
            >
              &larr; All boards
            </Link>
            <h1 className="text-3xl font-bold" style={{ color: textColor }}>
              {board.title}
            </h1>
            {board.description && (
              <p className="mt-1 opacity-80" style={{ color: textColor }}>
                {board.description}
              </p>
            )}
          </div>
          <BoardActions board={board} />
        </div>

        <BoardListsClient boardId={board.id} initialLists={lists} />
      </PageContainer>
    </div>
  );
}
