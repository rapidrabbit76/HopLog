import { expect, test } from "@playwright/test";
import { gotoAndWaitForApp } from "./helpers";

test("home navigation reaches about and faq", async ({ page }) => {
  await gotoAndWaitForApp(page, "/");

  await page.getByRole("banner").getByRole("link", { name: /about/i }).click();
  await expect(page).toHaveURL(/\/about$/);
  await expect(page.getByRole("heading").first()).toBeVisible();
  await expect(page.getByRole("link", { name: /email/i })).toBeVisible();

  await page.getByRole("link", { name: /faq/i }).click();
  await expect(page).toHaveURL(/\/faq$/);
  await expect(page.getByRole("heading", { name: "FAQ" })).toBeVisible();
});

test("faq entries can be expanded", async ({ page }) => {
  await gotoAndWaitForApp(page, "/faq");

  const item = page.locator("details").filter({ hasText: "How do I create a new post?" });
  await item.locator("summary").click();

  await expect(item).toHaveAttribute("open", "");
  await expect(item.getByText(/Create a markdown file anywhere under content\/posts\//)).toBeVisible();
});

test("unknown routes show the not found page", async ({ page }) => {
  await gotoAndWaitForApp(page, "/this-route-does-not-exist");

  await expect(page.getByRole("heading", { name: /page not found/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /back home/i })).toBeVisible();
});
