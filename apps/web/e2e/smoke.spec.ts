import { test, expect } from "@playwright/test";

test.describe("Public pages", () => {
  test("redirects unauthenticated users to login", async ({ page }) => {
    await page.goto("/boards");
    await expect(page).toHaveURL(/\/login/);
  });

  test("login page renders", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();
  });

  test("register page renders", async ({ page }) => {
    await page.goto("/register");
    await expect(page.getByRole("heading", { name: /create an account/i })).toBeVisible();
  });
});
