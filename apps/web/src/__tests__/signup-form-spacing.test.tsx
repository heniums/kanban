import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { SignUpForm } from "@/components/auth/sign-up-form";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

describe("SignUpForm bottom spacing (FR-4 / AC-3)", () => {
  it("gives the form's outer container some bottom padding so the submit button does not sit at the viewport edge", () => {
    const { container } = render(<SignUpForm />);
    const card = container.querySelector('[class*="rounded-xl"]') as HTMLElement | null;
    expect(card, "SignUpForm renders its outer container").toBeTruthy();
    expect(card!.className).toMatch(/\bpb-\d/);
  });

  it("gives the submit button some top clearance from the last form field", () => {
    render(<SignUpForm />);
    const submit = screen.getByRole("button", { name: /create account/i });
    expect(submit.className).toMatch(/\bmt-\d/);
  });

  it("leaves additional space below the submit button before the form ends", () => {
    const { container } = render(<SignUpForm />);
    const card = container.querySelector('[class*="rounded-xl"]') as HTMLElement | null;
    expect(card).toBeTruthy();
    const submit = screen.getByRole("button", { name: /create account/i });
    const submitWrapper = submit.parentElement as HTMLElement | null;
    expect(submitWrapper).toBeTruthy();
    const cardOrWrapper = `${card!.className} ${submitWrapper!.className}`;
    expect(cardOrWrapper).toMatch(/\b(mt-|pb-)\d/);
  });
});
