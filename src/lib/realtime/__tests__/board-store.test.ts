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

describe("useBoardCardStore.setInitial", () => {
  function makeCard(id: string, listId: string, position: number, dueDate?: Date | null) {
    return {
      id,
      listId,
      boardId: "b1",
      title: "Card " + id,
      description: null,
      dueDate: dueDate ?? null,
      position,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  it("updates card data when cards change even with same lists", () => {
    const store = useBoardCardStore.getState();
    store.setInitial("b1", [makeList("l1", "A", 0)], [makeCard("c1", "l1", 0, null)]);
    const firstCard = useBoardCardStore.getState().cardsByList["l1"][0];
    expect(firstCard.dueDate).toBeNull();

    store.setInitial(
      "b1",
      [makeList("l1", "A", 0)],
      [makeCard("c1", "l1", 0, new Date("2026-12-25"))],
    );
    const updatedCard = useBoardCardStore.getState().cardsByList["l1"][0];
    expect(updatedCard.dueDate).toEqual(new Date("2026-12-25"));
  });

  it("rebuilds cardsByList even when lists are unchanged", () => {
    const store = useBoardCardStore.getState();
    store.setInitial(
      "b1",
      [makeList("l1", "A", 0)],
      [makeCard("c1", "l1", 0), makeCard("c2", "l1", 1)],
    );
    expect(useBoardCardStore.getState().cardsByList["l1"]).toHaveLength(2);

    store.setInitial(
      "b1",
      [makeList("l1", "A", 0)],
      [makeCard("c2", "l1", 0), makeCard("c1", "l1", 1)],
    );
    expect(useBoardCardStore.getState().cardsByList["l1"]).toHaveLength(2);
    expect(useBoardCardStore.getState().cardsByList["l1"][0].id).toBe("c2");
    expect(useBoardCardStore.getState().cardsByList["l1"][1].id).toBe("c1");
  });
});
