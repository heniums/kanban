import { describe, it, expect, vi, beforeEach } from "vitest";

let db: any;
let selectResult: any[] = [];

const setupDbMock = () => {
  const mock: any = {};

  mock.select = vi.fn(() => {
    mock.then = (onFulfilled: (v: any) => any) => Promise.resolve(onFulfilled(selectResult));
    return mock;
  });
  mock.from = vi.fn(() => mock);
  mock.innerJoin = vi.fn(() => mock);
  mock.where = vi.fn(() => mock);
  mock.orderBy = vi.fn(() => mock);

  return { db: mock };
};

vi.mock("@/lib/db/client", async () => {
  const actual = await vi.importActual<typeof import("@/lib/db/client")>("@/lib/db/client");
  return {
    ...actual,
    createDbClient: () => db,
  };
});

vi.mock("@/lib/db/schema/lists", () => ({
  lists: { _table: "lists" },
}));

vi.mock("@/lib/db/schema/boards", () => ({
  boards: { _table: "boards" },
}));

vi.mock("@/lib/db/schema/board-members", () => ({
  boardMembers: { _table: "board_members" },
}));

import { getListsByBoardId } from "../get";

beforeEach(() => {
  const m = setupDbMock();
  db = m.db;
  selectResult = [];
});

describe("getListsByBoardId", () => {
  it("returns the lists for a board ordered by position", async () => {
    selectResult = [
      { list: { id: "l1", position: 0, title: "A", boardId: "board-1" } },
      { list: { id: "l2", position: 1, title: "B", boardId: "board-1" } },
    ];

    const result = await getListsByBoardId("board-1", { userId: "user-1" });

    expect(result).toEqual([
      { id: "l1", position: 0, title: "A", boardId: "board-1" },
      { id: "l2", position: 1, title: "B", boardId: "board-1" },
    ]);
    expect(db.select).toHaveBeenCalled();
    expect(db.from).toHaveBeenCalled();
    expect(db.innerJoin).toHaveBeenCalled();
    expect(db.where).toHaveBeenCalled();
    expect(db.orderBy).toHaveBeenCalled();
  });

  it("returns empty array when board has no lists", async () => {
    selectResult = [];
    const result = await getListsByBoardId("empty-board", { userId: "user-1" });
    expect(result).toEqual([]);
  });

  it("joins with board_members for membership check", async () => {
    selectResult = [];
    await getListsByBoardId("board-other", { userId: "user-1" });
    expect(db.innerJoin).toHaveBeenCalled();
  });
});
