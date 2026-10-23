import { test, expect } from "@playwright/test";

test("cu 15 ghiduri, pagina nu are scroll orizontal", async ({ page }) => {
  await page.goto("/ghiduri");
  await expect(page.locator(".colaj .gc")).toHaveCount(15);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
});
