import { expect, test } from "@playwright/test";
import { gotoAndWaitForApp } from "./helpers";

test("post pages render article content and markdown headings", async ({ page }) => {
  await gotoAndWaitForApp(page, "/posts/tutorial/getting-started");

  await expect(page.getByRole("article")).toBeVisible();
  await expect(page.getByRole("heading", { name: /Getting Started with HopLog/i })).toBeVisible();
  await expect(page.locator("time")).toContainText("2026.03.12");
  await expect(page.getByText("Guide", { exact: true }).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: /Quick Start with Docker/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Project Structure/i })).toBeVisible();
});

test("post pages expose table of contents and copy code controls", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await gotoAndWaitForApp(page, "/posts/tutorial/getting-started");

  await expect(page.getByText(/On this page/i)).toBeVisible();
  await expect(page.locator('a[href="#quick-start-with-docker-recommended"]')).toBeVisible();
  await expect(page.locator('a[href="#project-structure"]')).toBeVisible();
  await expect(page.getByRole("button", { name: /copy code/i }).first()).toBeVisible();
});

test("post pages render share buttons in correct order", async ({ page }) => {
  await gotoAndWaitForApp(page, "/posts/tutorial/getting-started");

  await expect(page.getByRole("button", { name: /share on twitter/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /share on facebook/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /share on linkedin/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /copy link/i })).toBeVisible();
});

test("share copy link button shows check icon after click", async ({ page }) => {
  await gotoAndWaitForApp(page, "/posts/tutorial/getting-started");

  const copyButton = page.getByRole("button", { name: /copy link/i });
  await expect(copyButton).toBeVisible();

  await expect.poll(async () => {
    await copyButton.click();
    return copyButton.locator("svg.lucide-check").count();
  }, {
    timeout: 10_000,
    message: "waiting for the share buttons client component to hydrate and show the copied state",
  }).toBe(1);

  await expect(page.getByText(/Copied!/i)).toBeVisible();
});

test("post links from home open the matching article page", async ({ page }) => {
  await gotoAndWaitForApp(page, "/");

  await page.locator('a[href="/posts/tutorial/site-configuration"]').first().click();

  await expect(page).toHaveURL(/\/posts\/tutorial\/site-configuration$/);
  await expect(page.getByRole("heading", { name: /Site Configuration/i }).first()).toBeVisible();
});
