import { describe, it, expect, vi, beforeEach } from "vitest";

let db: any;
let returningImpl: any;
let tx: any;

const setupDbMock = () => {
  const mock: any = {};
  const returning = vi.fn();

  mock.delete = vi.fn(() => mock);
  mock.transaction = vi.fn(async (fn: (tx: any) => Promise<unknown>) => fn(tx));
  mock.execute = vi.fn(() => Promise.resolve(undefined));
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

vi.mock("@/lib/db/schema/boards", () => ({
  boards: { _table: "boards" },
}));

import { deleteList } from "../delete";

beforeEach(() => {
  const m = setupDbMock();
  db = m.db;
  tx = m.db;
  returningImpl = m.returning;
});

describe("deleteList", () => {
  it("deletes the list and returns the deleted record", async () => {
    returningImpl.mockResolvedValueOnce([{ id: "l1", boardId: "board-1", position: 1 }]);

    const result = await deleteList("l1", { ownerId: "user-1" });

    expect(db.transaction).toHaveBeenCalled();
    expect(db.delete).toHaveBeenCalled();
    expect(result).toEqual({ id: "l1", boardId: "board-1", position: 1 });
  });

  it("returns null when nothing was deleted", async () => {
    returningImpl.mockResolvedValueOnce([]);
    const result = await deleteList("missing", { ownerId: "user-1" });
    expect(result).toBeNull();
  });

  it("compacts positions of remaining lists on the same board", async () => {
    returningImpl.mockResolvedValueOnce([{ id: "l1", boardId: "board-1", position: 1 }]);

    await deleteList("l1", { ownerId: "user-1" });

    expect(db.execute).toHaveBeenCalledTimes(1);
  });
});
