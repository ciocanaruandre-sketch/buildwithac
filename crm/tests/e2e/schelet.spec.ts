import { expect, test } from "@playwright/test";

test("tema din prototip: fundal grafit, titluri în Chakra Petch", async ({ page }) => {
  const r = await page.goto("/");
  expect(r?.ok()).toBe(true);
  const fundal = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  expect(fundal).toBe("rgb(20, 20, 23)");
  const font = await page.locator("h1").first().evaluate((el) => getComputedStyle(el).fontFamily);
  expect(font).toMatch(/^"?Chakra Petch/);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
});
