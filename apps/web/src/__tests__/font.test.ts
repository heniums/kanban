import { describe, it, expect, vi, beforeEach } from "vitest";

describe("font configuration", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("invokes next/font with display: 'swap' and subsets: ['latin']", async () => {
    const interMock = vi.fn(() => ({ variable: "mock-inter-var", className: "mock-inter-class" }));
    vi.doMock("next/font/google", () => ({
      Inter: interMock,
      Geist_Mono: vi.fn(() => ({ variable: "mock-mono-var", className: "mock-mono-class" })),
    }));

    await import("@/lib/font");

    expect(interMock).toHaveBeenCalledTimes(1);
    const callArg = (interMock.mock.calls as unknown[][])[0]?.[0] as Record<string, unknown>;
    expect(callArg.display).toBe("swap");
    expect(callArg.subsets).toEqual(["latin"]);
  });
});
