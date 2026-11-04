# Plan 5: site-urile-concept

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Trei pagini-concept statice pe `buildwithac.ro/concepte/*` și cardurile din portofoliu care duc la ele.

**Architecture:** Prototipurile aprobate devin fișiere HTML statice în `site/public/concepte/<slug>/`, servite prin rewrite din `next.config.ts`, deci fără `Nav`, `Footer` și Lenis. Fonturile și GSAP sunt copiate local. Singurul cod React atins e secțiunea Portofoliu.

**Tech Stack:** Next.js 16.4 (`public/`, rewrites, headers), HTML/CSS, GSAP 3.15 + ScrollTrigger, Playwright, vitest.

**Spec:** `docs/superpowers/specs/2026-11-04-site-uri-concept-design.md`

## Global Constraints

- Ramura `concepte`. Pe `main` se unește doar după „da”-ul lui Andrei, după verificarea pe telefon.
- Adresele: `/concepte/clinica`, `/concepte/frizerie`, `/concepte/tatuaje`.
- Toate căile din pagini sunt **absolute** (`/concepte/frizerie/foto/hol.webp`): pagina se servește la `/concepte/frizerie`, fără slash final, deci o cale relativă ar rezolva greșit.
- Fără cereri spre alte domenii: fonturile și GSAP din `/concepte/_comun/`. Fără Analytics.
- `X-Robots-Tag: noindex, nofollow` pe `/concepte/:path*`; paginile nu intră în `sitemap.ts`.
- Domeniul nu se scrie în pagini: link-urile sunt `/#portofoliu` și `/#formular`.
- Româna cu ș, ț cu virgulă. Mesajele de commit în română, cu `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Înainte de cod Next.js: citește `site/AGENTS.md` și ghidul din `node_modules/next/dist/docs/` pentru rewrites.
- Aspectul, textele și animațiile rămân cele din prototipuri. Nu se rescriu și nu se „îmbunătățesc”.

## Review Focus

- Telefon mic (320–360px): banda „Concept” pe un rând, numele firmei încape, fără scroll orizontal. (Task 1, test `fără scroll orizontal la 320px`)
- Bara de adrese de pe telefon apare și dispare, sau telefonul se rotește: scena fixată nu sare, iar pata de cerneală se redesenează la noile dimensiuni. (`ScrollTrigger.config({ ignoreMobileResize: true })` în toate; test `pata se redesenează la rotire` în Task 3)
- `/concepte/altceva`: pagina 404 a site-ului, nu o eroare de server. (Task 1, test `slug inexistent dă 404`)
- `/concepte/frizerie/` cu slash final: merge sau redirecționează spre adresa fără slash, cu pozele încărcate. (Task 1, test `slash final`)
- Fereastra de programare deschisă: Esc o închide, iar butonul din spate rămâne folosibil. (Task 1, test `Esc închide programarea`)

---

### Task 1: Infrastructura și Clinica Tei

**Files:**
- Create: `site/public/concepte/_comun/gsap.min.js`, `ScrollTrigger.min.js`, `fonturi/*.woff2`
- Create: `site/public/concepte/clinica/index.html`, `site/public/concepte/clinica/foto/{cabinet,explica}.webp`
- Modify: `site/next.config.ts`
- Test: `site/tests/e2e/concepte.spec.ts`

**Interfaces:**
- Produces: `/concepte/_comun/gsap.min.js`, `/concepte/_comun/ScrollTrigger.min.js`, dosarul de fonturi; lista `CONCEPTE` din `concepte.spec.ts`, la care Task 2 și Task 3 adaugă un rând.

- [ ] **Step 1: Pregătește ramura.** Din rădăcina repo-ului: `git checkout -b concepte`, apoi comite specificația, planul, `continut/concepte/`, `prototip/concept-*` și `docs/progres-brainstorming.md`.

- [ ] **Step 2: Scrie testele în `tests/e2e/concepte.spec.ts`**

```ts
const CONCEPTE = [{ slug: "clinica", titlu: "Clinica Tei", cta: "Programează-te" }];

for (const c of CONCEPTE) test.describe(c.slug, () => {
  test("răspunde 200, cu noindex", async ({ request }) => {
    const r = await request.get(`/concepte/${c.slug}`);
    expect(r.status()).toBe(200);
    expect(r.headers()["x-robots-tag"]).toContain("noindex");
  });
  test("nu cere nimic de pe alte domenii", async ({ page, baseURL }) => {
    const straine: string[] = [];
    page.on("request", (q) => { if (new URL(q.url()).origin !== new URL(baseURL!).origin && !q.url().startsWith("data:")) straine.push(q.url()); });
    await page.goto(`/concepte/${c.slug}`, { waitUntil: "networkidle" });
    expect(straine).toEqual([]);
  });
  test("are banda Concept și linkul înapoi, fără meniul site-ului", async ({ page }) => {
    await page.goto(`/concepte/${c.slug}`);
    await expect(page.locator(".concept")).toContainText("Concept");
    await expect(page.locator('.concept a[href="/#portofoliu"]')).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Principal" })).toHaveCount(0);
    await expect(page.locator('footer a[href="/#formular"]')).toBeVisible();
  });
  test("toate pozele se încarcă", async ({ page }) => { /* parcurge pagina, apoi naturalWidth > 0 la fiecare img */ });
  test("fără scroll orizontal la 320px", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto(`/concepte/${c.slug}`);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
    const banda = await page.locator(".concept").boundingBox();
    expect(banda!.height).toBeLessThanOrEqual(34);
  });
  test("Esc închide programarea", async ({ page }) => { /* apasă primul buton c.cta din bară după scroll, Escape, dialog ascuns */ });
  test("slash final", async ({ page }) => { /* goto /concepte/slug/, status < 400, pozele se încarcă */ });
  test("cu mișcare redusă, mesajul final se vede fără scroll fixat", async ({ browser }) => { /* context cu reducedMotion: "reduce"; nu există .pin-spacer; .sosit vizibil */ });
});

test("slug inexistent dă 404", async ({ request }) => {
  expect((await request.get("/concepte/altceva")).status()).toBe(404);
});
test("sitemap-ul nu conține conceptele", async ({ request }) => {
  expect(await (await request.get("/sitemap.xml")).text()).not.toContain("/concepte/");
});
```

- [ ] **Step 3: Rulează testele.** `npx playwright test concepte --project=mobil`. Expected: FAIL, 404 la `/concepte/clinica`.

- [ ] **Step 4: Adaugă în `next.config.ts`** un `rewrites()` cu `/concepte/:slug` → `/concepte/:slug/index.html` și, în `headers()`, `/concepte/:path*` cu `X-Robots-Tag: noindex, nofollow`. Dacă rewrite-ul nu merge cu Next 16.4, alege altă soluție care păstrează adresele și izolarea de layout, și scrie de ce în mesajul de commit.

- [ ] **Step 5: Pune resursele comune.** GSAP din `node_modules/gsap/dist/`. Fonturile, ca `woff2`, doar subseturile latin și latin-ext: Fraunces și Figtree acum, restul la Task 2 și Task 3. Le iei din CSS-ul Google Fonts, cerut cu un User-Agent de Chrome.

- [ ] **Step 6: Creează `clinica/index.html` din `prototip/concept-clinica.html`.**
  - Scoate variantele A și B, parametrii `?v` și `?c`, regulile `[data-c]` 2 și 3, `sala.jpg`, `zambet.jpg`; `<html>` are direct culorile 1.
  - `@font-face` local, `font-display: swap`; scripturile din `/concepte/_comun/`; `ScrollTrigger.config({ ignoreMobileResize: true })`.
  - Banda: `<b>Concept</b> firmă inventată <a href="/#portofoliu">Înapoi</a>`, cu textul redus cât să încapă la 320px.
  - Linkul din subsol: `/#formular`. Păstrează fraza despre Unsplash.
  - Reglează pe desktop distanța dintre subtitlu și arcadă.
  - Pozele în WebP: 1600px lățime (`cabinet`), 1000px (`explica`). Prima imagine: `fetchpriority="high"`.
  - Dacă `/#formular` nu derulează la formular la încărcare directă, raportează, nu repara în acest task.

- [ ] **Step 7: Rulează testele.** `npx playwright test concepte`. Expected: PASS pe `mobil` și `desktop`.

- [ ] **Step 8: Compară vizual** pagina de pe portul 3000 cu prototipul, la 390px: arcada se deschide, „Prima vizită e doar o discuție.” apare, diacriticele se văd în fonturile locale.

- [ ] **Step 9: Commit.** `concepte: infrastructura și Clinica Tei`.

### Task 2: Conu' Leonida

**Files:**
- Create: `site/public/concepte/frizerie/index.html`, `foto/{hol,foarfeca,brici,tuns}.webp`, fonturile Bodoni Moda și Hanken Grotesk în `_comun/fonturi/`
- Modify: `site/tests/e2e/concepte.spec.ts`

**Interfaces:**
- Consumes: resursele din `_comun`, lista `CONCEPTE`.

- [ ] **Step 1: Adaugă în `CONCEPTE`** `{ slug: "frizerie", titlu: "Conu' Leonida", cta: "Programează-te" }`.
- [ ] **Step 2: Rulează.** `npx playwright test concepte -g frizerie --project=mobil`. Expected: FAIL.
- [ ] **Step 3: Creează pagina din `prototip/concept-frizerie-c.html`,** cu aceleași reguli ca Task 1, Step 6. Rămân doar culorile 3 și titlurile Bodoni; scoate `?c`, `?t`, Rozha One, `[data-c]` 1 și 2. `hol` la 1600px, restul la 1000px.
- [ ] **Step 4: Rulează.** `npx playwright test concepte`. Expected: PASS.
- [ ] **Step 5: Compară vizual** la 390px: holul, „Scaunul tău, la ora ta.”, cele 4 servicii cu prețurile 100, 50, 125, 60 de lei, galeria „Cum lucrăm”.
- [ ] **Step 6: Commit.** `concepte: frizeria Conu' Leonida`.

### Task 3: Casa de Cerneală

**Files:**
- Create: `site/public/concepte/tatuaje/index.html`, `foto/{maini,linii,fin,brat,hartie}.webp`, fonturile Gloock și Instrument Sans în `_comun/fonturi/`
- Modify: `site/tests/e2e/concepte.spec.ts`

**Interfaces:**
- Consumes: resursele din `_comun`, lista `CONCEPTE`.

- [ ] **Step 1: Adaugă în `CONCEPTE`** `{ slug: "tatuaje", titlu: "Casa de Cerneală", cta: "Trimite-ne ideea" }` și, separat:

```ts
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
  await expect(page.locator(".tablou figcaption", { hasText: /Ana|Radu|Mara/ })).toHaveCount(0);
});
```

- [ ] **Step 2: Rulează.** `npx playwright test concepte -g tatuaje --project=mobil`. Expected: FAIL.
- [ ] **Step 3: Retușează `maini`:** șterge logo-ul de pe mașina de tatuat, cu aceeași tehnică de umplere ca la panoul din `sala.jpg`, sau taie poza dacă marginea rămâne vizibilă.
- [ ] **Step 4: Creează pagina din `prototip/concept-tatuaje.html`,** cu aceleași reguli ca Task 1, Step 6. Rămân primul ecran C și sala 1; scoate A, B, `.perete`, `?v`, `?r`, `[data-r]` 2 și 3, `.grila`. Pozele `masina` și `artist` nu se copiază. Leagă `deseneaza` de `ScrollTrigger.addEventListener("refresh", deseneaza)`.
- [ ] **Step 5: Rulează.** `npx playwright test concepte`. Expected: PASS.
- [ ] **Step 6: Compară vizual** la 390px: pata, „Fiecare desen, făcut o singură dată.”, ramele, lumina pe tablouri.
- [ ] **Step 7: Commit.** `concepte: salonul Casa de Cerneală`.

### Task 4: Cardurile din portofoliu

**Files:**
- Modify: `site/content/portofoliu.ts`, `site/components/home/Portofoliu.tsx`, `site/components/home/home.css`
- Create: `site/public/portofoliu/{frizerie,tatuaje}.webp`; înlocuiește `clinica.webp`; șterge `salon.webp`, `service.webp`
- Test: `site/tests/e2e/home.spec.ts`

**Interfaces:**
- Produces: `ElementPortofoliu` cu `link?: string`, fără `inCurand`.

- [ ] **Step 1: Scrie testul în `describe("portofoliu")`**

```ts
test("cardurile-concept duc la pagini și nu mai sunt „în curând”", async ({ page }) => {
  await page.goto("/");
  const carduri = page.locator("#portofoliu .it.concept");
  await expect(carduri).toHaveCount(3);
  for (const [i, cale] of ["/concepte/clinica", "/concepte/frizerie", "/concepte/tatuaje"].entries())
    await expect(carduri.nth(i).locator("a").first()).toHaveAttribute("href", cale);
  await expect(page.locator("#portofoliu")).not.toContainText("în curând");
});
```

- [ ] **Step 2: Rulează.** `npx playwright test home -g portofoliu --project=mobil`. Expected: FAIL.
- [ ] **Step 3: Actualizează `PORTOFOLIU`.** Ultimele trei intrări, în ordine, cu titlurile și descrierile din `prototip/concept-carduri.html`, `link` și imaginile noi. Scoate `inCurand` din tip și din date, plus clasele `.soon` și `.cc`.
- [ ] **Step 4: Fă imaginile cardurilor** din pozele complete, cu încadrarea din `concept-carduri.html` (`hol` la `object-position: 50% 62%`, `maini` retușată la `50% 38%`), 800×500, WebP.
- [ ] **Step 5: Leagă cardul în `Portofoliu.tsx`.** Când există `el.link`, conținutul cardului stă într-un `<a href>` simplu, nu `next/link`: destinația e un fișier static. Focus vizibil, aceeași mișcare la hover. Proiectele fără link rămân cum sunt.
- [ ] **Step 6: Rulează.** `npx playwright test home`, `npx vitest run`, `npx tsc --noEmit -p .`. Expected: PASS.
- [ ] **Step 7: Commit.** `portofoliu: cardurile duc la site-urile-concept`.

### Task 5: Verificarea și previzualizarea

**Files:**
- Modify: `docs/progres-brainstorming.md`, `CLAUDE.md` (tabelul „Unde sunt lucrurile”: paginile-concept și sursele pozelor)

- [ ] **Step 1: Rulează din `site/`:** `npx vitest run`, `npm run verifica`, `npm run lint`, `npx tsc --noEmit -p .`, `npx playwright test`. Expected: verde, cu excepția testului Aurora (desktop) din `fluiditate.spec.ts`, care pică și pe `main`.
- [ ] **Step 2: Rulează `npm run e2e:prod`** (~2 min), cu serverul de dev oprit sau cu `NEXT_DIST_DIR`. Adaugă în `tests/prod/` o verificare că `/concepte/frizerie` dă 200 și `noindex` în build de producție. Expected: PASS.
- [ ] **Step 3: Actualizează stadiul și `CLAUDE.md`,** apoi comite și dă `git push -u origin concepte`.
- [ ] **Step 4: Dă-i lui Andrei adresa previzualizării Vercel** pentru cele trei pagini și portofoliu. **Oprește-te aici.** Unirea în `main` se face doar la „da”-ul lui, după ce a verificat pe telefon fluiditatea animațiilor. Dacă pata sau arcada sacadează, simplifică efectul păstrând ideea (cerința din spec).
