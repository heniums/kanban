import { notFound } from "next/navigation";
import Link from "next/link";
import { BoardActions } from "@/components/boards/board-actions";
import { BoardHero } from "@/components/boards/board-hero";
import { PageContainer } from "@/components/layout/PageContainer";
import { BoardCards } from "@/components/cards/board-cards";
import { getBoardById } from "@/lib/data/boards";
import { getListsByBoardId } from "@/lib/data/lists";
import { getCardsByBoardId } from "@/lib/data/cards";
import { getLabelsByBoardId } from "@/lib/data/labels";
import { verifySession } from "@/lib/dal";
import type { CardSummary } from "@/components/cards/card-item";

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
  const allCards = await getCardsByBoardId(boardId, { ownerId: userId });
  const boardLabels = await getLabelsByBoardId(boardId, { ownerId: userId });

  const cardsByList: Record<string, CardSummary[]> = {};
  for (const list of lists) {
    cardsByList[list.id] = [];
  }
  for (const card of allCards) {
    if (!cardsByList[card.listId]) cardsByList[card.listId] = [];
    cardsByList[card.listId].push({
      ...card,
      labels: [],
      assignees: [],
      checklistProgress: null,
      commentCount: 0,
    });
  }

  return (
    <div className="bg-background min-h-[calc(100vh-4rem)]">
      <BoardHero
        board={board}
        variant="full"
        breadcrumb={
          <Link href="/boards" className="text-sm underline-offset-4 hover:underline">
            &larr; All boards
          </Link>
        }
      >
        <BoardActions board={board} variant="overlay" />
      </BoardHero>

      <PageContainer>
        <BoardCards
          boardId={board.id}
          initialLists={lists}
          initialCardsByList={cardsByList}
          boardLabels={boardLabels}
        />
      </PageContainer>
    </div>
  );
}
