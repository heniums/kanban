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

  it("renders seven feature highlight cards covering all MVP capabilities", () => {
    render(<MarketingLanding />);
    const featureHeadings = screen.getAllByRole("heading", { level: 3 });
    expect(featureHeadings.length).toBe(7);
  });

  it("includes real-time collaboration in the feature highlights", () => {
    render(<MarketingLanding />);
    const headings = screen.getAllByRole("heading", { level: 3 });
    const titles = headings.map((h) => h.textContent ?? "");
    expect(titles.some((t) => /real-?time/i.test(t))).toBe(true);
  });

  it("includes board management in the feature highlights", () => {
    render(<MarketingLanding />);
    const headings = screen.getAllByRole("heading", { level: 3 });
    const titles = headings.map((h) => h.textContent ?? "");
    expect(titles.some((t) => /boards?/i.test(t))).toBe(true);
  });

  it("includes drag-and-drop in the feature highlights", () => {
    render(<MarketingLanding />);
    const headings = screen.getAllByRole("heading", { level: 3 });
    const titles = headings.map((h) => h.textContent ?? "");
    expect(titles.some((t) => /drag|drop|dnd/i.test(t))).toBe(true);
  });

  it("includes sharing in the feature highlights", () => {
    render(<MarketingLanding />);
    expect(screen.getByText(/shar/i)).toBeDefined();
  });

  it("includes authentication in the feature highlights", () => {
    render(<MarketingLanding />);
    const headings = screen.getAllByRole("heading", { level: 3 });
    const titles = headings.map((h) => h.textContent ?? "");
    expect(titles.some((t) => /auth|sign.?up|register|account/i.test(t))).toBe(true);
  });

  it("includes labels or attachments in the feature highlights", () => {
    render(<MarketingLanding />);
    expect(screen.getAllByText(/label|attach|image/i).length).toBeGreaterThan(0);
  });

  it("includes responsive design in the feature highlights", () => {
    render(<MarketingLanding />);
    const headings = screen.getAllByRole("heading", { level: 3 });
    const titles = headings.map((h) => h.textContent ?? "");
    expect(titles.some((t) => /responsive|mobile|tablet|desktop/i.test(t))).toBe(true);
  });

  it("renders an About / Open Source section identifying the project as open source", () => {
    render(<MarketingLanding />);
    expect(screen.getAllByText(/open.?source/i).length).toBeGreaterThan(0);
  });

  it("renders a footer with a link to the portfolio", () => {
    render(<MarketingLanding />);
    const portfolioLink = screen.getByRole("link", { name: /portfolio|heniums/i });
    expect(portfolioLink).toBeDefined();
    expect(portfolioLink.getAttribute("href")).toContain("heniums");
  });

  it("renders a footer with a link to the GitHub repository", () => {
    render(<MarketingLanding />);
    const githubLink = screen.getByRole("link", { name: /github/i });
    expect(githubLink).toBeDefined();
    expect(githubLink.getAttribute("href")).toContain("github.com");
  });
});
