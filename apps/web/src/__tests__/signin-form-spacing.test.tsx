import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { SignInForm } from "@/components/auth/sign-in-form";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

describe("SignInForm bottom spacing (FR-4)", () => {
  it("gives the form's outer container some bottom padding so the submit button does not sit at the viewport edge", () => {
    const { container } = render(<SignInForm />);
    const card = container.querySelector('[class*="rounded-xl"]') as HTMLElement | null;
    expect(card, "SignInForm renders its outer container").toBeTruthy();
    expect(card!.className).toMatch(/\bpb-\d/);
  });

  it("gives the submit button some top clearance from the last form field", () => {
    render(<SignInForm />);
    const submit = screen.getByRole("button", { name: /sign in/i });
    expect(submit.className).toMatch(/\bmt-\d/);
  });
});
