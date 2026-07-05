import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockVerifySession, mockUpdateLabel, mockDeleteLabel, mockAssertLabelPermission } =
  vi.hoisted(() => ({
    mockVerifySession: vi.fn(),
    mockUpdateLabel: vi.fn(),
    mockDeleteLabel: vi.fn(),
    mockAssertLabelPermission: vi.fn(),
  }));

vi.mock("@/lib/dal", () => ({
  verifySession: mockVerifySession,
}));

vi.mock("@/lib/data/labels", () => ({
  updateLabel: mockUpdateLabel,
  deleteLabel: mockDeleteLabel,
}));

vi.mock("@/lib/actions/guards", () => ({
  assertLabelPermission: mockAssertLabelPermission,
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

const { mockEmitToBoard } = vi.hoisted(() => ({
  mockEmitToBoard: vi.fn(),
}));

vi.mock("@/lib/realtime/events", () => ({
  emitToBoard: mockEmitToBoard,
  REALTIME_EVENTS: {
    LABEL_UPDATED: "label:updated",
    LABEL_DELETED: "label:deleted",
  },
}));

import { updateLabelAction, deleteLabelAction } from "..";
import { emitToBoard, REALTIME_EVENTS } from "@/lib/realtime/events";

beforeEach(() => {
  vi.clearAllMocks();
  mockAssertLabelPermission.mockResolvedValue(true);
});

const validUpdateInput = {
  labelId: "11111111-1111-1111-1111-111111111111",
  name: "Updated Label",
  color: "#00ff00",
};

const validDeleteInput = {
  labelId: "11111111-1111-1111-1111-111111111111",
};

describe("updateLabelAction", () => {
  it("updates a label with valid input and returns the result", async () => {
    mockVerifySession.mockResolvedValue({ userId: "user-1" });
    mockUpdateLabel.mockResolvedValue({
      id: "11111111-1111-1111-1111-111111111111",
      boardId: "board-1",
      name: "Updated Label",
      color: "#00ff00",
    });

    const result = await updateLabelAction(validUpdateInput);

    expect(mockUpdateLabel).toHaveBeenCalledWith("11111111-1111-1111-1111-111111111111", {
      name: "Updated Label",
      color: "#00ff00",
    });
    expect(result).toHaveProperty("data");
    expect(result).not.toHaveProperty("errors");
  });

  it("returns errors for invalid input", async () => {
    mockVerifySession.mockResolvedValue({ userId: "user-1" });

    const result = await updateLabelAction({ labelId: "bad-uuid", name: "" });

    expect(result).toHaveProperty("errors");
    expect(mockUpdateLabel).not.toHaveBeenCalled();
  });

  it("returns errors when the data layer throws", async () => {
    mockVerifySession.mockResolvedValue({ userId: "user-1" });
    mockUpdateLabel.mockRejectedValue(new Error("Label not found or board not owned"));

    const result = await updateLabelAction(validUpdateInput);

    expect(result).toHaveProperty("errors");
  });

  it("redirects to /login when not signed in", async () => {
    mockVerifySession.mockRejectedValue(
      Object.assign(new Error("NEXT_REDIRECT"), { digest: "NEXT_REDIRECT;/login" }),
    );

    await expect(updateLabelAction(validUpdateInput)).rejects.toMatchObject({
      digest: expect.stringContaining("NEXT_REDIRECT;/login"),
    });
  });

  it("emits LABEL_UPDATED after a successful update", async () => {
    mockVerifySession.mockResolvedValue({ userId: "user-1" });
    mockUpdateLabel.mockResolvedValue({
      id: "11111111-1111-1111-1111-111111111111",
      boardId: "board-1",
      name: "Updated Label",
      color: "#00ff00",
    });

    const result = await updateLabelAction(validUpdateInput);

    expect(result).toHaveProperty("data");
    expect(emitToBoard).toHaveBeenCalledWith("board-1", REALTIME_EVENTS.LABEL_UPDATED, {
      boardId: "board-1",
      label: {
        id: "11111111-1111-1111-1111-111111111111",
        name: "Updated Label",
        color: "#00ff00",
      },
    });
  });

  it("does not emit LABEL_UPDATED on validation error", async () => {
    mockVerifySession.mockResolvedValue({ userId: "user-1" });

    const result = await updateLabelAction({ labelId: "bad-uuid", name: "" });

    expect(result).toHaveProperty("errors");
    expect(emitToBoard).not.toHaveBeenCalled();
  });

  it("does not emit LABEL_UPDATED when the data layer throws", async () => {
    mockVerifySession.mockResolvedValue({ userId: "user-1" });
    mockUpdateLabel.mockRejectedValue(new Error("Label not found or board not owned"));

    const result = await updateLabelAction(validUpdateInput);

    expect(result).toHaveProperty("errors");
    expect(emitToBoard).not.toHaveBeenCalled();
  });
});

describe("deleteLabelAction", () => {
  it("deletes a label with valid input and returns success", async () => {
    mockVerifySession.mockResolvedValue({ userId: "user-1" });
    mockDeleteLabel.mockResolvedValue({
      id: "11111111-1111-1111-1111-111111111111",
      boardId: "board-1",
      name: "Bug",
      color: "#ff0000",
    });

    const result = await deleteLabelAction(validDeleteInput);

    expect(mockDeleteLabel).toHaveBeenCalledWith("11111111-1111-1111-1111-111111111111");
    expect(result).toEqual({ success: true });
  });

  it("returns errors for invalid input", async () => {
    mockVerifySession.mockResolvedValue({ userId: "user-1" });

    const result = await deleteLabelAction({ labelId: "bad-uuid" });

    expect(result).toHaveProperty("errors");
    expect(mockDeleteLabel).not.toHaveBeenCalled();
  });

  it("returns errors when the data layer throws", async () => {
    mockVerifySession.mockResolvedValue({ userId: "user-1" });
    mockDeleteLabel.mockRejectedValue(new Error("Label not found or board not owned"));

    const result = await deleteLabelAction(validDeleteInput);

    expect(result).toHaveProperty("errors");
  });

  it("redirects to /login when not signed in", async () => {
    mockVerifySession.mockRejectedValue(
      Object.assign(new Error("NEXT_REDIRECT"), { digest: "NEXT_REDIRECT;/login" }),
    );

    await expect(deleteLabelAction(validDeleteInput)).rejects.toMatchObject({
      digest: expect.stringContaining("NEXT_REDIRECT;/login"),
    });
  });

  it("emits LABEL_DELETED after a successful delete", async () => {
    mockVerifySession.mockResolvedValue({ userId: "user-1" });
    mockDeleteLabel.mockResolvedValue({
      id: "11111111-1111-1111-1111-111111111111",
      boardId: "board-1",
      name: "Bug",
      color: "#ff0000",
    });

    const result = await deleteLabelAction(validDeleteInput);

    expect(result).toEqual({ success: true });
    expect(emitToBoard).toHaveBeenCalledWith("board-1", REALTIME_EVENTS.LABEL_DELETED, {
      boardId: "board-1",
      labelId: "11111111-1111-1111-1111-111111111111",
    });
  });

  it("does not emit LABEL_DELETED on validation error", async () => {
    mockVerifySession.mockResolvedValue({ userId: "user-1" });

    const result = await deleteLabelAction({ labelId: "bad-uuid" });

    expect(result).toHaveProperty("errors");
    expect(emitToBoard).not.toHaveBeenCalled();
  });

  it("does not emit LABEL_DELETED when the data layer throws", async () => {
    mockVerifySession.mockResolvedValue({ userId: "user-1" });
    mockDeleteLabel.mockRejectedValue(new Error("Label not found or board not owned"));

    const result = await deleteLabelAction(validDeleteInput);

    expect(result).toHaveProperty("errors");
    expect(emitToBoard).not.toHaveBeenCalled();
  });
});
