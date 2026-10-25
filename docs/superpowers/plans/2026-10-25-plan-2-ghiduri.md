# Plan 2 — Uneltele pentru ghiduri (CLAUDE.md, skill-uri, PDF) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Andrei poate cere „fă ghidul pentru postarea X” și Claude scrie caruselul și ghidul după standard, le verifică automat, generează PDF-ul și publică prin previzualizare → `main`, fără pași inventați pe moment.

**Architecture:** Regulile proiectului stau în `CLAUDE.md`, la rădăcina repo-ului. Procedura stă în două skill-uri de proiect, `.claude/skills/ghid-nou/` și `.claude/skills/idei/`. Partea care se poate verifica de o mașină e cod testat în `site/`: o verificare a ghidului (`npm run verifica`) și generarea PDF-ului (`npm run pdf`), plus trei reparații amânate din Plan 1, care țin de scrierea și găsirea ghidurilor. Scripturile rulează cu `tsx`, ca să folosească același `lib/` ca site-ul.

**Tech Stack:** cel din Plan 1 (Next.js 16, TypeScript, zod, gray-matter, Vitest, Playwright), plus `tsx` (devDependency, pentru scripturi). PDF-ul se face cu Chromium din `@playwright/test` (`page.pdf`). Transcrierea clipurilor se face cu `hyperframes transcribe` (instalat global, v0.8.98).

**Spec:** `docs/superpowers/specs/2026-10-22-site-buildwithac-design.md`: §6 (standardul și PDF-ul), §10 (publicarea), §11 (`CLAUDE.md`), §12 („ghid nou”), §13 („idei”). Stadiul și deciziile discutate sunt în `docs/progres-brainstorming.md`.

**Ce nu intră aici (Plan 3):** Kit (expeditor `ac@`, DMARC), limita de cereri din Vercel Firewall, primul ghid adevărat, lansarea. Tot în Plan 3 trec și lucrurile mici amânate din Plan 1 care nu țin de ghiduri: 404 cu HTTP 200 la primul acces, timeout la Kit + „Se trimite…”, focusul prins în caseta PDF și în meniul ☰, focusul în pista orizontală, durata abonărilor neconfirmate pe pagina de confidențialitate.

## Global Constraints

- Tot textul (site, `CLAUDE.md`, skill-uri, mesajele uneltelor) e în română, cu diacritice cu virgulă (ș, ț), niciodată cu sedilă (ş, ţ).
- Un ghid se scrie **doar** din componentele `<Pas titlu="…">`, `<Prompt>`, `<CeVezi src="…" alt="…" />`, `<DacaNuMerge>`, `<GresealaMea>`, `<Atentie>`, `<DeCeAiNevoie>`, plus Markdown. Fără HTML de mână.
- Frontmatter-ul e cel validat de `FrontmatterGhid` din `site/lib/ghiduri.ts`. Câmpurile nu se schimbă în planul ăsta.
- Ghidurile de exemplu (`exemplu: true`) nu apar niciodată când `VERCEL_ENV === "production"`. Un ghid adevărat nu are `exemplu: true`.
- Pe `main` nu ajung niciodată ghiduri neterminate: ciornele stau pe ramura `ghid/<slug>`.
- PDF-ul stă la `site/public/pdf/<slug>-<cheie>.pdf`, unde `<cheie>` = 12 caractere hex. Nu e listat nicăieri (nici sitemap, nici link pe site), robots îl exclude, iar răspunsul are `X-Robots-Tag: noindex, nofollow`. La regenerare, cheia se păstrează.
- Domeniul, e-mailul și link-urile sociale se iau doar din `site/lib/config.ts` (`SITE`), inclusiv în scripturi.
- Singura dependență nouă e `tsx` (dev). PDF-ul folosește Playwright-ul existent.
- Mesajele de commit se termină cu `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Pașii grei (subagenți, build-uri lungi) se anunță lui Andrei înainte (limita de folosire).

## Review Focus

1. **`<Pas` într-un bloc de cod** (ghidul despre site-uri poate arăta cod JSX). Numerotarea, cuprinsul și cercul de progres trebuie să rămână corecte. Testul e în Task 1.
2. **PDF cu imagini încărcate leneș** (`next/image` e `lazy`). Toate capturile trebuie să apară în PDF, nu cadre goale. Testul e în Task 4.
3. **PDF regenerat după o actualizare.** Link-ul trimis deja pe Instagram trebuie să meargă în continuare (aceeași cheie). Testul e în Task 4.
4. **ş/ţ cu sedilă**, copiate dintr-un text vechi. Verificarea trebuie să le prindă ca eroare, cu rândul. Testul e în Task 3.
5. **O captură pe care Andrei n-a trimis-o încă.** Previzualizarea arată un loc marcat („captură de pus: …”), nu o imagine spartă, iar verificarea blochează unirea în `main`. Testele sunt în Task 3.

---

## Structura fișierelor

```
C:\Portofoliu AC\
  CLAUDE.md                              ← nou (Task 5)
  .claude\skills\ghid-nou\               ← nou (Task 6)
    SKILL.md  standard.md  carusel.md  publicare.md  email.md
  .claude\skills\idei\SKILL.md           ← nou (Task 7)
  continut\                              ← nou (Task 5)
    idei.md
    ghiduri\.gitkeep
  site\
    lib\ghiduri.ts                       ← modificat (Task 1): pașii găsiți corect
    lib\cautare.ts                       ← modificat (Task 2): mai multe cuvinte
    lib\verificare.ts                    ← nou (Task 3)
    scripts\verifica-ghid.ts             ← nou (Task 3)
    scripts\pdf\tipar.ts                 ← nou (Task 4): tiparesteGhid, numePdf
    scripts\pdf.ts                       ← nou (Task 4): comanda
    components\ghid\Notite.tsx           ← modificat (Task 3): CeVezi cu loc marcat
    components\ghid\tipar.css            ← nou (Task 4)
    components\ghiduri\Colaj.tsx         ← modificat (Task 2)
    app\ghiduri\[slug]\page.tsx          ← modificat (Task 1, 4)
    app\robots.ts  next.config.ts        ← modificate (Task 4)
```

---

### Task 1: Pașii ghidului, găsiți la fel peste tot

Repară „numerotarea pașilor se poate desincroniza” (amânat din Plan 1). Acum cuprinsul (`extragePasi`) și numerotarea (`numeroteazaPasii` din pagină) folosesc două expresii diferite și ambele prind și `<Pas` din cod.

**Files:**
- Modify: `site/lib/ghiduri.ts` (`extragePasi`, `citesteGhid`)
- Modify: `site/app/ghiduri/[slug]/page.tsx` (scoate `numeroteazaPasii` local și îl importă)
- Test: `site/tests/unit/ghiduri.test.ts`, fixture nou `site/tests/unit/fixtures/ghiduri-pas-fara-titlu/x/index.mdx`

**Interfaces:**
- Produces: `extragePasi(corp: string): Pas[]` (exportat) și `numeroteazaPasii(corp: string): string` (exportat), ambele din `@/lib/ghiduri`. Primul `<Pas>` adevărat are `id: "pas-1"`. `Pas` rămâne `{ id: string; titlu: string }`.

- [ ] **Step 1: Scrie testele care pică**

```ts
describe("pașii", () => {
  const corp = [
    '<Pas titlu="Unu">a</Pas>',
    "```jsx\n<Pas titlu=\"Din cod\">x</Pas>\n```",
    "Text cu `<Pas titlu=\"inline\">` în el.",
    '<Pas\n  titlu="Doi">b</Pas>',
  ].join("\n\n");

  it("ignoră <Pas> din cod și prinde titlu pe alt rând", () =>
    expect(extragePasi(corp)).toEqual([{ id: "pas-1", titlu: "Unu" }, { id: "pas-2", titlu: "Doi" }]));

  it("numerotează doar pașii adevărați, în aceeași ordine", () => {
    const n = numeroteazaPasii(corp);
    expect(n).toContain('<Pas id="pas-1" n="1" titlu="Unu"');
    expect(n).toContain('<Pas id="pas-2" n="2"\n  titlu="Doi"');
    expect(n).toContain('```jsx\n<Pas titlu="Din cod">');
    expect(n).toContain('`<Pas titlu="inline">`');
  });

  it("un <Pas> fără titlu=\"…\" oprește încărcarea, cu numele fișierului", () =>
    expect(() => incarcaGhiduri(fx("ghiduri-pas-fara-titlu"), dev)).toThrow(/x[\\/]index\.mdx.*titlu/s));
});
```

Fixture-ul `ghiduri-pas-fara-titlu/x/index.mdx`: frontmatter valid (copiat din `fixtures/ghiduri/a`, cu `slug: x`, `cuvant: X`) și corpul `<Pas titlu='Ghilimele simple'>a</Pas>`.

- [ ] **Step 2: Rulează și verifică că pică**

Run: `cd site && npx vitest run tests/unit/ghiduri.test.ts`
Expected: FAIL (`numeroteazaPasii` nu e exportat; „Din cod” apare în listă).

- [ ] **Step 3: Implementează**

O singură funcție internă `pozitiiPasi(corp)` găsește pașii. Ea înlocuiește întâi blocurile ```…``` și codul inline `…` cu spații de aceeași lungime, ca pozițiile să rămână valabile. Apoi caută `<Pas\b` și, în eticheta deschisă, `titlu="…"` (oriunde printre atribute, pe orice rând). Un `<Pas` fără `titlu="…"` aruncă `Error("Pasul N nu are titlu=\"…\" (cu ghilimele duble)")`. `citesteGhid` prinde eroarea și o rearuncă cu `path.join(nume, "index.mdx")` în față, ca la frontmatter. `extragePasi` și `numeroteazaPasii` folosesc amândouă `pozitiiPasi`. Pagina importă `numeroteazaPasii`.

- [ ] **Step 4: Rulează testele unitare și e2e-ul ghidului**

Run: `cd site && npx vitest run && npx playwright test tests/e2e/ghid.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add site/lib/ghiduri.ts site/app/ghiduri/[slug]/page.tsx site/tests/unit
git commit -m "fix: pașii ghidului se găsesc la fel în cuprins și în numerotare, fără cei din cod"
```

---

### Task 2: Căutarea cu mai multe cuvinte și pagina fără ghiduri

Două lucruri amânate din Plan 1: „claude animatii” nu găsește nimic; `/ghiduri` fără ghiduri arată „0 ghiduri gratuite” deasupra mesajului.

**Files:**
- Modify: `site/lib/cautare.ts` (`cauta`)
- Modify: `site/components/ghiduri/Colaj.tsx:48` (rândul cu numărul)
- Test: `site/tests/unit/cautare.test.ts`, `site/tests/prod/productie.spec.ts`

**Interfaces:**
- Produces: `cauta<T extends GhidCautabil>(ghiduri: T[], intrebare: string): Rezultat<T>[]`, aceeași semnătură. `exact` e `true` doar când toată întrebarea normalizată e egală cu cuvântul ghidului.

- [ ] **Step 1: Scrie testele care pică** (în `cautare.test.ts`, cu `GHIDURI` existent)

```ts
describe("mai multe cuvinte", () => {
  const sluguri = (q: string) => cauta(GHIDURI, q).map((r) => r.ghid.slug);
  it("găsește în orice ordine", () => {
    expect(sluguri("claude animatii")).toEqual(["animatii"]);
    expect(sluguri("animatii claude")).toEqual(["animatii"]);
  });
  it("cuvintele pot fi în câmpuri diferite", () => expect(sluguri("gsap intro")).toEqual(["animatii"]));
  it("un cuvânt fără potrivire elimină ghidul", () => expect(sluguri("claude xyz")).toEqual([]));
  it("„claude” singur le găsește pe toate trei", () => expect(sluguri("claude")).toHaveLength(3));
  it("cuvântul exact rămâne marcat", () => expect(cauta(GHIDURI, "site")[0]).toMatchObject({ exact: true }));
});
```

În `productie.spec.ts`, testul „pagina de ghiduri spune că primul ghid vine curând” mai primește:

```ts
await expect(page.getByText(/0\s+ghiduri/)).toHaveCount(0);
```

- [ ] **Step 2: Rulează și verifică că pică**

Run: `cd site && npx vitest run tests/unit/cautare.test.ts`
Expected: FAIL la „găsește în orice ordine”.

- [ ] **Step 3: Implementează**

Întrebarea normalizată se împarte în cuvinte. Un ghid rămâne doar dacă **fiecare** cuvânt are `rang ≥ 0`. Rangul ghidului e cel mai mare rang dintre cuvinte (cel mai slab cuvânt decide). `exact` se calculează pe toată întrebarea, ca acum. În `Colaj.tsx`, rândul cu numărul nu se mai afișează când `ghiduri.length === 0`.

- [ ] **Step 4: Rulează**

Run: `cd site && npx vitest run && npx playwright test tests/e2e/ghiduri.spec.ts && npm run e2e:prod`
Expected: PASS (e2e:prod face un build, durează ~2 min)

- [ ] **Step 5: Commit**

```bash
git add site/lib/cautare.ts site/components/ghiduri/Colaj.tsx site/tests
git commit -m "fix: căutarea găsește mai multe cuvinte în orice ordine; fără „0 ghiduri” pe pagina goală"
```

---

### Task 3: Verificarea unui ghid (`npm run verifica`)

Partea din lista de verificare (§12) pe care o poate face o mașină. Tot aici intră locul marcat pentru capturile care lipsesc.

**Files:**
- Create: `site/lib/verificare.ts`, `site/scripts/verifica-ghid.ts`
- Modify: `site/components/ghid/Notite.tsx` (`CeVezi`), `site/components/ghid/ghid.css` (`.shot.lipsa`)
- Modify: `site/package.json` (devDependency `tsx`; script `"verifica": "tsx scripts/verifica-ghid.ts"`)
- Test: `site/tests/unit/verificare.test.ts`, `site/tests/unit/cevezi.test.tsx`, fixture-uri noi în `site/tests/unit/fixtures/verificare/`

**Interfaces:**
- Consumes: `Ghid`, `extragePasi`, `toateGhidurile`, `incarcaGhiduri` din `@/lib/ghiduri`.
- Produces:
  - `type Problema = { nivel: "eroare" | "avertisment"; mesaj: string }`
  - `verificaGhid(g: Ghid, o: { dosarPublic: string; azi?: Date }): Problema[]`
  - comanda `npm run verifica -- <slug>`: fără slug verifică toate ghidurile care nu sunt exemplu. Afișează erorile, apoi avertismentele; iese cu codul 1 dacă există vreo eroare.
  - `CeVezi`: dacă `public/ghiduri/<dosar>/<src>` nu există, randează `<figure className="shot lipsa">` cu textul „captură de pus: {alt}”.

**Regulile** (mesajele sunt în română și numesc pasul sau rândul):

| Nivel | Regula |
|---|---|
| eroare | `exemplu: true` |
| eroare | imaginea din `imagine` lipsește din `public/ghiduri/<dosar>/` |
| eroare | `<CeVezi src>` spre un fișier care lipsește („captură lipsă: x.webp, pasul N”) |
| eroare | lipsește `<DeCeAiNevoie>`, sau ghidul are 0 pași |
| eroare | `ş ţ Ş Ţ` (sedilă) oriunde, cu numărul rândului |
| eroare | o etichetă `<Ceva` în afara codului care nu e una dintre cele 7 componente |
| eroare | text de umplutură: `TODO`, `TBD`, `lorem ipsum`, `[CAPTURĂ]`, `[LINK]`, `[PREȚ]` |
| eroare | `<Prompt>` gol |
| eroare | `pdf: true`, dar niciun fișier `public/pdf/<slug>-<12 hex>.pdf` |
| eroare | `actualizat` după `azi`, sau `publicat` după `actualizat` |
| avertisment | linia lungă `—` (semn de text AI): câte sunt |
| avertisment | `<DeCeAiNevoie>` fără preț (fără `\d+ $/€/lei/RON` și fără „gratuit”) |
| avertisment | pas fără `<CeVezi>` („ok doar dacă nu e un pas important”) |
| avertisment | câte `<GresealaMea>` are („confirmă că vin din clip sau de la Andrei”) |
| avertisment | `descriere` peste 160 de caractere |
| avertisment | `actualizat` mai vechi de 90 de zile față de `azi` |

- [ ] **Step 1: Scrie testele care pică**

`verificare.test.ts` construiește ghidurile cu un ajutor `ghid(corp, frontmatter?)` peste un `Ghid` valid de bază, iar `dosarPublic` e `fixtures/verificare/public` (conține `ghiduri/t/cover.webp`, `ghiduri/t/ok.webp` și `pdf/t-0123456789ab.pdf`, fișiere de câțiva octeți). `azi = new Date("2026-10-25")`. Un test pentru fiecare rând din tabel, de forma:

```ts
const erori = (p: Problema[]) => p.filter((x) => x.nivel === "eroare").map((x) => x.mesaj);
it("ghidul de bază n-are erori", () => expect(erori(verificaGhid(ghid(BAZA), o))).toEqual([]));
it("sedila e eroare, cu rândul", () =>
  expect(erori(verificaGhid(ghid(BAZA + "\n\nşi"), o)).join()).toMatch(/sedil.*rândul \d+/));
it("<div> e etichetă nepermisă, dar nu în cod", () => {
  expect(erori(verificaGhid(ghid(BAZA + "\n\n<div>x</div>"), o)).join()).toMatch(/<div>/);
  expect(erori(verificaGhid(ghid(BAZA + "\n\n```html\n<div>x</div>\n```"), o))).toEqual([]);
});
it("captura lipsă e eroare, cu pasul", () =>
  expect(erori(verificaGhid(ghid('<DeCeAiNevoie>- 20 $/lună</DeCeAiNevoie>\n\n<Pas titlu="A"><CeVezi src="nu.webp" alt="x" /></Pas>'), o)).join())
    .toMatch(/nu\.webp.*pasul 1/));
it("pdf: true fără fișier e eroare; cu fișier, nu", () => {
  expect(erori(verificaGhid(ghid(BAZA, { pdf: true, slug: "u", dosar: "t" }), o)).join()).toMatch(/pdf/i);
  expect(erori(verificaGhid(ghid(BAZA, { pdf: true }), o))).toEqual([]);
});
```

Plus un test care trece prin **toate ghidurile adevărate** din `content/ghiduri` (`incarcaGhiduri(undefined, { productie: true })`) și cere 0 erori pentru fiecare. Acum lista e goală, deci trece. Din momentul în care apare primul ghid, `npx vitest run` blochează un ghid stricat.

`cevezi.test.tsx`: `CeVezi({ src: "directii.webp", … dosar: "site-uri-fara-aer-de-ai" })` randează un `img`; cu `src: "nu-exista.webp", alt: "Pagina de start"` randează textul „captură de pus: Pagina de start” și niciun `img`.

- [ ] **Step 2: Rulează și verifică că pică**

Run: `cd site && npx vitest run tests/unit/verificare.test.ts tests/unit/cevezi.test.tsx`
Expected: FAIL (`@/lib/verificare` nu există)

- [ ] **Step 3: Implementează** `verificaGhid` în `lib/verificare.ts` (regulile din tabel; codul se ascunde la fel ca în Task 1, cu o funcție comună exportată din `lib/ghiduri.ts` dacă e nevoie), `CeVezi` cu `fs.existsSync` pe `path.join(process.cwd(), "public", "ghiduri", dosar, src)`, stilul `.shot.lipsa` (foaie crem cu chenar întrerupt, text Caveat), apoi `scripts/verifica-ghid.ts` și `npm i -D tsx`.

- [ ] **Step 4: Rulează**

Run: `cd site && npx vitest run && npm run verifica -- site-uri-fara-aer-de-ai`
Expected: vitest PASS. Comanda afișează eroarea „exemplu: true” (ghidul e de exemplu) și iese cu codul 1. Asta dovedește că merge comanda.

- [ ] **Step 5: Commit**

```bash
git add site/lib/verificare.ts site/scripts site/components/ghid site/package.json site/package-lock.json site/tests/unit
git commit -m "feat: npm run verifica — verificarea automată a unui ghid; loc marcat pentru capturile lipsă"
```

---

### Task 4: PDF-ul ghidului (`npm run pdf`)

§6: PDF-ul se face din pagina ghidului, cu un stil de tipar separat (foi crem, fără animații), și stă la o adresă greu de ghicit.

**Files:**
- Create: `site/components/ghid/tipar.css` (importat în `app/ghiduri/[slug]/page.tsx`)
- Modify: componentele ghidului, care primesc `data-fara-tipar` pe ce nu intră în PDF (Nav, Footer, Aurora, cercul de progres, bifele, butoanele „Copiază”, caseta PDF, formularul din `FinalGhid`)
- Create: `site/scripts/pdf/tipar.ts`, `site/scripts/pdf.ts`
- Modify: `site/next.config.ts` (`headers()`), `site/app/robots.ts`, `site/package.json` (`"pdf": "tsx scripts/pdf.ts"`), `site/.gitignore` și `site/eslint.config.mjs` (`.next-pdf/`)
- Test: `site/tests/unit/pdf.test.ts`, `site/tests/e2e/pdf.spec.ts`

**Interfaces:**
- Consumes: `SITE` din `@/lib/config`; `ghidDupaSlug` din `@/lib/ghiduri`.
- Produces:
  - `numePdf(slug: string, existente: string[], cheieNoua?: () => string): string`: dacă în `existente` e un fișier `^<slug>-[0-9a-f]{12}\.pdf$`, îl întoarce pe acela; altfel `<slug>-<cheieNoua()>.pdf` (implicit `randomBytes(6).toString("hex")`).
  - `tiparesteGhid(page: Page, url: string): Promise<Buffer>`: deschide pagina, emulează `media: "print"` și `reducedMotion: "reduce"`, face toate imaginile `loading="eager"` și așteaptă să fie încărcate, așteaptă `document.fonts.ready`, apoi `page.pdf({ format: "A4", printBackground: true, displayHeaderFooter: true, … })`. În subsol scrie `buildwithac.ro/ghiduri/<slug>` și „pagina X din Y”.
  - Comanda `npm run pdf -- <slug> [--url <bază>]`. Fără `--url`, face build cu `NEXT_DIST_DIR=.next-pdf`, pornește `next start` pe portul 3003 și îl oprește la final. Scrie `public/pdf/<nume>`, apoi afișează link-ul complet `${SITE.url}/pdf/<nume>` și o reamintire: dacă `pdf: false`, schimbă în `pdf: true`.

**Ce cere stilul de tipar** (aspectul exact e la implementare, §15): A4, fundal crem `#f6efe3`, text `#0b0908`; sus, titlul, descrierea, durata, nivelul și „actualizat la”; toți pașii numerotați, vizibili, pe foi cu colțuri rotunjite; prompturile cu textul întreg (`white-space: pre-wrap`); capturile, notițele și „dacă nu merge” cu `break-inside: avoid`; titlul unui pas nu rămâne singur jos pe pagină; link-urile externe primesc adresa în paranteză.

- [ ] **Step 1: Scrie testele care pică**

`pdf.test.ts`:

```ts
it("păstrează cheia existentă", () =>
  expect(numePdf("site", ["site-0123456789ab.pdf", "alt-ffffffffffff.pdf"])).toBe("site-0123456789ab.pdf"));
it("nu confundă slug-urile care încep la fel", () =>
  expect(numePdf("site", ["site-uri-0123456789ab.pdf"], () => "aaaaaaaaaaaa")).toBe("site-aaaaaaaaaaaa.pdf"));
it("cheia nouă are 12 caractere hex", () => expect(numePdf("x", [])).toMatch(/^x-[0-9a-f]{12}\.pdf$/));
it("/pdf/ primește noindex", async () => {
  const h = await nextConfig.headers!();
  expect(h).toContainEqual({ source: "/pdf/:fisier*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] });
});
it("robots exclude /pdf/ în producție", () => {
  vi.stubEnv("VERCEL_ENV", "production");
  expect(robots().rules).toMatchObject({ disallow: "/pdf/" });
});
```

`pdf.spec.ts` (doar proiectul `desktop`: `page.pdf` merge doar în Chromium), pe `/ghiduri/site-uri-fara-aer-de-ai`:

```ts
test("în tipar: ce nu e ghid dispare, pașii și capturile sunt toate vizibile", async ({ page }) => {
  await page.emulateMedia({ media: "print", reducedMotion: "reduce" });
  await page.goto("/ghiduri/site-uri-fara-aer-de-ai");
  for (const el of await page.locator("[data-fara-tipar]").all()) await expect(el).toBeHidden();
  const pasi = page.locator("section.k-sheet");
  await expect(pasi).toHaveCount(5);
  for (const p of await pasi.all()) expect(await p.evaluate((e) => getComputedStyle(e).opacity)).toBe("1");
});
test("PDF-ul iese, are mai multe pagini și imaginile încărcate", async ({ page, baseURL }) => {
  const buf = await tiparesteGhid(page, `${baseURL}/ghiduri/site-uri-fara-aer-de-ai`);
  expect(buf.subarray(0, 4).toString()).toBe("%PDF");
  expect(buf.toString("latin1").match(/\/Type\s*\/Page[^s]/g)!.length).toBeGreaterThan(1);
  expect(await page.locator("img").evaluateAll((imgs) => imgs.every((i) => (i as HTMLImageElement).complete && (i as HTMLImageElement).naturalWidth > 0))).toBe(true);
});
```

- [ ] **Step 2: Rulează și verifică că pică**

Run: `cd site && npx vitest run tests/unit/pdf.test.ts && npx playwright test tests/e2e/pdf.spec.ts --project=desktop`
Expected: FAIL

- [ ] **Step 3: Implementează** `tipar.css`, atributele `data-fara-tipar`, `scripts/pdf/tipar.ts`, `scripts/pdf.ts`, `headers()` și `robots` (în producție: `allow: "/"`, `disallow: "/pdf/"`).

- [ ] **Step 4: Rulează testele**

Run: `cd site && npx vitest run && npx playwright test`
Expected: PASS (toată suita, ca nimic din ghid să nu se fi stricat pe ecran)

- [ ] **Step 5: Generează PDF-ul ghidului de exemplu și arată-i-l lui Andrei**

Run: `cd site && npm run pdf -- site-uri-fara-aer-de-ai`
Expected: `public/pdf/site-uri-fara-aer-de-ai-<cheie>.pdf` și link-ul afișat. Deschide PDF-ul în browser pentru Andrei, care îl judecă vizual. Ajustările lui intră în `tipar.css`, iar după ele se rulează din nou pașii 4–5. **Fișierul ăsta nu se pune în commit** (e al unui ghid de exemplu): după aprobare, șterge-l.

- [ ] **Step 6: Commit**

```bash
git add site/components site/scripts site/app site/next.config.ts site/package.json site/.gitignore site/eslint.config.mjs site/tests
git commit -m "feat: npm run pdf — PDF-ul ghidului din pagina lui, cu stil de tipar; /pdf/ neindexat"
```

---

### Task 5: `CLAUDE.md` și dosarul `continut/`

**Files:**
- Create: `CLAUDE.md` (rădăcina repo-ului), `continut/idei.md`, `continut/ghiduri/.gitkeep`

**Ce conține `CLAUDE.md`** (§11; scurt, sub ~150 de rânduri, cu titluri ca să se găsească repede):
1. **Proiectul**: §1 în 4–5 rânduri: drumul clip → bio → site → ghid, publicul, telefonul întâi; link spre documentul de design și spre `docs/progres-brainstorming.md` („stadiul: citește «DE AICI CONTINUĂM»”).
2. **Limba**: română, diacritice cu virgulă; `npm run verifica` prinde sedila.
3. **Lucrul cu Andrei**: judecă vizual (previzualizare sau browser, nu descrieri); variante de comparat cu un comutator; ia decizii pe bucăți; pașii grei se anunță înainte; la final de sesiune se salvează stadiul în `docs/progres-brainstorming.md`; extensia Chrome nu deschide `file://` (`python -m http.server 8765` din `prototip/`).
4. **Ce nu e referință**: „editorial crem” și PDF-urile vechi din `C:\Instagram Content Pipeline`; postările tăiate cu roșu din `Exemple/`.
5. **Sistemul vizual**: tabelul de culori și fonturi din §4 (fără Shrikhand) și unde e fiecare prototip.
6. **Ghidurile**: trimitere la `.claude/skills/ghid-nou/standard.md` pentru standard și ton, plus cele 7 reguli de ton din §11 scrise aici pe scurt (se aplică și textelor de pe site).
7. **Verificarea ghidurilor gratuite**: fără testare cap-coadă; Claude verifică singur link-urile, prețurile, versiunile și comenzile (într-un dosar gol); „actualizat la [data]”.
8. **Publicarea**: fluxul §10 în 7 rânduri; ciornele doar pe `ghid/<slug>`; înainte de unirea în `main`: `npx vitest run`, `npm run verifica -- <slug>`, `npm run lint`.
9. **Ce se poate copia de la alții**: subiectul și ideea, da; textul și designul, cuvânt cu cuvânt, nu.
10. **Portofoliul**: doar munca lui Andrei; conceptele marcate „Concept”.
11. **Codul**: aplicația e în `site/` (citește `site/AGENTS.md` înainte de cod Next.js); domeniul și e-mailul doar în `site/lib/config.ts`; comenzile (`npm run dev`, `npx vitest run`, `npx playwright test`, `npm run e2e:prod`, `npm run verifica`, `npm run pdf`); GitHub `ciocanaruandre-sketch/buildwithac` (privat), ramurile; previzualizările Vercel cer conectare; finalul mesajelor de commit.
12. **Unde sunt lucrurile**: tabel (site, conținut de lucru, skill-uri, prototipuri, montajul hero, logo-ul).

`continut/idei.md` pornește cu două secțiuni goale, în formatul din Task 7: `## De făcut` și `## Postate`.

- [ ] **Step 1: Scrie fișierele.**
- [ ] **Step 2: Verifică** cu `grep -c "^## " CLAUDE.md` (cel puțin 12 secțiuni), `grep -n "[şţŞŢ]" CLAUDE.md` (niciun rezultat) și `wc -l CLAUDE.md` (sub ~150). Fiecare comandă pomenită trebuie să existe în `site/package.json`.
- [ ] **Step 3: Andrei citește `CLAUDE.md`.** Corecturile lui intră înainte de commit.
- [ ] **Step 4: Commit**

```bash
git add CLAUDE.md continut
git commit -m "docs: CLAUDE.md cu regulile proiectului; dosarul continut/"
```

---

### Task 6: Skill-ul „ghid nou”

§12, plus fluxul din §10. Se scrie cu ajutorul skill-ului `superpowers:writing-skills` (structura și descrierea care declanșează skill-ul).

**Files:**
- Create: `.claude/skills/ghid-nou/SKILL.md`, `standard.md`, `carusel.md`, `publicare.md`, `email.md`

**Interfaces:**
- Consumes: `npm run verifica` (Task 3), `npm run pdf` (Task 4), `CLAUDE.md` (Task 5), `continut/idei.md`.

**Ce conține fiecare fișier:**
- `SKILL.md`: frontmatter `name: ghid-nou` și o `description` în română care pornește skill-ul la „fă ghidul”, „ghid nou”, „am postat un clip/carusel despre…”. Apoi: cele două situații (doar prima e acoperită; ghidurile separate și cele plătite se discută separat) și cei 8 pași din §12, fiecare cu fișierul de citit sau comanda de rulat:
  - **la clip**: clipul e în `continut/clipuri/`; transcrierea se face cu `hyperframes transcribe <clip> -m large-v3 -l ro --to srt -o continut/ghiduri/<slug>/transcriere.srt`; ghidul urmează ce spune Andrei în clip;
  - **la carusel**: `carusel.md`;
  - întrebarea despre greșelile reale ale lui Andrei pentru „greșeala mea”, cu regula „nu se inventează, altfel devine «Atenție» cu o capcană reală”;
  - cuvântul-cheie unic (îl verifică și încărcarea ghidurilor);
  - lista de verificare din §12, cu ce prinde `npm run verifica` și ce rămâne de verificat de mână.
- `standard.md`: structura ghidului (§6), frontmatter-ul cu fiecare câmp explicat (exemplul din §6), cele 7 componente cu sintaxa exactă și când se folosește fiecare, capturile („ce ar trebui să vezi” după fiecare pas important; numele fișierelor `pas-N-ce.webp` în `site/public/ghiduri/<slug>/`; cele netrimise rămân ca loc marcat și apar în lista pentru Andrei), tonul (cele 7 reguli din §11, fiecare cu un exemplu bun și unul rău, în română) și o listă concretă de semne de text AI de evitat (linia lungă „—”, înșiruirile de câte trei, „nu doar X, ci și Y”, „Hai să…”, „În lumea de azi”, „revoluționar”, „fără efort”, întrebările retorice la început, încheierile de tipul „Sper că…”).
- `carusel.md`: formatul lui `continut/ghiduri/<slug>/carusel.md`: slide 1 = cârligul, cu același titlu și aceeași imagine ca ghidul; 6–10 slide-uri, cu cel mult ~25 de cuvinte fiecare; caruselul spune *ce*, ghidul *cum*; ultima slide: „caută **CUVÂNT** pe buildwithac.ro · link în bio”; fără link-uri în postare; descrierea postării și hashtag-urile. Andrei face designul în Canva, deci textul e gata de copiat slide cu slide.
- `publicare.md`: pașii exacți:
  1. `git switch -c ghid/<slug>`;
  2. commit;
  3. `npm run verifica -- <slug>` și `npx vitest run`;
  4. `git push -u origin ghid/<slug>`;
  5. link-ul previzualizării (din Vercel sau din `gh`), pe care Andrei îl deschide pe telefon, conectat;
  6. corecturi;
  7. la „Publică”: `npm run pdf -- <slug>` (dacă e cazul), `pdf: true`, verificare, unire în `main`, push, plus o verificare pe `https://buildwithac.ro/ghiduri/<slug>`;
  8. textul e-mailului din `email.md`;
  9. ideea marcată ca postată în `continut/idei.md`;
  10. dacă ghidul vine dintr-un clip, întrebarea dacă intră pe peretele de clipuri (`site/content/clipuri.ts`).

  Plus: ce se face dacă verificarea dă erori, cum se actualizează un ghid publicat (data `actualizat`, PDF regenerat cu aceeași cheie) și unde se notează link-ul PDF-ului (`continut/ghiduri/<slug>/note.md`).
- `email.md`: șablonul e-mailului „ghid nou” din Kit: subiect, 3–4 rânduri, link spre ghidul de pe site (nu spre PDF), fără ritm promis. Plus o reamintire: Kit pe planul gratuit nu are automatizări, deci Andrei îl trimite manual.

- [ ] **Step 1: Scrie fișierele.**
- [ ] **Step 2: Verifică** frontmatter-ul `SKILL.md` (`name`, `description`), că fiecare comandă și cale pomenită există (`grep` în `site/package.json` și pe disc) și că nu există sedilă.
- [ ] **Step 3: Probă pe uscat (opțională; se anunță costul: un subagent, cam cât un task mediu).** Un subagent nou primește doar `CLAUDE.md` și skill-ul, plus un subiect inventat de carusel („un QR code pentru meniul cafenelei, făcut cu Claude”). Pe ramura `proba/ghid-nou`, el scrie `carusel.md` și ghidul. Rulează `npm run verifica -- <slug>`; citește textul pentru ton. Ce lipsește din skill se completează. Ramura se șterge. Dacă Andrei nu vrea proba, primul ghid adevărat din Plan 3 e proba.
- [ ] **Step 4: Andrei citește `SKILL.md` și `standard.md`.** Corecturile lui intră înainte de commit.
- [ ] **Step 5: Commit**

```bash
git add .claude/skills/ghid-nou
git commit -m "feat: skill-ul ghid-nou — carusel, ghid după standard, verificare, PDF, publicare"
```

---

### Task 7: Skill-ul „idei”

§13.

**Files:**
- Create: `.claude/skills/idei/SKILL.md`
- Modify: `continut/idei.md` (dacă formatul se schimbă față de Task 5)

**Ce conține `SKILL.md`:**
- frontmatter `name: idei` și o `description` care pornește skill-ul la „nu știu ce să postez”, „idei de postări”, „uite clipurile de inspirație”;
- cele două porniri:
  - Claude caută: noutăți și știri AI din ultimele ~2 săptămâni (WebSearch, mai întâi `standard`) și ce postează alți creatori (TikTok și Instagram se pot căuta doar parțial; se spune asta);
  - clipuri în `continut/inspiratie/`: le transcrie (aceeași comandă ca în „ghid nou”) și scoate ideea;
- ce primește Andrei: 5–8 idei, fiecare cu cârligul, „de ce acum” cu sursa (link), formatul (clip sau carusel), ce ar intra în ghid și efortul (mic / mediu / mare);
- filtrul: nimic din „Postate” sau „De făcut” nu se repetă; prioritate pentru subiectele în care Claude face ceva concret, vizibil (ce a mers până acum);
- ce se poate copia (subiectul și ideea da; textul și designul nu);
- formatul lui `continut/idei.md`:
  - `## De făcut`: o idee pe intrare, cu cele 5 câmpuri și data;
  - `## Postate`: ideea + data postării + slug-ul ghidului.

  Andrei alege ce intră în „De făcut”; restul nu se salvează.

- [ ] **Step 1: Scrie fișierul.**
- [ ] **Step 2: Verifică** frontmatter-ul, căile și lipsa sedilei, ca în Task 6.
- [ ] **Step 3: Andrei citește.** Corecturile lui intră înainte de commit.
- [ ] **Step 4: Commit**

```bash
git add .claude/skills/idei continut/idei.md
git commit -m "feat: skill-ul idei — idei de postări din noutăți și din clipuri de inspirație"
```

---

### Task 8: Închiderea planului

**Files:**
- Modify: `docs/progres-brainstorming.md` (secțiunea „DE AICI CONTINUĂM”), memoria proiectului (`portofoliu-buildwithac.md`)

- [ ] **Step 1: Toată suita**

Run: `cd site && npx vitest run && npx playwright test && npm run lint && npm run e2e:prod`
Expected: totul PASS (nota din Plan 1 rămâne: testul „adresa greșită primește mesajul ei” pică uneori, ~1/40; se rulează din nou)

- [ ] **Step 2: Unește în `main` și împinge** (cu acordul lui Andrei), apoi verifică pe `https://buildwithac.ro` că site-ul arată la fel și că `robots.txt` are `Disallow: /pdf/`.
- [ ] **Step 3: Actualizează „DE AICI CONTINUĂM”**: Plan 2 e închis; Plan 3 înseamnă Kit + DMARC, Vercel Firewall, cele 5 lucruri mici amânate (lista de la începutul planului ăstuia), primul ghid adevărat cu skill-ul „ghid nou” și lansarea. Actualizează și memoria.
- [ ] **Step 4: Întreabă-l pe Andrei** dacă dosarul `.superpowers/sdd/2026-10-23-plan-1-site/` se poate șterge acum (lucrurile amânate sunt preluate). Se șterge doar cu „da”.
- [ ] **Step 5: Commit**

```bash
git add docs
git commit -m "docs: Plan 2 închis; următorul pas Plan 3"
```
