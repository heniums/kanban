import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { verifySession } from "@/lib/dal";
import { createDbClient } from "@/lib/db/client";
import { cards } from "@/lib/db/schema/cards";
import { cardLabels } from "@/lib/db/schema/card-labels";
import { cardAssignees } from "@/lib/db/schema/card-assignees";
import { labels } from "@/lib/db/schema/labels";
import { boards } from "@/lib/db/schema/boards";
import { boardMembers } from "@/lib/db/schema/board-members";
import { checklists } from "@/lib/db/schema/checklists";
import { checklistItems } from "@/lib/db/schema/checklist-items";
import { comments } from "@/lib/db/schema/comments";
import { users } from "@/lib/db/schema/users";
import { attachments } from "@/lib/db/schema/attachments";
import { cardAttachments } from "@/lib/db/schema/card-attachments";
import { getBoardMembers } from "@/lib/data/members/list";

export async function GET(_request: Request, { params }: { params: Promise<{ cardId: string }> }) {
  const { userId } = await verifySession();
  const { cardId } = await params;
  const db = createDbClient();

  const [card] = await db
    .select({ card: cards, boardId: cards.boardId, listId: cards.listId })
    .from(cards)
    .innerJoin(boards, sql`${boards.id} = ${cards.boardId}`)
    .innerJoin(
      boardMembers,
      sql`${boardMembers.boardId} = ${boards.id} AND ${boardMembers.userId} = ${userId}`,
    )
    .where(sql`${cards.id} = ${cardId} AND ${boards.deletedAt} IS NULL`);
  if (!card) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const [
    cardLabelRows,
    boardLabelRows,
    cardAssigneeRows,
    cardChecklistRows,
    cardItemRows,
    cardCommentRows,
    boardMembersList,
    attachmentRows,
  ] = await Promise.all([
    db
      .select({ id: labels.id, name: labels.name, color: labels.color })
      .from(cardLabels)
      .innerJoin(labels, eq(labels.id, cardLabels.labelId))
      .where(eq(cardLabels.cardId, cardId)),
    db.select().from(labels).where(eq(labels.boardId, card.boardId)),
    db
      .select({ id: users.id, name: users.name, email: users.email })
      .from(cardAssignees)
      .innerJoin(users, eq(users.id, cardAssignees.userId))
      .where(eq(cardAssignees.cardId, cardId)),
    db
      .select()
      .from(checklists)
      .where(eq(checklists.cardId, cardId))
      .orderBy(sql`${checklists.position} ASC`),
    db
      .select()
      .from(checklistItems)
      .where(
        sql`${checklistItems.checklistId} IN (SELECT id FROM ${checklists} WHERE ${checklists.cardId} = ${cardId})`,
      )
      .orderBy(sql`${checklistItems.position} ASC`),
    db
      .select()
      .from(comments)
      .where(eq(comments.cardId, cardId))
      .orderBy(sql`${comments.createdAt} ASC`),
    getBoardMembers(card.boardId),
    db
      .select({
        id: cardAttachments.id,
        cardId: cardAttachments.cardId,
        attachmentId: cardAttachments.attachmentId,
        displayOrder: cardAttachments.displayOrder,
        url: attachments.url,
        publicId: attachments.publicId,
        format: attachments.format,
        width: attachments.width,
        height: attachments.height,
        bytes: attachments.bytes,
        resourceType: attachments.resourceType,
        createdBy: attachments.createdBy,
        createdAt: attachments.createdAt,
      })
      .from(cardAttachments)
      .innerJoin(attachments, eq(attachments.id, cardAttachments.attachmentId))
      .where(eq(cardAttachments.cardId, cardId))
      .orderBy(sql`${cardAttachments.displayOrder} ASC`),
  ]);

  const itemsByChecklist = new Map<string, typeof cardItemRows>();
  for (const it of cardItemRows) {
    if (!itemsByChecklist.has(it.checklistId)) itemsByChecklist.set(it.checklistId, []);
    itemsByChecklist.get(it.checklistId)!.push(it);
  }

  return NextResponse.json({
    card: card.card,
    labels: cardLabelRows,
    boardId: card.boardId,
    boardLabels: boardLabelRows,
    assignees: cardAssigneeRows,
    checklists: cardChecklistRows.map((c) => ({ ...c, items: itemsByChecklist.get(c.id) ?? [] })),
    comments: cardCommentRows,
    boardMembers: boardMembersList.map((m) => ({
      id: m.user.id,
      name: m.user.name,
      email: m.user.email,
    })),
    attachments: attachmentRows,
  });
}
