import { describe, it, expect, vi, beforeEach } from "vitest";

let db: any;
let returningImpl: any;
let tx: any;

const setupDbMock = () => {
  const mock: any = {};
  const returning = vi.fn();

  // Select chain for attachments JOIN query (returns empty array by default)
  const selectFromMock = {
    where: vi.fn().mockResolvedValue([]),
    innerJoin: vi.fn(() => selectFromMock),
  };
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

vi.mock("@/lib/db/schema/attachments", () => ({
  attachments: { _table: "attachments", publicId: "public_id" },
}));

vi.mock("@/lib/db/schema/card-attachments", () => ({
  cardAttachments: { _table: "card_attachments", cardId: "card_id", attachmentId: "attachment_id" },
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

  it("fetches all attachments in a single JOIN query and deletes them", async () => {
    returningImpl.mockResolvedValueOnce([{ id: "l1", boardId: "board-1", position: 1 }]);

    // Mock the select→from→innerJoin→innerJoin→where chain for attachments
    const attachmentsData = [{ publicId: "pub-1" }, { publicId: "pub-2" }];
    const selectChainMock = {
      innerJoin: vi.fn(() => selectChainMock),
      where: vi.fn().mockResolvedValue(attachmentsData),
    };
    db.from = vi.fn(() => selectChainMock);

    await deleteList("l1");

    // Should NOT call listAttachmentsByCardId (old per-card N+1 pattern)
    expect(listAttachmentsByCardId).not.toHaveBeenCalled();
    // Should call deleteCloudinaryAsset for each attachment
    expect(deleteCloudinaryAsset).toHaveBeenCalledTimes(2);
    expect(deleteCloudinaryAsset).toHaveBeenCalledWith("pub-1");
    expect(deleteCloudinaryAsset).toHaveBeenCalledWith("pub-2");
  });

  it("parallelizes Cloudinary deletions with Promise.allSettled", async () => {
    returningImpl.mockResolvedValueOnce([{ id: "l1", boardId: "board-1", position: 1 }]);

    const callOrder: string[] = [];
    vi.mocked(deleteCloudinaryAsset).mockImplementation(() => {
      callOrder.push("start");
      return new Promise((resolve) =>
        setTimeout(() => {
          callOrder.push("end");
          resolve(undefined);
        }, 10),
      );
    });

    const attachmentsData = [{ publicId: "pub-1" }, { publicId: "pub-2" }];
    const selectChainMock = {
      innerJoin: vi.fn(() => selectChainMock),
      where: vi.fn().mockResolvedValue(attachmentsData),
    };
    db.from = vi.fn(() => selectChainMock);

    await deleteList("l1");

    // If sequential: start, end, start, end
    // If parallel: start, start, end, end
    expect(callOrder).toEqual(["start", "start", "end", "end"]);
  });
});
