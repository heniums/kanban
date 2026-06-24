import { test, expect } from "@playwright/test";

// AC-3: the sign-up form's submit button has at least mt-8 (64px)
// clearance from the bottom of the viewport on a 1280x800 screen with
// no scroll.

test.describe("Sign-up form clearance (AC-3)", () => {
  test("submit button sits at least 64px above the viewport bottom at 1280x800", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/register");
    const submit = page.getByRole("button", { name: /create account/i });
    await expect(submit).toBeVisible();
    const box = await submit.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.y + box!.height).toBeLessThanOrEqual(800 - 64);
  });
});
