import { notFound } from "next/navigation";
import Link from "next/link";
import { BoardActions } from "@/components/boards/board-actions";
import { BoardHero } from "@/components/boards/board-hero";
import { PageContainer } from "@/components/layout/PageContainer";
import { BoardCards } from "@/components/cards/board-cards";
import { getBoardById } from "@/lib/data/boards";
import { getListsByBoardId } from "@/lib/data/lists";
import {
  getCardsByBoardId,
  getCardLabelsByBoardId,
  getCardAssigneesByBoardId,
  getCardAttachmentPreviewsByBoardId,
} from "@/lib/data/cards";

import { getChecklistProgressByBoardId } from "@/lib/data/checklists";
import { getCommentCountsByBoardId } from "@/lib/data/comments";
import { verifySession } from "@/lib/dal";
import { getBoardCapabilities } from "@/lib/capabilities";
import type { CardSummary } from "@/components/cards/card-item";

interface BoardPageProps {
  params: Promise<{ boardId: string }>;
}

export default async function BoardPage({ params }: BoardPageProps) {
  const { userId } = await verifySession();

  const { boardId } = await params;
  const board = await getBoardById(boardId, { userId });

  if (!board) {
    notFound();
  }

  const [
    capabilities,
    lists,
    allCards,
    cardLabelsMap,
    cardAssigneesMap,
    checklistProgressMap,
    commentCountsMap,
    attachmentPreviewMap,
  ] = await Promise.all([
    getBoardCapabilities(userId, boardId),
    getListsByBoardId(boardId),
    getCardsByBoardId(boardId),
    getCardLabelsByBoardId(boardId),
    getCardAssigneesByBoardId(boardId),
    getChecklistProgressByBoardId(boardId),
    getCommentCountsByBoardId(boardId),
    getCardAttachmentPreviewsByBoardId(boardId),
  ]);

  const cardsByList: Record<string, CardSummary[]> = {};
  for (const list of lists) {
    cardsByList[list.id] = [];
  }
  for (const card of allCards) {
    if (!cardsByList[card.listId]) cardsByList[card.listId] = [];
    cardsByList[card.listId].push({
      ...card,
      labels: cardLabelsMap[card.id] ?? [],
      assignees: cardAssigneesMap[card.id] ?? [],
      checklistProgress: checklistProgressMap[card.id] ?? null,
      commentCount: commentCountsMap[card.id] ?? 0,
      attachmentPreviewUrl: attachmentPreviewMap[card.id] ?? null,
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
        <BoardActions board={board} variant="overlay" capabilities={capabilities} />
      </BoardHero>

      <PageContainer>
        <BoardCards boardId={board.id} initialLists={lists} initialCardsByList={cardsByList} />
      </PageContainer>
    </div>
  );
}
