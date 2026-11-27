import { test, expect } from "@playwright/test";

// intrarea de pe copertă e o animație CSS: o terminăm, ca să măsurăm pozițiile finale
const gataIntrarea = (page: import("@playwright/test").Page) =>
  page.evaluate(() => document.getAnimations().forEach((a) => (a as CSSAnimation).animationName?.startsWith("intra") && a.finish()));

test.describe("hero", () => {
  test("pe cer: eticheta, fraza și rândul despre claritate, deasupra numelui", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle("buildwithac · site-uri și automatizări cu AI");
    await expect(page.locator("h1")).toHaveText("buildwithac");
    await gataIntrarea(page);
    const sus = page.locator(".px__sub");
    await expect(sus.locator(".cop-eti")).toHaveText("Site-uri · Automatizări · CRM");
    await expect(sus.locator(".cop-fraza")).toHaveText("Programări uitate, mesaje fără răspuns, clienți de care nu mai știi nimic? Le rezolv eu.");
    await expect(sus.locator(".cop-fraza .serif")).toHaveText("Le rezolv eu.");
    await expect(sus.locator(".cop-claritate")).toHaveText("Împreună construim claritate în afacerea ta");
    await expect(page.locator("#hero")).not.toContainText("AI pe înțelesul");
    const b = (await sus.boundingBox())!;
    const titlu = (await page.locator("h1").boundingBox())!;
    expect(b.y + b.height).toBeLessThanOrEqual(titlu.y + 1);
    expect(titlu.y - (b.y + b.height)).toBeLessThanOrEqual(40);
  });

  for (const [lat, inalt] of [[390, 844], [375, 667]]) {
    test(`la ${lat}×${inalt}, butoanele sunt pe copertă, în primul ecran`, async ({ page }) => {
      await page.setViewportSize({ width: lat, height: inalt });
      await page.goto("/");
      await gataIntrarea(page);
      const analiza = page.locator("#hero").getByRole("link", { name: "Analiză gratuită" });
      const ghiduri = page.locator("#hero").getByRole("link", { name: "Ghiduri gratuite" });
      await expect(analiza).toHaveAttribute("href", "#formular");
      await expect(ghiduri).toHaveAttribute("href", "/ghiduri");
      await expect(analiza).toBeInViewport({ ratio: 0.99 });
      await expect(ghiduri).toBeInViewport({ ratio: 0.99 });
      await expect(page.locator("#hero")).toContainText("Îți răspund în 1–2 zile");
      await expect(page.locator(".scrollcue")).toHaveCount(0);
    });
  }

  test("pe telefon scund, eticheta nu intră sub logo", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");
    await gataIntrarea(page);
    const eti = (await page.locator(".cop-eti").boundingBox())!;
    const logo = (await page.locator(".nav .logo").boundingBox())!;
    expect(eti.y).toBeGreaterThanOrEqual(logo.y + logo.height);
  });

  test("la 320px, textul de pe cer încape pe lățime", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto("/");
    await gataIntrarea(page);
    for (const s of [".cop-eti", ".cop-fraza", ".cop-claritate"]) {
      const b = (await page.locator(s).boundingBox())!;
      expect(b.x).toBeGreaterThanOrEqual(0);
      expect(b.x + b.width).toBeLessThanOrEqual(320);
    }
  });

  test("pe desktop, blocul de pe cer nu atinge numele", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await gataIntrarea(page);
    const b = (await page.locator(".px__sub").boundingBox())!;
    const titlu = (await page.locator("h1").boundingBox())!;
    expect(b.y + b.height).toBeLessThanOrEqual(titlu.y + 1);
    expect(b.y).toBeGreaterThan(0);
  });

  test("cu mișcare redusă, butoanele se văd de la început", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await expect(page.locator(".cop-jos")).toHaveCSS("opacity", "1");
    await expect(page.locator(".cop-jos")).toHaveCSS("animation-name", "none");
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
    const manifest = page.locator(".manifest");
    await expect(manifest).toContainText("Salut, sunt Andrei, am terminat Mecatronica la Politehnica din București.");
    await expect(manifest).not.toContainText("24 de ani");
    await expect(manifest).toContainText("ca tu să ai timp pentru gestionarea afacerii.");
    await expect(manifest.locator(".gtxt")).toHaveCount(0);
    await expect(page.locator(".curtain")).not.toContainText("tot gratuit");
  });

  for (const lat of [430, 390, 360, 320]) {
    test(`la ${lat}px, textul e rupt pe idei: trei fraze, fiecare rând întreg`, async ({ page }) => {
      await page.setViewportSize({ width: lat, height: 844 });
      await page.goto("/");
      await page.evaluate(() => document.fonts.ready);
      await expect(page.locator(".manifest p")).toHaveCount(3);
      const randuri = page.locator(".manifest .rd");
      await expect(randuri).toHaveText([
        "Salut, sunt Andrei,", "am terminat Mecatronica", "la Politehnica din București.",
        "Știu că la început de drum", "le faci pe toate singur.",
        "Eu îți fac site-ul", "și automatizările,", "ca tu să ai timp pentru", "gestionarea afacerii.",
      ]);
      const randuriRupte = await randuri.evaluateAll((r) => r.filter((x) => new Set([...x.querySelectorAll(".w")].map((w) => Math.round((w as HTMLElement).getBoundingClientRect().top))).size !== 1).map((x) => x.textContent));
      expect(randuriRupte).toEqual([]);
      const suprapuse = await randuri.evaluateAll((r) => r.filter((x, i) => i > 0 && x.getBoundingClientRect().top <= r[i - 1].getBoundingClientRect().top).length);
      expect(suprapuse).toBe(0);
    });
  }

  test("pe desktop, fiecare frază încape pe cel mult două rânduri", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    const randuri = await page.locator(".manifest p").evaluateAll((p) => p.map((x) => new Set([...x.querySelectorAll(".w")].map((w) => Math.round(w.getBoundingClientRect().top))).size));
    expect(randuri).toHaveLength(3);
    for (const n of randuri) expect(n).toBeLessThanOrEqual(2);
  });

  for (const lat of [1440, 768, 390]) {
    test(`la ${lat}px, textul începe pe aceeași linie cu titlurile de mai jos`, async ({ page }) => {
      await page.setViewportSize({ width: lat, height: 844 });
      await page.goto("/");
      const stanga = await page.evaluate(() => [".manifest", ".curtain .who", "#portofoliu h2"].map((s) => Math.round(document.querySelector(s)!.getBoundingClientRect().left)));
      expect(new Set(stanga).size).toBe(1);
    });
  }

  test("butoanele s-au mutat pe copertă", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".cortina-but")).toHaveCount(0);
    const butoane = page.locator("#hero .cop-but a");
    await expect(butoane).toHaveText(["Analiză gratuită", "Ghiduri gratuite"]);
    await expect(butoane.nth(0)).toHaveAttribute("href", "#formular");
    await expect(butoane.nth(1)).toHaveAttribute("href", "/ghiduri");
  });

  for (const lat of [390, 320]) {
    test(`la ${lat}px, butoanele stau unul lângă altul, pe câte un rând`, async ({ page }) => {
      await page.setViewportSize({ width: lat, height: 844 });
      await page.goto("/");
      const [a, b] = await Promise.all([0, 1].map((i) => page.locator("#hero .cop-but a").nth(i).boundingBox()));
      expect(Math.abs(a!.y - b!.y)).toBeLessThanOrEqual(1);
      expect(Math.abs(a!.width - b!.width)).toBeLessThanOrEqual(1);
      expect(a!.height).toBeLessThan(60);
      expect(b!.height).toBeLessThan(60);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
    });
  }

  test.describe("reduce motion", () => {
    test.use({ reducedMotion: "reduce" });
    test("cuvintele sunt aprinse de la început", async ({ page }) => {
      await page.goto("/");
      const opacitate = await page.locator(".manifest .w").first().evaluate((el) => getComputedStyle(el).opacity);
      expect(opacitate).toBe("1");
    });
  });
});

test("ordinea secțiunilor", async ({ page }) => {
  await page.goto("/");
  const ids = await page.$$eval("main section", (s) => s.map((x) => x.id).filter(Boolean));
  expect(ids).toEqual(["hero", "portofoliu", "servicii", "calculator", "colaborare", "ghiduri", "tiktok", "email", "intrebari", "contact"]);
});

test("cuvintele în gradient nu sunt tăiate la margine", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  // litera italică iese din cutia textului; gradientul se oprește la cutie, deci are nevoie de spațiu în plus
  const taiate = await page.evaluate(() => [...document.querySelectorAll<HTMLElement>("h2 .serif.gtxt")].flatMap((el) => {
    const s = getComputedStyle(el), ctx = document.createElement("canvas").getContext("2d")!;
    ctx.font = `${s.fontStyle} ${s.fontWeight} ${s.fontSize} ${s.fontFamily}`;
    ctx.letterSpacing = s.letterSpacing === "normal" ? "0px" : s.letterSpacing;
    const m = ctx.measureText(el.textContent!);
    const iese = m.actualBoundingBoxRight - m.width - parseFloat(s.paddingRight);
    return iese > 0 ? [`${el.textContent}: ${iese.toFixed(1)}px`] : [];
  }));
  expect(taiate).toEqual([]);
});

test("pe telefon, pagina e scurtă: portofoliul și formularul vin repede", async ({ page, isMobile }) => {
  test.skip(!isMobile, "doar pe telefon");
  await page.setViewportSize({ width: 390, height: 664 });
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  const ecrane = await page.evaluate(() => {
    const sus = (id: string) => (document.getElementById(id)!.getBoundingClientRect().top + scrollY) / innerHeight;
    return { portofoliu: sus("portofoliu"), formular: sus("formular"), total: document.body.scrollHeight / innerHeight };
  });
  console.log("ecrane", JSON.stringify(ecrane));
  expect(ecrane.portofoliu).toBeLessThan(3);
  expect(ecrane.formular).toBeLessThan(10);
  expect(ecrane.total).toBeLessThanOrEqual(18); // 18, nu 17: al patrulea card de la Servicii (CRM, 2026-11-27)
});

test.describe("ghiduri și clipuri", () => {
  test("ghidurile gratuite duc în bibliotecă, cele premium la newsletter", async ({ page }) => {
    await page.goto("/");
    const ghiduri = page.locator("#ghiduri");
    const gratuite = ghiduri.getByRole("link", { name: /Ghiduri gratuite/ });
    await expect(gratuite).toHaveAttribute("href", "/ghiduri");
    await expect(gratuite).toContainText(/[0-9]+ (de )?ghid(uri)?/);
    const premium = ghiduri.getByRole("link", { name: /Ghiduri premium/ });
    await expect(premium).toHaveAttribute("href", "#email");
    await expect(premium).toContainText("În curând");
    await expect(page.locator(".gcard, .drawer, #cine")).toHaveCount(0);
  });

  test("peretele are doar coperte, fără link-uri și fără playere; butonul duce la profil", async ({ page }) => {
    await page.goto("/");
    const perete = page.locator("#tiktok");
    expect(await perete.locator(".clip img").count()).toBeGreaterThan(0);
    await expect(perete.locator(".clip a, a.clip")).toHaveCount(0);
    await expect(perete.locator("a")).toHaveCount(1);
    await expect(perete.locator("a")).toHaveAttribute("target", "_blank");
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

  test("cât așteaptă, butonul scrie „Se trimite…” și nu se poate apăsa", async ({ page }) => {
    await page.route("**/api/abonare", async (r) => { await new Promise((g) => setTimeout(g, 2000)); await r.fulfill({ status: 200, json: { stare: "ok" } }); });
    await page.goto("/");
    const formular = page.locator(".mail form");
    await formular.getByPlaceholder("adresa ta de e-mail").fill("ana@exemplu.ro");
    await formular.getByRole("button", { name: "Mă abonez" }).click();
    await expect(formular.getByRole("button", { name: "Se trimite…" })).toBeDisabled();
    await expect(formular.getByRole("button", { name: "Mă abonez" })).toBeEnabled({ timeout: 5000 });
  });

  test("limita de cereri (429, pagină HTML) → mesajul „indisponibil”, butonul revine", async ({ page }) => {
    await page.route("**/api/abonare", (r) => r.fulfill({ status: 429, contentType: "text/html", body: "<html>Too Many Requests</html>" }));
    await page.goto("/");
    const formular = page.locator(".mail form");
    await formular.getByPlaceholder("adresa ta de e-mail").fill("ana@exemplu.ro");
    await formular.getByRole("button", { name: "Mă abonez" }).click();
    await expect(page.locator(".mail")).toContainText("Acum nu merge abonarea.");
    await expect(formular.getByRole("button", { name: "Mă abonez" })).toBeEnabled();
  });

  test("după confirmarea din e-mail (?abonat=1), secțiunea arată felicitarea în loc de formular", async ({ page }) => {
    await page.goto("/?abonat=1#email");
    const mail = page.locator(".mail");
    await expect(mail.getByRole("heading", { name: /Felicitări/ })).toBeVisible();
    await expect(mail).toContainText("De acum îți vin pe e-mail noutățile din AI și ghidurile noi.");
    await expect(mail.locator("form")).toHaveCount(0);
    await expect(mail.getByRole("heading", { name: /Felicitări/ })).toBeInViewport();
  });

  test("fără ?abonat, secțiunea are formularul", async ({ page }) => {
    await page.goto("/#email");
    await expect(page.locator(".mail form")).toHaveCount(1);
    await expect(page.locator(".mail")).toContainText("un ghid nou, gratuit sau premium");
    await expect(page.locator(".mail")).not.toContainText("Felicitări");
  });

  test("lângă formular e acordul cu link spre confidențialitate", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".mail .acord")).toContainText("ghid nou, gratuit sau plătit,");
    await expect(page.locator(".mail").getByRole("link", { name: "Confidențialitate" })).toHaveAttribute("href", "/confidentialitate");
  });
});

test.describe("servicii și contact", () => {
  test("serviciile au patru carduri, CRM primul, și titlul nou", async ({ page }) => {
    await page.goto("/");
    const carduri = page.locator("#servicii .scard");
    await expect(carduri).toHaveCount(4);
    await expect(carduri.nth(0)).toContainText("CRM pentru echipe de vânzări");
    await expect(carduri.nth(0)).toContainText("ai integrare Meta pentru a urmări corect lead-urile provenite din reclame");
    await expect(carduri.nth(1)).toContainText("Optimizat pentru a funcționa eficient pe telefon.");
    await expect(carduri.nth(2)).toContainText("Le integrez astfel încât să funcționeze automat, fără intervenția ta.");
    await expect(carduri.nth(3)).toContainText("Sesiune 1 la 1");
    await expect(page.locator("#servicii h2")).toHaveText("Cu ce îți pot fi de ajutor.");
    await expect(page.locator("#servicii")).toContainText("în funcție de nevoile tale");
  });

  test("contactul are Instagram și e-mail", async ({ page }) => {
    const { SITE } = await import("../../lib/config");
    await page.goto("/");
    const contact = page.locator("#contact");
    await expect(contact.getByRole("link", { name: /Mesaj pe Instagram/ })).toHaveAttribute("href", SITE.instagram.url);
    await expect(contact.getByRole("link", { name: /E-mail/ })).toHaveAttribute("href", `mailto:${SITE.emailContact}`);
    await expect(contact).toContainText(SITE.emailContact);
    await expect(contact.locator("form")).toHaveCount(0);
  });

  test("/#contact ajunge la contact", async ({ page }) => {
    await page.goto("/#contact");
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("heading", { name: "Ai o întrebare? Scrie-mi." })).toBeInViewport();
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

  test("cardurile-concept duc la pagini și nu mai sunt „în curând”", async ({ page }) => {
    await page.goto("/");
    const carduri = page.locator("#portofoliu .it.concept");
    await expect(carduri).toHaveCount(3);
    for (const [i, cale] of ["/concepte/clinica", "/concepte/frizerie", "/concepte/tatuaje"].entries())
      await expect(carduri.nth(i).locator("a").first()).toHaveAttribute("href", cale);
    await expect(page.locator("#portofoliu")).not.toContainText("în curând");
  });

  test("CRM-ul e primul, cu „date demo”; ImobSearch se deschide în filă nouă", async ({ page }) => {
    await page.goto("/");
    const carduri = page.locator("#portofoliu .it");
    await expect(carduri.nth(0)).toContainText("CRM pentru echipe de vânzări");
    await expect(carduri.nth(0)).toContainText("date demo");
    const imob = carduri.nth(1).getByRole("link", { name: /ImobSearch/ });
    await expect(imob).toHaveAttribute("href", "https://www.imobsearch.ro");
    await expect(imob).toHaveAttribute("target", "_blank");
    await expect(imob).toHaveAttribute("rel", "noopener");
  });

  test("rândurile se pot derula din tastatură", async ({ page, isMobile }) => {
    test.skip(!isMobile, "pe desktop rândurile încap întregi");
    await page.goto("/");
    const randuri = page.locator("#portofoliu .rand");
    await expect(randuri).toHaveCount(2);
    for (const r of await randuri.all()) {
      await expect(r).toHaveAttribute("role", "region");
      await expect(r).toHaveAttribute("aria-label", /.+/);
    }
    const primul = randuri.first();
    await expect(primul).toHaveAttribute("tabindex", "0");
    await primul.scrollIntoViewIfNeeded();
    await primul.focus();
    await page.keyboard.press("ArrowRight");
    await expect.poll(() => primul.evaluate((el) => el.scrollLeft)).toBeGreaterThan(0);
  });

  for (const lat of [390, 320, 1440]) {
    test(`la ${lat}px, portofoliul nu lățește pagina`, async ({ page }) => {
      await page.setViewportSize({ width: lat, height: 844 });
      await page.goto("/");
      await page.locator("#portofoliu").scrollIntoViewIfNeeded();
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
      const primul = await page.locator("#portofoliu .it").first().boundingBox();
      expect(primul!.x).toBeGreaterThanOrEqual(0);
      expect(primul!.x + primul!.width).toBeLessThanOrEqual(lat);
    });
  }

  test("bara de sus are link spre portofoliu", async ({ page, isMobile }) => {
    test.skip(!!isMobile, "pe telefon linkurile sunt în meniul ☰");
    await page.goto("/");
    await expect(page.getByRole("navigation", { name: "Principal" }).locator(".links").getByRole("link", { name: "Portofoliu" })).toHaveAttribute("href", /#portofoliu$/);
  });
});

test("abonarea merge și pe iPhone-uri vechi (fără AbortSignal.timeout)", async ({ page }) => {
  await page.addInitScript(() => { Object.defineProperty(AbortSignal, "timeout", { value: undefined }); });
  await page.route("**/api/abonare", (r) => r.fulfill({ status: 200, json: { stare: "ok" } }));
  await page.goto("/");
  const formular = page.locator(".mail form");
  await formular.getByPlaceholder("adresa ta de e-mail").fill("ana@exemplu.ro");
  await formular.getByRole("button", { name: "Mă abonez" }).click();
  await expect(page.locator(".mail")).toContainText("Gata! Verifică-ți e-mailul și confirmă abonarea.");
});

test.describe("banda", () => {
  test("e decorativă și curge", async ({ page }) => {
    await page.goto("/");
    const banda = page.locator(".banda");
    await expect(banda).toHaveAttribute("aria-hidden", "true");
    await expect(banda).not.toContainText("tot gratuit");
    await expect(banda).toContainText("construit pe nevoile tale");
    await banda.scrollIntoViewIfNeeded();
    const pista = page.locator(".fasie.crem .pista");
    const inainte = await pista.evaluate((el) => getComputedStyle(el).transform);
    await expect.poll(() => pista.evaluate((el) => getComputedStyle(el).transform)).not.toBe(inainte);
  });

  test.describe("reduce motion", () => {
    test.use({ reducedMotion: "reduce" });
    test("stă pe loc", async ({ page }) => {
      await page.goto("/");
      await page.locator(".banda").scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      expect(await page.locator(".fasie.crem .pista").evaluate((el) => getComputedStyle(el).transform)).toBe("none");
    });
  });
});

test.describe("întrebări", () => {
  test("o întrebare primește răspunsul, iese din listă, iar conversația se poate lua de la capăt", async ({ page }) => {
    await page.goto("/");
    // pagina e hidratată când butonul formularului devine activ (ca în contact.spec.ts); înainte, clicul se pierde
    await expect(page.locator(".colab .fcard").getByRole("button", { name: "Vreau analiza gratuită" })).toBeEnabled();
    const sectiune = page.locator("#intrebari");
    await expect(sectiune.locator(".bula")).toHaveCount(2);
    await expect(sectiune.getByRole("button", { name: "de la capăt" })).toHaveCount(0);
    await sectiune.getByRole("button", { name: "Cât costă un site?" }).click();
    await expect(sectiune.locator(".bula.el").last()).toContainText("Nu lucrez cu prețuri din listă.");
    await expect(sectiune.locator(".bula")).toHaveCount(4);
    await expect(sectiune.getByRole("button", { name: "Cât costă un site?" })).toHaveCount(0);
    await sectiune.getByRole("button", { name: "de la capăt" }).click();
    await expect(sectiune.locator(".bula")).toHaveCount(2);
    await expect(sectiune.getByRole("button", { name: "Cât costă un site?" })).toBeVisible();
  });

  test("„Scrie-mi direct” duce la contact, iar analiza gratuită are răspuns", async ({ page }) => {
    await page.goto("/");
    const sectiune = page.locator("#intrebari");
    await expect(sectiune.getByRole("link", { name: /Scrie-mi direct/ })).toHaveAttribute("href", "#contact");
    await expect(page.locator(".colab .fcard").getByRole("button", { name: "Vreau analiza gratuită" })).toBeEnabled();
    await sectiune.getByRole("button", { name: "Ce primesc la analiza gratuită?" }).click();
    await expect(sectiune.locator(".bula.el").last()).toContainText("ce s-ar putea automatiza");
  });

  test("telefonul nu lățește pagina", async ({ page }) => {
    await page.goto("/");
    await page.locator("#intrebari .ecran").scrollIntoViewIfNeeded();
    const latime = await page.evaluate(() => innerWidth);
    const ecran = await page.locator("#intrebari .ecran").boundingBox();
    expect(ecran!.x).toBeGreaterThanOrEqual(0);
    expect(ecran!.x + ecran!.width).toBeLessThanOrEqual(latime);
  });
});
