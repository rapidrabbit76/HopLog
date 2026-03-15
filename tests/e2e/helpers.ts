import { expect, Page } from "@playwright/test";

export async function gotoAndWaitForApp(page: Page, path: string) {
  await page.goto(path);
  await expect(page.locator("html")).toHaveAttribute("data-app-ready", "true");
}
