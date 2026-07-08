import { describe, expect, it } from "vitest";
import { asc, eq } from "drizzle-orm";
// @vitest-environment node
import { createDbClient } from "@/lib/db/client";
import { users } from "@/lib/db/schema/users";
import { boards } from "@/lib/db/schema/boards";
import { boardMembers } from "@/lib/db/schema/board-members";
import { lists } from "@/lib/db/schema/lists";
import { cards } from "@/lib/db/schema/cards";
import { cardLabels } from "@/lib/db/schema/card-labels";
import { cardAssignees } from "@/lib/db/schema/card-assignees";
import { labels } from "@/lib/db/schema/labels";
import { createCard, moveCard, reorderCards, updateCard, deleteCard } from "..";

const db = createDbClient();

async function createTestUser() {
  const [user] = await db
    .insert(users)
    .values({
      email: `card-test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@kanban.local`,
      passwordHash: "test-hash",
      name: "Card Test User",
    })
    .returning();
  return user;
}

async function createTestBoard(ownerId: string) {
  const [board] = await db
    .insert(boards)
    .values({
      title: "Cards Test Board",
      background: "#000000",
      ownerId,
    })
    .returning();
  await db.insert(boardMembers).values({
    boardId: board.id,
    userId: ownerId,
    role: "owner",
  });
  return board;
}

async function createTestLists(boardId: string) {
  const [l0] = await db.insert(lists).values({ boardId, title: "To Do", position: 0 }).returning();
  const [l1] = await db.insert(lists).values({ boardId, title: "Doing", position: 1 }).returning();
  return { l0, l1 };
}

async function getCardsByListIdDirect(listId: string) {
  return db.select().from(cards).where(eq(cards.listId, listId)).orderBy(asc(cards.position));
}

describe("createCard (integration)", () => {
  it("auto-assigns the next position and links label/assignee ids", async () => {
    const user = await createTestUser();
    const board = await createTestBoard(user.id);
    const { l0 } = await createTestLists(board.id);

    const [lbl] = await db
      .insert(labels)
      .values({ boardId: board.id, name: "Bug", color: "#ff0000" })
      .returning();

    const card = await createCard({
      listId: l0.id,
      title: "Card A",
      labelIds: [lbl.id],
      assigneeIds: [user.id],
    });

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
    expect(linkedAssignees[0].userId).toBe(user.id);
  });
});

describe("getCardsByListId (integration)", () => {
  it("returns cards in position order", async () => {
    const user = await createTestUser();
    const board = await createTestBoard(user.id);
    const { l0 } = await createTestLists(board.id);

    await createCard({ listId: l0.id, title: "A" });
    await createCard({ listId: l0.id, title: "B" });
    await createCard({ listId: l0.id, title: "C" });

    const result = await getCardsByListIdDirect(l0.id);
    expect(result.map((c) => c.title)).toEqual(["A", "B", "C"]);
    expect(result.map((c) => c.position)).toEqual([0, 1, 2]);
  });
});

describe("updateCard (integration)", () => {
  it("updates title and replaces label links", async () => {
    const user = await createTestUser();
    const board = await createTestBoard(user.id);
    const { l0 } = await createTestLists(board.id);

    const [lbl1] = await db
      .insert(labels)
      .values({ boardId: board.id, name: "L1", color: "#ff0000" })
      .returning();
    const [lbl2] = await db
      .insert(labels)
      .values({ boardId: board.id, name: "L2", color: "#00ff00" })
      .returning();

    const created = await createCard({ listId: l0.id, title: "Initial", labelIds: [lbl1.id] });
    const updated = await updateCard(created.id, { title: "Renamed", labelIds: [lbl2.id] });
    expect(updated?.title).toBe("Renamed");

    const linked = await db.select().from(cardLabels).where(eq(cardLabels.cardId, created.id));
    expect(linked).toHaveLength(1);
    expect(linked[0].labelId).toBe(lbl2.id);
  });

  it("replaces labels without changing scalar fields", async () => {
    const user = await createTestUser();
    const board = await createTestBoard(user.id);
    const { l0 } = await createTestLists(board.id);

    const [lbl] = await db
      .insert(labels)
      .values({ boardId: board.id, name: "Tag A", color: "#0000ff" })
      .returning();

    const created = await createCard({ listId: l0.id, title: "Card" });
    const updated = await updateCard(created.id, { labelIds: [lbl.id] });

    expect(updated?.id).toBe(created.id);
    expect(updated?.title).toBe("Card");

    const linked = await db.select().from(cardLabels).where(eq(cardLabels.cardId, created.id));
    expect(linked).toHaveLength(1);
    expect(linked[0].labelId).toBe(lbl.id);
  });

  it("replaces assignees without changing scalar fields", async () => {
    const user = await createTestUser();
    const board = await createTestBoard(user.id);
    const { l0 } = await createTestLists(board.id);

    const created = await createCard({ listId: l0.id, title: "Card" });
    const updated = await updateCard(created.id, { assigneeIds: [user.id] });

    expect(updated?.id).toBe(created.id);

    const linked = await db
      .select()
      .from(cardAssignees)
      .where(eq(cardAssignees.cardId, created.id));
    expect(linked).toHaveLength(1);
    expect(linked[0].userId).toBe(user.id);
  });
});

describe("deleteCard (integration) — position recompaction", () => {
  it("recompacts positions within the same list", async () => {
    const user = await createTestUser();
    const board = await createTestBoard(user.id);
    const { l0 } = await createTestLists(board.id);

    const c0 = await createCard({ listId: l0.id, title: "C0" });
    const c1 = await createCard({ listId: l0.id, title: "C1" });
    const c2 = await createCard({ listId: l0.id, title: "C2" });
    void c0;
    void c2;

    await deleteCard(c1.id);

    const remaining = await getCardsByListIdDirect(l0.id);
    const sorted = remaining.sort((a, b) => a.position - b.position);
    expect(sorted.map((c) => c.title)).toEqual(["C0", "C2"]);
    expect(sorted.map((c) => c.position)).toEqual([0, 1]);
  });
});

describe("moveCard (integration)", () => {
  it("moves a card across lists and recompacts both", async () => {
    const user = await createTestUser();
    const board = await createTestBoard(user.id);
    const { l0, l1 } = await createTestLists(board.id);

    const c0 = await createCard({ listId: l0.id, title: "C0" });
    const c1 = await createCard({ listId: l0.id, title: "C1" });
    await createCard({ listId: l1.id, title: "D0" });
    void c0;

    const moved = await moveCard(c1.id, l1.id, 0);
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

  it("reorders within the same list: move last card to first position", async () => {
    const user = await createTestUser();
    const board = await createTestBoard(user.id);
    const { l0 } = await createTestLists(board.id);

    const c0 = await createCard({ listId: l0.id, title: "C0" });
    const c1 = await createCard({ listId: l0.id, title: "C1" });
    const c2 = await createCard({ listId: l0.id, title: "C2" });
    void c0;
    void c1;

    const moved = await moveCard(c2.id, l0.id, 0);
    expect(moved?.position).toBe(0);

    const after = await getCardsByListIdDirect(l0.id);
    expect(after.map((c) => c.title)).toEqual(["C2", "C0", "C1"]);
    expect(after.map((c) => c.position)).toEqual([0, 1, 2]);
  });

  it("reorders within the same list: move first card to last position", async () => {
    const user = await createTestUser();
    const board = await createTestBoard(user.id);
    const { l0 } = await createTestLists(board.id);

    const c0 = await createCard({ listId: l0.id, title: "C0" });
    const c1 = await createCard({ listId: l0.id, title: "C1" });
    const c2 = await createCard({ listId: l0.id, title: "C2" });
    void c1;
    void c2;

    const moved = await moveCard(c0.id, l0.id, 2);
    expect(moved?.position).toBe(2);

    const after = await getCardsByListIdDirect(l0.id);
    expect(after.map((c) => c.title)).toEqual(["C1", "C2", "C0"]);
    expect(after.map((c) => c.position)).toEqual([0, 1, 2]);
  });

  it("moves a card to position 0 in a non-empty target list", async () => {
    const user = await createTestUser();
    const board = await createTestBoard(user.id);
    const { l0, l1 } = await createTestLists(board.id);

    const srcCard = await createCard({ listId: l0.id, title: "Src" });
    await createCard({ listId: l1.id, title: "T0" });
    await createCard({ listId: l1.id, title: "T1" });
    void srcCard;

    const moved = await moveCard(srcCard.id, l1.id, 0);
    expect(moved?.listId).toBe(l1.id);
    expect(moved?.position).toBe(0);

    const inL0 = await getCardsByListIdDirect(l0.id);
    expect(inL0).toHaveLength(0);

    const inL1 = await getCardsByListIdDirect(l1.id);
    expect(inL1.map((c) => c.title)).toEqual(["Src", "T0", "T1"]);
    expect(inL1.map((c) => c.position)).toEqual([0, 1, 2]);
  });
});

describe("reorderCards (integration)", () => {
  it("reorders cards to match the new positions", async () => {
    const user = await createTestUser();
    const board = await createTestBoard(user.id);
    const { l0 } = await createTestLists(board.id);

    const a = await createCard({ listId: l0.id, title: "A" });
    const b = await createCard({ listId: l0.id, title: "B" });
    const c = await createCard({ listId: l0.id, title: "C" });

    await reorderCards(l0.id, [c.id, a.id, b.id]);

    const after = await getCardsByListIdDirect(l0.id);
    expect(after.map((c) => c.title)).toEqual(["C", "A", "B"]);
    expect(after.map((c) => c.position)).toEqual([0, 1, 2]);

    void a;
    void b;
  });
});
