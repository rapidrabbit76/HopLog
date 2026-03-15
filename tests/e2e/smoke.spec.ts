import { expect, test } from "@playwright/test";
import { gotoAndWaitForApp } from "./helpers";

test("home page renders", async ({ page }) => {
  await gotoAndWaitForApp(page, "/");

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("banner")).toBeVisible();
  await expect(page.getByRole("main")).toBeVisible();
  await expect(page.getByRole("heading").first()).toBeVisible();
});

test("about page opens from header", async ({ page }) => {
  await gotoAndWaitForApp(page, "/");

  await page.getByRole("link", { name: /about/i }).click();

  await expect(page).toHaveURL(/\/about$/);
  await expect(page.getByRole("main")).toBeVisible();
  await expect(page.getByRole("heading").first()).toBeVisible();
});
