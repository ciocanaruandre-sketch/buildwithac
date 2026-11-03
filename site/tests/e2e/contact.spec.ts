import { test, expect, type Page } from "@playwright/test";

const card = (page: Page) => page.locator(".contact .fcard");
const nume = (page: Page) => card(page).getByLabel("Numele tău");
const telefon = (page: Page) => card(page).getByLabel("Telefon");
const trimite = (page: Page) => card(page).getByRole("button", { name: "Trimite" });

/** Pagina e gata (hidratată) când butonul devine activ: abia atunci pastilele răspund la clic. */
async function deschide(page: Page) {
  await page.goto("/");
  await expect(trimite(page)).toBeEnabled();
}

async function completeaza(page: Page) {
  await nume(page).fill("Maria Popescu");
  await telefon(page).fill("0721 123 456");
  await card(page).getByRole("button", { name: "Site", exact: true }).click();
}

/** Interceptează /api/contact și numără cererile. */
async function intercepteaza(page: Page, raspuns: { status: number; json?: object; body?: string; contentType?: string }, intarziere = 0) {
  const corpuri: unknown[] = [];
  await page.route("**/api/contact", async (r) => {
    corpuri.push(r.request().postDataJSON());
    if (intarziere) await new Promise((g) => setTimeout(g, intarziere));
    await r.fulfill(raspuns);
  });
  return corpuri;
}

test.describe("formularul de contact", () => {
  test("are titlul, cele 4 pastile și link spre confidențialitate", async ({ page }) => {
    await deschide(page);
    await expect(card(page).getByRole("heading", { name: "Vrei să colaborăm?" })).toBeVisible();
    for (const p of ["Site", "Automatizări", "Sesiune 1 la 1 sau ghid personalizat", "Altceva"]) {
      await expect(card(page).getByRole("button", { name: p, exact: true })).toHaveAttribute("aria-pressed", "false");
    }
    await expect(card(page).getByRole("link", { name: "politica de confidențialitate" })).toHaveAttribute("href", "/confidentialitate");
  });

  test("formularul gol arată greșelile, focusul pe nume, fără cerere", async ({ page }) => {
    const corpuri = await intercepteaza(page, { status: 200, json: { stare: "ok" } });
    await deschide(page);
    await trimite(page).click();
    await expect(card(page)).toContainText("Scrie-mi cum te cheamă.");
    await expect(card(page)).toContainText("Numărul nu pare complet. Verifică-l o dată.");
    await expect(card(page)).toContainText("Alege ce te interesează.");
    await expect(nume(page)).toBeFocused();
    await expect(nume(page)).toHaveAttribute("aria-invalid", "true");
    expect(corpuri).toHaveLength(0);
  });

  test("„Altceva” schimbă textul din descriere", async ({ page }) => {
    await deschide(page);
    const descriere = card(page).getByLabel("Descriere (opțional)");
    await expect(descriere).toHaveAttribute("placeholder", "Ce firmă ai și ce ți-ar plăcea să rezolvi.");
    await card(page).getByRole("button", { name: "Altceva" }).click();
    await expect(descriere).toHaveAttribute("placeholder", "Spune-mi ce ai în minte.");
  });

  test("o pastilă se alege cu tastatura și doar una e aleasă", async ({ page, isMobile }) => {
    test.skip(isMobile, "tastatura se verifică pe calculator");
    await deschide(page);
    const site = card(page).getByRole("button", { name: "Site", exact: true });
    await site.focus();
    await page.keyboard.press("Space");
    await expect(site).toHaveAttribute("aria-pressed", "true");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Enter");
    await expect(site).toHaveAttribute("aria-pressed", "false");
    await expect(card(page).getByRole("button", { name: "Automatizări" })).toHaveAttribute("aria-pressed", "true");
  });

  test("trimiterea reușită arată „Am primit. Mersi!”", async ({ page }) => {
    const corpuri = await intercepteaza(page, { status: 200, json: { stare: "ok" } });
    await deschide(page);
    await completeaza(page);
    await trimite(page).click();
    await expect(card(page)).toContainText("Am primit. Mersi!");
    await expect(card(page)).toContainText("te contactez în 1–2 zile");
    expect(corpuri[0]).toMatchObject({ nume: "Maria Popescu", telefon: "0721 123 456", serviciu: "site" });
  });

  test("dublu-tap cât se trimite → o singură cerere", async ({ page }) => {
    const corpuri = await intercepteaza(page, { status: 200, json: { stare: "ok" } }, 2000);
    await deschide(page);
    await completeaza(page);
    await trimite(page).click();
    const asteapta = card(page).getByRole("button", { name: "Se trimite…" });
    await expect(asteapta).toBeDisabled();
    await asteapta.click({ force: true }).catch(() => {});
    await expect(card(page)).toContainText("Am primit. Mersi!", { timeout: 6000 });
    expect(corpuri).toHaveLength(1);
  });

  test("limita de cereri (429, HTML) → mesajul de eșec, textul rămâne", async ({ page }) => {
    await intercepteaza(page, { status: 429, contentType: "text/html", body: "<html>Too Many Requests</html>" });
    await deschide(page);
    await completeaza(page);
    await trimite(page).click();
    await expect(card(page)).toContainText("Acum nu merge trimiterea.");
    await expect(card(page).getByRole("link", { name: "scrie-mi pe Instagram" })).toBeVisible();
    await expect(nume(page)).toHaveValue("Maria Popescu");
    await expect(telefon(page)).toHaveValue("0721 123 456");
    await expect(trimite(page)).toBeEnabled();
  });

  test("serverul spune că telefonul e greșit → greșeala apare la telefon", async ({ page }) => {
    await intercepteaza(page, { status: 400, json: { stare: "invalid", camp: "telefon" } });
    await deschide(page);
    await completeaza(page);
    await trimite(page).click();
    await expect(card(page)).toContainText("Numărul nu pare complet. Verifică-l o dată.");
    await expect(telefon(page)).toHaveAttribute("aria-invalid", "true");
  });

  test("fără cheia Resend (serverul de dev) → mesajul de eșec, nu „Am primit”", async ({ page }) => {
    await deschide(page);
    await completeaza(page);
    await trimite(page).click();
    await expect(card(page)).toContainText("Acum nu merge trimiterea.");
    await expect(card(page)).not.toContainText("Am primit.");
  });
});
