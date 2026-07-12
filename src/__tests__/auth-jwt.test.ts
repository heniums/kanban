import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  getUserById: vi.fn(),
  verifyCredentials: vi.fn(),
}));

vi.mock("@/lib/data/auth", () => ({
  verifyCredentials: mocks.verifyCredentials,
  getUserById: mocks.getUserById,
}));

vi.mock("next-auth", () => {
  const callbacks: Record<string, (...args: unknown[]) => unknown> = {};
  return {
    default: (config: { callbacks?: Record<string, (...a: unknown[]) => unknown> }) => {
      Object.assign(callbacks, config.callbacks);
      return {
        handlers: {},
        signIn: vi.fn(),
        signOut: vi.fn(),
        auth: vi.fn(),
        _callbacks: callbacks,
      };
    },
  };
});

import NextAuth from "next-auth";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("auth jwt callback", () => {
  it("does NOT call getUserById when token already has avatarUrl", async () => {
    const result = NextAuth({
      providers: [],
      session: { strategy: "jwt" },
      callbacks: {
        async jwt({ token }) {
          if (token.sub && !(token as Record<string, unknown>).avatarUrl) {
            const dbUser = await mocks.getUserById(token.sub);
            if (dbUser) {
              (token as Record<string, unknown>).avatarUrl = dbUser.avatarUrl;
            }
          }
          return token;
        },
      },
    });
    const jwt = (result as unknown as { _callbacks: Record<string, (...a: unknown[]) => unknown> })
      ._callbacks.jwt;

    const token = { sub: "user-1", name: "Test", email: "t@t.com", avatarUrl: "old-url" };
    await jwt({ token });

    expect(mocks.getUserById).not.toHaveBeenCalled();
  });

  it("calls getUserById when token lacks avatarUrl (backfill)", async () => {
    const result = NextAuth({
      providers: [],
      session: { strategy: "jwt" },
      callbacks: {
        async jwt({ token }) {
          if (token.sub && !(token as Record<string, unknown>).avatarUrl) {
            const dbUser = await mocks.getUserById(token.sub);
            if (dbUser) {
              (token as Record<string, unknown>).avatarUrl = dbUser.avatarUrl;
            }
          }
          return token;
        },
      },
    });
    const jwt = (result as unknown as { _callbacks: Record<string, (...a: unknown[]) => unknown> })
      ._callbacks.jwt;

    mocks.getUserById.mockResolvedValue({ avatarUrl: "new-url" });
    const token = { sub: "user-1", name: "Test", email: "t@t.com" };
    await jwt({ token });

    expect(mocks.getUserById).toHaveBeenCalledTimes(1);
    expect((token as Record<string, unknown>).avatarUrl).toBe("new-url");
  });
});
