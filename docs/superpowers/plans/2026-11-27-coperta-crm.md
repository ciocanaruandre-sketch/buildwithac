# Coperta nouă și serviciul CRM: plan de implementare

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prototipul de pe ramura `coperta` devine cod curat: coperta cu mesajul și butoanele, CRM primul la Servicii și în formular (cu punte spre `altceva` în CRM), Cortina fără vârstă și fără butoane.

**Architecture:** Coperta rămâne `components/home/Hero.tsx` (client, GSAP); textul de pe cer stă în stratul titlului, butoanele în `.px__header`. Stilurile din `coperta-variante.css` intră în `home.css`, iar prototipul (comutatorul, `?fraza=`, `prototip/coperta.html`) dispare. Puntea CRM stă doar în `lib/crm.ts`.

**Tech Stack:** Next.js 16 (App Router, `cacheComponents`), TypeScript, Tailwind, GSAP, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-11-27-coperta-crm-design.md`

## Global Constraints
- Texte în română, diacritice cu virgulă (ș, ț). Textele de mai jos se copiază exact.
- Eticheta: `Site-uri · Automatizări · CRM` (afișată cu majuscule din CSS), Inter 800, auriu `var(--color-gold)`.
- Fraza: `Programări uitate, mesaje fără răspuns, clienți de care nu mai știi nimic?` + italic serif auriu `Le rezolv eu.`
- Rândul: `Împreună construim claritate în afacerea ta` (același font și culoare ca eticheta, mai mic).
- Butoane: `Analiză gratuită` → `#formular` (gradient), `Ghiduri gratuite` → `/ghiduri`; sub ele: `Îți răspund în 1–2 zile · Vorbești direct cu mine`.
- Blocul de pe cer: numele coboară cu `6svh` față de vechea copertă; între rândul despre claritate și nume, `20px`.
- Cortina, primul paragraf: rândurile `Salut, sunt Andrei,` / `am terminat Mecatronica` / `la Politehnica din București.`; fără `.cortina-but`.
- Servicii, în ordine: CRM, Site, Automatizări, Sesiune 1 la 1. Textele exacte sunt în spec, la „Servicii (textele lui Andrei, finale)”; titlul CRM: `CRM <span class="serif gtxt">pentru echipe de vânzări</span>`.
- Pastila de formular: `{ cheie: "crm", eticheta: "CRM" }`, prima.
- Commit-uri în română, terminate cu `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Nu rula `next build` fără `NEXT_DIST_DIR` cât merge serverul de dev.

## Review Focus
1. Telefon scund (375×667, iPhone SE): eticheta nu intră sub logo și ☰ (top-ul etichetei ≥ partea de jos a `.nav`), iar butoanele sunt în primul ecran. Test în Task 2.
2. 320px lățime: fraza nu iese din ecran pe orizontală și nu se suprapune cu numele. Test în Task 2.
3. Desktop 1440×900: blocul de pe cer e deasupra numelui, nu-l atinge. Test în Task 2.
4. `?serviciu=crm` din linkul unei reclame alege pastila CRM; un lead `crm` ajunge în CRM ca `altceva` cu „[CRM] ” în față, chiar și cu descriere goală. Teste în Task 1.
5. `prefers-reduced-motion`: blocul de jos e vizibil fără animație. Test în Task 2.

---

### Task 1: Serviciul CRM în formular, cu puntea spre CRM

**Files:**
- Modify: `site/lib/contact.ts` (`SERVICII_CONTACT`)
- Modify: `site/lib/crm.ts` (`trimiteLaCrm`)
- Modify: `site/components/home/Servicii.tsx` (cheia cardului CRM: `"crm"`, scos comentariul PROTOTIP)
- Test: `site/tests/unit/contact.test.ts`, `site/tests/unit/crm.test.ts` (nou), `site/tests/e2e/contact.spec.ts`

**Interfaces:**
- Produces: `CheieServiciu` include `"crm"`; `trimiteLaCrm(c, mediu, f?, ms?)` neschimbată ca semnătură.

- [ ] **Step 1: Testele care pică**

În `contact.test.ts`:
```ts
expect(serviciuDinLink("?serviciu=crm")).toBe("crm");
expect(verificaCerere({ ...buna, serviciu: "crm" })).toEqual({ cerere: { ...buna, serviciu: "crm" } });
expect(construiesteEmail({ ...c, serviciu: "crm" }, acum).subiect).toBe("Cerere nouă: CRM · Maria Popescu");
```
(folosește obiectele de test deja definite în fișier.) `crm.test.ts`, cu un `fetch` fals care reține corpul:
```ts
test("o cerere crm intră în CRM ca altceva, cu [CRM] în față", ...)
  // corp trimis: { serviciu: "altceva", descriere: "[CRM] Am 3 calleri" }
test("fără descriere: doar [CRM]", ...)          // descriere: "[CRM]"
test("celelalte servicii trec neschimbate", ...)  // serviciu: "site", descriere identică
```
În `contact.spec.ts`: lista pastilelor devine `["CRM", "Site", "Automatizări", "Sesiune 1 la 1 sau ghid personalizat", "Altceva"]` (titlul testului: „cele 5 pastile”); în „duc la formular…”: `link(0)` alege „CRM”, `link(2)` alege „Automatizări”, `link(3)` alege „Sesiune 1 la 1…”.

- [ ] **Step 2:** `npx vitest run tests/unit/contact.test.ts tests/unit/crm.test.ts` → FAIL (`crm` necunoscut).
- [ ] **Step 3:** `crm` primul în `SERVICII_CONTACT`; în `trimiteLaCrm`, pentru `c.serviciu === "crm"` trimite `serviciu: "altceva"` și `descriere: ("[CRM] " + c.descriere).trim()`, cu un comentariu care spune că puntea se scoate când CRM-ul acceptă `crm` (spec, „Puntea”). Cardul CRM din `Servicii.tsx` primește `cheie: "crm"`.
- [ ] **Step 4:** `npx vitest run` și `npx tsc --noEmit -p .` → trec. `npx playwright test tests/e2e/contact.spec.ts` → trece.
- [ ] **Step 5:** Commit `formular: serviciul CRM, cu punte spre „altceva” în CRM`.

### Task 2: Coperta finală (fără prototip)

**Files:**
- Modify: `site/components/home/Hero.tsx`
- Modify: `site/components/home/home.css` (secțiunea PARALLAX)
- Delete: `site/components/home/coperta-variante.css`, `prototip/coperta.html`
- Test: `site/tests/e2e/home.spec.ts` (describe „hero”)

**Interfaces:**
- Produces: clasele `.px__sub` (blocul de pe cer: `.cop-eti`, `.cop-fraza`, `.cop-claritate`) și `.cop-jos` (`.cop-but a.plin`, `.cop-prom`) în `.px__header`.

- [ ] **Step 1: Testele care pică** (în locul testului „…subtitlul stă deasupra lui”; după `finish()` pe animațiile `intra*`, ca acum):
```ts
test("pe cer: eticheta, fraza și rândul despre claritate, deasupra numelui", ...)
  // .px__sub conține exact textele din Global Constraints; nu conține „AI pe înțelesul”
  // partea de jos a .px__sub ≤ top-ul h1 + 1, iar distanța e ≤ 40px
test("butoanele sunt pe copertă, în primul ecran", ...)   // la 390×844 și 375×667
  // #hero a: „Analiză gratuită” href #formular, „Ghiduri gratuite” href /ghiduri; ambele toBeInViewport()
  // #hero conține „Îți răspund în 1–2 zile”; .scrollcue are 0 elemente
test("pe telefon scund, eticheta nu intră sub meniu", ...)  // 375×667: top .px__sub ≥ bottom .nav
test("la 320px, textul încape pe lățime", ...)              // .px__sub: left ≥ 0, right ≤ 320
test("pe desktop, blocul nu atinge numele", ...)            // 1440×900: bottom .px__sub ≤ top h1
test("cu mișcare redusă, butoanele se văd", ...)            // emulateMedia({ reducedMotion: "reduce" }); opacity 1 pe .cop-jos
```
- [ ] **Step 2:** `npx playwright test tests/e2e/home.spec.ts -g hero` → FAIL (clasele noi lipsesc).
- [ ] **Step 3:** `Hero.tsx` fără `useState`/`useEffect`/comutator/`FRAZE`/`?fraza`; textele fixe din Global Constraints. Stilurile `.cv-*` folosite de varianta C se mută în `home.css` cu prefixul `cop-` (fără regulile variantelor A și B și fără `.cv-comutator`); `--cv-jos` devine `--cop-jos: 6svh`. Se scot `.scrollcue` din JSX și regulile lui din CSS. `.cop-jos` fără animație la `prefers-reduced-motion: reduce`.
- [ ] **Step 4:** testele din Step 1 + `npx playwright test tests/e2e/home.spec.ts` → trec. Captură la 390×844 și 1440×900, comparată cu prototipul aprobat (previzualizarea de la commit 9f4835f).
- [ ] **Step 5:** Commit `coperta: mesajul și butoanele pe copertă (varianta C)`.

### Task 3: Cortina, Servicii și regula din CLAUDE.md

**Files:**
- Modify: `site/components/home/Cortina.tsx` (deja schimbat în prototip; se verifică doar că nu mai importă `Link`)
- Modify: `site/components/home/home.css` (scoase regulile `.cortina-but`)
- Modify: `site/components/home/Servicii.tsx` (textele sunt deja puse; se verifică față de spec)
- Modify: `CLAUDE.md` (rândul despre CRM)
- Test: `site/tests/e2e/home.spec.ts` (describe „cortina”, „servicii și contact”)

- [ ] **Step 1: Testele actualizate:** „are mesajul personal” așteaptă `Salut, sunt Andrei, am terminat Mecatronica la Politehnica din București.` și `not.toContainText("24 de ani")`; lista `.rd` începe cu cele 3 rânduri noi; din testul „aceeași linie” iese `.cortina-but`; testele „sub text, analiza și ghidurile” și „butoanele stau unul lângă altul” se mută pe `#hero .cop-but a` (aceleași așteptări: același rând, aceeași lățime, înălțime < 60, la 390 și 320); în plus `expect(page.locator(".cortina-but")).toHaveCount(0)`. Servicii: `toHaveCount(4)`; primul card conține „CRM pentru echipe de vânzări” și „integrare Meta”; al doilea conține „Optimizat pentru a funcționa eficient pe telefon.”; al treilea „fără intervenția ta”.
- [ ] **Step 2:** `npx playwright test tests/e2e/home.spec.ts` → trece.
- [ ] **Step 3:** În `CLAUDE.md`, „CRM-ul e în portofoliu, dar nu e încă serviciu.” devine „CRM-ul e și în portofoliu, și serviciu (primul la Servicii); regulile lui în `servicii/` vin mai târziu.”
- [ ] **Step 4:** Commit `cortina, servicii: fără vârstă, CRM primul; regula CRM`.

### Task 4: Verificarea finală și previzualizarea

- [ ] **Step 1:** Din `site/`: `npx vitest run`, `npx tsc --noEmit -p .`, `npm run lint`, `npm run verifica` → toate trec; `npx playwright test` → trece tot.
- [ ] **Step 2:** `git push`; Andrei verifică previzualizarea pe iPhone. Unirea în `main` doar la „da”-ul lui.
- [ ] **Step 3:** În `docs/progres-brainstorming.md` („DE AICI CONTINUĂM”): de făcut în CRM: `crm` în enum (migrare + `db push` de Andrei), `crm/lib/tipuri.ts`, `crm/lib/azi.ts`, `finante/actiuni.ts`, apoi scoasă puntea din `site/lib/crm.ts`.
