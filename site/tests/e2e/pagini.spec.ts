import { test, expect } from "@playwright/test";
import { SITE } from "../../lib/config";

test("confidențialitate: operatorul, e-mailul de contact și ANSPDCP", async ({ page }) => {
  const r = await page.goto("/confidentialitate");
  expect(r?.status()).toBe(200);
  const main = page.locator("main");
  await expect(main).toContainText(SITE.operatorDate.nume);
  await expect(main).toContainText(SITE.operatorDate.email);
  await expect(main).toContainText("ANSPDCP");
  await expect(main).toContainText("Kit");
});

test("un ghid inexistent dă 404 cu link spre toate ghidurile", async ({ page }) => {
  const r = await page.goto("/ghiduri/ceva-gresit");
  expect(r?.status()).toBe(404);
  await expect(page.locator("main").getByRole("link", { name: /Toate ghidurile/ })).toHaveAttribute("href", "/ghiduri");
});

test("lupa de pe 404 trimite la /ghiduri?q=…", async ({ page }) => {
  await page.goto("/nu-exista");
  await expect(page.locator("h1")).toHaveText("Pagina asta nu există.");
  const lupa = page.getByRole("searchbox");
  await lupa.fill("animatii");
  await lupa.press("Enter");
  await expect(page).toHaveURL(/\/ghiduri\?q=animatii$/);
  await expect(page.locator(".colaj .gc")).toHaveCount(1);
});
