import { describe, it, expect, vi, beforeEach } from "vitest";

let db: any;
let returningImpl: any;
let capturedSet: unknown = null;
let capturedWhere: unknown = null;

const setupDbMock = () => {
  const mock: any = {};
  const returning = vi.fn();

  mock.update = vi.fn(() => mock);
  mock.set = vi.fn((v: unknown) => {
    capturedSet = v;
    return mock;
  });
  mock.where = vi.fn((w: unknown) => {
    capturedWhere = w;
    return mock;
  });
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

import { renameList } from "../update";

beforeEach(() => {
  const m = setupDbMock();
  db = m.db;
  returningImpl = m.returning;
  capturedSet = null;
  capturedWhere = null;
});

describe("renameList", () => {
  it("updates the list title scoped to the owner", async () => {
    returningImpl.mockResolvedValueOnce([{ id: "l1", title: "New Title" }]);

    const result = await renameList("l1", { title: "New Title" }, { ownerId: "user-1" });

    expect(db.update).toHaveBeenCalled();
    expect(capturedSet).toEqual({ title: "New Title" });
    expect(result).toEqual({ id: "l1", title: "New Title" });
  });

  it("returns null if the list is not found or not owned", async () => {
    returningImpl.mockResolvedValueOnce([]);
    const result = await renameList("missing", { title: "X" }, { ownerId: "user-1" });
    expect(result).toBeNull();
  });

  it("scopes to the owner via the boards subquery", async () => {
    returningImpl.mockResolvedValueOnce([{ id: "l1", title: "X" }]);
    await renameList("l1", { title: "X" }, { ownerId: "user-1" });
    const whereString = JSON.stringify(capturedWhere);
    expect(whereString).toContain("user-1");
  });
});
