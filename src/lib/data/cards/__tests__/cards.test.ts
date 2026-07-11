import { describe, it, expect, vi, beforeEach } from "vitest";

let db: any;
let tx: any;
let selectResults: any[] = [];
let selectCall = 0;
let capturedInserts: unknown[] = [];
let capturedUpdates: Array<{ set: unknown; where: unknown }> = [];
let capturedDeletes: unknown[] = [];
let returnedRows: any[] = [];
let executeReturnRows: any[] = [];

const setupDbMock = () => {
  const mock: any = {};
  mock.select = vi.fn(() => {
    mock.then = (onFulfilled: (v: any) => any) =>
      Promise.resolve(onFulfilled(selectResults[selectCall++] ?? []));
    return mock;
  });
  mock.insert = vi.fn(() => {
    mock.values = vi.fn((v: unknown) => {
      capturedInserts.push(v);
      mock.returning = vi.fn(() => Promise.resolve(returnedRows.shift() ?? []));
      return mock;
    });
    return mock;
  });
  mock.update = vi.fn(() => {
    mock.set = vi.fn((s: unknown) => {
      capturedUpdates.push({ set: s, where: null });
      mock.where = vi.fn((w: unknown) => {
        const last = capturedUpdates[capturedUpdates.length - 1];
        last.where = w;
        mock.returning = vi.fn(() => Promise.resolve(returnedRows.shift() ?? []));
        return mock;
      });
      return mock;
    });
    return mock;
  });
  mock.delete = vi.fn(() => {
    mock.where = vi.fn((w: unknown) => {
      capturedDeletes.push(w);
      mock.returning = vi.fn(() => Promise.resolve(returnedRows.shift() ?? []));
      return mock;
    });
    return mock;
  });
  mock.transaction = vi.fn(async (fn: (t: any) => Promise<unknown>) => fn(tx));
  mock.execute = vi.fn(() => Promise.resolve({ rows: executeReturnRows.shift() ?? [] }));
  mock.from = vi.fn(() => mock);
  mock.innerJoin = vi.fn(() => mock);
  mock.leftJoin = vi.fn(() => mock);
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

vi.mock("@/lib/db/schema/cards", () => ({
  cards: { _table: "cards" },
}));
vi.mock("@/lib/db/schema/card-labels", () => ({
  cardLabels: { _table: "card_labels" },
}));
vi.mock("@/lib/db/schema/card-assignees", () => ({
  cardAssignees: { _table: "card_assignees" },
}));
vi.mock("@/lib/db/schema/lists", () => ({
  lists: { _table: "lists" },
}));
vi.mock("@/lib/db/schema/boards", () => ({
  boards: { _table: "boards" },
}));
vi.mock("@/lib/cloudinary", () => ({
  deleteCloudinaryAsset: vi.fn(),
}));
vi.mock("@/lib/data/attachments", () => ({
  listAttachmentsByCardId: vi.fn(() => Promise.resolve([])),
}));

import { createCard, updateCard, copyCard, deleteCard, reorderCards } from "..";

beforeEach(() => {
  db = setupDbMock();
  tx = db;
  selectResults = [];
  selectCall = 0;
  capturedInserts = [];
  capturedUpdates = [];
  capturedDeletes = [];
  returnedRows = [];
  executeReturnRows = [];
});

describe("createCard", () => {
  it("inserts a card with auto-position and returns it", async () => {
    // First select: verify board (with list) ownership
    selectResults = [
      [{ id: "list-1", boardId: "board-1" }], // list lookup
      [{ value: 2 }], // max position
    ];
    returnedRows = [
      [{ id: "card-new", title: "Do thing", listId: "list-1", boardId: "board-1", position: 3 }],
    ];

    const result = await createCard({ listId: "list-1", title: "Do thing" });

    expect(db.transaction).toHaveBeenCalled();
    expect(capturedInserts.length).toBeGreaterThan(0);
    expect(capturedInserts[0]).toMatchObject({
      listId: "list-1",
      boardId: "board-1",
      title: "Do thing",
      position: 3,
    });
    expect(result).toEqual({
      id: "card-new",
      title: "Do thing",
      listId: "list-1",
      boardId: "board-1",
      position: 3,
    });
  });

  it("starts position at 0 when no existing cards", async () => {
    selectResults = [[{ id: "list-1", boardId: "board-1" }], [{ value: null }]];
    returnedRows = [[{ id: "c1", position: 0, listId: "list-1", boardId: "board-1" }]];

    await createCard({ listId: "list-1", title: "First" });
    expect((capturedInserts[0] as { position: number }).position).toBe(0);
  });

  it("rejects when the list is not found", async () => {
    selectResults = [[]];

    await expect(createCard({ listId: "missing", title: "X" })).rejects.toThrow(/not found/);
  });

  it("links labels in a single batch insert", async () => {
    selectResults = [[{ id: "list-1", boardId: "board-1" }], [{ value: 0 }]];
    returnedRows = [[{ id: "c1", position: 0, listId: "list-1", boardId: "board-1" }]];

    await createCard({ listId: "list-1", title: "With labels", labelIds: ["l1", "l2"] });
    // Card insert + 1 batch label insert = 2 total insert calls
    expect(capturedInserts.length).toBe(2);
    expect(Array.isArray(capturedInserts[1])).toBe(true);
    expect(capturedInserts[1]).toContainEqual({ cardId: "c1", labelId: "l1" });
    expect(capturedInserts[1]).toContainEqual({ cardId: "c1", labelId: "l2" });
  });

  it("links assignees in a single batch insert", async () => {
    selectResults = [[{ id: "list-1", boardId: "board-1" }], [{ value: 0 }]];
    returnedRows = [[{ id: "c1", position: 0, listId: "list-1", boardId: "board-1" }]];

    await createCard({ listId: "list-1", title: "With assignees", assigneeIds: ["u1", "u2"] });
    expect(capturedInserts.length).toBe(2);
    expect(Array.isArray(capturedInserts[1])).toBe(true);
    expect(capturedInserts[1]).toContainEqual({ cardId: "c1", userId: "u1" });
    expect(capturedInserts[1]).toContainEqual({ cardId: "c1", userId: "u2" });
  });
});

describe("deleteCard", () => {
  it("deletes the card and recompacts positions in its list", async () => {
    returnedRows = [[{ id: "c1", listId: "list-1", boardId: "board-1", position: 2 }]];

    const result = await deleteCard("c1");

    expect(db.transaction).toHaveBeenCalled();
    expect(db.execute).toHaveBeenCalled();
    expect(result).toEqual({
      id: "c1",
      listId: "list-1",
      boardId: "board-1",
      position: 2,
    });
  });

  it("returns null when the card is not found", async () => {
    returnedRows = [[]];

    const result = await deleteCard("missing");
    expect(result).toBeNull();
  });
});

describe("reorderCards", () => {
  it("uses a two-pass strategy to avoid unique constraint conflicts", async () => {
    // Post-refactor: a single `.returning()` call from the final batched
    // UPDATE returns all updated rows in one array (Drizzle-mapped camelCase).
    returnedRows = [
      [
        { id: "c2", position: 0 },
        { id: "c1", position: 1 },
        { id: "c3", position: 2 },
      ],
    ];

    const result = await reorderCards("list-1", ["c2", "c1", "c3"]);

    expect(db.transaction).toHaveBeenCalled();
    expect(result).toHaveLength(3);
  });

  it("issues a constant number of UPDATE statements regardless of list size", async () => {
    returnedRows = [
      [
        { id: "c2", position: 0 },
        { id: "c1", position: 1 },
        { id: "c3", position: 2 },
      ],
    ];
    await reorderCards("list-1", ["c2", "c1", "c3"]);
    const smallCount = capturedUpdates.length;

    capturedUpdates = [];
    returnedRows = [Array.from({ length: 10 }, (_, i) => ({ id: `c${i}`, position: i }))];
    await reorderCards(
      "list-1",
      Array.from({ length: 10 }, (_, i) => `c${i}`),
    );
    const largeCount = capturedUpdates.length;

    expect(smallCount).toBe(largeCount);
    expect(smallCount).toBeLessThanOrEqual(5);
  });

  it("returns empty array when no card IDs are provided", async () => {
    const result = await reorderCards("list-1", []);
    expect(result).toEqual([]);
  });

  it("rejects duplicate card ids", async () => {
    await expect(reorderCards("list-1", ["c1", "c2", "c1"])).rejects.toThrow(/duplicates/);
  });
});

describe("updateCard", () => {
  it("replaces labels in a single batch insert", async () => {
    returnedRows = [
      [{ id: "c1", title: "Updated", position: 0, listId: "list-1", boardId: "board-1" }],
    ];

    await updateCard("c1", { title: "Updated", labelIds: ["l1", "l2"] });

    // 1 batch label insert only (no card insert)
    expect(capturedInserts.length).toBe(1);
    expect(Array.isArray(capturedInserts[0])).toBe(true);
    expect(capturedInserts[0]).toContainEqual({ cardId: "c1", labelId: "l1" });
    expect(capturedInserts[0]).toContainEqual({ cardId: "c1", labelId: "l2" });
    // 1 delete call for old labels
    expect(capturedDeletes.length).toBe(1);
  });

  it("replaces assignees in a single batch insert", async () => {
    returnedRows = [
      [{ id: "c1", title: "Updated", position: 0, listId: "list-1", boardId: "board-1" }],
    ];

    await updateCard("c1", { assigneeIds: ["u1", "u2"] });

    expect(capturedInserts.length).toBe(1);
    expect(Array.isArray(capturedInserts[0])).toBe(true);
    expect(capturedInserts[0]).toContainEqual({ cardId: "c1", userId: "u1" });
    expect(capturedInserts[0]).toContainEqual({ cardId: "c1", userId: "u2" });
  });

  it("clears labels with delete-only when empty array provided", async () => {
    returnedRows = [
      [{ id: "c1", title: "Card", position: 0, listId: "list-1", boardId: "board-1" }],
    ];

    await updateCard("c1", { title: "Card", labelIds: [] });

    expect(capturedDeletes.length).toBe(1);
    expect(capturedInserts.length).toBe(0);
  });
});

describe("copyCard", () => {
  it("copies labels and assignees in single batch inserts", async () => {
    selectResults = [
      [
        {
          id: "src-1",
          title: "Original",
          listId: "list-1",
          boardId: "board-1",
          position: 0,
          description: null,
          dueDate: null,
        },
      ],
      [{ value: 0 }], // max position
      [{ labelId: "l1" }, { labelId: "l2" }], // source labels
      [], // consumed by label insert await
      [{ userId: "u1" }], // source assignees
      [], // consumed by assignee insert await
    ];
    returnedRows = [
      [
        {
          id: "copy-1",
          title: "Original (copy)",
          listId: "list-1",
          boardId: "board-1",
          position: 1,
          description: null,
          dueDate: null,
        },
      ],
    ];

    const result = await copyCard("src-1");

    expect(result).toEqual({
      id: "copy-1",
      title: "Original (copy)",
      listId: "list-1",
      boardId: "board-1",
      position: 1,
      description: null,
      dueDate: null,
    });
    // Card insert + 1 batch label insert + 1 batch assignee insert = 3
    expect(capturedInserts.length).toBe(3);
    expect(Array.isArray(capturedInserts[1])).toBe(true);
    expect(capturedInserts[1]).toContainEqual({ cardId: "copy-1", labelId: "l1" });
    expect(capturedInserts[1]).toContainEqual({ cardId: "copy-1", labelId: "l2" });
    expect(Array.isArray(capturedInserts[2])).toBe(true);
    expect(capturedInserts[2]).toContainEqual({ cardId: "copy-1", userId: "u1" });
  });

  it("returns null when source card is not found", async () => {
    selectResults = [[]];

    const result = await copyCard("missing");
    expect(result).toBeNull();
  });
});
