import { test, expect } from "@playwright/test";
import { registerUser, createBoard, cleanupE2EUser, type TestUser } from "./utils";

const TEST_USER: TestUser = {
  email: `e2e-labels-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@kanban.local`,
  password: "test-password-123",
  name: "E2E Labels User",
};

test.describe("Label management", () => {
  test.beforeEach(async ({ page }) => {
    await registerUser(page, TEST_USER);
  });

  test.afterAll(async () => {
    await cleanupE2EUser(TEST_USER.email);
  });

  test("can assign and unassign labels to a card", async ({ page }) => {
    await createBoard(page, "Label Test Board");

    // Open the first card (created by seed data or add a card)
    const cardTitle = page.locator('[data-testid="card-title"]').first();
    if (await cardTitle.isVisible().catch(() => false)) {
      await cardTitle.click();
    } else {
      // If no cards, quickly add one
      await page.getByRole("button", { name: /add list/i }).click();
      const listInput = page.getByLabel(/list title/i);
      await listInput.fill("Test List");
      await listInput.press("Enter");
      await page
        .getByRole("button", { name: /add card/i })
        .first()
        .click();
      const cardInput = page.getByLabel(/card title/i);
      await cardInput.fill("Test Card");
      await cardInput.press("Enter");
      await page.locator('[data-testid="card-title"]').first().click();
    }

    // Open the label picker
    await page.getByRole("button", { name: /add or create label/i }).click();

    // Create a new label inside the popover
    await page.getByText("Create new label").click();
    await page.getByPlaceholder("Label name").fill("Urgent");
    await page.getByRole("button", { name: /create/i, exact: true }).click();

    // The label should now appear as an attached chip
    await expect(
      page.locator('[data-testid="attached-label"]').filter({ hasText: "Urgent" }),
    ).toBeVisible();

    // Remove the label
    await page
      .locator('[data-testid="attached-label"]')
      .filter({ hasText: "Urgent" })
      .getByRole("button", { name: /remove urgent/i })
      .click();

    // Label should be gone from attached chips
    await expect(
      page.locator('[data-testid="attached-label"]').filter({ hasText: "Urgent" }),
    ).not.toBeVisible();
  });

  test("can edit a label name and color", async ({ page }) => {
    await createBoard(page, "Edit Label Board");

    // Open a card
    const cardTitle = page.locator('[data-testid="card-title"]').first();
    if (!(await cardTitle.isVisible().catch(() => false))) {
      await page.getByRole("button", { name: /add list/i }).click();
      const listInput = page.getByLabel(/list title/i);
      await listInput.fill("Test List");
      await listInput.press("Enter");
      await page
        .getByRole("button", { name: /add card/i })
        .first()
        .click();
      const cardInput = page.getByLabel(/card title/i);
      await cardInput.fill("Edit Test Card");
      await cardInput.press("Enter");
      await page.locator('[data-testid="card-title"]').first().click();
    } else {
      await cardTitle.click();
    }

    // Create a label first
    await page.getByRole("button", { name: /add or create label/i }).click();
    await page.getByText("Create new label").click();
    await page.getByPlaceholder("Label name").fill("OldName");
    await page.getByRole("button", { name: /create/i, exact: true }).click();

    // Reopen the popover to see the available label
    await page.getByRole("button", { name: /add or create label/i }).click();

    // Click the edit pencil icon on the label
    await page.getByRole("button", { name: /edit oldname/i }).click();

    // Edit the name
    const editNameInput = page.getByPlaceholder("Label name");
    await editNameInput.fill("NewName");

    // Click save
    await page.getByRole("button", { name: /save/i }).click();

    // Verify the label name changed in the list
    await expect(page.getByText("NewName").first()).toBeVisible();
  });

  test("can delete a label with confirmation", async ({ page }) => {
    await createBoard(page, "Delete Label Board");

    // Open a card
    const cardTitle = page.locator('[data-testid="card-title"]').first();
    if (!(await cardTitle.isVisible().catch(() => false))) {
      await page.getByRole("button", { name: /add list/i }).click();
      const listInput = page.getByLabel(/list title/i);
      await listInput.fill("Test List");
      await listInput.press("Enter");
      await page
        .getByRole("button", { name: /add card/i })
        .first()
        .click();
      const cardInput = page.getByLabel(/card title/i);
      await cardInput.fill("Delete Test Card");
      await cardInput.press("Enter");
      await page.locator('[data-testid="card-title"]').first().click();
    } else {
      await cardTitle.click();
    }

    // Create a label first
    await page.getByRole("button", { name: /add or create label/i }).click();
    await page.getByText("Create new label").click();
    await page.getByPlaceholder("Label name").fill("ToDelete");
    await page.getByRole("button", { name: /create/i, exact: true }).click();

    // Reopen the popover
    await page.getByRole("button", { name: /add or create label/i }).click();

    // Click the edit pencil on the label to open edit mode
    await page.getByRole("button", { name: /edit todelete/i }).click();

    // Click the delete (trash) button
    await page
      .getByRole("button")
      .filter({ has: page.locator(".lucide-trash2") })
      .first()
      .click();

    // Confirm deletion in the alert dialog
    await page
      .getByRole("button", { name: /delete/i })
      .filter({ hasText: "Delete" })
      .last()
      .click();

    // Wait for the dialog to close and the label list to update
    await page.waitForTimeout(500);

    // Reopen the popover to check
    await page.getByRole("button", { name: /add or create label/i }).click();

    // Verify the deleted label is gone
    await expect(page.getByText("ToDelete")).not.toBeVisible();
  });

  test("can search/filter labels in the card detail sidebar", async ({ page }) => {
    await createBoard(page, "Search Label Board");

    // Open a card
    const cardTitle = page.locator('[data-testid="card-title"]').first();
    if (!(await cardTitle.isVisible().catch(() => false))) {
      await page.getByRole("button", { name: /add list/i }).click();
      const listInput = page.getByLabel(/list title/i);
      await listInput.fill("Test List");
      await listInput.press("Enter");
      await page
        .getByRole("button", { name: /add card/i })
        .first()
        .click();
      const cardInput = page.getByLabel(/card title/i);
      await cardInput.fill("Search Test Card");
      await cardInput.press("Enter");
      await page.locator('[data-testid="card-title"]').first().click();
    } else {
      await cardTitle.click();
    }

    // Create two labels
    await page.getByRole("button", { name: /add or create label/i }).click();

    await page.getByText("Create new label").click();
    await page.getByPlaceholder("Label name").fill("Alpha");
    await page.getByRole("button", { name: /create/i, exact: true }).click();

    // The popover may have closed, reopen it
    await page.getByRole("button", { name: /add or create label/i }).click();
    await page.getByText("Create new label").click();
    await page.getByPlaceholder("Label name").fill("Beta");
    await page.getByRole("button", { name: /create/i, exact: true }).click();

    // Reopen the popover to see available labels
    await page.getByRole("button", { name: /add or create label/i }).click();

    // Search for Alpha
    const searchInput = page.getByRole("textbox", { name: /search labels/i });
    await searchInput.fill("Alpha");

    // Only Alpha should be visible
    await expect(page.getByText("Alpha").first()).toBeVisible();
    await expect(page.getByText("Beta")).not.toBeVisible();

    // Search for something non-existent
    await searchInput.fill("Zeta");
    await expect(page.getByText("No matching labels")).toBeVisible();
  });
});
