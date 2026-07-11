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
  mock.set = vi.fn(() => mock);
  mock.where = vi.fn(() => mock);
  mock.returning = vi.fn(() => Promise.resolve(returnedRows.shift() ?? []));
  return mock;
};

vi.mock("@/lib/db/client", async () => {
  const actual = await vi.importActual<typeof import("@/lib/db/client")>("@/lib/db/client");
  return { ...actual, createDbClient: () => db };
});

vi.mock("@/lib/db/schema/comments", () => ({
  comments: { _table: "comments" },
}));
vi.mock("@/lib/db/schema/cards", () => ({
  cards: { _table: "cards" },
}));
vi.mock("@/lib/db/schema/boards", () => ({
  boards: { _table: "boards" },
}));

import { createComment, updateComment, deleteComment } from "../mutations";

beforeEach(() => {
  db = setupDbMock();
  tx = db;
  returnedRows = [];
});

describe("createComment", () => {
  it("creates a comment and returns boardId", async () => {
    returnedRows = [
      [{ boardId: "board-1" }],
      [{ id: "c-1", cardId: "card-1", userId: "user-1", content: "Hello" }],
    ];

    const result = await createComment(
      { cardId: "card-1", content: "Hello" },
      { userId: "user-1" },
    );

    expect(result.id).toBe("c-1");
    expect(result.content).toBe("Hello");
    expect(result.boardId).toBe("board-1");
    expect(db.transaction).toHaveBeenCalled();
  });
});

describe("updateComment", () => {
  it("updates a comment and returns boardId", async () => {
    returnedRows = [
      [{ id: "c-1", cardId: "card-1", userId: "user-1", content: "Updated" }],
      [{ boardId: "board-1" }],
    ];

    const result = await updateComment("c-1", { content: "Updated" });

    expect(result).not.toBeNull();
    expect(result?.id).toBe("c-1");
    expect(result?.content).toBe("Updated");
    expect(result?.boardId).toBe("board-1");
  });

  it("returns null when comment is not found", async () => {
    returnedRows = [[]];

    const result = await updateComment("missing", { content: "X" });
    expect(result).toBeNull();
  });
});

describe("deleteComment", () => {
  it("deletes a comment and returns boardId", async () => {
    returnedRows = [
      [{ id: "c-1", cardId: "card-1", userId: "user-1", content: "Hello" }],
      [{ boardId: "board-1" }],
    ];

    const result = await deleteComment("c-1");

    expect(result).not.toBeNull();
    expect(result?.id).toBe("c-1");
    expect(result?.boardId).toBe("board-1");
  });

  it("returns null when comment is not found", async () => {
    returnedRows = [[]];

    const result = await deleteComment("missing");
    expect(result).toBeNull();
  });
});
