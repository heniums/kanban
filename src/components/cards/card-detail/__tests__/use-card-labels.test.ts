import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCardLabels } from "@/components/cards/card-detail/use-card-labels";

const { mockCreateLabelAction, mockUpdateLabelAction, mockDeleteLabelAction } = vi.hoisted(() => ({
  mockCreateLabelAction: vi.fn(),
  mockUpdateLabelAction: vi.fn(),
  mockDeleteLabelAction: vi.fn(),
}));

vi.mock("@/lib/actions/labels", () => ({
  createLabelAction: mockCreateLabelAction,
  updateLabelAction: mockUpdateLabelAction,
  deleteLabelAction: mockDeleteLabelAction,
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useCardLabels", () => {
  it("returns the expected shape", () => {
    const setData = vi.fn();
    const setDraft = vi.fn();
    const { result } = renderHook(() => useCardLabels({ boardId: "b1", setData, setDraft }));
    expect(result.current).toHaveProperty("newlyCreatedLabelIds");
    expect(result.current).toHaveProperty("handleCreateLabel");
    expect(result.current).toHaveProperty("handleUpdateLabel");
    expect(result.current).toHaveProperty("handleDeleteLabel");
    expect(result.current.newlyCreatedLabelIds).toEqual([]);
  });

  it("handleCreateLabel calls createLabelAction with boardId, name, color", async () => {
    mockCreateLabelAction.mockResolvedValue({
      data: { id: "lbl1", boardId: "b1", name: "Bug", color: "#ff0000" },
    });
    const setData = vi.fn();
    const setDraft = vi.fn();
    const { result } = renderHook(() => useCardLabels({ boardId: "b1", setData, setDraft }));
    await act(async () => {
      await result.current.handleCreateLabel("Bug", "#ff0000");
    });
    expect(mockCreateLabelAction).toHaveBeenCalledWith({
      boardId: "b1",
      name: "Bug",
      color: "#ff0000",
    });
  });

  it("handleCreateLabel shows toast on error", async () => {
    mockCreateLabelAction.mockResolvedValue({
      errors: [{ message: "Failed" }],
    });
    const setData = vi.fn();
    const setDraft = vi.fn();
    const { result } = renderHook(() => useCardLabels({ boardId: "b1", setData, setDraft }));
    await act(async () => {
      const res = await result.current.handleCreateLabel("Bug", "#ff0000");
      expect(res).toBeNull();
    });
  });

  it("handleUpdateLabel calls updateLabelAction", async () => {
    mockUpdateLabelAction.mockResolvedValue({
      data: { id: "lbl1", boardId: "b1", name: "Updated", color: "#000" },
    });
    const setData = vi.fn();
    const setDraft = vi.fn();
    const { result } = renderHook(() => useCardLabels({ boardId: "b1", setData, setDraft }));
    await act(async () => {
      const res = await result.current.handleUpdateLabel("lbl1", "Updated", "#000");
      expect(res).toBe(true);
    });
    expect(mockUpdateLabelAction).toHaveBeenCalledWith({
      labelId: "lbl1",
      name: "Updated",
      color: "#000",
    });
  });

  it("handleDeleteLabel calls deleteLabelAction", async () => {
    mockDeleteLabelAction.mockResolvedValue({ data: {} });
    const setData = vi.fn();
    const setDraft = vi.fn();
    const { result } = renderHook(() => useCardLabels({ boardId: "b1", setData, setDraft }));
    await act(async () => {
      const res = await result.current.handleDeleteLabel("lbl1");
      expect(res).toBe(true);
    });
    expect(mockDeleteLabelAction).toHaveBeenCalledWith({ labelId: "lbl1" });
  });
});
