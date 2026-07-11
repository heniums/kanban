import { describe, it, expect, vi, beforeEach } from "vitest";

let db: any;
let tx: any;
let updateCount: number;
let selectResults: any[];
let selectCall: number;
let executeReturns: any[];
let updateReturningReturns: any[];

const setupDbMock = () => {
  const mock: any = {};

  mock.select = vi.fn(() => {
    const builder: any = {
      from: vi.fn(() => builder),
      innerJoin: vi.fn(() => builder),
      leftJoin: vi.fn(() => builder),
      where: vi.fn(() => builder),
      orderBy: vi.fn(() => builder),
    };
    builder.then = (resolve: any) => Promise.resolve(resolve(selectResults[selectCall++] ?? []));
    return builder;
  });

  mock.update = vi.fn(() => {
    updateCount++;
    const builder: any = {
      set: vi.fn(() => builder),
      where: vi.fn(() => builder),
      returning: vi.fn(() => Promise.resolve(updateReturningReturns.shift() ?? [])),
    };
    builder.then = (resolve: any) => Promise.resolve(resolve(undefined));
    return builder;
  });

  mock.execute = vi.fn(() => Promise.resolve({ rows: executeReturns.shift() ?? [] }));

  mock.transaction = vi.fn(async (fn: any) => fn(tx));
  return mock;
};

vi.mock("@/lib/db/client", async () => {
  const actual = await vi.importActual<typeof import("@/lib/db/client")>("@/lib/db/client");
  return { ...actual, createDbClient: () => db };
});

vi.mock("@/lib/db/schema/cards", () => ({ cards: { _table: "cards" } }));
vi.mock("@/lib/db/schema/lists", () => ({ lists: { _table: "lists" } }));
vi.mock("@/lib/db/schema/boards", () => ({ boards: { _table: "boards" } }));
vi.mock("@/lib/db/schema/card-labels", () => ({ cardLabels: { _table: "card_labels" } }));
vi.mock("@/lib/db/schema/card-assignees", () => ({ cardAssignees: { _table: "card_assignees" } }));
vi.mock("@/lib/cloudinary", () => ({ deleteCloudinaryAsset: vi.fn() }));
vi.mock("@/lib/data/attachments", () => ({
  listAttachmentsByCardId: vi.fn(() => Promise.resolve([])),
}));

import { moveCard } from "../mutations";

beforeEach(() => {
  db = setupDbMock();
  tx = db;
  updateCount = 0;
  selectCall = 0;
  selectResults = [];
  executeReturns = [];
  updateReturningReturns = [];
});

describe("moveCard update count", () => {
  it("within same list issues a constant number of UPDATE statements regardless of list size", async () => {
    // 4-card same-list move (move c2 to position 0)
    selectResults = [
      [{ id: "c2", listId: "l0", boardId: "b0", position: 1 }],
      [{ id: "l0" }],
      [{ id: "c0" }, { id: "c1" }, { id: "c2" }, { id: "c3" }],
    ];
    executeReturns = [[{ max: 4 }]];
    updateReturningReturns = [
      Array.from({ length: 4 }, (_, i) => ({ id: `c${i}`, listId: "l0", position: i })),
    ];

    await moveCard("c2", "l0", 0);
    const smallListUpdateCount = updateCount;

    // 10-card same-list move (move c5 to position 0)
    updateCount = 0;
    selectCall = 0;
    selectResults = [
      [{ id: "c5", listId: "l0", boardId: "b0", position: 5 }],
      [{ id: "l0" }],
      Array.from({ length: 10 }, (_, i) => ({ id: `c${i}` })),
    ];
    executeReturns = [[{ max: 10 }]];
    updateReturningReturns = [
      Array.from({ length: 10 }, (_, i) => ({ id: `c${i}`, listId: "l0", position: i })),
    ];

    await moveCard("c5", "l0", 0);
    const largeListUpdateCount = updateCount;

    expect(smallListUpdateCount).toBe(largeListUpdateCount);
    expect(smallListUpdateCount).toBeLessThanOrEqual(5);
  });

  it("across lists issues a constant number of UPDATE statements regardless of list size", async () => {
    // Small source (3 cards) → target (2 cards); move c1 to position 1
    selectResults = [
      [{ id: "c1", listId: "l0", boardId: "b0", position: 1 }],
      [{ id: "l1" }],
      [{ id: "c0" }, { id: "c1" }, { id: "c2" }],
      [{ id: "t0" }, { id: "t1" }],
    ];
    executeReturns = [[{ max: 2 }]];
    updateReturningReturns = [
      [
        { id: "t0", listId: "l1", position: 0 },
        { id: "c1", listId: "l1", position: 1 },
        { id: "t1", listId: "l1", position: 2 },
      ],
    ];

    await moveCard("c1", "l1", 1);
    const smallUpdateCount = updateCount;

    // Large source (10 cards) → same target (2 cards); move c5 to position 1
    updateCount = 0;
    selectCall = 0;
    selectResults = [
      [{ id: "c5", listId: "l0", boardId: "b0", position: 5 }],
      [{ id: "l1" }],
      Array.from({ length: 10 }, (_, i) => ({ id: `c${i}` })),
      [{ id: "t0" }, { id: "t1" }],
    ];
    executeReturns = [[{ max: 2 }]];
    updateReturningReturns = [
      [
        { id: "t0", listId: "l1", position: 0 },
        { id: "c5", listId: "l1", position: 1 },
        { id: "t1", listId: "l1", position: 2 },
      ],
    ];

    await moveCard("c5", "l1", 1);
    const largeUpdateCount = updateCount;

    expect(smallUpdateCount).toBe(largeUpdateCount);
    expect(smallUpdateCount).toBeLessThanOrEqual(5);
  });
});
