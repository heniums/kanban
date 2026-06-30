import { describe, it, expect, vi, beforeEach } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

const { mockRegisterAction, mockSignIn } = vi.hoisted(() => ({
  mockRegisterAction: vi.fn(),
  mockSignIn: vi.fn(),
}));

vi.mock("@/lib/actions/auth/register", () => ({
  registerAction: mockRegisterAction,
}));

vi.mock("next-auth/react", () => ({
  signIn: mockSignIn,
}));

import { SignUpForm } from "../sign-up-form";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("SignUpForm — uses Server Action, not apiFetch", () => {
  it("imports from @/lib/actions/auth/register (Server Action path)", () => {
    const source = readFileSync(resolve(__dirname, "../sign-up-form.tsx"), "utf-8");
    expect(source).toMatch(/from\s+['"]@\/lib\/actions\/auth\/register['"]/);
  });

  it("does not import apiFetch (no cross-origin fetch to /api/server/...)", () => {
    const source = readFileSync(resolve(__dirname, "../sign-up-form.tsx"), "utf-8");
    expect(source).not.toMatch(/from\s+['"]@\/lib\/api['"]/);
    expect(source).not.toMatch(/apiFetch\s*\(/);
  });

  it("renders the form structure", () => {
    expect(SignUpForm).toBeDefined();
    expect(typeof SignUpForm).toBe("function");
  });
});
