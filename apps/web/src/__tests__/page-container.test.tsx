import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PageContainer } from "@/components/layout/PageContainer";

describe("PageContainer", () => {
  it("renders children inside the container", () => {
    render(
      <PageContainer>
        <p>Hello world</p>
      </PageContainer>,
    );
    expect(screen.getByText("Hello world")).toBeDefined();
  });

  it("applies mx-auto max-w-7xl as the outer width constraint", () => {
    const { container } = render(
      <PageContainer>
        <p>content</p>
      </PageContainer>,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root).not.toBeNull();
    expect(root.className).toContain("mx-auto");
    expect(root.className).toContain("max-w-7xl");
  });

  it("applies responsive horizontal padding px-4 sm:px-6 lg:px-8", () => {
    const { container } = render(
      <PageContainer>
        <p>content</p>
      </PageContainer>,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.className).toContain("px-4");
    expect(root.className).toContain("sm:px-6");
    expect(root.className).toContain("lg:px-8");
  });

  it("applies default py-8 vertical padding", () => {
    const { container } = render(
      <PageContainer>
        <p>content</p>
      </PageContainer>,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.className).toContain("py-8");
  });

  it("allows overriding vertical padding via the py prop", () => {
    const { container } = render(
      <PageContainer py="12">
        <p>content</p>
      </PageContainer>,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.className).toContain("py-12");
    expect(root.className).not.toContain("py-8");
  });

  it("accepts a custom element via the as prop (default 'div')", () => {
    const { container } = render(
      <PageContainer>
        <p>content</p>
      </PageContainer>,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.tagName.toLowerCase()).toBe("div");
  });

  it("renders a <main> element when as='main'", () => {
    const { container } = render(
      <PageContainer as="main">
        <p>content</p>
      </PageContainer>,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.tagName.toLowerCase()).toBe("main");
    expect(root.className).toContain("mx-auto");
    expect(root.className).toContain("max-w-7xl");
  });

  it("renders a <section> element when as='section'", () => {
    const { container } = render(
      <PageContainer as="section">
        <p>content</p>
      </PageContainer>,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.tagName.toLowerCase()).toBe("section");
  });

  it("merges custom className with the default container classes", () => {
    const { container } = render(
      <PageContainer className="bg-red-500">
        <p>content</p>
      </PageContainer>,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.className).toContain("mx-auto");
    expect(root.className).toContain("max-w-7xl");
    expect(root.className).toContain("bg-red-500");
  });
});
