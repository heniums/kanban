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
} from "@/lib/data/cards";

import { getChecklistProgressByBoardId } from "@/lib/data/checklists";
import { getCommentCountsByBoardId } from "@/lib/data/comments";
import { verifySession } from "@/lib/dal";
import { getUserRole } from "@/lib/permissions";
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

  const userRole = await getUserRole(userId, boardId);
  const canManageSettings = userRole === "owner";

  const lists = await getListsByBoardId(boardId, { userId });
  const [allCards, cardLabelsMap, cardAssigneesMap, checklistProgressMap, commentCountsMap] =
    await Promise.all([
      getCardsByBoardId(boardId, { userId }),
      getCardLabelsByBoardId(boardId, { userId }),
      getCardAssigneesByBoardId(boardId, { userId }),
      getChecklistProgressByBoardId(boardId, { userId }),
      getCommentCountsByBoardId(boardId, { userId }),
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
        <BoardActions board={board} variant="overlay" canManageSettings={canManageSettings} />
      </BoardHero>

      <PageContainer>
        <BoardCards boardId={board.id} initialLists={lists} initialCardsByList={cardsByList} />
      </PageContainer>
    </div>
  );
}
