import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  getUserById: vi.fn(),
  verifyCredentials: vi.fn(),
}));

// Capture the REAL callbacks object that auth.ts passes to NextAuth so we
// exercise the actual jwt callback logic instead of a re-implementation.
const captured = vi.hoisted(() => ({
  callbacks: undefined as unknown as {
    jwt: (params: {
      token: Record<string, unknown>;
      trigger?: string;
      session?: unknown;
    }) => Promise<unknown>;
  },
}));

vi.mock("@/lib/data/auth", () => ({
  verifyCredentials: mocks.verifyCredentials,
  getUserById: mocks.getUserById,
}));

vi.mock("next-auth", () => ({
  default: (config: { callbacks: typeof captured.callbacks }) => {
    captured.callbacks = config.callbacks;
    return { handlers: {}, signIn: vi.fn(), signOut: vi.fn(), auth: vi.fn() };
  },
}));

import "@/auth";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("auth jwt callback", () => {
  it("does NOT call getUserById when token already has avatarUrl", async () => {
    const token: Record<string, unknown> = {
      sub: "user-1",
      name: "Test",
      email: "t@t.com",
      avatarUrl: "old-url",
    };
    await captured.callbacks.jwt({ token });
    expect(mocks.getUserById).not.toHaveBeenCalled();
  });

  it("calls getUserById to backfill avatarUrl when token lacks it", async () => {
    mocks.getUserById.mockResolvedValue({ avatarUrl: "new-url" });
    const token: Record<string, unknown> = { sub: "user-1", name: "Test", email: "t@t.com" };
    await captured.callbacks.jwt({ token });
    expect(mocks.getUserById).toHaveBeenCalledTimes(1);
    expect(token.avatarUrl).toBe("new-url");
  });

  it("refreshes avatarUrl from the update trigger without a DB call", async () => {
    const token: Record<string, unknown> = {
      sub: "user-1",
      name: "Test",
      email: "t@t.com",
      avatarUrl: "old-url",
    };
    await captured.callbacks.jwt({
      token,
      trigger: "update",
      session: { avatarUrl: "refreshed-url" },
    });
    expect(mocks.getUserById).not.toHaveBeenCalled();
    expect(token.avatarUrl).toBe("refreshed-url");
  });
});
