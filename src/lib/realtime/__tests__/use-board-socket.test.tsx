import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { useBoardSocket } from "@/lib/realtime/use-board-socket";
import { useBoardCardStore } from "@/lib/realtime/board-store";
import { REALTIME_EVENTS } from "@/lib/realtime/types";

const mockSocket = {
  on: vi.fn(),
  off: vi.fn(),
  emit: vi.fn(),
  disconnect: vi.fn(),
};

vi.mock("socket.io-client", () => ({
  io: () => mockSocket,
}));

function TestHarness({ boardId }: { boardId: string }) {
  useBoardSocket(boardId);
  return null;
}

const dispatchEvent = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  useBoardCardStore.setState({
    boardId: null,
    cardsByList: {},
    lists: [],
  });
  vi.stubGlobal("dispatchEvent", dispatchEvent);
});

describe("useBoardSocket LIST_REORDERED listener", () => {
  it("applies the reordered list ids when the boardId matches", () => {
    useBoardCardStore.getState().setInitial(
      "b1",
      [
        { id: "l1", title: "A", position: 0 },
        { id: "l2", title: "B", position: 1 },
      ],
      [],
    );

    render(<TestHarness boardId="b1" />);

    const registerCall = mockSocket.on.mock.calls.find(
      (call) => call[0] === REALTIME_EVENTS.LIST_REORDERED,
    );
    expect(registerCall).toBeDefined();

    const handler = registerCall![1];
    handler({ boardId: "b1", orderedListIds: ["l2", "l1"] });

    const lists = useBoardCardStore.getState().lists;
    expect(lists.map((l) => l.id)).toEqual(["l2", "l1"]);
  });

  it("ignores the event when the boardId does not match", () => {
    useBoardCardStore.getState().setInitial(
      "b1",
      [
        { id: "l1", title: "A", position: 0 },
        { id: "l2", title: "B", position: 1 },
      ],
      [],
    );

    render(<TestHarness boardId="b1" />);

    const registerCall = mockSocket.on.mock.calls.find(
      (call) => call[0] === REALTIME_EVENTS.LIST_REORDERED,
    );
    expect(registerCall).toBeDefined();

    const handler = registerCall![1];
    handler({ boardId: "b2", orderedListIds: ["l2", "l1"] });

    const lists = useBoardCardStore.getState().lists;
    expect(lists.map((l) => l.id)).toEqual(["l1", "l2"]);
  });
});

describe("useBoardSocket LABEL_UPDATED listener", () => {
  it("dispatches a board:label-updated CustomEvent when boardId matches", () => {
    render(<TestHarness boardId="b1" />);

    const registerCall = mockSocket.on.mock.calls.find(
      (call) => call[0] === REALTIME_EVENTS.LABEL_UPDATED,
    );
    expect(registerCall).toBeDefined();

    const label = { id: "l1", name: "Bug", color: "#ff0000" };
    const handler = registerCall![1];
    handler({ boardId: "b1", label });

    expect(dispatchEvent).toHaveBeenCalledTimes(1);
    const event = dispatchEvent.mock.calls[0][0] as CustomEvent;
    expect(event.type).toBe("board:label-updated");
    expect(event.detail).toEqual({ boardId: "b1", label });
  });

  it("ignores the event when boardId does not match", () => {
    render(<TestHarness boardId="b1" />);

    const registerCall = mockSocket.on.mock.calls.find(
      (call) => call[0] === REALTIME_EVENTS.LABEL_UPDATED,
    );
    expect(registerCall).toBeDefined();

    const handler = registerCall![1];
    handler({ boardId: "b2", label: { id: "l1", name: "Bug", color: "#f00" } });

    expect(dispatchEvent).not.toHaveBeenCalled();
  });
});

describe("useBoardSocket LABEL_DELETED listener", () => {
  it("dispatches a board:label-deleted CustomEvent when boardId matches", () => {
    render(<TestHarness boardId="b1" />);

    const registerCall = mockSocket.on.mock.calls.find(
      (call) => call[0] === REALTIME_EVENTS.LABEL_DELETED,
    );
    expect(registerCall).toBeDefined();

    const handler = registerCall![1];
    handler({ boardId: "b1", labelId: "l1" });

    expect(dispatchEvent).toHaveBeenCalledTimes(1);
    const event = dispatchEvent.mock.calls[0][0] as CustomEvent;
    expect(event.type).toBe("board:label-deleted");
    expect(event.detail).toEqual({ boardId: "b1", labelId: "l1" });
  });

  it("ignores the event when boardId does not match", () => {
    render(<TestHarness boardId="b1" />);

    const registerCall = mockSocket.on.mock.calls.find(
      (call) => call[0] === REALTIME_EVENTS.LABEL_DELETED,
    );
    expect(registerCall).toBeDefined();

    const handler = registerCall![1];
    handler({ boardId: "b2", labelId: "l1" });

    expect(dispatchEvent).not.toHaveBeenCalled();
  });
});

describe("useBoardSocket CARD_LABELS_UPDATED listener", () => {
  it("dispatches a board:card-labels-updated CustomEvent when boardId matches", () => {
    render(<TestHarness boardId="b1" />);

    const registerCall = mockSocket.on.mock.calls.find(
      (call) => call[0] === REALTIME_EVENTS.CARD_LABELS_UPDATED,
    );
    expect(registerCall).toBeDefined();

    const handler = registerCall![1];
    handler({ boardId: "b1", cardId: "c1" });

    expect(dispatchEvent).toHaveBeenCalledTimes(1);
    const event = dispatchEvent.mock.calls[0][0] as CustomEvent;
    expect(event.type).toBe("board:card-labels-updated");
    expect(event.detail).toEqual({ boardId: "b1", cardId: "c1" });
  });

  it("ignores the event when boardId does not match", () => {
    render(<TestHarness boardId="b1" />);

    const registerCall = mockSocket.on.mock.calls.find(
      (call) => call[0] === REALTIME_EVENTS.CARD_LABELS_UPDATED,
    );
    expect(registerCall).toBeDefined();

    const handler = registerCall![1];
    handler({ boardId: "b2", cardId: "c1" });

    expect(dispatchEvent).not.toHaveBeenCalled();
  });
});
