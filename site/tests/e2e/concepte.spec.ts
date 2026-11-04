import { test, expect } from "@playwright/test";

const CONCEPTE = [{ slug: "clinica", titlu: "Clinica Tei", cta: "Programează-te" }];

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
      await context.close();
    });
  });
}

test("slug inexistent dă 404", async ({ request }) => {
  expect((await request.get("/concepte/altceva")).status()).toBe(404);
});

test("sitemap-ul nu conține conceptele", async ({ request }) => {
  expect(await (await request.get("/sitemap.xml")).text()).not.toContain("/concepte/");
});
