import { test, expect, type Page } from "@playwright/test";

const calc = (page: Page) => page.locator("#calculator");
const descriere = (page: Page) => page.locator(".colab").getByLabel("Descriere (opțional)");
const buton = (page: Page) => calc(page).getByRole("link", { name: /Vreau analiza gratuită/ });

/** Pagina e gata (hidratată) când butonul formularului devine activ. */
async function deschide(page: Page) {
  await page.goto("/");
  await expect(page.locator(".colab .fcard").getByRole("button", { name: "Vreau analiza gratuită" })).toBeEnabled();
  // după încărcare, ScrollTrigger mai măsoară o dată pagina; până atunci un scroll nativ se pierde
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(300);
}

/** Ca un om: întâi ajunge la buton, apoi apasă (un clic în aceeași clipă cu un scroll nativ se bate cu Lenis). */
async function apasa(page: Page) {
  await buton(page).scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await buton(page).click();
}

const rezultat = (page: Page) => calc(page).locator("output");
const cursor = (page: Page, nume: RegExp) => calc(page).getByRole("slider", { name: nume });
const CERERI = /Cereri pe săptămână/, PROGRAMARI = /Programări pe săptămână/, MINUTE = /Minute pe zi/;

async function laZero(page: Page, ...care: RegExp[]) {
  for (const c of care) { await cursor(page, c).focus(); await page.keyboard.press("Home"); }
}

test("arată cât poți câștiga, cu verde, pe un singur bon", async ({ page }) => {
  await deschide(page);
  await expect(calc(page).getByRole("heading", { level: 2 })).toHaveText("Cât poți câștiga dacă nu mai faci totul manual?");
  await expect(calc(page).getByRole("slider")).toHaveCount(4);
  await expect(rezultat(page)).toContainText("Poți câștiga până la");
  await expect(rezultat(page)).toContainText("+510 lei");
  await expect(rezultat(page)).toContainText("pe lună, plus 7 zile pe an pentru tine");
  await expect(calc(page)).not.toContainText(/pierzi|pierdu/i);
  await expect(rezultat(page).locator("strong")).toHaveCSS("color", "rgb(47, 125, 58)");
  for (const presupunere of ["1 din 10 cereri", "1 din 4 programări", "Jumătate din timp"]) await expect(calc(page).locator(".bon-r")).toContainText(presupunere);
  await expect(calc(page)).toContainText("Estimare prudentă, nu o promisiune. Costul automatizării nu e scăzut din sumă.");
});

test("cursoarele schimbă suma, iar la capete nu se strică nimic", async ({ page }) => {
  await deschide(page);
  await cursor(page, CERERI).focus();
  for (let i = 0; i < 3; i++) await page.keyboard.press("ArrowRight");
  await expect(rezultat(page)).toContainText("+710 lei");
  for (const s of await calc(page).getByRole("slider").all()) { await s.focus(); await page.keyboard.press("End"); }
  await expect(rezultat(page)).toContainText("+7.570 lei");
  await expect(rezultat(page)).toContainText("31 de zile");
  await expect(calc(page)).not.toContainText("NaN");
  const bon = await calc(page).locator(".bon").boundingBox(), suma = await rezultat(page).locator("strong").boundingBox();
  expect(suma!.x).toBeGreaterThanOrEqual(bon!.x);
  expect(suma!.x + suma!.width).toBeLessThanOrEqual(bon!.x + bon!.width);
});

test("fără bani de câștigat, pe bon rămân zilele; fără nimic, îi spune să mute un cursor", async ({ page }) => {
  await deschide(page);
  await laZero(page, CERERI, PROGRAMARI);
  await expect(rezultat(page).locator("strong")).toHaveText("+7 zile");
  await expect(rezultat(page)).not.toContainText("lei");
  await laZero(page, MINUTE);
  await expect(rezultat(page)).toContainText("Mută un cursor");
  await expect(rezultat(page)).not.toContainText("+0");
  await apasa(page);
  await expect(page.locator(".colab .fcard")).toBeInViewport();
  await expect(descriere(page)).toHaveValue("");
});

test("minutele pe zero: rămâne suma, fără „0 zile”", async ({ page }) => {
  await deschide(page);
  await laZero(page, MINUTE);
  await expect(rezultat(page)).toContainText("+510 lei");
  await expect(calc(page).locator(".bon-t")).not.toContainText("zile");
});

test("butonul duce la formular, alege Automatizări și scrie cifrele", async ({ page }) => {
  await deschide(page);
  await apasa(page);
  await expect(page.locator(".colab .fcard")).toBeInViewport();
  await expect(page.locator(".colab").getByRole("button", { name: "Automatizări", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(descriere(page)).toHaveValue("Din calculator: 3 cereri pe săptămână la care răspund târziu sau deloc, 2 programări pe săptămână la care nu vine nimeni, 150 de lei pe client, 30 de minute pe zi de muncă repetată. Estimare prudentă: până la 510 lei pe lună și 7 zile pe an.");
});

test("textul din calculator se vede întreg în „Descriere”, fără derulare", async ({ page }) => {
  await deschide(page);
  await apasa(page);
  await expect(descriere(page)).toHaveValue(/^Din calculator/);
  await expect.poll(() => descriere(page).evaluate((el) => el.scrollHeight - el.clientHeight)).toBeLessThanOrEqual(1);
  const inalt = (await descriere(page).boundingBox())!.height;
  await laZero(page, CERERI, PROGRAMARI, MINUTE);
  await apasa(page);
  await expect(descriere(page)).toHaveValue("");
  expect((await descriere(page).boundingBox())!.height).toBeLessThanOrEqual(inalt);
  expect((await descriere(page).boundingBox())!.height).toBeLessThanOrEqual(112);
});

test("eroarea „Alege ce te interesează” dispare când calculatorul alege serviciul", async ({ page }) => {
  await deschide(page);
  const card = page.locator(".colab .fcard");
  await card.getByLabel("Numele tău").fill("Ana");
  await card.getByLabel("Telefon").fill("0722123456");
  await card.locator("button[type=submit]").click();
  await expect(card.getByText("Alege ce te interesează.")).toBeVisible();
  await calc(page).scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await apasa(page);
  await expect(card.getByRole("button", { name: "Automatizări", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(card.getByText("Alege ce te interesează.")).toHaveCount(0);
});

test("cifrele noi le înlocuiesc pe cele vechi ale calculatorului", async ({ page }) => {
  await deschide(page);
  await apasa(page);
  await expect(descriere(page)).toHaveValue(/510 lei/);
  await laZero(page, CERERI, PROGRAMARI);
  await apasa(page);
  await expect(descriere(page)).toHaveValue(/^Din calculator: 30 de minute/);
  await laZero(page, MINUTE);
  await apasa(page);
  await expect(descriere(page)).toHaveValue("");
});

test("ce a scris omul în „Descriere” rămâne neatins", async ({ page }) => {
  await deschide(page);
  await descriere(page).fill("Am o cafenea");
  await calc(page).scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await apasa(page);
  await expect(page.locator(".colab").getByRole("button", { name: "Automatizări", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(descriere(page)).toHaveValue("Am o cafenea");
});

for (const lat of [390, 320]) {
  test(`la ${lat}px nu lățește pagina`, async ({ page }) => {
    await page.setViewportSize({ width: lat, height: 844 });
    await page.goto("/");
    await calc(page).scrollIntoViewIfNeeded();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
    const bon = await calc(page).locator(".bon").boundingBox();
    expect(bon!.x).toBeGreaterThanOrEqual(0);
    expect(bon!.x + bon!.width).toBeLessThanOrEqual(lat);
  });
}
