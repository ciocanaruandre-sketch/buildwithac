import { expect, test } from "@playwright/test";

// Site-ul se vede întâi pe telefon: nimic nu iese din ecran, nicio eroare, nicio legătură internă ruptă.
for (const latime of [360, 390]) {
  for (const cale of ["/", "/confidentialitate"]) {
    test(`${cale} la ${latime}px`, async ({ page, request }) => {
      const erori: string[] = [];
      page.on("pageerror", (e) => erori.push(e.message));
      await page.setViewportSize({ width: latime, height: 800 });
      const raspuns = await page.goto(cale);
      expect(raspuns?.status()).toBe(200);
      await page.waitForLoadState("networkidle");

      // adresa canonică: aceeași pagină, pe domeniul firmei (nu pe …vercel.app)
      const canonica = await page.locator('link[rel="canonical"]').getAttribute("href");
      expect(new URL(canonica!).pathname).toBe(cale);

      const depasire = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(depasire, "pagina iese din ecran").toBeLessThanOrEqual(0);

      const interne = await page.$$eval('a[href^="/"]', (a) => [...new Set(a.map((x) => x.getAttribute("href")!))]);
      for (const href of interne) {
        expect((await request.get(href)).status(), href).toBeLessThan(400);
      }
      expect(erori).toEqual([]);
    });
  }
}

test("pagina 404", async ({ page }) => {
  const raspuns = await page.goto("/nu-exista");
  expect(raspuns?.status()).toBe(404);
  await expect(page.locator('a[href="/"]').first()).toBeVisible();
});
