import { test, expect } from "@playwright/test";

test("homepage răspunde, e în română, fără erori și fără scroll orizontal", async ({ page }) => {
  const erori: string[] = [];
  page.on("console", (m) => m.type() === "error" && erori.push(m.text()));
  page.on("pageerror", (e) => erori.push(e.message));
  const raspuns = await page.goto("/");
  expect(raspuns?.status()).toBe(200);
  await expect(page.locator("html")).toHaveAttribute("lang", "ro");
  const latime = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(latime).toBeLessThanOrEqual(0);
  const font = await page.evaluate(() => getComputedStyle(document.body).fontFamily);
  expect(font).toMatch(/Inter/);
  expect(erori).toEqual([]);
});
