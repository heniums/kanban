import { describe, expect, it, afterAll } from "vitest";
import { eq } from "drizzle-orm";
// @vitest-environment node
import { createDbClient } from "@/lib/db/client";
import { users } from "@/lib/db/schema/users";
import { boards } from "@/lib/db/schema/boards";
import { lists } from "@/lib/db/schema/lists";
import {
  createList,
  getListsByBoardId,
  renameList,
  deleteList,
  reorderLists,
} from "@/lib/data/lists";

const db = createDbClient();

const TEST_EMAILS: string[] = [];
let testBoardId: string | null = null;

async function ensureTestBoard() {
  if (testBoardId) return testBoardId;
  const email = `test-lists-data-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@kanban.local`;
  TEST_EMAILS.push(email);
  const [user] = await db
    .insert(users)
    .values({ email, passwordHash: "x", name: "Test User" })
    .returning();
  const [board] = await db
    .insert(boards)
    .values({ title: "Test Board", background: "#000", ownerId: user.id })
    .returning();
  testBoardId = board.id;
  return board.id;
}

afterAll(async () => {
  for (const email of TEST_EMAILS) {
    const [testUser] = await db.select().from(users).where(eq(users.email, email));
    if (testUser) {
      await db.delete(boards).where(eq(boards.ownerId, testUser.id));
      await db.delete(users).where(eq(users.id, testUser.id));
    }
  }
});

async function getOwnerOf(boardId: string): Promise<string | null> {
  const [b] = await db.select().from(boards).where(eq(boards.id, boardId));
  return b?.ownerId ?? null;
}

describe("getListsByBoardId (integration)", () => {
  it("returns lists in position order for the owner", async () => {
    const boardId = await ensureTestBoard();
    await createList({ boardId, title: "A" });
    await createList({ boardId, title: "B" });
    await createList({ boardId, title: "C" });

    const result = await getListsByBoardId(boardId, { ownerId: (await getOwnerOf(boardId))! });

    expect(result.map((l) => l.title)).toEqual(["A", "B", "C"]);
    expect(result.map((l) => l.position)).toEqual([0, 1, 2]);

    await db.delete(lists).where(eq(lists.boardId, boardId));
  });
});

describe("createList (integration)", () => {
  it("auto-assigns the next position based on existing lists", async () => {
    const boardId = await ensureTestBoard();
    const l0 = await createList({ boardId, title: "Zero" });
    const l1 = await createList({ boardId, title: "One" });
    expect(l0.position).toBe(0);
    expect(l1.position).toBe(1);

    await db.delete(lists).where(eq(lists.boardId, boardId));
  });
});

describe("renameList (integration)", () => {
  it("updates the list title", async () => {
    const boardId = await ensureTestBoard();
    const list = await createList({ boardId, title: "Original" });
    const ownerId = await getOwnerOf(boardId);

    const updated = await renameList(list.id, { title: "Renamed" }, { ownerId: ownerId! });

    expect(updated?.title).toBe("Renamed");

    await db.delete(lists).where(eq(lists.boardId, boardId));
  });
});

describe("deleteList (integration) — position recompaction", () => {
  it("recompacts positions after deletion", async () => {
    const boardId = await ensureTestBoard();
    const l0 = await createList({ boardId, title: "L0" });
    const l1 = await createList({ boardId, title: "L1" });
    const l2 = await createList({ boardId, title: "L2" });
    const l3 = await createList({ boardId, title: "L3" });
    const ownerId = await getOwnerOf(boardId);

    const result = await deleteList(l1.id, { ownerId: ownerId! });
    expect(result?.id).toBe(l1.id);

    const after = await getListsByBoardId(boardId, { ownerId: ownerId! });
    const positions = after
      .sort((a, b) => a.position - b.position)
      .map((l) => ({ title: l.title, position: l.position }));
    expect(positions).toEqual([
      { title: "L0", position: 0 },
      { title: "L2", position: 1 },
      { title: "L3", position: 2 },
    ]);

    void l0;
    void l2;
    void l3;
    await db.delete(lists).where(eq(lists.boardId, boardId));
  });
});

describe("reorderLists (integration)", () => {
  it("reorders lists to match the new positions", async () => {
    const boardId = await ensureTestBoard();
    const a = await createList({ boardId, title: "A" });
    const b = await createList({ boardId, title: "B" });
    const c = await createList({ boardId, title: "C" });
    const ownerId = await getOwnerOf(boardId);

    await reorderLists(boardId, [c.id, a.id, b.id], { ownerId: ownerId! });

    const after = await getListsByBoardId(boardId, { ownerId: ownerId! });
    expect(after.map((l) => l.title)).toEqual(["C", "A", "B"]);
    expect(after.map((l) => l.position)).toEqual([0, 1, 2]);

    void a;
    void b;
    await db.delete(lists).where(eq(lists.boardId, boardId));
  });
});
