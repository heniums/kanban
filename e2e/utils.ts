import { type Page } from "@playwright/test";
import pg from "pg";

export interface TestUser {
  email: string;
  password: string;
  name: string;
}

export async function registerUser(page: Page, user: TestUser) {
  await page.goto("/register");
  await page.getByLabel(/name/i).fill(user.name);
  await page.getByLabel(/email/i).fill(user.email);
  await page.getByLabel(/password/i).fill(user.password);
  await page.getByRole("button", { name: /create account/i }).click();
  await page.waitForURL("/", { timeout: 30_000 });
}

export async function createBoard(page: Page, title: string): Promise<string> {
  await page.goto("/boards/new");
  await page.getByLabel(/title/i).fill(title);
  await page.getByRole("button", { name: /create board/i }).click();
  await page.waitForURL(/\/boards\/[a-f0-9-]+$/, { timeout: 30_000 });
  const url = page.url();
  const match = url.match(/\/boards\/([a-f0-9-]+)$/);
  if (!match) throw new Error(`Could not parse boardId from URL: ${url}`);
  return match[1];
}

export async function cleanupE2EUser(email: string): Promise<void> {
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
  });
  const client = await pool.connect();
  try {
    const { rows } = await client.query<{ id: string }>("SELECT id FROM users WHERE email = $1", [
      email,
    ]);
    for (const row of rows) {
      await client.query("DELETE FROM boards WHERE owner_id = $1", [row.id]);
      await client.query("DELETE FROM users WHERE id = $1", [row.id]);
    }
  } finally {
    client.release();
    await pool.end();
  }
}
