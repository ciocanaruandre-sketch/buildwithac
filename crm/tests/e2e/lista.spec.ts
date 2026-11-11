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
  await page.getByRole("searchbox", { name: "Caută lead-uri" }).fill("0700 000 001");
  await page.getByRole("searchbox", { name: "Caută lead-uri" }).press("Enter");
  await expect(page).toHaveURL(/q=0700/);
  await expect(page.getByRole("link", { name: "Elena Marin · Cafeneaua Boabe" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Cristian Popa · Salon Aura" })).toHaveCount(0);
});

test("pe listă e o singură căutare, iar cea de sus păstrează filtrele alese", async ({ page }) => {
  await intraCa(page, "caller");
  await expect(page.getByPlaceholder("Nume, telefon sau e-mail")).toHaveCount(0);
  await page.goto("/lead-uri?stare=client");
  const caseta = page.getByRole("searchbox", { name: "Caută lead-uri" });
  await caseta.fill("laura");
  await caseta.press("Enter");
  await expect(page).toHaveURL(/stare=client/);
  await expect(page).toHaveURL(/q=laura/);
  await expect(page.getByRole("link", { name: "Laura Ene · Atelier Ceramică" })).toBeVisible();
  await expect(page.getByRole("searchbox", { name: "Caută lead-uri" })).toHaveValue("laura");
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
