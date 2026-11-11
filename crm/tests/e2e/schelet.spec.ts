import { expect, test } from "@playwright/test";

test("tema A: fundal grafit, titluri în Inter, fără Chakra Petch", async ({ page }) => {
  const r = await page.goto("/");
  expect(r?.ok()).toBe(true);
  const fundal = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  expect(fundal).toBe("rgb(20, 20, 23)");
  const font = await page.locator("h1").first().evaluate((el) => getComputedStyle(el).fontFamily);
  expect(font).toMatch(/^"?Inter/);
  const chakra = await page.request.get("/fonts/chakra-petch-500-latin.woff2");
  expect(chakra.status()).toBe(404);
  const pete = await page.locator(".perete i").evaluateAll((els) => els.map((e) => getComputedStyle(e).filter));
  expect(pete.length).toBe(3);
  expect(pete.every((f) => f === "none")).toBe(true);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
});
