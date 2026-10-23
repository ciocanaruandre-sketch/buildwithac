import { test, expect } from "@playwright/test";

test.describe("hero", () => {
  test("titlul e buildwithac, iar subtitlul stă deasupra lui", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toHaveText("buildwithac");
    const sus = await page.locator(".px__sub").boundingBox();
    const titlu = await page.locator("h1").boundingBox();
    expect(sus!.y + sus!.height).toBeLessThanOrEqual(titlu!.y + 1);
    await expect(page.locator(".px__sub")).toContainText("AI pe înțelesul tău, în română.");
  });

  test("pe ecran portret, primul plan e centrat pe 38%", async ({ page, isMobile }) => {
    test.skip(!isMobile, "doar pe telefon");
    await page.goto("/");
    const poz = await page.locator('[data-l="4"] img').evaluate((el) => getComputedStyle(el).objectPosition);
    expect(poz).toBe("38% 50%");
  });

  test("la scroll, straturile se mișcă diferit", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => window.scrollTo(0, 600));
    await expect
      .poll(async () => {
        const [fundal, primPlan] = await Promise.all(
          ['[data-l="2"]', '[data-l="4"]'].map((s) => page.locator(s).evaluate((el) => getComputedStyle(el).transform)),
        );
        return fundal !== primPlan;
      })
      .toBe(true);
  });
});

test.describe("cortina", () => {
  test("are mesajul personal", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".manifest")).toContainText("Salut, sunt Andrei.");
  });

  test.describe("reduce motion", () => {
    test.use({ reducedMotion: "reduce" });
    test("cuvintele sunt aprinse de la început", async ({ page }) => {
      await page.goto("/");
      const opacitate = await page.locator(".manifest .w").first().evaluate((el) => getComputedStyle(el).opacity);
      expect(opacitate).toBe("1");
    });
  });
});

test.describe("pentru cine și clipuri", () => {
  test("cele două drumuri", async ({ page }) => {
    await page.goto("/");
    const cine = page.locator("#cine");
    await expect(cine.locator(".path .eb")).toHaveText(["Înveți AI", "Ai o firmă"]);
  });

  test("clipurile duc pe TikTok, fără playere încorporate", async ({ page }) => {
    const { CLIPURI } = await import("../../content/clipuri");
    await page.goto("/");
    const linkuri = page.locator("#tiktok .clip");
    expect(await linkuri.count()).toBeGreaterThan(0);
    const adrese = new Set(CLIPURI.map((c) => c.url));
    for (const a of await linkuri.all()) {
      expect(adrese.has((await a.getAttribute("href"))!)).toBe(true);
      await expect(a).toHaveAttribute("target", "_blank");
    }
    await expect(page.locator("iframe")).toHaveCount(0);
  });
});
