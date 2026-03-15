import { devices, expect, test } from "@playwright/test";
import { gotoAndWaitForApp } from "./helpers";

test.use({
  viewport: devices["iPhone 13"].viewport,
  userAgent: devices["iPhone 13"].userAgent,
  deviceScaleFactor: devices["iPhone 13"].deviceScaleFactor,
  isMobile: true,
  hasTouch: true,
});

test.skip(({ browserName }) => browserName === "firefox", "Firefox does not support iPhone emulation contexts.");

test("home page works on a mobile viewport", async ({ page }) => {
  await gotoAndWaitForApp(page, "/");

  await expect(page.getByRole("banner")).toBeVisible();
  await expect(page.getByRole("main")).toBeVisible();
  await expect(page.getByRole("heading", { name: /latest posts/i })).toBeVisible();
  await expect(page.locator("select")).toBeVisible();
  await expect(page.locator('article a[href^="/posts/"]')).not.toHaveCount(0);
});

test("category filtering still works on mobile", async ({ page }) => {
  await gotoAndWaitForApp(page, "/");

  await expect.poll(async () => {
    await page.locator("select").selectOption("Design");
    return page.locator('article a[href^="/posts/"]').count();
  }, {
    timeout: 10_000,
    message: "waiting for the client-side category filter to hydrate and replace the post list",
  }).toBe(2);

  await expect(page.getByRole("link", { name: /Themes and Typography/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /테마와 타이포그래피/i })).toBeVisible();
});

test("post content stays usable on mobile", async ({ page }) => {
  await gotoAndWaitForApp(page, "/posts/tutorial/getting-started");

  await expect(page.getByRole("article")).toBeVisible();
  await expect(page.getByRole("heading", { name: /Getting Started with HopLog/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Quick Start with Docker/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /copy code/i }).first()).toBeVisible();
});
