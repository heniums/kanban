import { test, expect } from "@playwright/test";
import { registerUser, createBoard, cleanupE2EUser, type TestUser } from "./utils";

const TEST_USER: TestUser = {
  email: `e2e-hero-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@kanban.local`,
  password: "test-password-123",
  name: "E2E Hero User",
};

test.describe("Board hero section", () => {
  test.beforeEach(async ({ page }) => {
    await registerUser(page, TEST_USER);
  });

  test.afterAll(async () => {
    await cleanupE2EUser(TEST_USER.email);
  });

  test("board detail page shows the board background in a top hero, not a full-page background", async ({
    page,
  }) => {
    await createBoard(page, "Hero Test Board");

    // The hero is a region landmark with an aria-label including the title
    const hero = page.getByRole("region", { name: /hero test board board header/i });
    await expect(hero).toBeVisible();

    // The hero should be the first visible content (no large page-level colored wrapper)
    const heroBox = await hero.boundingBox();
    expect(heroBox).not.toBeNull();
    // The hero should be near the top of the viewport
    expect(heroBox!.y).toBeLessThan(200);

    // The hero should not fill the entire viewport height (so the page wrapper is not the hero)
    const viewport = page.viewportSize();
    expect(heroBox!.height).toBeLessThan(viewport!.height * 0.6);
  });

  test("board detail page shows the 'All boards' breadcrumb inside the hero", async ({ page }) => {
    await createBoard(page, "Breadcrumb Board");

    const breadcrumb = page.getByRole("link", { name: /all boards/i });
    await expect(breadcrumb).toBeVisible();

    // The breadcrumb should be inside the hero region
    const hero = page.getByRole("region", { name: /breadcrumb board board header/i });
    await expect(hero).toContainText(/all boards/i);
  });

  test("board detail page renders board title, settings, and delete inside the hero", async ({
    page,
  }) => {
    await createBoard(page, "Actions Board");

    const hero = page.getByRole("region", { name: /actions board board header/i });
    await expect(hero).toBeVisible();
    await expect(hero.getByRole("heading", { name: /actions board/i })).toBeVisible();
    await expect(hero.getByRole("button", { name: /settings/i })).toBeVisible();
    await expect(hero.getByRole("button", { name: /^delete$/i })).toBeVisible();
  });

  test("board detail page renders the board lists below the hero, outside the colored region", async ({
    page,
  }) => {
    await createBoard(page, "Lists Below Board");

    const hero = page.getByRole("region", { name: /lists below board board header/i });
    const lists = page.getByTestId("board-lists");

    const heroBox = await hero.boundingBox();
    const listsBox = await lists.boundingBox();
    expect(heroBox).not.toBeNull();
    expect(listsBox).not.toBeNull();
    // Lists start below the hero
    expect(listsBox!.y).toBeGreaterThanOrEqual(heroBox!.y + heroBox!.height - 1);
  });

  test("dashboard board cards render the board background in a compact hero", async ({ page }) => {
    await createBoard(page, "Card Hero Board");

    await page.goto("/");
    // The dashboard should show a region landmark per board card
    const card = page.getByRole("region", { name: /card hero board board header/i });
    await expect(card).toBeVisible();
  });
});
