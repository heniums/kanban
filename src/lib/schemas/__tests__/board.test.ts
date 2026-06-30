import { describe, expect, it } from "vitest";
import { createBoardSchema, updateBoardSchema } from "@/lib/schemas/board";

describe("createBoardSchema", () => {
  const validInput = {
    title: "My Board",
    description: "A test board",
    background: "#1a1a2e",
  };

  it("accepts valid input with all fields", () => {
    const result = createBoardSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it("accepts valid input without description", () => {
    const result = createBoardSchema.safeParse({
      title: "My Board",
      background: "#1a1a2e",
    });
    expect(result.success).toBe(true);
  });

  it("accepts null description", () => {
    const result = createBoardSchema.safeParse({
      title: "My Board",
      description: null,
      background: "#1a1a2e",
    });
    expect(result.success).toBe(true);
  });

  it("accepts gradient background string", () => {
    const result = createBoardSchema.safeParse({
      title: "My Board",
      background: "linear-gradient(#667eea, #764ba2)",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty title", () => {
    const result = createBoardSchema.safeParse({
      title: "",
      background: "#1a1a2e",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toMatch(/title/i);
    }
  });

  it("rejects missing title", () => {
    const result = createBoardSchema.safeParse({
      background: "#1a1a2e",
    });
    expect(result.success).toBe(false);
  });

  it("rejects title over 100 characters", () => {
    const result = createBoardSchema.safeParse({
      title: "a".repeat(101),
      background: "#1a1a2e",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toMatch(/100/i);
    }
  });

  it("rejects missing background", () => {
    const result = createBoardSchema.safeParse({
      title: "My Board",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty background", () => {
    const result = createBoardSchema.safeParse({
      title: "My Board",
      background: "",
    });
    expect(result.success).toBe(false);
  });

  it("accepts hex color with 3 digits (#fff)", () => {
    const result = createBoardSchema.safeParse({
      title: "My Board",
      background: "#fff",
    });
    expect(result.success).toBe(true);
  });

  it("accepts radial gradient", () => {
    const result = createBoardSchema.safeParse({
      title: "My Board",
      background: "radial-gradient(#667eea, #764ba2)",
    });
    expect(result.success).toBe(true);
  });

  it("rejects script tag in background (XSS)", () => {
    const result = createBoardSchema.safeParse({
      title: "My Board",
      background: "<script>alert(1)</script>",
    });
    expect(result.success).toBe(false);
  });

  it("rejects CSS injection in background", () => {
    const result = createBoardSchema.safeParse({
      title: "My Board",
      background: "red; }</style><script>alert(1)</script>",
    });
    expect(result.success).toBe(false);
  });

  it("rejects arbitrary string in background", () => {
    const result = createBoardSchema.safeParse({
      title: "My Board",
      background: "javascript:alert(1)",
    });
    expect(result.success).toBe(false);
  });

  it("rejects description over 2000 characters", () => {
    const result = createBoardSchema.safeParse({
      title: "My Board",
      description: "a".repeat(2001),
      background: "#1a1a2e",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toMatch(/2000/i);
    }
  });
});

describe("updateBoardSchema", () => {
  it("accepts partial update with only title", () => {
    const result = updateBoardSchema.safeParse({ title: "Updated" });
    expect(result.success).toBe(true);
  });

  it("accepts partial update with only background", () => {
    const result = updateBoardSchema.safeParse({
      background: "#ff0000",
    });
    expect(result.success).toBe(true);
  });

  it("accepts partial update with only description", () => {
    const result = updateBoardSchema.safeParse({
      description: "New description",
    });
    expect(result.success).toBe(true);
  });

  it("accepts null description", () => {
    const result = updateBoardSchema.safeParse({ description: null });
    expect(result.success).toBe(true);
  });

  it("accepts empty object (no fields to update)", () => {
    const result = updateBoardSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("rejects empty title when title is provided", () => {
    const result = updateBoardSchema.safeParse({ title: "" });
    expect(result.success).toBe(false);
  });

  it("rejects title over 100 characters", () => {
    const result = updateBoardSchema.safeParse({
      title: "a".repeat(101),
    });
    expect(result.success).toBe(false);
  });

  it("rejects description over 2000 characters", () => {
    const result = updateBoardSchema.safeParse({
      description: "a".repeat(2001),
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty background when background is provided", () => {
    const result = updateBoardSchema.safeParse({ background: "" });
    expect(result.success).toBe(false);
  });
});
