import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockVerifySession, mockUpdateLabel, mockDeleteLabel } = vi.hoisted(() => ({
  mockVerifySession: vi.fn(),
  mockUpdateLabel: vi.fn(),
  mockDeleteLabel: vi.fn(),
}));

vi.mock("@/lib/dal", () => ({
  verifySession: mockVerifySession,
}));

vi.mock("@/lib/data/labels", () => ({
  updateLabel: mockUpdateLabel,
  deleteLabel: mockDeleteLabel,
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

beforeEach(() => {
  vi.clearAllMocks();
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

    expect(mockUpdateLabel).toHaveBeenCalledWith(
      "11111111-1111-1111-1111-111111111111",
      { name: "Updated Label", color: "#00ff00" },
      { ownerId: "user-1" },
    );
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

    expect(mockDeleteLabel).toHaveBeenCalledWith("11111111-1111-1111-1111-111111111111", {
      ownerId: "user-1",
    });
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
});
