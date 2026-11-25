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

test("pornește pe „Clienții pierduți”, iar săgețile schimbă fila", async ({ page }) => {
  await deschide(page);
  await expect(calc(page).getByRole("tab", { name: "Clienții pierduți" })).toHaveAttribute("aria-selected", "true");
  await expect(calc(page).locator("output")).toContainText("3.250 lei");
  await calc(page).getByRole("tab", { name: "Clienții pierduți" }).focus();
  await page.keyboard.press("ArrowLeft");
  await expect(calc(page).getByRole("tab", { name: "Timpul meu" })).toBeFocused();
  await expect(calc(page).getByRole("tab", { name: "Timpul meu" })).toHaveAttribute("aria-selected", "true");
  await expect(calc(page).locator("output")).toContainText("187 de ore");
  await expect(calc(page).locator("output")).toContainText("9.375 lei");
  await page.keyboard.press("ArrowRight");
  await expect(calc(page).locator("output")).toContainText("3.250 lei");
});

test("cursoarele schimbă suma, iar la capete nu se strică nimic", async ({ page }) => {
  await deschide(page);
  const cereri = calc(page).getByRole("slider", { name: /Cereri pe săptămână/ });
  await cereri.focus();
  for (let i = 0; i < 5; i++) await page.keyboard.press("ArrowRight");
  await expect(calc(page).locator("output")).toContainText("6.500 lei");
  for (const fila of ["Clienții pierduți", "Timpul meu"]) {
    await calc(page).getByRole("tab", { name: fila }).click();
    for (const tasta of ["Home", "End"]) {
      for (const s of await calc(page).getByRole("slider").all()) { await s.focus(); await page.keyboard.press(tasta); }
      await expect(calc(page)).not.toContainText("NaN");
    }
  }
  await expect(calc(page).locator("output")).toContainText("1.000 de ore");
});

test("butonul duce la formular, alege Automatizări și scrie cifrele", async ({ page }) => {
  await deschide(page);
  await apasa(page);
  await expect(page.locator(".colab .fcard")).toBeInViewport();
  await expect(page.locator(".colab").getByRole("button", { name: "Automatizări", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(descriere(page)).toHaveValue("Din calculator: 5 cereri pe săptămână fără răspuns, 3 din 10 cumpără, 500 de lei pe client. Cam 3.250 lei pe lună.");
});

test("cifrele noi le înlocuiesc pe cele vechi ale calculatorului", async ({ page }) => {
  await deschide(page);
  await apasa(page);
  await expect(descriere(page)).toHaveValue(/3\.250 lei/);
  await calc(page).getByRole("tab", { name: "Timpul meu" }).click();
  await apasa(page);
  await expect(descriere(page)).toHaveValue(/^Din calculator: 45 de minute/);
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
