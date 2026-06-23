import { describe, it, expect, vi } from "vitest";

const { captured } = vi.hoisted(() => ({
  captured: {} as {
    config?: {
      callbacks?: {
        authorized?: (params: {
          auth: unknown;
          request: { nextUrl: URL };
        }) => boolean | Response | Promise<boolean | Response>;
      };
    };
  },
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
  default: vi.fn(() => ({})),
}));

import "@/auth";

const authorized = () => {
  if (!captured.config?.callbacks?.authorized) {
    throw new Error(
      "auth.ts did not register an authorized callback with NextAuth"
    );
  }
  return captured.config!.callbacks!.authorized!;
};

const makeRequest = (pathname: string) =>
  ({ nextUrl: new URL(`http://localhost${pathname}`) }) as any;

describe("middleware authorized callback — security regression", () => {
  it("redirects to /login when unauthenticated user visits /boards", () => {
    const result = authorized()({ auth: null, request: makeRequest("/boards") });
    expect(result).toBeInstanceOf(Response);
    const res = result as Response;
    expect(res.headers.get("location") || res.headers.get("Location")).toBe(
      new URL("/login", makeRequest("/boards").nextUrl).toString()
    );
  });

  it("redirects to /login when unauthenticated user visits /boards/new", () => {
    const result = authorized()({
      auth: null,
      request: makeRequest("/boards/new"),
    });
    expect(result).toBeInstanceOf(Response);
  });

  it("redirects to /login when unauthenticated user visits /boards/<id>", () => {
    const result = authorized()({
      auth: null,
      request: makeRequest("/boards/abc-123"),
    });
    expect(result).toBeInstanceOf(Response);
  });

  it("allows unauthenticated user to visit / (marketing landing)", () => {
    const result = authorized()({ auth: null, request: makeRequest("/") });
    expect(result).toBe(true);
  });

  it("allows unauthenticated user to visit /login", () => {
    const result = authorized()({ auth: null, request: makeRequest("/login") });
    expect(result).toBe(true);
  });

  it("allows unauthenticated user to visit /register", () => {
    const result = authorized()({
      auth: null,
      request: makeRequest("/register"),
    });
    expect(result).toBe(true);
  });

  it("allows authenticated user to visit /boards", () => {
    const result = authorized()({
      auth: { user: { id: "u1" } },
      request: makeRequest("/boards"),
    });
    expect(result).toBe(true);
  });

  it("allows authenticated user to visit /boards/<id>", () => {
    const result = authorized()({
      auth: { user: { id: "u1" } },
      request: makeRequest("/boards/abc-123"),
    });
    expect(result).toBe(true);
  });
});
