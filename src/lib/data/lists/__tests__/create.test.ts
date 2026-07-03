import { describe, it, expect, vi, beforeEach } from "vitest";

let db: any;
let returningImpl: any;
let selectResults: any[] = [];
let selectCall = 0;
let capturedValues: unknown = null;
let tx: any;

const setupDbMock = () => {
  const mock: any = {};
  const returning = vi.fn();

  mock.select = vi.fn(() => {
    mock.then = (onFulfilled: (v: any) => any) =>
      Promise.resolve(onFulfilled(selectResults[selectCall++] ?? []));
    return mock;
  });
  mock.insert = vi.fn(() => mock);
  mock.update = vi.fn(() => mock);
  mock.delete = vi.fn(() => mock);
  mock.transaction = vi.fn(async (fn: (tx: any) => Promise<unknown>) => fn(tx));
  mock.execute = vi.fn(() => Promise.resolve(undefined));
  mock.from = vi.fn(() => mock);
  mock.innerJoin = vi.fn(() => mock);
  mock.leftJoin = vi.fn(() => mock);
  mock.values = vi.fn((v: unknown) => {
    capturedValues = v;
    return mock;
  });
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

vi.mock("@/lib/db/schema/lists", () => ({
  lists: { _table: "lists" },
}));

import { createList } from "../create";

beforeEach(() => {
  const m = setupDbMock();
  db = m.db;
  tx = m.db;
  returningImpl = m.returning;
  selectResults = [];
  selectCall = 0;
  capturedValues = null;
});

describe("createList", () => {
  it("inserts a list with position = max(existing positions) + 1 and returns it", async () => {
    selectResults = [[{ value: 2 }]];
    returningImpl.mockResolvedValueOnce([
      { id: "list-new", title: "Doing", boardId: "board-1", position: 3 },
    ]);

    const result = await createList({ boardId: "board-1", title: "Doing" });

    expect(db.transaction).toHaveBeenCalled();
    expect(db.from).toHaveBeenCalled();
    expect(db.values).toHaveBeenCalled();
    expect(capturedValues).toEqual({
      boardId: "board-1",
      title: "Doing",
      position: 3,
    });
    expect(result).toEqual({ id: "list-new", title: "Doing", boardId: "board-1", position: 3 });
  });

  it("starts position at 0 when no existing lists on the board", async () => {
    selectResults = [[{ value: null }]];
    returningImpl.mockResolvedValueOnce([
      { id: "list-new", title: "To Do", boardId: "board-1", position: 0 },
    ]);

    const result = await createList({ boardId: "board-1", title: "To Do" });

    expect((capturedValues as { position: number }).position).toBe(0);
    expect(result.position).toBe(0);
  });
});
