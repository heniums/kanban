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
    cardsNeedingChecklistRefresh: new Set(),
    cardsNeedingCommentsRefresh: new Set(),
    labelUpdatedEvent: null,
    labelDeletedEvent: null,
    cardToOpen: null,
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

describe("useBoardCardStore checklist and comment refresh", () => {
  it("marks a card for checklist refresh", () => {
    const store = useBoardCardStore.getState();
    store.markChecklistRefresh("c1");
    expect(useBoardCardStore.getState().cardsNeedingChecklistRefresh.has("c1")).toBe(true);
  });

  it("clears a card from checklist refresh", () => {
    const store = useBoardCardStore.getState();
    store.markChecklistRefresh("c1");
    store.clearChecklistRefresh("c1");
    expect(useBoardCardStore.getState().cardsNeedingChecklistRefresh.has("c1")).toBe(false);
  });

  it("marks a card for comments refresh", () => {
    const store = useBoardCardStore.getState();
    store.markCommentsRefresh("c1");
    expect(useBoardCardStore.getState().cardsNeedingCommentsRefresh.has("c1")).toBe(true);
  });

  it("clears a card from comments refresh", () => {
    const store = useBoardCardStore.getState();
    store.markCommentsRefresh("c1");
    store.clearCommentsRefresh("c1");
    expect(useBoardCardStore.getState().cardsNeedingCommentsRefresh.has("c1")).toBe(false);
  });

  it("handles multiple cards in refresh sets", () => {
    const store = useBoardCardStore.getState();
    store.markChecklistRefresh("c1");
    store.markChecklistRefresh("c2");
    store.markCommentsRefresh("c3");
    expect(useBoardCardStore.getState().cardsNeedingChecklistRefresh.size).toBe(2);
    expect(useBoardCardStore.getState().cardsNeedingCommentsRefresh.size).toBe(1);
  });
});

describe("useBoardCardStore label events", () => {
  it("sets label updated event", () => {
    const store = useBoardCardStore.getState();
    const label = { id: "l1", name: "Bug", color: "#ff0000" };
    store.setLabelUpdatedEvent(label);
    expect(useBoardCardStore.getState().labelUpdatedEvent).toEqual({ label });
  });

  it("sets label deleted event", () => {
    const store = useBoardCardStore.getState();
    store.setLabelDeletedEvent("l1");
    expect(useBoardCardStore.getState().labelDeletedEvent).toEqual({ labelId: "l1" });
  });

  it("clears all label events", () => {
    const store = useBoardCardStore.getState();
    store.setLabelUpdatedEvent({ id: "l1", name: "Bug", color: "#ff0000" });
    store.setLabelDeletedEvent("l2");
    store.clearLabelEvents();
    expect(useBoardCardStore.getState().labelUpdatedEvent).toBeNull();
    expect(useBoardCardStore.getState().labelDeletedEvent).toBeNull();
  });
});

describe("useBoardCardStore card open", () => {
  it("opens a card by id", () => {
    const store = useBoardCardStore.getState();
    store.openCard("c1");
    expect(useBoardCardStore.getState().cardToOpen).toBe("c1");
  });

  it("clears the card to open", () => {
    const store = useBoardCardStore.getState();
    store.openCard("c1");
    store.clearCardToOpen();
    expect(useBoardCardStore.getState().cardToOpen).toBeNull();
  });

  it("overwrites previous cardToOpen when opening a new card", () => {
    const store = useBoardCardStore.getState();
    store.openCard("c1");
    store.openCard("c2");
    expect(useBoardCardStore.getState().cardToOpen).toBe("c2");
  });
});
