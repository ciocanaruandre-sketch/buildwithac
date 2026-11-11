import { expect, test } from "@playwright/test";
import { intraCa } from "./ajutor";

test("pe laptop, bara laterală arată legătura activă", async ({ page }) => {
  await intraCa(page, "admin");
  await page.goto("/clienti");
  const nav = page.getByRole("navigation", { name: "Navigare" }).filter({ visible: true });
  await expect(nav.getByRole("link", { name: "Clienți" })).toHaveAttribute("aria-current", "page");
});

test("pe telefon, legăturile sunt jos și nu acoperă pagina", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await intraCa(page, "admin");
  const jos = page.getByRole("navigation", { name: "Navigare" }).filter({ visible: true });
  const cutie = (await jos.boundingBox())!;
  expect(cutie.y + cutie.height).toBeGreaterThan(844 - 40);
  await jos.getByRole("link", { name: "Echipa" }).click();
  await expect(page).toHaveURL(/\/echipa/);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  const ultim = await page.locator("main > *").last().boundingBox();
  expect(ultim!.y + ultim!.height).toBeLessThanOrEqual(cutie.y + 1);
});
