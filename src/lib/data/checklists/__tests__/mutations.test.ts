import { describe, it, expect, vi, beforeEach } from "vitest";

let db: any;
let tx: any;
let returnedRows: any[] = [];

const setupDbMock = () => {
  const mock: any = {};
  mock.select = vi.fn(() => {
    mock.then = (onFulfilled: (v: any) => any) =>
      Promise.resolve(onFulfilled(returnedRows.shift() ?? []));
    return mock;
  });
  mock.insert = vi.fn(() => {
    mock.values = vi.fn(() => {
      mock.returning = vi.fn(() => Promise.resolve(returnedRows.shift() ?? []));
      return mock;
    });
    return mock;
  });
  mock.update = vi.fn(() => mock);
  mock.delete = vi.fn(() => mock);
  mock.transaction = vi.fn(async (fn: (t: any) => Promise<unknown>) => fn(tx));
  mock.from = vi.fn(() => mock);
  mock.innerJoin = vi.fn(() => mock);
  mock.orderBy = vi.fn(() => mock);
  mock.set = vi.fn(() => mock);
  mock.where = vi.fn(() => mock);
  mock.execute = vi.fn(() => Promise.resolve({ rows: [] }));
  return mock;
};

vi.mock("@/lib/db/client", async () => {
  const actual = await vi.importActual<typeof import("@/lib/db/client")>("@/lib/db/client");
  return { ...actual, createDbClient: () => db };
});

vi.mock("@/lib/db/schema/checklists", () => ({
  checklists: { _table: "checklists" },
}));
vi.mock("@/lib/db/schema/checklist-items", () => ({
  checklistItems: { _table: "checklist_items" },
}));
vi.mock("@/lib/db/schema/cards", () => ({
  cards: { _table: "cards" },
}));
vi.mock("@/lib/db/schema/boards", () => ({
  boards: { _table: "boards" },
}));

import { createChecklist, createChecklistItem } from "../mutations";

beforeEach(() => {
  db = setupDbMock();
  tx = db;
  returnedRows = [];
});

describe("createChecklist", () => {
  it("creates a checklist with auto-incremented position", async () => {
    returnedRows = [[{ value: 1 }], [{ id: "cl-1", cardId: "card-1", title: "Test", position: 2 }]];

    const result = await createChecklist({ cardId: "card-1", title: "Test" });

    expect(result.id).toBe("cl-1");
    expect(result.title).toBe("Test");
    expect(db.transaction).toHaveBeenCalled();
  });
});

describe("createChecklistItem", () => {
  it("creates a checklist item with auto-incremented position", async () => {
    returnedRows = [
      [{ value: 0 }],
      [{ id: "ci-1", checklistId: "cl-1", content: "Buy milk", isCompleted: false, position: 1 }],
    ];

    const result = await createChecklistItem({
      checklistId: "cl-1",
      content: "Buy milk",
    });

    expect(result.id).toBe("ci-1");
    expect(result.content).toBe("Buy milk");
    expect(db.transaction).toHaveBeenCalled();
  });
});
