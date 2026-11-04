import { test, expect } from "@playwright/test";

const CONCEPTE = [
  { slug: "clinica", titlu: "Clinica Tei", cta: "Programează-te" },
  { slug: "frizerie", titlu: "Conu' Leonida", cta: "Programează-te" },
  { slug: "tatuaje", titlu: "Casa de Cerneală", cta: "Trimite-ne ideea" },
];

for (const c of CONCEPTE) {
  test.describe(c.slug, () => {
    test("răspunde 200, cu noindex", async ({ request }) => {
      const r = await request.get(`/concepte/${c.slug}`);
      expect(r.status()).toBe(200);
      expect(r.headers()["x-robots-tag"]).toContain("noindex");
    });

    test("nu cere nimic de pe alte domenii", async ({ page, baseURL }) => {
      const straine: string[] = [];
      page.on("request", (q) => {
        if (!q.url().startsWith("data:") && new URL(q.url()).origin !== new URL(baseURL!).origin) straine.push(q.url());
      });
      await page.goto(`/concepte/${c.slug}`, { waitUntil: "networkidle" });
      expect(straine).toEqual([]);
    });

    test("are banda Concept și linkurile spre site, fără meniul site-ului", async ({ page }) => {
      await page.goto(`/concepte/${c.slug}`);
      await expect(page.locator(".concept")).toContainText("Concept");
      await expect(page.locator('.concept a[href="/#portofoliu"]')).toBeVisible();
      await expect(page.getByRole("navigation", { name: "Principal" })).toHaveCount(0);
      await expect(page.locator('footer a[href="/#formular"]')).toHaveCount(1);
    });

    test("toate pozele se încarcă", async ({ page }) => {
      await page.goto(`/concepte/${c.slug}`);
      expect(await page.locator("img").count()).toBeGreaterThan(0);
      await page.evaluate(() => document.querySelectorAll("img").forEach((i) => { i.loading = "eager"; }));
      await page.waitForFunction(() => [...document.images].every((i) => i.complete));
      const stricate = await page.evaluate(() => [...document.images].filter((i) => !i.naturalWidth).map((i) => i.src));
      expect(stricate).toEqual([]);
    });

    test("fără scroll orizontal la 320px", async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 640 });
      await page.goto(`/concepte/${c.slug}`);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
      const banda = await page.locator(".concept").boundingBox();
      expect(banda!.height).toBeLessThanOrEqual(34);
      const incape = await page.locator(".concept").evaluate((e) => e.scrollWidth <= e.clientWidth);
      expect(incape).toBe(true);
    });

    test("Esc închide programarea", async ({ page }) => {
      await page.goto(`/concepte/${c.slug}`);
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      const buton = page.locator(".bara .btn", { hasText: c.cta });
      await expect(buton).toBeInViewport();
      await buton.click();
      await expect(page.locator("dialog")).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(page.locator("dialog")).toBeHidden();
      await buton.click();
      await expect(page.locator("dialog")).toBeVisible();
    });

    test("atingerea în fereastră n-o închide, cea de pe fundal da", async ({ page }) => {
      await page.goto(`/concepte/${c.slug}`);
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.locator(".bara .btn", { hasText: c.cta }).click();
      const fereastra = page.locator("dialog");
      await expect(fereastra).toBeVisible();
      await fereastra.click({ position: { x: 4, y: 120 } });
      await expect(fereastra).toBeVisible();
      await page.mouse.click(4, 4);
      await expect(fereastra).toBeHidden();
    });

    test("slash final", async ({ page }) => {
      const r = await page.goto(`/concepte/${c.slug}/`);
      expect(r!.status()).toBeLessThan(400);
      await expect(page).toHaveTitle(new RegExp(c.titlu));
      await page.waitForFunction(() => [...document.images].filter((i) => i.loading !== "lazy").every((i) => i.complete && i.naturalWidth > 0));
    });

    test("cu mișcare redusă, mesajul final se vede fără scroll fixat", async ({ browser, baseURL }) => {
      const context = await browser.newContext({ reducedMotion: "reduce", baseURL });
      const page = await context.newPage();
      await page.goto(`/concepte/${c.slug}`);
      await expect(page.locator(".sosit")).toBeVisible();
      await expect(page.locator(".pin-spacer")).toHaveCount(0);
      expect(await page.locator(".erou .poza").evaluate((e) => getComputedStyle(e).clipPath)).toBe("none");
      await expect(page.getByText(c.titlu, { exact: true }).first()).toBeVisible();
      await context.close();
    });
  });
}

test("pata se redesenează la rotire", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/concepte/tatuaje");
  const inainte = await page.locator(".erou .poza").evaluate((e) => (e as HTMLElement).style.clipPath);
  await page.setViewportSize({ width: 844, height: 390 });
  await expect.poll(() => page.locator(".erou .poza").evaluate((e) => (e as HTMLElement).style.clipPath)).not.toBe(inainte);
});

test("tablourile se aprind la scroll", async ({ page }) => {
  await page.goto("/concepte/tatuaje");
  const t = page.locator(".tablou").first();
  await expect(t).not.toHaveClass(/aprins/);
  await t.scrollIntoViewIfNeeded();
  await expect(t).toHaveClass(/aprins/);
});

test("etichetele nu pomenesc artiști", async ({ page }) => {
  await page.goto("/concepte/tatuaje");
  await expect(page.locator(".tablou")).not.toHaveCount(0);
  await expect(page.locator(".tablou figcaption", { hasText: /Ana|Radu|Mara/ })).toHaveCount(0);
});

for (const [cale, selector, tinta] of [
  ["banda", ".concept a", "#portofoliu h2"],
  ["subsolul", "footer a", "#formular"],
] as const) {
  test(`linkul din ${cale} ajunge la secțiunea cerută`, async ({ page }) => {
    await page.goto("/concepte/clinica");
    await page.locator(selector).click();
    await page.waitForURL(/#/);
    // scenele fixate de pe homepage împing ținta în jos după sosire, deci se verifică după ce pagina s-a așezat
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2500);
    await expect(page.locator(tinta)).toBeInViewport();
  });
}

for (const [slug, tarzii, ultima] of [
  ["clinica", ["14:00", "16:00", "18:00"], "18:00"],
  ["frizerie", ["17:00"], "17:00"],
] as const) {
  test(`${slug}: sâmbăta nu oferă ore după închidere`, async ({ page }) => {
    await page.goto(`/concepte/${slug}`);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.locator(".bara .btn", { hasText: "Programează-te" }).click();
    await page.locator("#a-serv button").first().click();
    await page.locator("#a-zi button", { hasNotText: "sâmbătă" }).first().click();
    await page.locator("#a-ora button", { hasText: ultima }).click();
    await expect(page.locator("#trimite")).toBeEnabled();
    await page.locator("#a-zi button", { hasText: "sâmbătă" }).click();
    for (const ora of tarzii) await expect(page.locator("#a-ora button", { hasText: ora })).toHaveCount(0);
    await expect(page.locator("#trimite")).toBeDisabled();
  });
}

test("frizeria: focusul se vede pe fondurile deschise", async ({ page }) => {
  await page.goto("/concepte/frizerie");
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.locator(".bara .btn", { hasText: "Programează-te" }).click();
  await page.keyboard.press("Tab");
  const culoare = await page.evaluate(() => getComputedStyle(document.activeElement!).outlineColor);
  expect(culoare).toBe("rgb(20, 35, 29)");
});

test("clinica: scena rămâne întreagă când bara de adrese se ascunde", async ({ page }) => {
  // în Chromium fără bară de adrese lvh = svh, deci se verifică regula, nu efectul
  await page.goto("/concepte/clinica");
  const inaltime = await page.evaluate(() => {
    for (const foaie of document.styleSheets)
      for (const r of foaie.cssRules)
        if (r instanceof CSSStyleRule && r.selectorText === ".erou.c") return r.style.height;
    return "";
  });
  expect(inaltime).toBe("100lvh");
});

test("slug inexistent dă 404", async ({ request }) => {
  expect((await request.get("/concepte/altceva")).status()).toBe(404);
});

test("sitemap-ul nu conține conceptele", async ({ request }) => {
  expect(await (await request.get("/sitemap.xml")).text()).not.toContain("/concepte/");
});
