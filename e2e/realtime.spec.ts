import { test, expect, type Page, type BrowserContext } from "@playwright/test";

const TEST_USER = {
  email: `e2e-realtime-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@kanban.local`,
  password: "test-password-123",
  name: "E2E Realtime User",
};

async function registerUser(page: Page) {
  await page.goto("/register");
  await page.getByLabel(/name/i).fill(TEST_USER.name);
  await page.getByLabel(/email/i).fill(TEST_USER.email);
  await page.getByLabel(/password/i).fill(TEST_USER.password);
  await page.getByRole("button", { name: /create account/i }).click();
  await page.waitForURL("/", { timeout: 30_000 });
}

async function createBoard(page: Page, title: string): Promise<string> {
  await page.goto("/boards/new");
  await page.getByLabel(/title/i).fill(title);
  await page.getByRole("button", { name: /create board/i }).click();
  await page.waitForURL(/\/boards\/[a-f0-9-]+$/, { timeout: 30_000 });
  const url = page.url();
  const match = url.match(/\/boards\/([a-f0-9-]+)$/);
  if (!match) throw new Error(`Could not parse boardId from URL: ${url}`);
  return match[1];
}

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
    await registerUser(page);
  });

  test("a card created in one tab appears in another tab of the same board", async ({
    browser,
  }) => {
    const ctxA: BrowserContext = await browser.newContext();
    const ctxB: BrowserContext = await browser.newContext();
    try {
      const pageA = await ctxA.newPage();
      const pageB = await ctxB.newPage();

      await registerUser(pageA);

      const boardId = await createBoard(pageA, "Realtime Test Board");
      const url = `/boards/${boardId}`;

      await pageB.goto("/register");
      await pageB.getByLabel(/name/i).fill("Bob");
      await pageB
        .getByLabel(/email/i)
        .fill(
          `e2e-realtime-bob-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@kanban.local`,
        );
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

      await registerUser(pageA);

      const boardId = await createBoard(pageA, "Realtime List Reorder Board");
      const url = `/boards/${boardId}`;

      await pageB.goto("/register");
      await pageB.getByLabel(/name/i).fill("Bob");
      await pageB
        .getByLabel(/email/i)
        .fill(
          `e2e-realtime-bob-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@kanban.local`,
        );
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
