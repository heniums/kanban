import { describe, it, expect, vi, beforeEach } from "vitest";

let db: any;
let returningImpl: any;
let selectResult: any[] = [];

const setupDbMock = () => {
  const mock: any = {};
  const returning = vi.fn();

  mock.select = vi.fn(() => {
    mock.then = (onFulfilled: (v: any) => any) => Promise.resolve(onFulfilled(selectResult));
    return mock;
  });
  mock.insert = vi.fn(() => mock);
  mock.update = vi.fn(() => mock);
  mock.delete = vi.fn(() => {
    mock.then = (onFulfilled: (v: any) => any) => Promise.resolve(onFulfilled(selectResult));
    return mock;
  });
  mock.transaction = vi.fn(async (fn: (tx: any) => Promise<unknown>) => fn(mock));
  mock.from = vi.fn(() => mock);
  mock.innerJoin = vi.fn(() => mock);
  mock.values = vi.fn(() => mock);
  mock.set = vi.fn(() => mock);
  mock.orderBy = vi.fn(() => mock);
  mock.limit = vi.fn(() => mock);
  mock.offset = vi.fn(() => mock);
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

vi.mock("@/lib/db/schema/boards", () => ({
  boards: { _table: "boards" },
}));

vi.mock("@/lib/db/schema/board-members", () => ({
  boardMembers: { _table: "board_members" },
}));

import {
  getBoardAttachmentPublicIds,
  deleteAttachmentsByBoardId,
  hardDeleteBoard,
} from "../permanent-delete";

beforeEach(() => {
  const m = setupDbMock();
  db = m.db;
  returningImpl = m.returning;
  selectResult = [];
});

describe("getBoardAttachmentPublicIds", () => {
  it("queries attachments joined through card_attachments and cards", async () => {
    selectResult = [{ publicId: "img_1" }, { publicId: "img_2" }];
    const ids = await getBoardAttachmentPublicIds("board-1");
    expect(ids).toEqual(["img_1", "img_2"]);
    expect(db.select).toHaveBeenCalled();
    expect(db.from).toHaveBeenCalled();
    expect(db.innerJoin).toHaveBeenCalledTimes(2);
    expect(db.where).toHaveBeenCalled();
  });

  it("returns empty array when no attachments found", async () => {
    selectResult = [];
    const ids = await getBoardAttachmentPublicIds("board-1");
    expect(ids).toEqual([]);
  });
});

describe("deleteAttachmentsByBoardId", () => {
  it("deletes attachments for cards in the board", async () => {
    selectResult = [{ id: "card-1" }];
    await deleteAttachmentsByBoardId("board-1");
    expect(db.select).toHaveBeenCalled();
    expect(db.delete).toHaveBeenCalled();
  });

  it("does nothing when no cards found", async () => {
    selectResult = [];
    await deleteAttachmentsByBoardId("board-1");
    expect(db.delete).not.toHaveBeenCalled();
  });
});

describe("hardDeleteBoard", () => {
  it("deletes the board filtered by id and deletedAt IS NOT NULL", async () => {
    returningImpl.mockResolvedValueOnce([{ id: "board-1" }]);
    const result = await hardDeleteBoard("board-1");
    expect(result).toBe(true);
    expect(db.delete).toHaveBeenCalled();
    expect(db.where).toHaveBeenCalled();
  });

  it("returns false when no board is deleted", async () => {
    returningImpl.mockResolvedValueOnce([]);
    const result = await hardDeleteBoard("missing");
    expect(result).toBe(false);
  });
});
