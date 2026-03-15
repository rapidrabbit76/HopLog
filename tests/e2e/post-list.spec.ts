import { expect, test } from "@playwright/test";
import { gotoAndWaitForApp } from "./helpers";

test("home page shows all published posts", async ({ page }) => {
  await gotoAndWaitForApp(page, "/");

  await expect(page.getByRole("heading", { name: /latest posts/i })).toBeVisible();
  const postLinks = page.locator('article a[href^="/posts/"]');
  await expect(postLinks).not.toHaveCount(0);
  const count = await postLinks.count();
  expect(count).toBeGreaterThanOrEqual(5);
});

test("category filter narrows the visible post list", async ({ page }) => {
  await gotoAndWaitForApp(page, "/");

  await page.locator("select").selectOption("Config");

  const configPosts = page.locator('article a[href^="/posts/"]');
  await expect(configPosts).not.toHaveCount(0);
  await expect(page.getByRole("link", { name: /Site Configuration/i }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: /Getting Started with HopLog/i })).toHaveCount(0);
});

test("category filter supports categories with multiple posts", async ({ page }) => {
  await gotoAndWaitForApp(page, "/");

  await page.locator("select").selectOption("Design");

  await expect(page.locator('article a[href^="/posts/"]')).toHaveCount(2);
  await expect(page.getByRole("link", { name: /Themes and Typography/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /테마와 타이포그래피/i })).toBeVisible();
});
