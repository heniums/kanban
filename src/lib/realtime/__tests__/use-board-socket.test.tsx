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

beforeEach(() => {
  vi.clearAllMocks();
  useBoardCardStore.setState({
    boardId: null,
    cardsByList: {},
    lists: [],
  });
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
