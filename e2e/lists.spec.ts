import { test, expect } from "@playwright/test";
import { registerUser, createBoard, cleanupE2EUser, type TestUser } from "./utils";

const TEST_USER: TestUser = {
  email: `e2e-lists-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@kanban.local`,
  password: "test-password-123",
  name: "E2E Lists User",
};

test.describe("List management", () => {
  test.beforeEach(async ({ page }) => {
    await registerUser(page, TEST_USER);
  });

  test.afterAll(async () => {
    await cleanupE2EUser(TEST_USER.email);
  });

  test("creating a board shows the default 'To Do' list", async ({ page }) => {
    await createBoard(page, "E2E Test Board");

    // Wait for the board to load and the default list to be visible
    await expect(page.getByRole("heading", { name: "To Do" })).toBeVisible();
  });

  test("can add a new list", async ({ page }) => {
    await createBoard(page, "Add List Board");

    await page.getByRole("button", { name: /add list/i }).click();
    const input = page.getByLabel(/list title/i);
    await input.fill("Doing");
    await input.press("Enter");

    await expect(page.getByRole("heading", { name: "Doing" })).toBeVisible();
  });

  test("can rename a list inline", async ({ page }) => {
    await createBoard(page, "Rename Board");

    // Click the default list title to enter rename mode
    const title = page.getByRole("heading", { name: "To Do" });
    await title.click();

    const input = page.getByLabel(/rename list/i);
    await input.fill("Backlog");
    await input.press("Enter");

    await expect(page.getByRole("heading", { name: "Backlog" })).toBeVisible();
  });

  test("can delete a list with confirmation", async ({ page }) => {
    await createBoard(page, "Delete Board");

    // Add a second list so we have one to delete and the default one remains
    await page.getByRole("button", { name: /add list/i }).click();
    const input = page.getByLabel(/list title/i);
    await input.fill("Disposable");
    await input.press("Enter");
    await expect(page.getByRole("heading", { name: "Disposable" })).toBeVisible();

    // Click the delete button for the second list
    const disposableSection = page.locator("section", {
      has: page.getByRole("heading", { name: "Disposable" }),
    });
    await disposableSection.getByRole("button", { name: /delete list/i }).click();
    await page.getByRole("button", { name: /^delete$/i }).click();

    await expect(page.getByRole("heading", { name: "Disposable" })).toHaveCount(0);
  });

  test("can reorder lists via drag-and-drop", async ({ page }) => {
    await createBoard(page, "Reorder Board");

    // Add a second list
    await page.getByRole("button", { name: /add list/i }).click();
    const input = page.getByLabel(/list title/i);
    await input.fill("Second");
    await input.press("Enter");
    await expect(page.getByRole("heading", { name: "Second" })).toBeVisible();

    // The lists should be: [To Do, Second]
    // Drag the move handle of "Second" to before "To Do"
    const secondSection = page.locator("section", {
      has: page.getByRole("heading", { name: "Second" }),
    });
    const todoSection = page.locator("section", {
      has: page.getByRole("heading", { name: "To Do" }),
    });

    const secondHandle = secondSection.getByRole("button", { name: /move list/i });
    const todoHandle = todoSection.getByRole("button", { name: /move list/i });

    const sourceBox = await secondHandle.boundingBox();
    const targetBox = await todoHandle.boundingBox();
    if (!sourceBox || !targetBox) throw new Error("Could not measure drag handles");

    await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2, {
      steps: 10,
    });
    await page.mouse.up();

    // After reorder: [Second, To Do]
    const headings = await page.getByRole("heading", { name: /To Do|Second/ }).allTextContents();
    expect(headings[0]).toBe("Second");
    expect(headings[1]).toBe("To Do");

    // Wait for the server action to persist before reloading
    await page.waitForTimeout(1000);

    // The order must survive a hard reload
    await page.reload();
    await expect(page.getByRole("heading", { name: "Second" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "To Do" })).toBeVisible();
    const headingsAfterReload = await page
      .getByRole("heading", { name: /To Do|Second/ })
      .allTextContents();
    expect(headingsAfterReload[0]).toBe("Second");
    expect(headingsAfterReload[1]).toBe("To Do");
  });
});
