import { describe, it, expect } from "vitest";
import { REALTIME_EVENTS } from "@/lib/realtime/types";

describe("REALTIME_EVENTS", () => {
  it("defines LIST_REORDERED as 'list:reordered'", () => {
    expect(REALTIME_EVENTS.LIST_REORDERED).toBe("list:reordered");
  });
});

describe("ListsReorderedPayload type", () => {
  it("accepts a payload with boardId and orderedListIds", () => {
    const payload: import("@/lib/realtime/types").ListsReorderedPayload = {
      boardId: "11111111-1111-1111-1111-111111111111",
      orderedListIds: ["22222222-2222-2222-2222-222222222222"],
    };
    expect(payload.boardId).toBe("11111111-1111-1111-1111-111111111111");
    expect(payload.orderedListIds).toEqual(["22222222-2222-2222-2222-222222222222"]);
  });
});
