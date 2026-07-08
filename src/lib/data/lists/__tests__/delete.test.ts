import { describe, it, expect, vi, beforeEach } from "vitest";

let db: any;
let returningImpl: any;
let tx: any;

const setupDbMock = () => {
  const mock: any = {};
  const returning = vi.fn();

  // Select chain for cards query (returns empty array — no cards to clean up)
  const selectFromMock = { where: vi.fn().mockResolvedValue([]) };
  mock.select = vi.fn(() => mock);
  mock.from = vi.fn(() => selectFromMock);
  mock.delete = vi.fn(() => mock);
  mock.transaction = vi.fn(async (fn: (tx: any) => Promise<unknown>) => fn(tx));
  mock.execute = vi.fn(() => Promise.resolve(undefined));
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

vi.mock("@/lib/db/schema/cards", () => ({
  cards: { _table: "cards" },
}));

vi.mock("@/lib/data/attachments", () => ({
  listAttachmentsByCardId: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/lib/cloudinary", () => ({
  deleteCloudinaryAsset: vi.fn(),
}));

import { deleteList } from "../delete";
import { listAttachmentsByCardId } from "@/lib/data/attachments";
import { deleteCloudinaryAsset } from "@/lib/cloudinary";

beforeEach(() => {
  vi.clearAllMocks();
  const m = setupDbMock();
  db = m.db;
  tx = m.db;
  returningImpl = m.returning;
});

describe("deleteList", () => {
  it("deletes the list and returns the deleted record", async () => {
    returningImpl.mockResolvedValueOnce([{ id: "l1", boardId: "board-1", position: 1 }]);

    const result = await deleteList("l1");

    expect(db.select).toHaveBeenCalled();
    expect(db.transaction).toHaveBeenCalled();
    expect(db.delete).toHaveBeenCalled();
    expect(result).toEqual({ id: "l1", boardId: "board-1", position: 1 });
  });

  it("returns null when nothing was deleted", async () => {
    returningImpl.mockResolvedValueOnce([]);
    const result = await deleteList("missing");
    expect(result).toBeNull();
  });

  it("compacts positions of remaining lists on the same board", async () => {
    returningImpl.mockResolvedValueOnce([{ id: "l1", boardId: "board-1", position: 1 }]);

    await deleteList("l1");

    expect(db.execute).toHaveBeenCalledTimes(1);
  });

  it("cleans up Cloudinary assets for cards in the list", async () => {
    returningImpl.mockResolvedValueOnce([{ id: "l1", boardId: "board-1", position: 1 }]);

    // Override the select→from→where chain for the cards query
    const cardIds = [{ id: "c1" }, { id: "c2" }];
    const fromMock = { where: vi.fn().mockResolvedValue(cardIds) };
    db.from = vi.fn(() => fromMock);
    vi.mocked(listAttachmentsByCardId)
      .mockResolvedValueOnce([
        {
          id: "a1",
          publicId: "pub-1",
          url: "",
          format: null,
          width: null,
          height: null,
          bytes: null,
          resourceType: null,
          createdBy: "u1",
          createdAt: new Date(),
        },
      ] as any)
      .mockResolvedValueOnce([
        {
          id: "a2",
          publicId: "pub-2",
          url: "",
          format: null,
          width: null,
          height: null,
          bytes: null,
          resourceType: null,
          createdBy: "u1",
          createdAt: new Date(),
        },
      ] as any);

    await deleteList("l1");

    expect(listAttachmentsByCardId).toHaveBeenCalledTimes(2);
    expect(listAttachmentsByCardId).toHaveBeenCalledWith("c1");
    expect(listAttachmentsByCardId).toHaveBeenCalledWith("c2");
    expect(deleteCloudinaryAsset).toHaveBeenCalledTimes(2);
    expect(deleteCloudinaryAsset).toHaveBeenCalledWith("pub-1");
    expect(deleteCloudinaryAsset).toHaveBeenCalledWith("pub-2");
  });
});
