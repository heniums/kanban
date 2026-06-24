import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

// AC-5 enforcement: no file under apps/web/src/app/**/page.tsx or layout.tsx
// may define an ad-hoc outer max-w-* wrapper. All page-level container width
// and horizontal padding must come from <PageContainer>.
//
// The allow-list is empty on purpose. Any max-w-* inside app/**/page.tsx
// or layout.tsx — including max-w-md and max-w-lg on Card components — is
// a violation. Form Card content widths belong in a component file under
// components/**, not in the route's page.tsx.
const ALLOWED_MAX_W = new Set<string>();

const APP_DIR = join(process.cwd(), "src", "app");

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      walk(full, out);
    } else if (
      stat.isFile() &&
      (entry === "page.tsx" || entry === "layout.tsx")
    ) {
      out.push(full);
    }
  }
  return out;
}

function findMaxWClasses(source: string): string[] {
  const matches = source.match(/\bmax-w-[a-z0-9-]+/g);
  return matches ? Array.from(new Set(matches)) : [];
}

describe("AC-5 — no ad-hoc max-w-* outer wrappers in app/**", () => {
  const files = walk(APP_DIR);

  if (files.length === 0) {
    it("finds at least one page.tsx or layout.tsx in app/**", () => {
      expect(files.length).toBeGreaterThan(0);
    });
    return;
  }

  for (const file of files) {
    const rel = relative(process.cwd(), file).split(sep).join("/");
    const source = readFileSync(file, "utf8");
    const found = findMaxWClasses(source).filter(
      (cls) => !ALLOWED_MAX_W.has(cls),
    );

    it(`${rel} has no ad-hoc max-w-* classes`, () => {
      expect(
        found,
        `${rel} defines ad-hoc max-w-* classes: ${found.join(", ")}. ` +
          "Use <PageContainer> for the page wrapper, or move the width " +
          "constraint into a component under components/**.",
      ).toEqual([]);
    });
  }
});
