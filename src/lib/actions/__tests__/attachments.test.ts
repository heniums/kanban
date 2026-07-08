import { describe, it, expect, vi, beforeEach } from "vitest";

const USER_1 = "00000000-0000-0000-0000-000000000001";
const CARD_ID = "00000000-0000-0000-0000-000000000020";
const ATTACHMENT_ID = "00000000-0000-0000-0000-000000000030";
const BOARD_ID = "00000000-0000-0000-0000-000000000010";

const {
  mockVerifySession,
  mockHasPermission,
  mockCreateAttachment,
  mockDeleteAttachmentData,
  mockListAttachmentsByCardId,
  mockAttachImageToCard,
  mockCountAttachmentsByCardId,
  mockDeleteCloudinaryAsset,
} = vi.hoisted(() => ({
  mockVerifySession: vi.fn(),
  mockHasPermission: vi.fn(),
  mockCreateAttachment: vi.fn(),
  mockDeleteAttachmentData: vi.fn(),
  mockListAttachmentsByCardId: vi.fn(),
  mockAttachImageToCard: vi.fn(),
  mockCountAttachmentsByCardId: vi.fn(),
  mockDeleteCloudinaryAsset: vi.fn(),
}));

vi.mock("@/lib/dal", () => ({
  verifySession: mockVerifySession,
}));

vi.mock("@/lib/permissions", () => ({
  hasPermission: mockHasPermission,
  BoardPermission: {
    VIEW: "view",
    EDIT_CONTENT: "edit_content",
    MANAGE_SETTINGS: "manage_settings",
    MANAGE_MEMBERS: "manage_members",
  },
}));

vi.mock("@/lib/data/attachments", () => ({
  createAttachment: mockCreateAttachment,
  deleteAttachment: mockDeleteAttachmentData,
  listAttachmentsByCardId: mockListAttachmentsByCardId,
  attachImageToCard: mockAttachImageToCard,
  countAttachmentsByCardId: mockCountAttachmentsByCardId,
}));

vi.mock("@/lib/cloudinary", () => ({
  deleteCloudinaryAsset: mockDeleteCloudinaryAsset,
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import {
  createAttachmentAction,
  deleteAttachmentAction,
  listCardAttachmentsAction,
} from "../attachments";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("createAttachmentAction", () => {
  it("creates an attachment and links it to the card", async () => {
    mockVerifySession.mockResolvedValue({ userId: USER_1 });
    mockHasPermission.mockResolvedValue(true);
    mockCountAttachmentsByCardId.mockResolvedValue(0);
    mockCreateAttachment.mockResolvedValue({
      id: ATTACHMENT_ID,
      publicId: "cloud_public_id",
      url: "https://cloudinary.com/image.jpg",
      createdBy: USER_1,
    });
    mockAttachImageToCard.mockResolvedValue({ id: "link-id" });

    const result = await createAttachmentAction({
      publicId: "cloud_public_id",
      url: "https://cloudinary.com/image.jpg",
      cardId: CARD_ID,
      boardId: BOARD_ID,
    });

    expect(result).toHaveProperty("attachment");
    expect(result.attachment!.id).toBe(ATTACHMENT_ID);
    expect(mockCreateAttachment).toHaveBeenCalledWith(
      expect.objectContaining({
        publicId: "cloud_public_id",
        url: "https://cloudinary.com/image.jpg",
        createdBy: USER_1,
      }),
    );
    expect(mockAttachImageToCard).toHaveBeenCalledWith(CARD_ID, ATTACHMENT_ID, 0);
  });

  it("returns error when user lacks edit permission", async () => {
    mockVerifySession.mockResolvedValue({ userId: USER_1 });
    mockHasPermission.mockResolvedValue(false);

    const result = await createAttachmentAction({
      publicId: "cloud_public_id",
      url: "https://cloudinary.com/image.jpg",
      cardId: CARD_ID,
      boardId: BOARD_ID,
    });

    expect(result).toHaveProperty("error");
    expect(result.error).toContain("permission");
  });

  it("returns error when max attachments reached", async () => {
    mockVerifySession.mockResolvedValue({ userId: USER_1 });
    mockHasPermission.mockResolvedValue(true);
    mockCountAttachmentsByCardId.mockResolvedValue(10);

    const result = await createAttachmentAction({
      publicId: "cloud_public_id",
      url: "https://cloudinary.com/image.jpg",
      cardId: CARD_ID,
      boardId: BOARD_ID,
    });

    expect(result).toHaveProperty("error");
    expect(result.error).toContain("Maximum 10 attachments");
    expect(mockCreateAttachment).not.toHaveBeenCalled();
  });
});

describe("deleteAttachmentAction", () => {
  it("deletes attachment and removes from Cloudinary", async () => {
    mockVerifySession.mockResolvedValue({ userId: USER_1 });
    mockHasPermission.mockResolvedValue(true);
    mockDeleteAttachmentData.mockResolvedValue({
      id: ATTACHMENT_ID,
      publicId: "cloud_public_id",
    });
    mockDeleteCloudinaryAsset.mockResolvedValue(undefined);

    const result = await deleteAttachmentAction({
      attachmentId: ATTACHMENT_ID,
      cardId: CARD_ID,
      boardId: BOARD_ID,
    });

    expect(result).toEqual({ success: true });
    expect(mockDeleteAttachmentData).toHaveBeenCalledWith(ATTACHMENT_ID);
    expect(mockDeleteCloudinaryAsset).toHaveBeenCalledWith("cloud_public_id");
  });

  it("returns error when user lacks edit permission", async () => {
    mockVerifySession.mockResolvedValue({ userId: USER_1 });
    mockHasPermission.mockResolvedValue(false);

    const result = await deleteAttachmentAction({
      attachmentId: ATTACHMENT_ID,
      cardId: CARD_ID,
      boardId: BOARD_ID,
    });

    expect(result).toHaveProperty("error");
    expect(result.error).toContain("permission");
  });

  it("returns error when attachment not found", async () => {
    mockVerifySession.mockResolvedValue({ userId: USER_1 });
    mockHasPermission.mockResolvedValue(true);
    mockDeleteAttachmentData.mockResolvedValue(null);

    const result = await deleteAttachmentAction({
      attachmentId: ATTACHMENT_ID,
      cardId: CARD_ID,
      boardId: BOARD_ID,
    });

    expect(result).toHaveProperty("error");
    expect(result.error).toContain("Attachment not found");
  });
});

describe("listCardAttachmentsAction", () => {
  it("returns attachments for the card", async () => {
    mockVerifySession.mockResolvedValue({ userId: USER_1 });
    mockHasPermission.mockResolvedValue(true);
    mockListAttachmentsByCardId.mockResolvedValue([
      {
        id: ATTACHMENT_ID,
        publicId: "img_1",
        url: "https://example.com/1.jpg",
      },
    ]);

    const result = await listCardAttachmentsAction({
      cardId: CARD_ID,
      boardId: BOARD_ID,
    });

    expect(result).toHaveProperty("attachments");
    expect(result.attachments).toHaveLength(1);
    expect(mockListAttachmentsByCardId).toHaveBeenCalledWith(CARD_ID);
  });

  it("returns error when user lacks view permission", async () => {
    mockVerifySession.mockResolvedValue({ userId: USER_1 });
    mockHasPermission.mockResolvedValue(false);

    const result = await listCardAttachmentsAction({
      cardId: CARD_ID,
      boardId: BOARD_ID,
    });

    expect(result).toHaveProperty("error");
    expect(result.error).toContain("permission");
  });
});
