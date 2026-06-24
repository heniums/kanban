import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PageContainer } from "@/components/layout/PageContainer";

describe("PageContainer", () => {
  it("renders children with mx-auto, max-w-7xl, responsive padding, and default py-8", () => {
    const { container } = render(
      <PageContainer>
        <p>content</p>
      </PageContainer>,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.tagName.toLowerCase()).toBe("div");
    expect(root.className).toContain("mx-auto");
    expect(root.className).toContain("max-w-7xl");
    expect(root.className).toContain("px-4");
    expect(root.className).toContain("sm:px-6");
    expect(root.className).toContain("lg:px-8");
    expect(root.className).toContain("py-8");
    expect(screen.getByText("content")).toBeDefined();
  });

  it("renders the requested element via the as prop and accepts a py override and className merge", () => {
    const { container } = render(
      <PageContainer as="main" py="12" className="bg-red-500">
        <p>content</p>
      </PageContainer>,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.tagName.toLowerCase()).toBe("main");
    expect(root.className).toContain("py-12");
    expect(root.className).not.toContain("py-8");
    expect(root.className).toContain("bg-red-500");
    expect(root.className).toContain("max-w-7xl");
  });
});
