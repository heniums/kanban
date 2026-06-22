import { describe, it, expect, vi, beforeEach } from "vitest";

let db: any;
let returningImpl: any;
let operation: "select" | "insert" | "update" | null = null;
let selectResult: any[] = [];

const setupDbMock = () => {
  const mock: any = {};
  const returning = vi.fn();

  mock.select = vi.fn(() => {
    operation = "select";
    mock.then = (onFulfilled: (v: any) => any) =>
      Promise.resolve(onFulfilled(selectResult));
    return mock;
  });
  mock.insert = vi.fn(() => {
    operation = "insert";
    return mock;
  });
  mock.update = vi.fn(() => {
    operation = "update";
    return mock;
  });
  mock.from = vi.fn(() => mock);
  mock.values = vi.fn(() => mock);
  mock.set = vi.fn(() => mock);
  mock.orderBy = vi.fn(() => mock);
  mock.limit = vi.fn(() => mock);
  mock.offset = vi.fn(() => mock);
  mock.where = vi.fn(() => {
    if (operation === "select") {
      return mock;
    }
    return mock;
  });
  mock.returning = returning;

  return { db: mock, returning };
};

vi.mock("@kanban/shared", async () => {
  const actual = await vi.importActual<typeof import("@kanban/shared")>("@kanban/shared");
  return {
    ...actual,
    createDbClient: () => db,
    boards: { _table: "boards" },
  };
});

import {
  getBoardById,
  getBoardByIdIncludingDeleted,
  listBoardsByOwner,
  createBoard,
  updateBoard,
  softDeleteBoard,
  restoreBoard,
} from "../index";

beforeEach(() => {
  const m = setupDbMock();
  db = m.db;
  returningImpl = m.returning;
  operation = null;
  selectResult = [];
});

describe("getBoardById", () => {
  it("returns the first row from db.select", async () => {
    selectResult = [{ id: "board-1", title: "Test" }];
    const board = await getBoardById("board-1");
    expect(db.select).toHaveBeenCalled();
    expect(db.from).toHaveBeenCalled();
    expect(db.where).toHaveBeenCalled();
    expect(board).toEqual({ id: "board-1", title: "Test" });
  });

  it("returns null if no row found", async () => {
    selectResult = [];
    const board = await getBoardById("missing");
    expect(board).toBeNull();
  });
});

describe("getBoardByIdIncludingDeleted", () => {
  it("returns the row even if soft-deleted (no deletedAt filter)", async () => {
    selectResult = [
      { id: "board-1", title: "Deleted", deletedAt: new Date() },
    ];
    const board = await getBoardByIdIncludingDeleted("board-1");
    expect(board).not.toBeNull();
    expect(board?.title).toBe("Deleted");
  });
});

describe("listBoardsByOwner", () => {
  it("filters by owner, orders, and applies limit", async () => {
    selectResult = [];
    await listBoardsByOwner("user-1");
    expect(db.where).toHaveBeenCalled();
    expect(db.orderBy).toHaveBeenCalled();
    expect(db.limit).toHaveBeenCalledWith(100);
  });
});

describe("createBoard", () => {
  it("inserts and returns the inserted row", async () => {
    const board = { id: "new", title: "Test", ownerId: "u1" };
    returningImpl.mockResolvedValueOnce([board]);
    const result = await createBoard({
      title: "Test",
      background: "#000",
      ownerId: "u1",
    });
    expect(db.insert).toHaveBeenCalled();
    expect(db.values).toHaveBeenCalled();
    expect(result).toEqual(board);
  });
});

describe("updateBoard", () => {
  it("calls db.update and returns the updated row", async () => {
    returningImpl.mockResolvedValueOnce([{ id: "board-1", title: "New" }]);
    const result = await updateBoard(
      "board-1",
      { title: "New" },
      { ownerId: "user-1" }
    );
    expect(db.update).toHaveBeenCalled();
    expect(db.set).toHaveBeenCalledWith({ title: "New" });
    expect(result).toEqual({ id: "board-1", title: "New" });
  });

  it("returns null if no row updated", async () => {
    returningImpl.mockResolvedValueOnce([]);
    const result = await updateBoard(
      "board-1",
      { title: "New" },
      { ownerId: "user-1" }
    );
    expect(result).toBeNull();
  });
});

describe("softDeleteBoard", () => {
  it("sets deletedAt to a Date and filters by id", async () => {
    returningImpl.mockResolvedValueOnce([{ id: "board-1" }]);
    await softDeleteBoard("board-1", { ownerId: "user-1" });
    expect(db.update).toHaveBeenCalled();
    const setArg = db.set.mock.calls[0][0];
    expect(setArg).toHaveProperty("deletedAt");
    expect(setArg.deletedAt).toBeInstanceOf(Date);
  });
});

describe("restoreBoard", () => {
  it("sets deletedAt to null", async () => {
    returningImpl.mockResolvedValueOnce([{ id: "board-1" }]);
    await restoreBoard("board-1", { ownerId: "user-1" });
    expect(db.update).toHaveBeenCalled();
    expect(db.set).toHaveBeenCalledWith({ deletedAt: null });
  });
});
