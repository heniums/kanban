import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { verifySession } from "@/lib/dal";
import { createDbClient } from "@/lib/db/client";
import { cards } from "@/lib/db/schema/cards";
import { cardLabels } from "@/lib/db/schema/card-labels";
import { labels } from "@/lib/db/schema/labels";
import { boards } from "@/lib/db/schema/boards";
import { lists } from "@/lib/db/schema/lists";

export async function GET(_request: Request, { params }: { params: Promise<{ cardId: string }> }) {
  const { userId } = await verifySession();
  const { cardId } = await params;
  const db = createDbClient();

  const [card] = await db
    .select({ card: cards, boardId: cards.boardId, listId: cards.listId })
    .from(cards)
    .innerJoin(boards, sql`${boards.id} = ${cards.boardId}`)
    .where(
      sql`${cards.id} = ${cardId} AND ${boards.ownerId} = ${userId} AND ${boards.deletedAt} IS NULL`,
    );
  if (!card) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const cardLabelRows = await db
    .select({
      id: labels.id,
      name: labels.name,
      color: labels.color,
    })
    .from(cardLabels)
    .innerJoin(labels, eq(labels.id, cardLabels.labelId))
    .where(eq(cardLabels.cardId, cardId));

  const boardLabelRows = await db.select().from(labels).where(eq(labels.boardId, card.boardId));

  return NextResponse.json({
    card: card.card,
    labels: cardLabelRows,
    boardId: card.boardId,
    boardLabels: boardLabelRows,
  });
}
