import { describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
// @vitest-environment node
import { createDbClient } from "@/lib/db/client";
import { lists } from "@/lib/db/schema/lists";
import { TestDataFactory } from "@/__tests__/test-factory";
import { getListsByBoardId, renameList, deleteList, reorderLists } from "@/lib/data/lists";
import { createList } from "@/lib/data/lists/create";

const db = createDbClient();
const factory = new TestDataFactory();
factory.registerCleanup();

let testBoardId: string | null = null;
let testOwnerId: string | null = null;

async function ensureTestBoard() {
  if (testBoardId && testOwnerId) return { boardId: testBoardId, ownerId: testOwnerId };
  const user = await factory.createUser();
  const board = await factory.createBoard({ ownerId: user.id });
  testBoardId = board.id;
  testOwnerId = user.id;
  return { boardId: board.id, ownerId: user.id };
}

describe("getListsByBoardId (integration)", () => {
  it("returns lists in position order for the owner", async () => {
    const { boardId, ownerId } = await ensureTestBoard();
    await createList({ boardId, title: "A" });
    await createList({ boardId, title: "B" });
    await createList({ boardId, title: "C" });

    const result = await getListsByBoardId(boardId, { userId: ownerId });

    expect(result.map((l) => l.title)).toEqual(["A", "B", "C"]);
    expect(result.map((l) => l.position)).toEqual([0, 1, 2]);

    await db.delete(lists).where(eq(lists.boardId, boardId));
  });
});

describe("createList (integration)", () => {
  it("auto-assigns the next position based on existing lists", async () => {
    const { boardId } = await ensureTestBoard();
    const l0 = await createList({ boardId, title: "Zero" });
    const l1 = await createList({ boardId, title: "One" });
    expect(l0.position).toBe(0);
    expect(l1.position).toBe(1);

    await db.delete(lists).where(eq(lists.boardId, boardId));
  });
});

describe("renameList (integration)", () => {
  it("updates the list title", async () => {
    const { boardId, ownerId } = await ensureTestBoard();
    const list = await createList({ boardId, title: "Original" });

    const updated = await renameList(list.id, { title: "Renamed" }, { ownerId });

    expect(updated?.title).toBe("Renamed");

    await db.delete(lists).where(eq(lists.boardId, boardId));
  });
});

describe("deleteList (integration) — position recompaction", () => {
  it("recompacts positions after deletion", async () => {
    const { boardId, ownerId } = await ensureTestBoard();
    const l0 = await createList({ boardId, title: "L0" });
    const l1 = await createList({ boardId, title: "L1" });
    const l2 = await createList({ boardId, title: "L2" });
    const l3 = await createList({ boardId, title: "L3" });

    const result = await deleteList(l1.id, { ownerId });
    expect(result?.id).toBe(l1.id);

    const after = await getListsByBoardId(boardId, { userId: ownerId });
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
    const { boardId, ownerId } = await ensureTestBoard();
    const a = await createList({ boardId, title: "A" });
    const b = await createList({ boardId, title: "B" });
    const c = await createList({ boardId, title: "C" });

    await reorderLists(boardId, [c.id, a.id, b.id], { ownerId });

    const after = await getListsByBoardId(boardId, { userId: ownerId });
    expect(after.map((l) => l.title)).toEqual(["C", "A", "B"]);
    expect(after.map((l) => l.position)).toEqual([0, 1, 2]);

    void a;
    void b;
    await db.delete(lists).where(eq(lists.boardId, boardId));
  });
});
