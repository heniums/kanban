import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

// AC-5: no file under apps/web/src/app/**/page.tsx or layout.tsx may define
// an ad-hoc outer max-w-* wrapper. All page-level container width and
// horizontal padding must come from <PageContainer>.
//
// The allow-list is empty on purpose. Any max-w-* inside app/**/page.tsx
// or layout.tsx — including max-w-md and max-w-lg on Card components — is
// a violation. Form Card content widths belong in a component file under
// components/**, not in the route's page.tsx.

const APP_DIR = join(process.cwd(), "src", "app");
const ROUTE_FILES = ["page.tsx", "layout.tsx"];

function findRouteFiles(): string[] {
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      const stat = statSync(full);
      if (stat.isDirectory()) {
        walk(full);
      } else if (stat.isFile() && ROUTE_FILES.includes(entry)) {
        out.push(full);
      }
    }
  };
  walk(APP_DIR);
  return out;
}

describe("AC-5 — no ad-hoc max-w-* outer wrappers in app/**", () => {
  const files = findRouteFiles();
  const violations: string[] = [];

  for (const file of files) {
    const rel = relative(process.cwd(), file).split(sep).join("/");
    const source = readFileSync(file, "utf8");
    const matches = source.match(/\bmax-w-[a-z0-9-]+/g) ?? [];
    const unique = Array.from(new Set(matches));
    if (unique.length > 0) {
      violations.push(`${rel}: ${unique.join(", ")}`);
    }
  }

  it("has no ad-hoc max-w-* classes in any app/**/page.tsx or layout.tsx", () => {
    expect(
      violations,
      "Ad-hoc max-w-* wrappers found:\n  " +
        violations.join("\n  ") +
        "\nUse <PageContainer> for the page wrapper, or move the width " +
        "constraint into a component under components/**.",
    ).toEqual([]);
  });
});
