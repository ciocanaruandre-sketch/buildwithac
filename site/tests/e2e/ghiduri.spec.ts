import { test, expect } from "@playwright/test";
import { SITE } from "../../lib/config";
import { ghidulNou, toateGhidurile } from "../../lib/ghiduri";

// cel mai nou ghid se schimbă la fiecare publicare: îl luăm din conținut, nu-l scriem de mână
const NOU = ghidulNou()!;

test("fără căutare, primul card e cel mai nou, cu „ghid nou!”", async ({ page }) => {
  await page.goto("/ghiduri");
  const primul = page.locator(".colaj .gc").first();
  await expect(primul).toContainText(NOU.titlu);
  await expect(primul.locator(".sticker")).toHaveText("ghidnou!");
  await expect(page.locator(".colaj .gc")).toHaveCount(toateGhidurile().length);
});

test("?q=site arată ghidul din clip, marcat", async ({ page }) => {
  await page.goto("/ghiduri?q=site");
  await expect(page.getByRole("searchbox")).toHaveValue("site");
  const primul = page.locator(".colaj .gc").first();
  await expect(primul).toContainText("Site-uri care nu arată");
  await expect(primul).toContainText("ăsta e ghidul din clip ✓");
});

test("căutarea fără diacritice găsește ghidul și actualizează adresa", async ({ page }) => {
  await page.goto("/ghiduri");
  await page.getByRole("searchbox").fill("animatii");
  await expect(page.locator(".colaj .gc")).toHaveCount(1);
  await expect(page.locator(".colaj .gc")).toContainText("Animații video cu Claude");
  await expect(page).toHaveURL(/\?q=animatii/);
});

test("scurtătura TRADING filtrează lista", async ({ page }) => {
  await page.goto("/ghiduri");
  await page.locator(".quick").getByRole("button", { name: "TRADING" }).click();
  await expect(page.locator(".colaj .gc")).toHaveCount(1);
  await expect(page.locator(".colaj .gc")).toContainText("TradingView");
});

test("fără rezultat: mesaj și link spre Instagram", async ({ page }) => {
  await page.goto("/ghiduri?q=xyzxyz");
  const gol = page.locator(".empty");
  await expect(gol).toContainText("Nu găsesc ghidul ăsta.");
  await expect(gol.getByRole("link")).toHaveAttribute("href", SITE.instagram.url);
});

test("un card duce la pagina ghidului", async ({ page }) => {
  await page.goto("/ghiduri");
  await expect(page.locator(".colaj .gc").first()).toHaveAttribute("href", `/ghiduri/${NOU.slug}`);
});
