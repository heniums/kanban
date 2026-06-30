import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  captured,
  mockVerifyCredentials,
} = vi.hoisted(() => ({
  captured: {} as {
    config?: {
      providers?: Array<{
        credentials?: Record<string, unknown>;
        authorize?: (credentials: Record<string, string>) => Promise<unknown>;
      }>;
    };
  },
  mockVerifyCredentials: vi.fn(),
}));

vi.mock("next-auth", () => ({
  default: vi.fn((config: any) => {
    captured.config = config;
    return {
      handlers: {},
      signIn: vi.fn(),
      signOut: vi.fn(),
      auth: vi.fn(),
    };
  }),
}));

vi.mock("next-auth/providers/credentials", () => ({
  default: vi.fn((config: unknown) => config),
}));

vi.mock("@/lib/data/auth", () => ({
  verifyCredentials: mockVerifyCredentials,
}));

vi.mock("server-only", () => ({}));

import "@/auth";

const getAuthorize = () => {
  if (!captured.config?.providers?.[0]?.authorize) {
    throw new Error("auth.ts did not register an authorize function on the credentials provider");
  }
  return captured.config!.providers![0]!.authorize!;
};

describe("NextAuth authorize callback — direct DB call", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the user from verifyCredentials when credentials are valid", async () => {
    const fakeUser = { id: "user-1", email: "u@example.com", name: "U" };
    mockVerifyCredentials.mockResolvedValue(fakeUser);

    const result = await getAuthorize()({
      email: "u@example.com",
      password: "pw",
    });

    expect(mockVerifyCredentials).toHaveBeenCalledWith("u@example.com", "pw");
    expect(result).toEqual(fakeUser);
  });

  it("returns null when verifyCredentials returns null", async () => {
    mockVerifyCredentials.mockResolvedValue(null);

    const result = await getAuthorize()({
      email: "missing@example.com",
      password: "pw",
    });

    expect(result).toBeNull();
  });

  it("does not call fetch (no cross-origin HTTP to a server)", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    mockVerifyCredentials.mockResolvedValue(null);

    await getAuthorize()({
      email: "u@example.com",
      password: "pw",
    });

    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
});
