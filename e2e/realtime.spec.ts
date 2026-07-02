import { test, expect, type Page, type BrowserContext } from "@playwright/test";
import { registerUser, createBoard, cleanupE2EUser, type TestUser } from "./utils";

const TEST_USER: TestUser = {
  email: `e2e-realtime-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@kanban.local`,
  password: "test-password-123",
  name: "E2E Realtime User",
};

const SECONDARY_EMAILS: string[] = [];

async function addCard(page: Page, title: string) {
  await page
    .getByRole("button", { name: /add card/i })
    .first()
    .click();
  const input = page.getByLabel(/card title/i).last();
  await input.fill(title);
  await input.press("Enter");
  await expect(page.getByText(title, { exact: true })).toBeVisible();
}

async function addList(page: Page, title: string) {
  await page.getByRole("button", { name: /add list/i }).click();
  const input = page.getByLabel(/list title/i);
  await input.fill(title);
  await input.press("Enter");
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
}

test.describe("Real-time collaboration", () => {
  test.beforeEach(async ({ page }) => {
    await registerUser(page, TEST_USER);
  });

  test.afterAll(async () => {
    await cleanupE2EUser(TEST_USER.email);
    for (const email of SECONDARY_EMAILS) {
      await cleanupE2EUser(email);
    }
  });

  test("a card created in one tab appears in another tab of the same board", async ({
    browser,
  }) => {
    const ctxA: BrowserContext = await browser.newContext();
    const ctxB: BrowserContext = await browser.newContext();
    try {
      const pageA = await ctxA.newPage();
      const pageB = await ctxB.newPage();

      await registerUser(pageA, TEST_USER);

      const boardId = await createBoard(pageA, "Realtime Test Board");
      const url = `/boards/${boardId}`;

      const bobEmail = `e2e-realtime-bob-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@kanban.local`;
      SECONDARY_EMAILS.push(bobEmail);

      await pageB.goto("/register");
      await pageB.getByLabel(/name/i).fill("Bob");
      await pageB.getByLabel(/email/i).fill(bobEmail);
      await pageB.getByLabel(/password/i).fill("test-password-123");
      await pageB.getByRole("button", { name: /create account/i }).click();
      await pageB.waitForURL("/", { timeout: 15_000 });

      await pageB.goto(url);
      await expect(pageB.getByText("To Do", { exact: true })).toBeVisible();

      await pageA.goto(url);
      await expect(pageA.getByText("To Do", { exact: true })).toBeVisible();

      await addCard(pageA, "Live update card");

      await expect(pageB.getByText("Live update card", { exact: true })).toBeVisible({
        timeout: 10_000,
      });
    } finally {
      await ctxA.close();
      await ctxB.close();
    }
  });

  test("a list reorder in one tab appears in another tab of the same board", async ({
    browser,
  }) => {
    const ctxA: BrowserContext = await browser.newContext();
    const ctxB: BrowserContext = await browser.newContext();
    try {
      const pageA = await ctxA.newPage();
      const pageB = await ctxB.newPage();

      await registerUser(pageA, TEST_USER);

      const boardId = await createBoard(pageA, "Realtime List Reorder Board");
      const url = `/boards/${boardId}`;

      const bobEmail = `e2e-realtime-bob-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@kanban.local`;
      SECONDARY_EMAILS.push(bobEmail);

      await pageB.goto("/register");
      await pageB.getByLabel(/name/i).fill("Bob");
      await pageB.getByLabel(/email/i).fill(bobEmail);
      await pageB.getByLabel(/password/i).fill("test-password-123");
      await pageB.getByRole("button", { name: /create account/i }).click();
      await pageB.waitForURL("/", { timeout: 15_000 });

      await pageB.goto(url);
      await expect(pageB.getByText("To Do", { exact: true })).toBeVisible();

      await pageA.goto(url);
      await expect(pageA.getByText("To Do", { exact: true })).toBeVisible();

      await addList(pageA, "Second");
      await expect(pageB.getByRole("heading", { name: "Second" })).toBeVisible({
        timeout: 10_000,
      });

      const secondSection = pageA.locator("section", {
        has: pageA.getByRole("heading", { name: "Second" }),
      });
      const todoSection = pageA.locator("section", {
        has: pageA.getByRole("heading", { name: "To Do" }),
      });
      const secondHandle = secondSection.getByRole("button", { name: /move list/i });
      const todoHandle = todoSection.getByRole("button", { name: /move list/i });

      const sourceBox = await secondHandle.boundingBox();
      const targetBox = await todoHandle.boundingBox();
      if (!sourceBox || !targetBox) throw new Error("Could not measure drag handles");

      await pageA.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2);
      await pageA.mouse.down();
      await pageA.mouse.move(
        targetBox.x + targetBox.width / 2,
        targetBox.y + targetBox.height / 2,
        { steps: 10 },
      );
      await pageA.mouse.up();

      // Wait for the server action to persist and the socket event to propagate
      await pageA.waitForTimeout(1000);

      await expect(pageB.getByRole("heading", { name: "Second" })).toBeVisible({
        timeout: 10_000,
      });

      const headingsB = await pageB
        .getByRole("heading", { name: /To Do|Second/ })
        .allTextContents();
      expect(headingsB[0]).toBe("Second");
      expect(headingsB[1]).toBe("To Do");
    } finally {
      await ctxA.close();
      await ctxB.close();
    }
  });
});
