import { describe, it, expect, vi, beforeEach } from "vitest";

let db: any;
let returningImpl: any;
let selectResult: any[] = [];

const setupDbMock = () => {
  const mock: any = {};
  const returning = vi.fn();

  mock.select = vi.fn(() => {
    mock.then = (onFulfilled: (v: any) => any) => Promise.resolve(onFulfilled(selectResult));
    return mock;
  });
  mock.insert = vi.fn(() => mock);
  mock.update = vi.fn(() => mock);
  mock.transaction = vi.fn(async (fn: (tx: any) => Promise<unknown>) => fn(mock));
  mock.from = vi.fn(() => mock);
  mock.innerJoin = vi.fn(() => mock);
  mock.values = vi.fn(() => mock);
  mock.set = vi.fn(() => mock);
  mock.orderBy = vi.fn(() => mock);
  mock.limit = vi.fn(() => mock);
  mock.offset = vi.fn(() => mock);
  mock.where = vi.fn(() => mock);
  mock.returning = returning;

  return { db: mock, returning };
};

vi.mock("@/lib/db/client", async () => {
  const actual = await vi.importActual<typeof import("@/lib/db/client")>("@/lib/db/client");
  return {
    ...actual,
    createDbClient: () => db,
  };
});

vi.mock("@/lib/db/schema/boards", () => ({
  boards: { _table: "boards" },
}));

vi.mock("@/lib/db/schema/board-members", () => ({
  boardMembers: { _table: "board_members" },
}));

import { listDeletedBoardsByOwner } from "../list-deleted";

beforeEach(() => {
  const m = setupDbMock();
  db = m.db;
  returningImpl = m.returning;
  selectResult = [];
});

describe("listDeletedBoardsByOwner", () => {
  it("queries boards filtered by owner and deletedAt IS NOT NULL", async () => {
    selectResult = [];
    await listDeletedBoardsByOwner({ userId: "user-1" });
    expect(db.select).toHaveBeenCalled();
    expect(db.from).toHaveBeenCalled();
    expect(db.where).toHaveBeenCalled();
    expect(db.orderBy).toHaveBeenCalled();
    expect(db.limit).toHaveBeenCalledWith(10);
    expect(db.offset).toHaveBeenCalledWith(0);
  });

  it("returns paginated results with correct offset", async () => {
    selectResult = [];
    await listDeletedBoardsByOwner({ userId: "user-1", page: 3, limit: 10 });
    expect(db.limit).toHaveBeenCalledWith(10);
    expect(db.offset).toHaveBeenCalledWith(20);
  });

  it("returns boards and total count", async () => {
    selectResult = [{ id: "b1", title: "Deleted Board" }];
    const result = await listDeletedBoardsByOwner({ userId: "user-1" });
    expect(result.boards).toEqual(selectResult);
    expect(result.total).toBeDefined();
  });

  it("defaults to page 1 when page is less than 1", async () => {
    selectResult = [];
    await listDeletedBoardsByOwner({ userId: "user-1", page: 0 });
    expect(db.offset).toHaveBeenCalledWith(0);
  });

  it("applies search filter when search term is provided", async () => {
    selectResult = [];
    await listDeletedBoardsByOwner({ userId: "user-1", search: "test" });
    expect(db.where).toHaveBeenCalled();
  });
});
