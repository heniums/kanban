import { describe, it, expect, vi, beforeEach } from "vitest";

let db: any;
let selectResult: any[] = [];
let capturedWhere: unknown = null;

const setupDbMock = () => {
  const mock: any = {};

  mock.select = vi.fn(() => {
    mock.then = (onFulfilled: (v: any) => any) => Promise.resolve(onFulfilled(selectResult));
    return mock;
  });
  mock.from = vi.fn(() => mock);
  mock.innerJoin = vi.fn(() => mock);
  mock.where = vi.fn((w: unknown) => {
    capturedWhere = w;
    return mock;
  });
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

import { getListsByBoardId } from "../get";

beforeEach(() => {
  const m = setupDbMock();
  db = m.db;
  selectResult = [];
  capturedWhere = null;
});

describe("getListsByBoardId", () => {
  it("returns the lists for a board ordered by position", async () => {
    selectResult = [
      { list: { id: "l1", position: 0, title: "A", boardId: "board-1" } },
      { list: { id: "l2", position: 1, title: "B", boardId: "board-1" } },
    ];

    const result = await getListsByBoardId("board-1", { ownerId: "user-1" });

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
    const result = await getListsByBoardId("empty-board", { ownerId: "user-1" });
    expect(result).toEqual([]);
  });

  it("scopes the query to the owner (refuses mismatched board owner)", async () => {
    selectResult = [];
    await getListsByBoardId("board-other", { ownerId: "user-1" });
    const whereString = JSON.stringify(capturedWhere);
    expect(whereString).toContain("user-1");
  });
});
