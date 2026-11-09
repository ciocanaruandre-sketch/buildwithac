import { expect, test } from "@playwright/test";
import { intraCa } from "./ajutor";
import { leadNou, stergeLead } from "./date";

test("callerul vede numărătoarea și lead-urile din seed", async ({ page }) => {
  await intraCa(page, "caller");
  await expect(page.getByRole("link", { name: /Nou \d+/ })).toBeVisible();
  await expect(page.getByRole("link", { name: "Elena Marin · Cafeneaua Boabe" })).toBeVisible();
});

test("căutarea după telefon scris pe jumătate găsește lead-ul", async ({ page }) => {
  await intraCa(page, "caller");
  await page.getByPlaceholder("Nume, telefon sau e-mail").fill("0700 000 001");
  await page.getByPlaceholder("Nume, telefon sau e-mail").press("Enter");
  await expect(page).toHaveURL(/q=0700/);
  await expect(page.getByRole("link", { name: "Elena Marin · Cafeneaua Boabe" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Cristian Popa · Salon Aura" })).toHaveCount(0);
});

test("„Îmi iau lead-ul” îl mută în „Ale mele”", async ({ page }) => {
  const l = await leadNou();
  try {
    await intraCa(page, "caller");
    const rand = page.getByRole("row", { name: new RegExp(l.nume) });
    await rand.getByRole("button", { name: "Îmi iau lead-ul" }).click();
    await expect(rand.getByRole("button", { name: "Îmi iau lead-ul" })).toHaveCount(0);
    await page.getByRole("link", { name: "Ale mele" }).click();
    await expect(page.getByRole("link", { name: l.nume })).toBeVisible();
  } finally {
    await stergeLead(l.id);
  }
});

test("WhatsApp și telefonul sunt linkuri directe", async ({ page }) => {
  await intraCa(page, "caller");
  const rand = page.getByRole("row", { name: /Elena Marin/ });
  await expect(rand.getByRole("link", { name: "WhatsApp" })).toHaveAttribute("href", /^https:\/\/wa\.me\/40700/);
  await expect(rand.getByRole("link", { name: "Sună" })).toHaveAttribute("href", /^tel:\+40700/);
});

test("la 390px pagina nu are scroll orizontal", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await intraCa(page, "caller");
  const lat = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(lat).toBeLessThanOrEqual(390);
});
