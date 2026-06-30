import { describe, it, expect, vi, beforeEach } from "vitest";

let db: any;
let returningImpl: any;
let tx: any;

const setupDbMock = () => {
  const mock: any = {};
  const returning = vi.fn();

  mock.update = vi.fn(() => mock);
  mock.transaction = vi.fn(async (fn: (tx: any) => Promise<unknown>) => fn(tx));
  mock.set = vi.fn(() => mock);
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

import { reorderLists } from "../reorder";

beforeEach(() => {
  const m = setupDbMock();
  db = m.db;
  tx = m.db;
  returningImpl = m.returning;
});

describe("reorderLists", () => {
  it("uses a two-pass strategy to avoid unique constraint conflicts", async () => {
    // First pass: 3 set() calls for negative positions
    // Second pass: 3 returning() calls for final positions
    returningImpl.mockResolvedValueOnce([{ id: "l2", position: 0 }]);
    returningImpl.mockResolvedValueOnce([{ id: "l1", position: 1 }]);
    returningImpl.mockResolvedValueOnce([{ id: "l3", position: 2 }]);

    const result = await reorderLists("board-1", ["l2", "l1", "l3"], { ownerId: "user-1" });

    expect(db.transaction).toHaveBeenCalled();
    expect(db.update).toHaveBeenCalled();
    expect(result).toHaveLength(3);
  });

  it("returns empty array when no list IDs are provided", async () => {
    const result = await reorderLists("board-1", [], { ownerId: "user-1" });
    expect(result).toEqual([]);
  });

  it("skips lists that do not belong to the board or owner", async () => {
    returningImpl.mockResolvedValueOnce([{ id: "l1", position: 0 }]);
    returningImpl.mockResolvedValueOnce([]);
    returningImpl.mockResolvedValueOnce([{ id: "l3", position: 2 }]);

    const result = await reorderLists("board-1", ["l1", "l2", "l3"], { ownerId: "user-1" });

    expect(result).toHaveLength(2);
    expect(result.map((r: { id: string }) => r.id)).toEqual(["l1", "l3"]);
  });
});
