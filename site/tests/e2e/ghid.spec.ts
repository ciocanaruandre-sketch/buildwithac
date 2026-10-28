import { test, expect } from "@playwright/test";
import { SITE } from "../../lib/config";

const URL = "/ghiduri/exemplu-test";
const N = 5;

test("antetul are titlul, data și cuprinsul cu câte o intrare pe pas", async ({ page }) => {
  await page.goto(URL);
  await expect(page.locator("h1")).toHaveText("Ghid de test");
  await expect(page.locator(".k-head")).toContainText("Actualizat la 21 octombrie 2026");
  const cuprins = page.locator(".k-toc a");
  await expect(cuprins).toHaveCount(N);
  for (let i = 1; i <= N; i++) await expect(cuprins.nth(i - 1)).toHaveAttribute("href", `#pas-${i}`);
  await expect(page.locator(".k-sheet")).toHaveCount(N);
  await expect(page.locator("#pas-1")).toBeVisible();
});

test("bifarea pasului 1 arată 1/N și rămâne după reload", async ({ page }) => {
  await page.goto(URL);
  await expect(page.locator(".k-count b")).toHaveText(`0/${N}`);
  await page.locator("#pas-1").getByRole("button", { name: /Am făcut pasul/ }).click();
  await expect(page.locator(".k-count b")).toHaveText(`1/${N}`);
  await expect(page.locator("#pas-1")).toHaveClass(/done/);
  await page.reload();
  await expect(page.locator(".k-count b")).toHaveText(`1/${N}`);
});

test.describe("fără localStorage", () => {
  test("bifarea merge în sesiune, fără erori", async ({ page }) => {
    await page.addInitScript(() => {
      Storage.prototype.setItem = () => { throw new Error("blocat"); };
      Storage.prototype.getItem = () => { throw new Error("blocat"); };
    });
    const erori: string[] = [];
    page.on("pageerror", (e) => erori.push(e.message));
    await page.goto(URL);
    await page.locator("#pas-1").getByRole("button", { name: /Am făcut pasul/ }).click();
    await expect(page.locator(".k-count b")).toHaveText(`1/${N}`);
    expect(erori).toEqual([]);
  });
});

test("Copiază pune promptul în clipboard", async ({ page, context, browserName }) => {
  test.skip(browserName !== "chromium", "permisiunile de clipboard există doar în Chromium");
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto(URL);
  const prompt = page.locator(".prompt").first();
  await prompt.getByRole("button", { name: "Copiază" }).click();
  await expect(prompt.getByRole("button")).toHaveText("Copiat ✓");
  const text = await page.evaluate(() => navigator.clipboard.readText());
  expect(text).toContain("Instalează skill-ul UI UX Pro Max");
});

test("caseta PDF are cuvântul ghidului și duce pe Instagram", async ({ page }) => {
  await page.goto(URL);
  const caseta = page.locator("#pdf");
  await expect(caseta).toContainText("TEST");
  await caseta.getByRole("button", { name: /Primește-l pe Instagram/ }).click();
  const fereastra = page.getByRole("dialog");
  await expect(fereastra).toContainText("TEST");
  await expect(fereastra.getByRole("link", { name: /Deschide Instagram/ })).toHaveAttribute("href", SITE.instagram.url);
  await page.keyboard.press("Escape");
  await expect(fereastra).toBeHidden();
});

test("finalul are ghidul următor și link spre toate ghidurile", async ({ page }) => {
  await page.goto(URL);
  const final = page.locator(".end");
  await expect(final.getByRole("link", { name: /Animații video cu Claude/ })).toHaveAttribute("href", "/ghiduri/animatii-video-cu-claude");
  await expect(final.getByRole("link", { name: /Toate ghidurile/ })).toHaveAttribute("href", "/ghiduri");
  await expect(final.getByPlaceholder("adresa ta de e-mail")).toBeVisible();
});

test("componentele ghidului apar", async ({ page }) => {
  await page.goto(URL);
  await expect(page.locator(".mistake")).toContainText("greșeala mea");
  await expect(page.locator(".atentie")).toContainText("atenție");
  await expect(page.locator(".daca-nu")).toContainText("dacă nu merge");
  await expect(page.locator(".shot img").first()).toBeVisible();
  await expect(page.locator(".need")).toContainText("Cont Claude Pro");
});

test("formularul de abonare din ghid are stilurile comune, deschis direct", async ({ page }) => {
  await page.goto(URL);
  const card = page.locator(".abonare-card");
  const stil = await card.evaluate((el) => {
    const mesaj = el.querySelector(".mesaj")!, input = el.querySelector("input")!;
    return { minMesaj: getComputedStyle(mesaj).minHeight, litera: parseFloat(getComputedStyle(input).fontSize) };
  });
  expect(stil.minMesaj).not.toBe("0px");
  // sub 16px, Safari pe iPhone mărește pagina când apeși în câmp
  expect(stil.litera).toBeGreaterThanOrEqual(16);
});
