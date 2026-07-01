import { describe, it, expect, beforeEach } from "vitest";
import { useBoardCardStore } from "@/lib/realtime/board-store";

function makeList(id: string, title: string, position: number) {
  return { id, title, position };
}

beforeEach(() => {
  useBoardCardStore.setState({
    boardId: null,
    cardsByList: {},
    lists: [],
  });
});

describe("useBoardCardStore.reorderLists", () => {
  it("reorders the lists to match the provided ordered ids", () => {
    useBoardCardStore
      .getState()
      .setInitial(
        "b1",
        [makeList("l1", "A", 0), makeList("l2", "B", 1), makeList("l3", "C", 2)],
        [],
      );
    useBoardCardStore.getState().reorderLists(["l3", "l1", "l2"]);
    const lists = useBoardCardStore.getState().lists;
    expect(lists.map((l) => l.id)).toEqual(["l3", "l1", "l2"]);
  });

  it("reassigns sequential position values after reordering", () => {
    useBoardCardStore
      .getState()
      .setInitial("b1", [makeList("l1", "A", 10), makeList("l2", "B", 20)], []);
    useBoardCardStore.getState().reorderLists(["l2", "l1"]);
    const lists = useBoardCardStore.getState().lists;
    expect(lists[0].position).toBe(0);
    expect(lists[1].position).toBe(1);
  });

  it("ignores ids that are not present in the store", () => {
    useBoardCardStore
      .getState()
      .setInitial("b1", [makeList("l1", "A", 0), makeList("l2", "B", 1)], []);
    useBoardCardStore.getState().reorderLists(["l2", "missing", "l1"]);
    const lists = useBoardCardStore.getState().lists;
    expect(lists.map((l) => l.id)).toEqual(["l2", "l1"]);
    expect(lists[0].position).toBe(0);
    expect(lists[1].position).toBe(1);
  });

  it("is idempotent for the same order", () => {
    useBoardCardStore
      .getState()
      .setInitial("b1", [makeList("l1", "A", 0), makeList("l2", "B", 1)], []);
    useBoardCardStore.getState().reorderLists(["l2", "l1"]);
    useBoardCardStore.getState().reorderLists(["l2", "l1"]);
    const lists = useBoardCardStore.getState().lists;
    expect(lists.map((l) => l.id)).toEqual(["l2", "l1"]);
    expect(lists[0].position).toBe(0);
    expect(lists[1].position).toBe(1);
  });
});
