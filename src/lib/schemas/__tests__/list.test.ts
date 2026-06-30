import { describe, expect, it } from "vitest";
import { createListSchema, renameListSchema, reorderListsSchema } from "@/lib/schemas/list";

describe("createListSchema", () => {
  it("accepts a valid boardId and title", () => {
    const result = createListSchema.safeParse({
      boardId: "11111111-1111-1111-1111-111111111111",
      title: "To Do",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing boardId", () => {
    const result = createListSchema.safeParse({ title: "To Do" });
    expect(result.success).toBe(false);
  });

  it("rejects non-UUID boardId", () => {
    const result = createListSchema.safeParse({ boardId: "not-a-uuid", title: "To Do" });
    expect(result.success).toBe(false);
  });

  it("rejects empty title", () => {
    const result = createListSchema.safeParse({
      boardId: "11111111-1111-1111-1111-111111111111",
      title: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects title over 100 characters", () => {
    const result = createListSchema.safeParse({
      boardId: "11111111-1111-1111-1111-111111111111",
      title: "a".repeat(101),
    });
    expect(result.success).toBe(false);
  });
});

describe("renameListSchema", () => {
  it("accepts a valid listId and title", () => {
    const result = renameListSchema.safeParse({
      listId: "11111111-1111-1111-1111-111111111111",
      title: "Doing",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing listId", () => {
    const result = renameListSchema.safeParse({ title: "Doing" });
    expect(result.success).toBe(false);
  });

  it("rejects non-UUID listId", () => {
    const result = renameListSchema.safeParse({ listId: "abc", title: "Doing" });
    expect(result.success).toBe(false);
  });

  it("rejects empty title", () => {
    const result = renameListSchema.safeParse({
      listId: "11111111-1111-1111-1111-111111111111",
      title: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects title over 100 characters", () => {
    const result = renameListSchema.safeParse({
      listId: "11111111-1111-1111-1111-111111111111",
      title: "a".repeat(101),
    });
    expect(result.success).toBe(false);
  });
});

describe("reorderListsSchema", () => {
  it("accepts a valid boardId and array of UUID listIds", () => {
    const result = reorderListsSchema.safeParse({
      boardId: "11111111-1111-1111-1111-111111111111",
      orderedListIds: [
        "22222222-2222-2222-2222-222222222222",
        "33333333-3333-3333-3333-333333333333",
      ],
    });
    expect(result.success).toBe(true);
  });

  it("accepts an empty list array", () => {
    const result = reorderListsSchema.safeParse({
      boardId: "11111111-1111-1111-1111-111111111111",
      orderedListIds: [],
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing boardId", () => {
    const result = reorderListsSchema.safeParse({ orderedListIds: [] });
    expect(result.success).toBe(false);
  });

  it("rejects non-UUID entries in orderedListIds", () => {
    const result = reorderListsSchema.safeParse({
      boardId: "11111111-1111-1111-1111-111111111111",
      orderedListIds: ["not-a-uuid"],
    });
    expect(result.success).toBe(false);
  });
});
