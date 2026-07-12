import { describe, it, expect, vi, beforeEach } from "vitest";

let db: any;
let tx: any;
let selectCallCount = 0;
let returnedRows: any[] = [];

const setupDbMock = () => {
  const mock: any = {};
  mock.select = vi.fn(() => {
    selectCallCount++;
    mock.then = (onFulfilled: (v: any) => any) =>
      Promise.resolve(onFulfilled(returnedRows.shift() ?? []));
    return mock;
  });
  mock.delete = vi.fn(() => {
    mock.where = vi.fn(() => Promise.resolve());
    return mock;
  });
  mock.transaction = vi.fn(async (fn: (t: any) => Promise<unknown>) => fn(tx));
  mock.from = vi.fn(() => mock);
  mock.where = vi.fn(() => mock);
  return mock;
};

vi.mock("@/lib/db/client", async () => {
  const actual = await vi.importActual<typeof import("@/lib/db/client")>("@/lib/db/client");
  return { ...actual, createDbClient: () => db };
});

vi.mock("@/lib/db/schema/board-members", () => ({
  boardMembers: { _table: "board_members", boardId: "board_id", userId: "user_id", role: "role" },
}));

import { removeMember } from "../remove";

beforeEach(() => {
  selectCallCount = 0;
  returnedRows = [];
  db = setupDbMock();
  tx = db;
});

describe("removeMember", () => {
  it("performs exactly one member fetch (in-transaction) for self-removal of non-owner", async () => {
    returnedRows = [[{ boardId: "b1", userId: "u1", role: "member" }]];

    const result = await removeMember("b1", "u1", "u1");

    expect(result).toEqual({ success: true });
    expect(selectCallCount).toBe(1);
  });

  it("performs exactly one member fetch for removal by another user", async () => {
    returnedRows = [[{ boardId: "b1", userId: "u2", role: "member" }]];

    const result = await removeMember("b1", "u2", "u1");

    expect(result).toEqual({ success: true });
    expect(selectCallCount).toBe(1);
  });

  it("prevents owner self-removal within the transaction (single fetch)", async () => {
    returnedRows = [[{ boardId: "b1", userId: "u1", role: "owner" }]];

    const result = await removeMember("b1", "u1", "u1");

    expect(result).toEqual({ error: "Owner cannot remove themselves from the board" });
    expect(selectCallCount).toBe(1);
    expect(db.transaction).toHaveBeenCalled();
  });

  it("prevents removing the last owner", async () => {
    returnedRows = [[{ boardId: "b1", userId: "u2", role: "owner" }], [{ count: 0 }]];

    const result = await removeMember("b1", "u2", "u1");

    expect(result).toEqual({ error: "Cannot remove the last owner of the board" });
  });

  it("returns error when member is not found", async () => {
    returnedRows = [[]];

    const result = await removeMember("b1", "u2", "u1");

    expect(result).toEqual({ error: "User is not a member of this board" });
  });

  it("allows removing an owner when other owners exist", async () => {
    returnedRows = [[{ boardId: "b1", userId: "u2", role: "owner" }], [{ count: 1 }]];

    const result = await removeMember("b1", "u2", "u1");

    expect(result).toEqual({ success: true });
  });
});
