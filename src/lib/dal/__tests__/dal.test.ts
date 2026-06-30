import { describe, it, expect, vi, beforeEach } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

const { mockAuth, mockRedirect } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockRedirect: vi.fn((url: string) => {
    const err: Error & { digest?: string } = new Error("NEXT_REDIRECT");
    err.digest = `NEXT_REDIRECT;${url}`;
    throw err;
  }),
}));

vi.mock("@/auth", () => ({
  auth: mockAuth,
}));

vi.mock("next/navigation", () => ({
  redirect: mockRedirect,
}));

vi.mock("server-only", () => ({}));

import { verifySession } from "@/lib/dal";

describe("verifySession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns { userId } when auth() yields a session with a user id", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user-1", email: "u@example.com" },
      expires: "2099-01-01",
    });

    const result = await verifySession();
    expect(result).toEqual({ userId: "user-1" });
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it("redirects to /login when there is no session", async () => {
    mockAuth.mockResolvedValue(null);

    await expect(verifySession()).rejects.toThrow("NEXT_REDIRECT");
    expect(mockRedirect).toHaveBeenCalledWith("/login");
  });

  it("redirects to /login when the session has no user id", async () => {
    mockAuth.mockResolvedValue({ user: undefined, expires: "2099-01-01" });

    await expect(verifySession()).rejects.toThrow("NEXT_REDIRECT");
    expect(mockRedirect).toHaveBeenCalledWith("/login");
  });
});

describe("dal.ts module shape", () => {
  it("imports 'server-only' so client components cannot use it", () => {
    const source = readFileSync(resolve(__dirname, "../../dal.ts"), "utf-8");
    expect(source).toMatch(/import\s+['"]server-only['"]/);
  });

  it("wraps verifySession in React's cache() for per-render dedupe", () => {
    const source = readFileSync(resolve(__dirname, "../../dal.ts"), "utf-8");
    expect(source).toMatch(/import\s*\{[^}]*\bcache\b[^}]*\}\s*from\s+['"]react['"]/);
    expect(source).toMatch(/cache\(\s*async/);
  });
});
