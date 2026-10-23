import { test, expect } from "@playwright/test";

test.describe("hero", () => {
  test("titlul e buildwithac, iar subtitlul stă deasupra lui", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toHaveText("buildwithac");
    // intrarea titlului e o animație CSS: o terminăm, ca să măsurăm pozițiile finale
    await page.evaluate(() => document.getAnimations().forEach((a) => (a as CSSAnimation).animationName?.startsWith("intra") && a.finish()));
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

test.describe("abonare", () => {
  test("fără cheia Kit apare mesajul și adresa rămâne în câmp", async ({ page }) => {
    await page.goto("/");
    const formular = page.locator(".mail form");
    await formular.getByPlaceholder("adresa ta de e-mail").fill("ana@exemplu.ro");
    await formular.getByRole("button", { name: "Mă abonez" }).click();
    await expect(page.locator(".mail")).toContainText("Acum nu merge abonarea.");
    await expect(formular.getByPlaceholder("adresa ta de e-mail")).toHaveValue("ana@exemplu.ro");
  });

  test("când Kit răspunde ok, cere confirmarea pe e-mail", async ({ page }) => {
    await page.route("**/api/abonare", (r) => r.fulfill({ status: 200, json: { stare: "ok" } }));
    await page.goto("/");
    const formular = page.locator(".mail form");
    await formular.getByPlaceholder("adresa ta de e-mail").fill("ana@exemplu.ro");
    await formular.getByRole("button", { name: "Mă abonez" }).click();
    await expect(page.locator(".mail")).toContainText("Gata! Verifică-ți e-mailul și confirmă abonarea.");
  });

  test("adresa greșită primește mesajul ei", async ({ page }) => {
    await page.goto("/");
    const formular = page.locator(".mail form");
    await formular.getByPlaceholder("adresa ta de e-mail").fill("ana@");
    await formular.getByRole("button", { name: "Mă abonez" }).click();
    await expect(page.locator(".mail")).toContainText("Adresa nu pare corectă.");
  });

  test("lângă formular e acordul cu link spre confidențialitate", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".mail").getByRole("link", { name: "Confidențialitate" })).toHaveAttribute("href", "/confidentialitate");
  });
});

test.describe("servicii și contact", () => {
  test("serviciile au cele trei carduri", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#servicii .scard")).toHaveCount(3);
  });

  test("contactul are Instagram și e-mail", async ({ page }) => {
    const { SITE } = await import("../../lib/config");
    await page.goto("/");
    const contact = page.locator("#contact");
    await expect(contact.getByRole("link", { name: /Mesaj pe Instagram/ })).toHaveAttribute("href", SITE.instagram.url);
    await expect(contact.getByRole("link", { name: /E-mail/ })).toHaveAttribute("href", `mailto:${SITE.emailContact}`);
    await expect(contact).toContainText(SITE.emailContact);
  });
});

test.describe("portofoliu", () => {
  test("portofoliul e înainte de servicii", async ({ page }) => {
    await page.goto("/");
    const ordine = await page.evaluate(() => {
      const p = document.getElementById("portofoliu");
      const s = document.getElementById("servicii");
      return !!p && !!s && !!(p.compareDocumentPosition(s) & Node.DOCUMENT_POSITION_FOLLOWING);
    });
    expect(ordine).toBe(true);
  });

  test("fiecare concept e etichetat „Concept”", async ({ page }) => {
    const { PORTOFOLIU } = await import("../../content/portofoliu");
    await page.goto("/");
    const carduri = page.locator("#portofoliu .it");
    await expect(carduri).toHaveCount(PORTOFOLIU.length);
    for (const [i, el] of PORTOFOLIU.entries()) {
      if (el.tip === "concept") await expect(carduri.nth(i)).toContainText("Concept");
    }
  });

  test("bara de sus are link spre portofoliu", async ({ page, isMobile }) => {
    test.skip(!!isMobile, "pe telefon linkurile sunt în meniul ☰");
    await page.goto("/");
    await expect(page.getByRole("navigation", { name: "Principal" }).locator(".links").getByRole("link", { name: "Portofoliu" })).toHaveAttribute("href", /#portofoliu$/);
  });
});
