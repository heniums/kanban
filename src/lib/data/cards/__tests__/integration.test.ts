import { describe, expect, it } from "vitest";
import { asc, eq } from "drizzle-orm";
// @vitest-environment node
import { createDbClient } from "@/lib/db/client";
import { lists } from "@/lib/db/schema/lists";
import { cards } from "@/lib/db/schema/cards";
import { cardLabels } from "@/lib/db/schema/card-labels";
import { cardAssignees } from "@/lib/db/schema/card-assignees";
import { labels } from "@/lib/db/schema/labels";
import type { User } from "@/lib/db/schema/users";
import { TestDataFactory } from "@/__tests__/test-factory";
import { getListsByBoardId } from "@/lib/data/lists";
import { createCard, moveCard, reorderCards, updateCard, deleteCard } from "..";

const db = createDbClient();
const factory = new TestDataFactory();
factory.registerCleanup();

let testBoardId: string | null = null;
let testOwnerId: string | null = null;
let testOwner: User | null = null;

async function ensureTestBoard() {
  if (testBoardId && testOwnerId && testOwner)
    return { boardId: testBoardId, ownerId: testOwnerId, owner: testOwner };
  const user = await factory.createUser();
  const board = await factory.createBoard({ ownerId: user.id, title: "Cards Test Board" });
  testBoardId = board.id;
  testOwnerId = user.id;
  testOwner = user;
  return { boardId: board.id, ownerId: user.id, owner: user };
}

async function getCardsByListIdDirect(listId: string) {
  return db.select().from(cards).where(eq(cards.listId, listId)).orderBy(asc(cards.position));
}

async function resetList(boardId: string, ownerId: string) {
  await db.delete(cards).where(eq(cards.boardId, boardId));
  const remaining = await getListsByBoardId(boardId);
  for (const l of remaining) {
    await db.delete(lists).where(eq(lists.id, l.id));
  }
  const l0 = await db.insert(lists).values({ boardId, title: "To Do", position: 0 }).returning();
  const l1 = await db.insert(lists).values({ boardId, title: "Doing", position: 1 }).returning();
  return { l0: l0[0], l1: l1[0] };
}

describe("createCard (integration)", () => {
  it("auto-assigns the next position and links label/assignee ids", async () => {
    const { boardId, ownerId, owner } = await ensureTestBoard();
    const { l0 } = await resetList(boardId, ownerId);

    const [lbl] = await db
      .insert(labels)
      .values({ boardId, name: "Bug", color: "#ff0000" })
      .returning();

    const card = await createCard(
      {
        listId: l0.id,
        title: "Card A",
        labelIds: [lbl.id],
        assigneeIds: [owner.id],
      },
      { ownerId },
    );

    expect(card.position).toBe(0);
    expect(card.title).toBe("Card A");

    const linkedLabels = await db.select().from(cardLabels).where(eq(cardLabels.cardId, card.id));
    expect(linkedLabels).toHaveLength(1);
    expect(linkedLabels[0].labelId).toBe(lbl.id);

    const linkedAssignees = await db
      .select()
      .from(cardAssignees)
      .where(eq(cardAssignees.cardId, card.id));
    expect(linkedAssignees).toHaveLength(1);
    expect(linkedAssignees[0].userId).toBe(owner.id);
  });
});

describe("getCardsByListId (integration)", () => {
  it("returns cards in position order", async () => {
    const { boardId, ownerId } = await ensureTestBoard();
    const { l0 } = await resetList(boardId, ownerId);

    await createCard({ listId: l0.id, title: "A" }, { ownerId });
    await createCard({ listId: l0.id, title: "B" }, { ownerId });
    await createCard({ listId: l0.id, title: "C" }, { ownerId });

    const result = await getCardsByListIdDirect(l0.id);
    expect(result.map((c) => c.title)).toEqual(["A", "B", "C"]);
    expect(result.map((c) => c.position)).toEqual([0, 1, 2]);
  });
});

describe("updateCard (integration)", () => {
  it("updates title and replaces label links", async () => {
    const { boardId, ownerId } = await ensureTestBoard();
    const { l0 } = await resetList(boardId, ownerId);

    const [lbl1] = await db
      .insert(labels)
      .values({ boardId, name: "L1", color: "#ff0000" })
      .returning();
    const [lbl2] = await db
      .insert(labels)
      .values({ boardId, name: "L2", color: "#00ff00" })
      .returning();

    const created = await createCard(
      { listId: l0.id, title: "Initial", labelIds: [lbl1.id] },
      { ownerId },
    );
    const updated = await updateCard(
      created.id,
      { title: "Renamed", labelIds: [lbl2.id] },
      { ownerId },
    );
    expect(updated?.title).toBe("Renamed");

    const linked = await db.select().from(cardLabels).where(eq(cardLabels.cardId, created.id));
    expect(linked).toHaveLength(1);
    expect(linked[0].labelId).toBe(lbl2.id);
  });

  it("replaces labels without changing scalar fields", async () => {
    const { boardId, ownerId } = await ensureTestBoard();
    const { l0 } = await resetList(boardId, ownerId);

    const [lbl] = await db
      .insert(labels)
      .values({ boardId, name: "Tag A", color: "#0000ff" })
      .returning();

    const created = await createCard({ listId: l0.id, title: "Card" }, { ownerId });
    const updated = await updateCard(created.id, { labelIds: [lbl.id] }, { ownerId });

    expect(updated?.id).toBe(created.id);
    expect(updated?.title).toBe("Card");

    const linked = await db.select().from(cardLabels).where(eq(cardLabels.cardId, created.id));
    expect(linked).toHaveLength(1);
    expect(linked[0].labelId).toBe(lbl.id);
  });

  it("replaces assignees without changing scalar fields", async () => {
    const { boardId, ownerId, owner } = await ensureTestBoard();
    const { l0 } = await resetList(boardId, ownerId);

    const created = await createCard({ listId: l0.id, title: "Card" }, { ownerId });
    const updated = await updateCard(created.id, { assigneeIds: [owner.id] }, { ownerId });

    expect(updated?.id).toBe(created.id);

    const linked = await db
      .select()
      .from(cardAssignees)
      .where(eq(cardAssignees.cardId, created.id));
    expect(linked).toHaveLength(1);
    expect(linked[0].userId).toBe(owner.id);
  });
});

describe("deleteCard (integration) — position recompaction", () => {
  it("recompacts positions within the same list", async () => {
    const { boardId, ownerId } = await ensureTestBoard();
    const { l0 } = await resetList(boardId, ownerId);

    const c0 = await createCard({ listId: l0.id, title: "C0" }, { ownerId });
    const c1 = await createCard({ listId: l0.id, title: "C1" }, { ownerId });
    const c2 = await createCard({ listId: l0.id, title: "C2" }, { ownerId });
    void c0;
    void c2;

    await deleteCard(c1.id, { ownerId });

    const remaining = await getCardsByListIdDirect(l0.id);
    const sorted = remaining.sort((a, b) => a.position - b.position);
    expect(sorted.map((c) => c.title)).toEqual(["C0", "C2"]);
    expect(sorted.map((c) => c.position)).toEqual([0, 1]);
  });
});

describe("moveCard (integration)", () => {
  it("moves a card across lists and recompacts both", async () => {
    const { boardId, ownerId } = await ensureTestBoard();
    const { l0, l1 } = await resetList(boardId, ownerId);

    const c0 = await createCard({ listId: l0.id, title: "C0" }, { ownerId });
    const c1 = await createCard({ listId: l0.id, title: "C1" }, { ownerId });
    await createCard({ listId: l1.id, title: "D0" }, { ownerId });
    void c0;

    const moved = await moveCard(c1.id, l1.id, 0, { ownerId });
    expect(moved?.listId).toBe(l1.id);
    expect(moved?.position).toBe(0);

    const inL0 = await getCardsByListIdDirect(l0.id);
    const inL1 = await getCardsByListIdDirect(l1.id);
    expect(inL0.map((c) => c.title)).toEqual(["C0"]);
    expect(inL0.map((c) => c.position)).toEqual([0]);
    const l1Sorted = inL1.sort((a, b) => a.position - b.position);
    expect(l1Sorted.map((c) => c.title)).toEqual(["C1", "D0"]);
    expect(l1Sorted.map((c) => c.position)).toEqual([0, 1]);
  });
});

describe("reorderCards (integration)", () => {
  it("reorders cards to match the new positions", async () => {
    const { boardId, ownerId } = await ensureTestBoard();
    const { l0 } = await resetList(boardId, ownerId);

    const a = await createCard({ listId: l0.id, title: "A" }, { ownerId });
    const b = await createCard({ listId: l0.id, title: "B" }, { ownerId });
    const c = await createCard({ listId: l0.id, title: "C" }, { ownerId });

    await reorderCards(l0.id, [c.id, a.id, b.id], { ownerId });

    const after = await getCardsByListIdDirect(l0.id);
    expect(after.map((c) => c.title)).toEqual(["C", "A", "B"]);
    expect(after.map((c) => c.position)).toEqual([0, 1, 2]);

    void a;
    void b;
  });
});
