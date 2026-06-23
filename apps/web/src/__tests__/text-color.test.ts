import { describe, it, expect } from "vitest";
import { getTextColor } from "@/lib/text-color";

describe("getTextColor", () => {
  it("returns white for dark hex backgrounds", () => {
    expect(getTextColor("#1a1a2e")).toBe("white");
    expect(getTextColor("#000000")).toBe("white");
    expect(getTextColor("#065f46")).toBe("white");
  });

  it("returns near-black for light hex backgrounds", () => {
    expect(getTextColor("#ffffff")).toBe("#0a0a0a");
    expect(getTextColor("#f5f5f5")).toBe("#0a0a0a");
    expect(getTextColor("#ffeb3b")).toBe("#0a0a0a");
  });

  it("returns white for gradient backgrounds (safe default)", () => {
    expect(getTextColor("linear-gradient(135deg, #667eea 0%, #764ba2 100%)")).toBe(
      "white",
    );
    expect(getTextColor("radial-gradient(circle, #43e97b 0%, #38f9d7 100%)")).toBe(
      "white",
    );
  });

  it("handles 3-digit hex shorthand", () => {
    expect(getTextColor("#fff")).toBe("#0a0a0a");
    expect(getTextColor("#000")).toBe("white");
  });

  it("handles 6-digit hex", () => {
    expect(getTextColor("#ffffff")).toBe("#0a0a0a");
    expect(getTextColor("#ff0000")).toBe("white");
  });
});
