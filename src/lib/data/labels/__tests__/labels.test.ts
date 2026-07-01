import { describe, it, expect, vi, beforeEach } from "vitest";

let db: any;
let tx: any;
let selectResults: any[] = [];
let selectCall = 0;
let returnedRows: any[] = [];

const setupDbMock = () => {
  const mock: any = {};
  mock.select = vi.fn(() => {
    mock.then = (onFulfilled: (v: any) => any) =>
      Promise.resolve(onFulfilled(selectResults[selectCall++] ?? []));
    return mock;
  });
  mock.insert = vi.fn(() => {
    mock.values = vi.fn(() => {
      mock.returning = vi.fn(() => Promise.resolve(returnedRows.shift() ?? []));
      return mock;
    });
    return mock;
  });
  mock.update = vi.fn(() => {
    mock.set = vi.fn(() => {
      mock.where = vi.fn(() => {
        mock.returning = vi.fn(() => Promise.resolve(returnedRows.shift() ?? []));
        return mock;
      });
      return mock;
    });
    return mock;
  });
  mock.delete = vi.fn(() => {
    mock.where = vi.fn(() => {
      mock.returning = vi.fn(() => Promise.resolve(returnedRows.shift() ?? []));
      return mock;
    });
    return mock;
  });
  mock.transaction = vi.fn(async (fn: (t: any) => Promise<unknown>) => fn(tx));
  mock.from = vi.fn(() => mock);
  mock.innerJoin = vi.fn(() => mock);
  mock.orderBy = vi.fn(() => mock);
  mock.where = vi.fn(() => mock);
  return mock;
};

vi.mock("@/lib/db/client", async () => {
  const actual = await vi.importActual<typeof import("@/lib/db/client")>("@/lib/db/client");
  return {
    ...actual,
    createDbClient: () => db,
  };
});

vi.mock("@/lib/db/schema/labels", () => ({
  labels: { _table: "labels" },
}));
vi.mock("@/lib/db/schema/boards", () => ({
  boards: { _table: "boards" },
}));

import { createLabel, updateLabel, deleteLabel, getLabelsByBoardId } from "..";

beforeEach(() => {
  db = setupDbMock();
  tx = db;
  selectResults = [];
  selectCall = 0;
  returnedRows = [];
});

describe("createLabel", () => {
  it("creates a label on a board owned by the user", async () => {
    selectResults = [[{ id: "board-1" }]];
    returnedRows = [[{ id: "l1", boardId: "board-1", name: "Bug", color: "#ff0000" }]];

    const result = await createLabel(
      { boardId: "board-1", name: "Bug", color: "#ff0000" },
      { ownerId: "user-1" },
    );

    expect(result.id).toBe("l1");
    expect(db.transaction).toHaveBeenCalled();
  });

  it("rejects when the board is not owned", async () => {
    selectResults = [[]];
    await expect(
      createLabel({ boardId: "x", name: "X", color: "#000" }, { ownerId: "user-1" }),
    ).rejects.toThrow(/not found/);
  });
});

describe("updateLabel", () => {
  it("updates name and color", async () => {
    returnedRows = [[{ id: "l1", name: "New", color: "#00ff00" }]];
    const result = await updateLabel(
      "l1",
      { name: "New", color: "#00ff00" },
      { ownerId: "user-1" },
    );
    expect(result?.name).toBe("New");
  });

  it("returns null when label not found", async () => {
    returnedRows = [[]];
    const result = await updateLabel("missing", { name: "X" }, { ownerId: "user-1" });
    expect(result).toBeNull();
  });
});

describe("deleteLabel", () => {
  it("deletes a label and returns it", async () => {
    returnedRows = [[{ id: "l1" }]];
    const result = await deleteLabel("l1", { ownerId: "user-1" });
    expect(result?.id).toBe("l1");
  });
});

describe("getLabelsByBoardId", () => {
  it("returns labels for a board", async () => {
    selectResults = [
      [
        { label: { id: "l1", boardId: "b1", name: "A", color: "#000" } },
        { label: { id: "l2", boardId: "b1", name: "B", color: "#fff" } },
      ],
    ];
    const result = await getLabelsByBoardId("b1", { ownerId: "user-1" });
    expect(result).toHaveLength(2);
  });
});
