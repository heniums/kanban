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

import { createLabel, getLabelsByBoardId, updateLabel, deleteLabel, getLabelById } from "..";

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

describe("updateLabel", () => {
  it("modifies name and color for an owned label", async () => {
    selectResults = [[{ id: "l1" }]];
    returnedRows = [[{ id: "l1", boardId: "b1", name: "Updated", color: "#00ff00" }]];

    const result = await updateLabel(
      "l1",
      { name: "Updated", color: "#00ff00" },
      { ownerId: "user-1" },
    );

    expect(result.id).toBe("l1");
    expect(result.name).toBe("Updated");
    expect(result.color).toBe("#00ff00");
    expect(db.transaction).toHaveBeenCalled();
  });

  it("rejects when the label does not exist or board is not owned", async () => {
    selectResults = [[]];

    await expect(updateLabel("l1", { name: "X" }, { ownerId: "user-1" })).rejects.toThrow(
      /not found/,
    );

    expect(db.transaction).toHaveBeenCalled();
  });
});

describe("deleteLabel", () => {
  it("removes a label for an owned board", async () => {
    selectResults = [[{ id: "l1" }]];
    returnedRows = [[{ id: "l1", boardId: "b1", name: "Bug", color: "#ff0000" }]];

    const result = await deleteLabel("l1", { ownerId: "user-1" });

    expect(result.id).toBe("l1");
    expect(db.transaction).toHaveBeenCalled();
  });

  it("rejects when the label does not exist or board is not owned", async () => {
    selectResults = [[]];

    await expect(deleteLabel("l1", { ownerId: "user-1" })).rejects.toThrow(/not found/);

    expect(db.transaction).toHaveBeenCalled();
  });
});

describe("getLabelById", () => {
  it("returns a single label by ID for an owned board", async () => {
    selectResults = [[{ label: { id: "l1", boardId: "b1", name: "Bug", color: "#ff0000" } }]];

    const result = await getLabelById("l1", { ownerId: "user-1" });

    expect(result.id).toBe("l1");
    expect(result.name).toBe("Bug");
    expect(result.color).toBe("#ff0000");
  });

  it("rejects when the label does not exist or board is not owned", async () => {
    selectResults = [[]];

    await expect(getLabelById("l1", { ownerId: "user-1" })).rejects.toThrow(/not found/);
  });
});
