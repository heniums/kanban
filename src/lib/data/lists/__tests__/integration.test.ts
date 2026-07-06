import { describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
// @vitest-environment node
import { createDbClient } from "@/lib/db/client";
import { users } from "@/lib/db/schema/users";
import { boards } from "@/lib/db/schema/boards";
import { boardMembers } from "@/lib/db/schema/board-members";
import { lists } from "@/lib/db/schema/lists";
import { getListsByBoardId, renameList, deleteList, reorderLists } from "@/lib/data/lists";
import { createList } from "@/lib/data/lists/create";

const db = createDbClient();

async function createTestUser() {
  const [user] = await db
    .insert(users)
    .values({
      email: `list-test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@kanban.local`,
      passwordHash: "test-hash",
      name: "List Test User",
    })
    .returning();
  return user;
}

async function createTestBoard(ownerId: string) {
  const [board] = await db
    .insert(boards)
    .values({
      title: "Test Board",
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

describe("getListsByBoardId (integration)", () => {
  it("returns lists in position order for the owner", async () => {
    const user = await createTestUser();
    const board = await createTestBoard(user.id);
    await createList({ boardId: board.id, title: "A" });
    await createList({ boardId: board.id, title: "B" });
    await createList({ boardId: board.id, title: "C" });

    const result = await getListsByBoardId(board.id);

    expect(result.map((l) => l.title)).toEqual(["A", "B", "C"]);
    expect(result.map((l) => l.position)).toEqual([0, 1, 2]);
  });
});

describe("createList (integration)", () => {
  it("auto-assigns the next position based on existing lists", async () => {
    const user = await createTestUser();
    const board = await createTestBoard(user.id);
    const l0 = await createList({ boardId: board.id, title: "Zero" });
    const l1 = await createList({ boardId: board.id, title: "One" });
    expect(l0.position).toBe(0);
    expect(l1.position).toBe(1);
  });
});

describe("renameList (integration)", () => {
  it("updates the list title", async () => {
    const user = await createTestUser();
    const board = await createTestBoard(user.id);
    const list = await createList({ boardId: board.id, title: "Original" });

    const updated = await renameList(list.id, { title: "Renamed" });

    expect(updated?.title).toBe("Renamed");
  });
});

describe("deleteList (integration) — position recompaction", () => {
  it("recompacts positions after deletion", async () => {
    const user = await createTestUser();
    const board = await createTestBoard(user.id);
    const l0 = await createList({ boardId: board.id, title: "L0" });
    const l1 = await createList({ boardId: board.id, title: "L1" });
    const l2 = await createList({ boardId: board.id, title: "L2" });
    const l3 = await createList({ boardId: board.id, title: "L3" });

    const result = await deleteList(l1.id);
    expect(result?.id).toBe(l1.id);

    const after = await getListsByBoardId(board.id);
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
  });
});

describe("reorderLists (integration)", () => {
  it("reorders lists to match the new positions", async () => {
    const user = await createTestUser();
    const board = await createTestBoard(user.id);
    const a = await createList({ boardId: board.id, title: "A" });
    const b = await createList({ boardId: board.id, title: "B" });
    const c = await createList({ boardId: board.id, title: "C" });

    await reorderLists(board.id, [c.id, a.id, b.id]);

    const after = await getListsByBoardId(board.id);
    expect(after.map((l) => l.title)).toEqual(["C", "A", "B"]);
    expect(after.map((l) => l.position)).toEqual([0, 1, 2]);

    void a;
    void b;
  });
});
