import { expect, test } from "@playwright/test";
import { gotoAndWaitForApp } from "./helpers";

const paletteShortcut = process.platform === "darwin" ? "Meta+Shift+P" : "Control+Shift+P";

test("theme toggle persists after reload", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await gotoAndWaitForApp(page, "/");

  const html = page.locator("html");

  await page.getByRole("button", { name: /toggle theme/i }).click();
  await expect(html).toHaveClass(/dark/);

  await page.reload();
  await expect(html).toHaveClass(/dark/);
});

test("locale selection persists after reload", async ({ page }) => {
  await gotoAndWaitForApp(page, "/");

  await page.getByRole("button", { name: /language menu/i }).click();
  await page.getByRole("button", { name: /한국어/i }).click();

  await expect(page.locator("html")).toHaveAttribute("lang", "ko");

  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", "ko");
});

test("wide mode toggle persists after reload", async ({ page }) => {
  await gotoAndWaitForApp(page, "/");

  const html = page.locator("html");

  await page.getByRole("button", { name: /toggle wide mode/i }).click();
  await expect(html).toHaveAttribute("data-wide", "false");

  await page.reload();
  await expect(html).toHaveAttribute("data-wide", "false");
});

test("command palette opens via header search button", async ({ page }) => {
  await gotoAndWaitForApp(page, "/");

  await page.getByRole("button", { name: /command palette/i }).click();

  const input = page.getByPlaceholder(/search commands or posts/i).last();
  await expect(input).toBeVisible();
});

test("command palette closes on outside click", async ({ page }) => {
  await gotoAndWaitForApp(page, "/");

  await page.getByRole("button", { name: /command palette/i }).click();

  const input = page.getByPlaceholder(/search commands or posts/i).last();
  await expect(input).toBeVisible();

  await page.mouse.click(10, 10);

  await expect(input).not.toBeVisible();
});

test("command palette can open and navigate to a post", async ({ page }) => {
  await gotoAndWaitForApp(page, "/");

  await page.keyboard.press(paletteShortcut);

  const input = page.getByPlaceholder(/search commands or posts/i).last();
  await expect(input).toBeVisible();

  await input.fill("site configuration");

  const resultItem = page.locator("[cmdk-item]", { hasText: /Site Configuration/i });
  await expect(resultItem).toBeVisible();
  await expect(resultItem).toHaveAttribute("aria-selected", "true");
  await page.keyboard.press("Enter");

  await expect(page).toHaveURL(/\/posts\/tutorial\/site-configuration$/);
  await expect(page.getByRole("heading", { name: /Site Configuration/i }).first()).toBeVisible();
});
