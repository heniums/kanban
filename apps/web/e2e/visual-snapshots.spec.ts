import { test, expect } from "@playwright/test";

// Visual baselines for the UI revamp. Snapshots are committed in
// apps/web/e2e/snapshots/. Update them with `npx playwright test
// --update-snapshots` after a deliberate visual change.
//
// Authenticated surfaces (dashboard, boards list, board detail) and the
// dark theme are intentionally NOT covered here — the dark theme is not
// wired up in this app (see theme-contrast-audit.md) and the
// authenticated surfaces would require seeding a session, which is out
// of scope for this track.

test.describe("Visual baseline — public surfaces (light theme)", () => {
  test("marketing landing", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page).toHaveScreenshot("marketing-landing.png", {
      fullPage: true,
    });
  });

  test("sign-in page", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();
    await expect(page).toHaveScreenshot("sign-in.png", { fullPage: true });
  });

  test("sign-up page", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/register");
    await expect(
      page.getByRole("heading", { name: /create an account/i }),
    ).toBeVisible();
    await expect(page).toHaveScreenshot("sign-up.png", { fullPage: true });
  });
});
