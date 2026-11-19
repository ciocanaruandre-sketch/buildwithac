# Plan 15: lucrul pentru clienți, partea 1 (site-urile) — planul de construire

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Când vine un client de site, Andrei deschide Claude în `Portofoliu AC` și pornește direct: dosarul clientului, fișa, un site de pornire în depozitul lui separat, pașii de lansare și de predare, toate știute de skill-uri.

**Architecture:** `servicii/site-uri/` ține regulile, șablonul (o aplicație Next.js de sine stătătoare) și scriptul `porneste.mjs`, care copiază șablonul în `clienti/<slug>/site/cod/` și face acolo un depozit git nou. `clienti/` stă în git-ul buildwithac doar cu fișa și jurnalul; codul și materialele clientului sunt ignorate. Trei skill-uri (`client-nou`, `site-client`, `predare-site`) duc pașii.

**Tech Stack:** Next.js 16.4.6 (App Router), React 19.3.0, TypeScript, Tailwind 4, GSAP + Lenis, zod 4, Vitest, Playwright; scriptul cu Node (fără dependențe), testat cu `node --test`.

**Spec:** `docs/superpowers/specs/2026-11-19-servicii-site-uri-design.md` (aprobat de Andrei 2026-11-19). Citește-l înainte de orice task.

## Global Constraints

- Tot textul (fișiere, mesaje de eroare, interfață, commit-uri) în română, cu diacritice cu virgulă (ș, ț), niciodată sedilă. Tonul din `CLAUDE.md` („tu”, fraze scurte, fără exagerări).
- Ramura: `servicii-site-uri` (există, cu designul comis). Nimic pe `main` fără „da”-ul lui Andrei.
- Commit-urile se termină cu `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Versiunile din șablon = cele din `site/package.json`: `next` 16.4.6, `react`/`react-dom` 19.3.0, `eslint-config-next` 16.4.6, `gsap` ^3.15.0, `@gsap/react` ^2.1.2, `lenis` ^1.3.27, `@vercel/analytics` ^2.0.1, `zod` ^4.6.7, `tailwindcss` ^4 + `@tailwindcss/turbopack` ^4, `vitest` ^5.0.5, `@playwright/test` ^1.64.1, `typescript` ^5, `eslint` ^9.
- Next.js 16 are API-uri noi: înainte de cod Next, citește `site/AGENTS.md` și ghidurile din `node_modules/next/dist/docs/`.
- Fonturile din fișiere locale (`public/fonts/` + `app/fonturi.css`), **niciodată** `next/font/google`.
- **Fără** `output: 'export'`.
- Șablonul nu e o temă: un singur exemplu de pagină, neutru, fără gradient mov, fără carduri identice.
- Repo-ul folosește LF. După `npm install`, verifică `git diff --stat` (npm a schimbat terminații de rând înainte).
- Serverul de dev al șablonului merge pe portul **3300** (3000 = site, 3100 = CRM).
- Nu rula `git push`, nu crea depozite GitHub și nu crea proiecte Vercel în acest plan.

## Review Focus

1. `porneste.mjs` rulat pentru un client care are deja `clienti/<slug>/site/cod/` → refuză, nu suprascrie nimic (Task 4).
2. Slug cu diacritice, spații sau majuscule („Cafeneaua Colț”) → refuză și propune `cafeneaua-colt` (Task 4).
3. Telefoane scrise în toate felurile („0722 123 456”, „+40 722 123 456”, „0040722123456”, „0722.123.456”, fix „021 123 4567”) → același format `+40…`; un număr greșit oprește testele, nu ajunge pe site (Task 2).
4. Un site mutat pe Netlify la „doar site-ul” rămâne închis pentru Google pentru că `robots.ts` se uita doar la `VERCEL_ENV` → regula de indexare știe și Netlify, plus o variabilă manuală (Task 2).
5. Un nume de firmă sau un text lung iese din ecran la 360px → testul e2e verifică 360 și 390 (Task 3).

---

### Task 1: Dosarele și regulile git

**Files:**
- Modify: `.gitignore`
- Create: `servicii/README.md`, `clienti/README.md`

- [ ] **Step 1:** Adaugă în `.gitignore`, sub un comentariu „# clienții: codul fiecărui site are git-ul lui; materialele nu intră în git”:
```
clienti/*/materiale/
clienti/*/site/cod/
```
- [ ] **Step 2: Verifică.** Creează temporar `clienti/x/materiale/a.txt`, `clienti/x/site/cod/b.txt`, `clienti/x/fisa.md`. Rulează din rădăcină `git check-ignore -v clienti/x/materiale/a.txt clienti/x/site/cod/b.txt clienti/x/fisa.md`. Așteptat: primele două listate, `fisa.md` nu. Șterge `clienti/x/`.
- [ ] **Step 3:** `servicii/README.md`: harta serviciilor (Site-uri: gata, în `site-uri/`; Automatizări și Sesiuni/ghiduri personalizate: urmează, fiecare cu brainstormingul lui), scheletul comun `servicii/<serviciu>/` + `clienti/<slug>/<serviciu>/`, și că un client nou începe mereu cu skill-ul `client-nou`.
- [ ] **Step 4:** `clienti/README.md`: ce intră în git (`fisa.md`, `jurnal.md`) și ce nu (`materiale/`, `site/cod/`); linia datelor personale, copiată din design („Unde e linia la datele personale”); copia din Drive `buildwithac.ai/clienti/<slug>/`; legătura cu CRM-ul prin numele firmei.
- [ ] **Step 5: Commit** `servicii, clienti: dosarele și regulile git`.

---

### Task 2: Șablonul — fundația și datele firmei

**Files:**
- Create în `servicii/site-uri/sablon/`: `package.json`, `tsconfig.json`, `next.config.ts`, `eslint.config.mjs`, `postcss`/turbopack ca în `site/next.config.ts`, `vitest.config.ts`, `tests/unit/setup.ts`, `app/globals.css`, `app/fonturi.css`, `public/fonts/inter-latin.woff2` + `inter-latin-ext.woff2` (copiate din `site/public/fonts/`), `lib/telefon.ts`, `lib/config.ts`, `lib/indexare.ts`, `app/robots.ts`
- Test: `tests/unit/telefon.test.ts`, `tests/unit/indexare.test.ts`

**Interfaces:**
- Produces:
  - `normalizeazaTelefon(text: string): string`: întoarce `+40` + 9 cifre; aruncă `Error("Telefon nevalid: <text>")` altfel.
  - `linkTelefon(text: string): string` → `"tel:+40722123456"`.
  - `linkWhatsapp(text: string, mesaj?: string): string` → `"https://wa.me/40722123456"`, plus `"?text=" + encodeURIComponent(mesaj)` dacă există mesaj.
  - `type Firma` și `const FIRMA: Firma` în `lib/config.ts`, cu câmpurile: `nume`, `slug`, `domeniu`, `url`, `telefon`, `whatsapp: string | null`, `adresa`, `harta` (link Google Maps), `retele: { instagram?: string; facebook?: string; tiktok?: string }`, `analytics: boolean`, `creditBuildwithac: boolean`. Valorile-marcaj pe care le înlocuiește Task 4: `__NUME_FIRMA__`, `__SLUG__`, `__DOMENIU__` (`url` = `` `https://${domeniu}` ``). Telefonul de început: `"0700 000 000"`. Implicit `analytics: true`, `creditBuildwithac: true`.
  - `seIndexeaza(env: Record<string, string | undefined>): boolean`.

- [ ] **Step 1:** `package.json` (`"name": "__SLUG__-site"`, `"private": true`), scripturile `dev` (`next dev -p 3300`), `build`, `start`, `lint` (`eslint`), `test` (`vitest run`), `e2e` (`playwright test`) și `verifica` (`tsc --noEmit -p . && eslint && vitest run && playwright test`). Dependențele din Global Constraints, fără `gray-matter`, `next-mdx-remote` și testing-library-ul doar dacă e folosit (Task 3 îl folosește: `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`, `@vitejs/plugin-react`, cu versiunile din `site/`). `next.config.ts` fără `distDir`, `cacheComponents`, `headers`, `rewrites` sau alte lucruri specifice buildwithac; doar regula turbopack pentru Tailwind.
- [ ] **Step 2: Scrie testele care pică**, `tests/unit/telefon.test.ts`:
```ts
it.each(["0722 123 456", "+40 722 123 456", "0040722123456", "0722.123.456", "0722-123-456", "722123456"])(
  "normalizează %s", (t) => expect(normalizeazaTelefon(t)).toBe("+40722123456"));
it("fix București", () => expect(normalizeazaTelefon("021 123 4567")).toBe("+40211234567"));
it.each(["", "0722 123", "0722 123 456 789", "abc", "+44 20 7946 0958"])("refuză %s", (t) =>
  expect(() => normalizeazaTelefon(t)).toThrow("Telefon nevalid"));
it("link de apel", () => expect(linkTelefon("0722 123 456")).toBe("tel:+40722123456"));
it("WhatsApp fără și cu mesaj", () => {
  expect(linkWhatsapp("0722 123 456")).toBe("https://wa.me/40722123456");
  expect(linkWhatsapp("0722 123 456", "Bună, aș vrea o programare")).toBe(
    "https://wa.me/40722123456?text=Bun%C4%83%2C%20a%C8%99%20vrea%20o%20programare");
});
it("datele firmei au telefoane valide", () => {
  expect(() => normalizeazaTelefon(FIRMA.telefon)).not.toThrow();
  if (FIRMA.whatsapp) expect(() => normalizeazaTelefon(FIRMA.whatsapp)).not.toThrow();
});
```
`tests/unit/indexare.test.ts`:
```ts
it("Vercel producție", () => expect(seIndexeaza({ VERCEL_ENV: "production" })).toBe(true));
it("Vercel previzualizare", () => expect(seIndexeaza({ VERCEL_ENV: "preview" })).toBe(false));
it("Netlify producție", () => expect(seIndexeaza({ CONTEXT: "production" })).toBe(true));
it("Netlify deploy-preview", () => expect(seIndexeaza({ CONTEXT: "deploy-preview" })).toBe(false));
it("forțat de mână", () => expect(seIndexeaza({ INDEXARE: "da" })).toBe(true));
it("local", () => expect(seIndexeaza({})).toBe(false));
```
- [ ] **Step 3:** `npm install` în `sablon/`, apoi `npx vitest run`. Așteptat: FAIL (funcțiile nu există).
- [ ] **Step 4:** Scrie `lib/telefon.ts`, `lib/config.ts`, `lib/indexare.ts`. Telefonul: se scot spațiile, punctele, cratimele și parantezele; prefixul `+40`/`0040`/`40`, sau `0` la început, se scoate; ce rămâne trebuie să fie exact 9 cifre (de aceea `"722123456"` trece). Regula de indexare: `VERCEL_ENV === "production" || CONTEXT === "production" || INDEXARE === "da"`. `app/robots.ts`: cu `seIndexeaza(process.env)` → allow + sitemap `${FIRMA.url}/sitemap.xml`; altfel disallow `/` (ca în `site/app/robots.ts`).
- [ ] **Step 5:** `npx vitest run` → PASS. `npx tsc --noEmit -p .` → fără erori.
- [ ] **Step 6:** `git diff --stat` (terminații de rând), apoi **commit** `sablon: fundația, telefonul, indexarea`. `node_modules/` și `.next/` din șablon sunt deja ignorate de regula din rădăcină; verifică cu `git status` că nu apar.

---

### Task 3: Șablonul — conținutul, paginile, testul pe telefon, regulile site-ului

**Files:**
- Create în `sablon/`: `lib/schema.ts`, `lib/continut.ts`, `components/ButoaneContact.tsx`, `components/Subsol.tsx`, `components/Lenis.tsx`, `app/layout.tsx`, `app/page.tsx`, `app/confidentialitate/page.tsx`, `app/not-found.tsx`, `app/sitemap.ts`, `app/icon.png` (provizoriu, neutru), `public/og.jpg` (provizoriu, 1200×630, neutru), `playwright.config.ts`, `CLAUDE.md`, `AGENTS.md` (copiat din `site/AGENTS.md`)
- Test: `tests/unit/continut.test.ts`, `tests/unit/componente.test.tsx`, `tests/e2e/telefon.spec.ts`

**Interfaces:**
- Consumes: `FIRMA`, `Firma`, `linkTelefon`, `linkWhatsapp`, `seIndexeaza` (Task 2).
- Produces:
  - `SchemaContinut` (zod) și `type Continut = z.infer<typeof SchemaContinut>`: `{ titlu: string (nevid); descriere: string (1–160 caractere, pentru Google); program: { zile: string; ore: string }[]; servicii: { nume: string; pret: number | null; descriere?: string }[]; poze: { fisier: string (începe cu „/”); alt: string (nevid) }[] }`.
  - `const CONTINUT: Continut` în `lib/continut.ts`: **singurul loc** cu texte, prețuri, program și poze (locul pregătit pentru panoul de mai târziu). Valori de exemplu, neutre.
  - `<ButoaneContact firma?: Firma />`: „Sună” (`tel:`), „WhatsApp” (doar dacă `whatsapp`, `target="_blank" rel="noopener"`), „Vezi pe hartă” (`harta`, idem).
  - `<Subsol firma?: Firma />`: numele firmei, adresa, link „Confidențialitate”, și „Site făcut de buildwithac” → `https://buildwithac.ro` doar dacă `creditBuildwithac`.

- [ ] **Step 1: Scrie testele care pică.** `tests/unit/continut.test.ts`:
```ts
it("conținutul trece schema", () => expect(SchemaContinut.safeParse(CONTINUT).success).toBe(true));
it("descriere prea lungă", () =>
  expect(SchemaContinut.safeParse({ ...CONTINUT, descriere: "a".repeat(161) }).success).toBe(false));
it("poză fără alt", () =>
  expect(SchemaContinut.safeParse({ ...CONTINUT, poze: [{ fisier: "/a.jpg", alt: "" }] }).success).toBe(false));
it("preț lipsă e permis", () =>
  expect(SchemaContinut.safeParse({ ...CONTINUT, servicii: [{ nume: "Cafea", pret: null }] }).success).toBe(true));
```
`tests/unit/componente.test.tsx` (cu o `Firma` de test, telefon `"0722 123 456"`):
```ts
it("Sună duce la tel:", () => /* link „Sună” are href "tel:+40722123456" */);
it("fără WhatsApp, fără buton", () => /* whatsapp: null → nu există link „WhatsApp” */);
it("creditul se poate scoate", () => {
  /* creditBuildwithac: true → există link „Site făcut de buildwithac” spre https://buildwithac.ro */
  /* creditBuildwithac: false → nu există */
});
```
`tests/e2e/telefon.spec.ts`, pentru lățimile 360 și 390 și căile `/` și `/confidentialitate`:
```ts
// documentElement.scrollWidth <= window.innerWidth
// nicio eroare în consolă (page.on("pageerror"))
// fiecare a[href^="/"] din pagină răspunde < 400 (request.get)
// "/nu-exista" → status 404 și un link spre "/"
```
`playwright.config.ts`: `webServer: { command: "npm run dev", port: 3300, reuseExistingServer: false }`, proiect Chromium.
- [ ] **Step 2:** `npx vitest run` → FAIL (lipsesc schema, conținutul, componentele).
- [ ] **Step 3:** Scrie schema, conținutul, componentele, `layout.tsx` (`lang="ro"`, `metadata` din `CONTINUT.titlu`/`descriere`, `metadataBase` din `FIRMA.url`, `openGraph` cu `/og.jpg`, `locale: "ro_RO"`; `<Analytics />` doar dacă `FIRMA.analytics`; Lenis ca în `site/components/layout/LenisProvider.tsx`), pagina de exemplu (titlul, programul, serviciile cu prețul sau fără, butoanele de contact; GSAP doar o apariție simplă la scroll, ca să existe tiparul), `confidentialitate` (schelet de adaptat: cine e operatorul = firma, ce date se strâng = niciuna cât nu e formular, Vercel Analytics fără cookie-uri doar dacă `analytics`; sus, un comentariu „de verificat cu skill-ul legal-advisor-ro dacă site-ul strânge date”), `not-found`, `sitemap` (`/` și `/confidentialitate`). Fontul: doar Inter, ca exemplu; în `fonturi.css`, comentariul cu pașii pentru alt font (woff2 de pe Google Fonts, latin + latin-ext, din cauza lui ș și ț).
- [ ] **Step 4:** `npx vitest run` → PASS. `npx playwright test` → PASS (toate 4 combinațiile + 404).
- [ ] **Step 5:** `CLAUDE.md` al șablonului: ce e site-ul (se completează la pornire: firma, varianta cu mentenanță sau doar site-ul, simplu sau cu panou); regulile: conținutul doar în `lib/continut.ts`, datele firmei doar în `lib/config.ts`; telefonul prin `lib/telefon.ts`; fonturile locale; proiectat întâi la 390px; fără recenzii sau rezultate inventate; o singură limbă (româna): o a doua limbă = un al doilea fișier de conținut cu aceeași schemă, iar rutele pe limbi se adaugă abia când cere un client; comenzile (`npm run dev` pe 3300, `npm run verifica`); înainte de cod Next, `AGENTS.md`. Scris așa încât să meargă și după predare, fără nimic din buildwithac (fără căi spre `Portofoliu AC`).
- [ ] **Step 6:** `npm run verifica` → trece tot. `npm run build` → trece.
- [ ] **Step 7: Commit** `sablon: conținutul, paginile, testul pe telefon`.

---

### Task 4: Scriptul care pornește un site de client

**Files:**
- Create: `servicii/site-uri/porneste.mjs`
- Test: `servicii/site-uri/porneste.test.mjs`

**Interfaces:**
- Produces (exportate din `porneste.mjs`; rulat direct: `node servicii/site-uri/porneste.mjs <slug> "<Numele firmei>" [domeniu]`):
  - `propuneSlug(text: string): string`: litere mici, fără diacritice, spații → cratime, doar `[a-z0-9-]`.
  - `valideazaSlug(slug: string): string | null`: `null` dacă e bun (`/^[a-z0-9]+(-[a-z0-9]+)*$/`), altfel mesajul, cu propunerea din `propuneSlug`.
  - `porneste({ radacina, slug, nume, domeniu }): string`: copiază `<radacina>/servicii/site-uri/sablon/` în `<radacina>/clienti/<slug>/site/cod/`, fără `node_modules`, `.next`, `test-results`, `playwright-report`, `*.tsbuildinfo`; înlocuiește `__NUME_FIRMA__`, `__SLUG__`, `__DOMENIU__` în `lib/config.ts`, `package.json`, `CLAUDE.md`; `domeniu` implicit `<slug>.ro`; rulează `git init -b main`, `git add -A`, `git commit -m "Pornit din șablonul buildwithac"`; întoarce calea. Aruncă eroare dacă slug-ul e greșit sau dacă destinația există deja (nu atinge nimic).

- [ ] **Step 1: Scrie testele care pică** (`node:test` + `node:assert`; fiecare test își face o rădăcină temporară cu un șablon mic: `lib/config.ts` cu cele trei marcaje, `package.json` cu `__SLUG__`, `CLAUDE.md`, plus `node_modules/x.js` și `.next/y`):
```js
test("propune slug", () => assert.equal(propuneSlug("Cafeneaua Colț"), "cafeneaua-colt"));
test("slug greșit", () => assert.match(valideazaSlug("Cafeneaua Colț"), /cafeneaua-colt/));
test("slug bun", () => assert.equal(valideazaSlug("cafeneaua-colt"), null));
test("copiază și înlocuiește", () => {
  // porneste({ radacina, slug: "cafeneaua-colt", nume: "Cafeneaua Colț" })
  // config.ts conține "Cafeneaua Colț", "cafeneaua-colt", "cafeneaua-colt.ro"; niciun "__"
  // node_modules și .next nu există în destinație
  // `git -C <dest> log --oneline` are exact 1 commit
});
test("nu suprascrie un client existent", () => {
  // a doua rulare cu același slug aruncă /există deja/; fișierul pus între timp în destinație e neatins
});
test("domeniul dat", () => /* domeniu "colt.ro" → config.ts conține "colt.ro" */);
```
- [ ] **Step 2:** `node --test servicii/site-uri/` → FAIL.
- [ ] **Step 3:** Scrie `porneste.mjs` (doar module Node: `fs`, `path`, `child_process`). Rulat direct: verifică argumentele, scrie calea și pașii următori (`cd …/cod`, `npm install`, `npm run dev`); la eroare, mesajul și cod de ieșire 1.
- [ ] **Step 4:** `node --test servicii/site-uri/` → PASS.
- [ ] **Step 5: Commit** `servicii/site-uri: scriptul care pornește un site de client`.

---

### Task 5: Regulile, lansarea și predarea (cu verificare pe web)

**Files:**
- Create: `servicii/site-uri/README.md`, `servicii/site-uri/lansare.md`, `servicii/site-uri/predare.md`

- [ ] **Step 1: Verifică pe web** (surse oficiale; notează la finalul fiecărui fișier „Verificat la <data>” cu link-urile): prețul Vercel Pro și ce include; termenii Netlify Free (uz comercial permis?) și suportul pentru Next.js 16 (App Router, funcții pe server); la fel pentru Cloudflare (Workers cu OpenNext); 2–3 registrari `.ro` (prețul pe an la înregistrare și la reînnoire; se poate adăuga un al doilea utilizator sau doar schimbarea DNS?); transferul unui depozit GitHub privat către alt cont (Settings → Danger Zone → Transfer). Alege **un** registrar și **o** găzduire gratuită pentru „doar site-ul”, cu motivul într-o frază. Dacă nicio găzduire gratuită nu permite uz comercial cu Next.js, scrie asta și rămâi la Vercel Pro pe contul clientului.
- [ ] **Step 2:** `README.md`: drumul clientului (pașii 1–9 din design, cu ce skill face fiecare pas); cele două alegeri (mentenanță / doar site-ul; simplu / panou: panoul se proiectează separat la primul client care îl cere); regulile de aspect (din design, „Regulile de aspect”, cu trimiteri la `site/content/ghiduri/site-uri-fara-aer-de-ai/index.mdx`, `site/public/concepte/` și `docs/superpowers/specs/2026-11-04-site-uri-concept-design.md`); pozele (ale clientului sau Unsplash, sursa notată în `jurnal.md`); costurile pe care le vede clientul (din Step 1); Vercel Pro de la semnarea primului client de site.
- [ ] **Step 3:** `lansare.md`: lista de pași numerotată, câte o acțiune pe pas, cu numele exacte ale butoanelor: depozitul pe GitHub (Andrei: github.com/new, `site-<slug>`, Private, fără README; apoi `git remote add` + `git push` din `cod/`); proiectul Vercel (Import din depozit, pe echipa Pro); Shareable Link pentru client; domeniul clientului (registrarul ales; ce înregistrări DNS cere Vercel; cine le pune); verificările după lansare (`curl -I https://<domeniu>` → 200; `/robots.txt` permite indexarea; pagina pe telefon); notarea în `jurnal.md`. Fără parole în capturi.
- [ ] **Step 4:** `predare.md`: „doar site-ul”: clientul își face contul de găzduire (cea aleasă) și GitHub; transferul depozitului; importul pe găzduirea lui; mutarea DNS; pe Netlify, `robots.txt` trebuie să permită indexarea (`CONTEXT=production`, Task 2) — se verifică cu `curl`; scoaterea proiectului de pe Vercel-ul lui Andrei după ce merge noul loc; notarea în `jurnal.md`.
- [ ] **Step 5: Verifică** că niciun fișier nu conține sedilă: `grep -rn "[şţŞŢ]" servicii/` → nimic.
- [ ] **Step 6: Commit** `servicii/site-uri: regulile, lansarea și predarea`.

---

### Task 6: Skill-urile

**Files:**
- Create: `.claude/skills/client-nou/SKILL.md`, `.claude/skills/client-nou/fisa.md`, `.claude/skills/client-nou/jurnal.md`, `.claude/skills/site-client/SKILL.md`, `.claude/skills/predare-site/SKILL.md`

Format ca `.claude/skills/ghid-nou/SKILL.md`: frontmatter `name` + `description` (cu frazele lui Andrei care îl pornesc), apoi „Pe scurt”, „Pașii”, „Nu uita”.

- [ ] **Step 1: `client-nou`.** Pornește la „am un client nou”, „a semnat …”, „a completat formularul Tally”. Pașii: numele firmei → slug (`propuneSlug`, confirmat de Andrei); creează `clienti/<slug>/` cu `fisa.md` și `jurnal.md` din cele două fișiere-model și `materiale/`; cere exportul Tally și notițele de la telefon, le pune în `materiale/`; completează fișa **fără** datele care nu se publică (linia din `clienti/README.md`); întreabă ce a cumpărat (site / automatizări / sesiune); îi amintește copia în Drive (`buildwithac.ai/clienti/<slug>/`); pentru site → `site-client`; pentru celelalte: „încă nu sunt gata, se fac în proiectele 2 și 3”. Tally nu intră în CRM; CRM-ul nu se atinge.
  - `fisa.md` (model): Firma (ce face, orașul) · Ce a cumpărat (serviciul; mentenanță sau doar site-ul; simplu sau cu panou) · Cui vinde · Ce trebuie să facă site-ul · Paginile · Tonul și aspectul (ce îi place, ce nu, exemple) · Materialele (primite / lipsă) · Datele publice de contact (telefon, WhatsApp, adresă, program, hartă) · Termenul · Întrebări deschise.
  - `jurnal.md` (model): rânduri `AAAA-LL-ZZ — ce s-a decis / livrat / cerut`, cel mai nou sus.
- [ ] **Step 2: `site-client`.** Pornește la „fă site-ul pentru …”, „clientul vrea o modificare la site”. Citește întâi `servicii/site-uri/README.md` și fișa. **Mod construire:** `node servicii/site-uri/porneste.mjs <slug> "<Nume>" [domeniu]` → `npm install` → completează `lib/config.ts` și `CLAUDE.md`-ul site-ului din fișă → ramura `variante`: 2–3 direcții cu comutator (`?v=`), arătate lui Andrei local pe 3300 (anunță pasul greu) → Andrei alege ce arată clientului → depozitul GitHub și proiectul Vercel după `lansare.md` (pașii lui Andrei, unul câte unul) → Shareable Link → clientul alege → varianta aleasă intră în `main`, ramura `variante` se șterge → construirea, cu tot conținutul în `lib/continut.ts` → `npm run verifica` → previzualizare + link → corecturi → lansarea după `lansare.md` → `jurnal.md`. **Mod modificare:** schimbarea în `cod/`, `npm run verifica`, push, Andrei verifică previzualizarea, `jurnal.md`. Uneltele: `ui-ux-pro-max`, `frontend-design`. Panou cerut → stop: se proiectează separat (brainstorming).
- [ ] **Step 3: `predare-site`.** Pornește la „clientul vrea doar site-ul”, „predau site-ul”. Parcurge `servicii/site-uri/predare.md` cu Andrei, câte un pas pe mesaj, cu numele exacte ale butoanelor; verifică din afară (`curl`) după mutarea DNS; notează în `jurnal.md`.
- [ ] **Step 4:** `grep -rn "[şţŞŢ]" .claude/skills/client-nou .claude/skills/site-client .claude/skills/predare-site` → nimic.
- [ ] **Step 5: Commit** `skill-uri: client-nou, site-client, predare-site`.

---

### Task 7: `CLAUDE.md`, proba cu un client inventat, stadiul

**Files:**
- Modify: `CLAUDE.md`, `docs/progres-brainstorming.md`

- [ ] **Step 1:** În `CLAUDE.md`, secțiunea nouă „Lucrul pentru clienți” (5–8 rânduri): `servicii/` și `clienti/`, depozitul separat al fiecărui site, ce nu intră în git, datele personale doar în CRM, skill-urile `client-nou` → `site-client` / `predare-site`. În tabelul „Unde sunt lucrurile”: rândurile pentru `servicii/`, `clienti/`, `servicii/site-uri/sablon/`.
- [ ] **Step 2: Proba (doar local).** Urmează `client-nou` și `site-client` pentru o firmă inventată, „Cafeneaua Probă” (`proba-cafenea`), cu o fișă scurtă scrisă de tine, până la: `porneste.mjs` → `npm install` → `npm run verifica` trece în `clienti/proba-cafenea/site/cod/`. Notează ce a fost neclar în skill-uri și repară pe loc. **Fără** GitHub, Vercel sau variante.
- [ ] **Step 3:** `git status` din rădăcină: din `clienti/proba-cafenea/` apar doar `fisa.md` și `jurnal.md`, nimic din `cod/` sau `materiale/`. Apoi șterge `clienti/proba-cafenea/` cu totul.
- [ ] **Step 4:** Verificările cerute de `CLAUDE.md`, din `site/`: `npx vitest run`, `npm run verifica`, `npm run lint` → trec (site-ul nu e atins; e doar confirmarea).
- [ ] **Step 5:** `docs/progres-brainstorming.md`: în „DE AICI CONTINUĂM”, noul stadiu (ramura, ce e gata, ce a rămas: proiectul 2, automatizările, începe cu actualizarea uneltelor n8n: pachetul `n8n-skills` are acum 14 skill-uri, iar n8n are server MCP oficial din aprilie 2026, cu n8n ≥ 2.18.4).
- [ ] **Step 6: Commit** `CLAUDE.md, stadiul: lucrul pentru clienți, partea 1`. Unirea în `main` doar la „da”-ul lui Andrei.
