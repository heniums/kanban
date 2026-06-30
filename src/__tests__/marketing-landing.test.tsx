import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MarketingLanding } from "@/components/marketing/marketing-landing";

describe("MarketingLanding", () => {
  it("renders the hero with the product name as the page title", () => {
    render(<MarketingLanding />);
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toBeDefined();
    expect(heading.textContent).toMatch(/kanban/i);
  });

  it("renders a one-sentence value proposition", () => {
    render(<MarketingLanding />);
    const heroText = screen.getAllByText(/board|collaborate|real-?time|share/i);
    expect(heroText.length).toBeGreaterThan(0);
  });

  it("renders a 'Get started' CTA in the hero that links to /register", () => {
    render(<MarketingLanding />);
    const cta = screen.getAllByRole("link", { name: /get started/i })[0];
    expect(cta).toBeDefined();
    expect(cta.getAttribute("href")).toBe("/register");
  });

  it("renders a 'Sign in' CTA in the hero that links to /login", () => {
    render(<MarketingLanding />);
    const cta = screen.getByRole("link", { name: /sign in/i });
    expect(cta).toBeDefined();
    expect(cta.getAttribute("href")).toBe("/login");
  });

  it("renders three feature highlight cards", () => {
    render(<MarketingLanding />);
    const featureHeadings = screen.getAllByRole("heading", { level: 3 });
    expect(featureHeadings.length).toBe(3);
  });

  it("includes real-time collaboration in the feature highlights", () => {
    render(<MarketingLanding />);
    const headings = screen.getAllByRole("heading", { level: 3 });
    const titles = headings.map((h) => h.textContent ?? "");
    expect(titles.some((t) => /real-?time/i.test(t))).toBe(true);
  });

  it("includes kanban boards in the feature highlights", () => {
    render(<MarketingLanding />);
    const headings = screen.getAllByRole("heading", { level: 3 });
    const titles = headings.map((h) => h.textContent ?? "");
    expect(titles.some((t) => /boards?/i.test(t))).toBe(true);
  });

  it("includes sharing in the feature highlights", () => {
    render(<MarketingLanding />);
    expect(screen.getByText(/shar/i)).toBeDefined();
  });

  it("renders a footer CTA that links to /register", () => {
    render(<MarketingLanding />);
    const ctas = screen.getAllByRole("link", { name: /get started/i });
    expect(ctas.length).toBeGreaterThanOrEqual(2);
    const footerCta = ctas[ctas.length - 1];
    expect(footerCta.getAttribute("href")).toBe("/register");
  });
});
