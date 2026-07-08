import { describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
// @vitest-environment node
import { createDbClient } from "@/lib/db/client";
import { users } from "@/lib/db/schema/users";
import { boards } from "@/lib/db/schema/boards";
import { boardMembers } from "@/lib/db/schema/board-members";
import { lists } from "@/lib/db/schema/lists";
import { cards } from "@/lib/db/schema/cards";
import { cardAttachments } from "@/lib/db/schema/card-attachments";
import {
  createAttachment,
  deleteAttachment,
  getAttachmentById,
  listAttachmentsByCardId,
  attachImageToCard,
  detachImageFromCard,
  countAttachmentsByCardId,
} from "..";

const db = createDbClient();

async function createTestUser() {
  const [user] = await db
    .insert(users)
    .values({
      email: `attachment-test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@kanban.local`,
      passwordHash: "test-hash",
      name: "Attachment Test User",
    })
    .returning();
  return user;
}

async function createTestBoard(ownerId: string) {
  const [board] = await db
    .insert(boards)
    .values({
      title: "Attachment Test Board",
      background: "#000000",
      ownerId,
    })
    .returning();
  await db.insert(boardMembers).values({
    boardId: board.id,
    userId: ownerId,
    role: "owner",
  });
  return board;
}

async function createTestList(boardId: string) {
  const [list] = await db
    .insert(lists)
    .values({ boardId, title: "To Do", position: 0 })
    .returning();
  return list;
}

async function createTestCard(listId: string, boardId: string) {
  const [card] = await db
    .insert(cards)
    .values({ listId, boardId, title: "Test Card", position: 0 })
    .returning();
  return card;
}

describe("createAttachment (integration)", () => {
  it("creates an attachment record", async () => {
    const user = await createTestUser();

    const attachment = await createAttachment({
      publicId: "test_public_id",
      url: "https://example.com/image.jpg",
      format: "jpg",
      width: 800,
      height: 600,
      bytes: 12345,
      resourceType: "image",
      createdBy: user.id,
    });

    expect(attachment.publicId).toBe("test_public_id");
    expect(attachment.url).toBe("https://example.com/image.jpg");
    expect(attachment.format).toBe("jpg");
    expect(attachment.width).toBe(800);
    expect(attachment.height).toBe(600);
    expect(attachment.bytes).toBe(12345);
    expect(attachment.resourceType).toBe("image");
    expect(attachment.createdBy).toBe(user.id);
  });
});

describe("getAttachmentById (integration)", () => {
  it("returns an attachment by id", async () => {
    const user = await createTestUser();

    const created = await createAttachment({
      publicId: "test_public_id_2",
      url: "https://example.com/image2.jpg",
      createdBy: user.id,
    });

    const found = await getAttachmentById(created.id);
    expect(found).not.toBeNull();
    expect(found?.id).toBe(created.id);
    expect(found?.publicId).toBe("test_public_id_2");
  });

  it("returns null for non-existent attachment", async () => {
    const found = await getAttachmentById("00000000-0000-0000-0000-000000000000");
    expect(found).toBeNull();
  });
});

describe("deleteAttachment (integration)", () => {
  it("deletes an attachment and returns it", async () => {
    const user = await createTestUser();

    const created = await createAttachment({
      publicId: "test_public_id_3",
      url: "https://example.com/image3.jpg",
      createdBy: user.id,
    });

    const deleted = await deleteAttachment(created.id);
    expect(deleted).not.toBeNull();
    expect(deleted?.id).toBe(created.id);

    const found = await getAttachmentById(created.id);
    expect(found).toBeNull();
  });

  it("returns null for non-existent attachment", async () => {
    const deleted = await deleteAttachment("00000000-0000-0000-0000-000000000000");
    expect(deleted).toBeNull();
  });
});

describe("attachImageToCard and listAttachmentsByCardId (integration)", () => {
  it("attaches images to a card and lists them", async () => {
    const user = await createTestUser();
    const board = await createTestBoard(user.id);
    const list = await createTestList(board.id);
    const card = await createTestCard(list.id, board.id);

    const attachment1 = await createAttachment({
      publicId: "img_1",
      url: "https://example.com/1.jpg",
      createdBy: user.id,
    });
    const attachment2 = await createAttachment({
      publicId: "img_2",
      url: "https://example.com/2.jpg",
      createdBy: user.id,
    });

    await attachImageToCard(card.id, attachment1.id, 0);
    await attachImageToCard(card.id, attachment2.id, 1);

    const cardAttachmentsList = await listAttachmentsByCardId(card.id);
    expect(cardAttachmentsList).toHaveLength(2);
    expect(cardAttachmentsList[0].id).toBe(attachment1.id);
    expect(cardAttachmentsList[1].id).toBe(attachment2.id);
  });

  it("returns empty array for card with no attachments", async () => {
    const user = await createTestUser();
    const board = await createTestBoard(user.id);
    const list = await createTestList(board.id);
    const card = await createTestCard(list.id, board.id);

    const result = await listAttachmentsByCardId(card.id);
    expect(result).toEqual([]);
  });
});

describe("detachImageFromCard (integration)", () => {
  it("removes an attachment link from a card", async () => {
    const user = await createTestUser();
    const board = await createTestBoard(user.id);
    const list = await createTestList(board.id);
    const card = await createTestCard(list.id, board.id);

    const attachment = await createAttachment({
      publicId: "img_detach",
      url: "https://example.com/detach.jpg",
      createdBy: user.id,
    });

    await attachImageToCard(card.id, attachment.id);

    const before = await listAttachmentsByCardId(card.id);
    expect(before).toHaveLength(1);

    const detached = await detachImageFromCard(card.id, attachment.id);
    expect(detached).not.toBeNull();

    const after = await listAttachmentsByCardId(card.id);
    expect(after).toHaveLength(0);

    // Attachment itself still exists
    const stillExists = await getAttachmentById(attachment.id);
    expect(stillExists).not.toBeNull();
  });
});

describe("countAttachmentsByCardId (integration)", () => {
  it("returns the correct count", async () => {
    const user = await createTestUser();
    const board = await createTestBoard(user.id);
    const list = await createTestList(board.id);
    const card = await createTestCard(list.id, board.id);

    expect(await countAttachmentsByCardId(card.id)).toBe(0);

    const attachment = await createAttachment({
      publicId: "img_count",
      url: "https://example.com/count.jpg",
      createdBy: user.id,
    });
    await attachImageToCard(card.id, attachment.id);

    expect(await countAttachmentsByCardId(card.id)).toBe(1);
  });
});

describe("cardAttachments cascade delete (integration)", () => {
  it("removes card attachment links when card is deleted", async () => {
    const user = await createTestUser();
    const board = await createTestBoard(user.id);
    const list = await createTestList(board.id);
    const card = await createTestCard(list.id, board.id);

    const attachment = await createAttachment({
      publicId: "img_cascade",
      url: "https://example.com/cascade.jpg",
      createdBy: user.id,
    });

    await attachImageToCard(card.id, attachment.id);

    // Delete the card
    await db.delete(cards).where(eq(cards.id, card.id));

    const after = await db
      .select()
      .from(cardAttachments)
      .where(eq(cardAttachments.cardId, card.id));
    expect(after).toHaveLength(0);

    // Attachment should still exist
    const stillExists = await getAttachmentById(attachment.id);
    expect(stillExists).not.toBeNull();
  });

  it("removes card attachment links when attachment is deleted", async () => {
    const user = await createTestUser();
    const board = await createTestBoard(user.id);
    const list = await createTestList(board.id);
    const card = await createTestCard(list.id, board.id);

    const attachment = await createAttachment({
      publicId: "img_cascade_attach",
      url: "https://example.com/cascade_attach.jpg",
      createdBy: user.id,
    });

    await attachImageToCard(card.id, attachment.id);

    // Delete the attachment
    await deleteAttachment(attachment.id);

    const after = await db
      .select()
      .from(cardAttachments)
      .where(eq(cardAttachments.attachmentId, attachment.id));
    expect(after).toHaveLength(0);
  });
});
