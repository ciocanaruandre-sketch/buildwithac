# CRM, etapa 3, bucata 1: tema „Grafit” și spațiul demo — planul

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tot CRM-ul primește tema A „Grafit” din prototip, iar `npm run demo` umple baza de test cu o firmă credibilă, bună de filmat.

**Architecture:** Tema stă într-un singur loc (`crm/app/tema.css`): variabilele din prototip plus clasele comune (`.panel`, `.btn`, `.chip`, `.lbl`, `.camp`, `.sticla`). Componentele doar le folosesc. Datele demo se fac dintr-un generator pur (`scripts/date/demo-date.ts`, testat cu vitest), relativ la ziua rulării, și se scriu de un script care refuză orice bază în afară de cea de test.

**Tech Stack:** Next.js 16 (App Router), Tailwind v4, Supabase (`@supabase/supabase-js`), vitest, Playwright, `tsx` pentru scripturi.

**Spec:** `docs/superpowers/specs/2026-11-10-crm-tema-demo-design.md` (+ referința vizuală `prototip/crm-tema.html#A`; designul mare: `docs/superpowers/specs/2026-11-09-crm-design.md`)

## Ce am hotărât eu în plan (confirmat de Andrei, 2026-11-10; execuția: în sesiune)

1. **Conturile de test devin echipa demo.** În design scria: conturi demo separate, conturile `…@test.buildwithac.ro` rămân neschimbate. Problema: cu două echipe, aceleași ecrane ar arăta doi calleri în plus, doi closeri la programare și cinci adrese `@test.` la Echipa. Așa că păstrez **aceleași 5 conturi și aceleași nume**, doar adresele se schimbă:
   - `andrei@buildwithac.ro` (Admin)
   - `mara@buildwithac.ro` (Caller, Mara Ionescu)
   - `vlad@buildwithac.ro` (Caller, Vlad Petrescu)
   - `ioana@buildwithac.ro` (Closer, Ioana Dumitru)
   - `radu@buildwithac.ro` (Constructor, Radu Stan)

   Parola rămâne cea de test. Pe **producție** rămâne `admin@buildwithac.ro`. Testele automate folosesc adresele noi.
2. **Pe telefon, legăturile stau jos**, într-o bară de sticlă cu iconițe, ca bara de tab-uri de pe iPhone. Bara laterală de sticlă rămâne doar pe laptop (de la 768px în sus).
3. **Căutarea din bara de sus: DA (cerută de Andrei, 2026-11-10).** O căsuță în bara de sus, ca în prototip („Caută lead-uri…”), care găsește lead-urile după nume, cuvinte din nume/firmă sau număr de telefon, inclusiv bucăți de număr, scrise cu sau fără spații (vezi Task 2b). Celelalte cinci alegeri sunt confirmate de Andrei.
4. **Petele de culoare din fundal se fac cu degradeuri radiale, fără `filter: blur`.** La site, blurul mare a dat negru pe iPhone.
5. **`npm run demo` golește baza de test:** lead-uri, clienți și fișierele din `materiale`. Apoi pune la loc datele de test (ca `npm run seed`) și peste ele firma demo. Testele automate merg după `npm run demo` la fel ca după `npm run seed`.
6. **Un singur constructor** (Radu). Designul cere „1–2”; un al doilea cont ar intra și în testele care aleg oameni.

## Global Constraints

- Totul în română, cu ș/ț cu virgulă (niciodată ş/ţ), inclusiv în datele demo.
- Codul în `crm/`; înainte de cod Next.js citește `crm/AGENTS.md`.
- Tema dintr-un singur loc: `crm/app/tema.css`; fără culori hex noi direct în componente (se folosesc variabilele).
- Culorile rămân: grafit `#141417` (fundal), `#1c1c20` (panou), textul `#f1f1f3` / `#b4b4bb` / `#8a8a92`, auriul `#ffb52e`, gradientul `linear-gradient(90deg, #ffb52e, #f26a21 45%, #e53222)` folosit rar.
- Fonturi: Inter peste tot, fără majuscule forțate și fără litere rărite; **Chakra Petch iese** (și fișierele din `crm/public/fonts/`); JetBrains Mono doar pentru lucruri tehnice (conturi, link-uri); cifrele în Inter cu `tabular-nums`.
- Colțuri: panouri 16px, elemente mici 10px, bara laterală 22px; butoanele și etichetele de stare sunt pastile (999px).
- Sticla doar pe ce plutește (bara laterală, bara de sus, bara de jos de pe telefon, ferestrele/meniurile peste pagină); tabelele, listele și textul stau pe panouri pline.
- Fără animații la derulare.
- Nicio migrație de bază de date. Dacă totuși apare una, merge întâi pe test.
- Datele demo: nume românești inventate, telefoane evident de probă (`0700 …`), domenii doar `exemplu.ro` sau `.ro` inventate, nicio persoană sau firmă reală.
- Producția (`znabkoesmtoggdmehmqp`) nu se atinge. Scripturile de date refuză orice URL care nu conține ref-ul de test `sglkjcwsohzszktljacv`.
- Niciun e-mail spre adresele echipei demo sau spre `@test.buildwithac.ro`.
- La final trec toate: `npm test` (vitest), `npm run test:rls`, `npm run e2e`, `npm run tsc`, `npm run lint` (din `crm/`). Testele e2e care se bazează pe aspectul vechi se ajustează, nu se șterg.
- Commit-urile în română, terminate cu `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **iPhone Safari:** fundalul fix cu pete și sticla (`backdrop-filter`) pot da negru sau sacadări. Se așteaptă o pagină care se derulează curat. Petele sunt degradeuri radiale fără `filter`; testul e2e din Task 1 verifică `filter: none` pe ele. Pe telefonul lui Andrei se verifică la punctul de control (Task 4).
2. **390px:** tabelele late (lista de lead-uri, Echipa) și comutatorul de tab-uri nu au voie să facă pagina să se deruleze pe orizontală. Se derulează doar în interiorul panoului lor. Testele e2e de 390px din Task 3 acoperă lista și fișa clientului.
3. **Bara de jos de pe telefon** nu are voie să acopere ultimul rând al paginii, nici butoanele din fișă. `main` are spațiu jos cât bara plus zona sigură. Testul din Task 2 verifică asta.
4. **`npm run demo` pornit din greșeală pe producție** (de exemplu un `.env.local` schimbat) trebuie să se oprească înainte de orice scriere. Teste unitare pe `eBazaDeTest` în Task 6.
5. **Un e-mail spre o adresă fără căsuță** („Retrimite linkul” la Echipa, „Am uitat parola” pe `/intra`) nu pleacă. Adminul primește linkul pe ecran, ca atunci când Resend nu merge. Teste unitare în Task 6.

---

## Harta fișierelor

| Fișier | Ce face |
|---|---|
| `crm/app/tema.css` | variabilele temei A, clasele comune, fundalul cu pete |
| `crm/app/fonturi.css` | doar Inter și JetBrains Mono |
| `crm/app/layout.tsx` | fundalul cu pete (`<div class="perete">`) sub tot |
| `crm/components/Iconite.tsx` (nou) | iconițele cu linie, inline (SVG), câte una pe legătură |
| `crm/components/Navigare.tsx` | legăturile: bara laterală pe laptop, bara de jos pe telefon |
| `crm/components/BaraSus.tsx` (nou) | bara de sus de sticlă, sub formă de pastilă: unde ești + butoanele paginii |
| `crm/app/(app)/layout.tsx` | aranjarea: bara laterală desprinsă de margine, conținutul, bara de jos pe telefon |
| `crm/app/(cont)/layout.tsx` | intrarea și parola nouă, pe sticlă |
| `crm/components/Taburi.tsx` | controlul segmentat |
| `crm/components/fisa/Taskuri.tsx` | bifele rotunde |
| paginile din `crm/app/(app)/**/page.tsx` și componentele din `crm/components/**` | trec pe clasele noi |
| `crm/lib/echipa-test.ts` (nou) | conturile echipei de test/demo, ref-ul bazei de test, `eAdresaFaraCasuta`, `eBazaDeTest` |
| `crm/lib/email.ts`, `crm/app/(cont)/actiuni.ts` | nu trimit spre adresele fără căsuță |
| `crm/scripts/date/baza.mts` (nou) | ce era în `seed.mts`, ca funcții (clientul Supabase, conturile, lead-urile, programul, fișele, curățarea) |
| `crm/scripts/seed.mts` | doar apelează `baza.mts` |
| `crm/scripts/date/demo-date.ts` (nou) | generatorul pur al firmei demo (fără Supabase) |
| `crm/scripts/demo.mts` (nou) | `npm run demo [-- --singur]`: verifică baza, golește, pune datele de test, scrie firma demo |
| `crm/tests/unit/echipa-test.test.ts`, `crm/tests/unit/demo-date.test.ts` (noi) | testele unitare |
| `crm/tests/e2e/schelet.spec.ts`, `crm/tests/e2e/tema.spec.ts` (nou) | tema, aranjarea, 390px |

---

### Task 0: Planul pe ramură

**Files:** `docs/superpowers/plans/2026-11-10-plan-8-crm-tema-demo.md`, `docs/progres-brainstorming.md`

- [ ] **Step 1:** Pe ramura `crm-tema` (deja făcută din `main`), comite planul și stadiul.

```bash
git add docs/superpowers/plans/2026-11-10-plan-8-crm-tema-demo.md docs/progres-brainstorming.md
git commit -m "docs: planul CRM-ului, etapa 3, bucata 1 (tema și spațiul demo)"
```

---

### Task 1: Baza temei (variabile, clase comune, fonturi, fundal)

**Files:**
- Modify: `crm/app/tema.css`, `crm/app/fonturi.css`, `crm/app/layout.tsx`
- Delete: `crm/public/fonts/chakra-petch-*.woff2` (6 fișiere)
- Modify: toate locurile cu `font-label` (9), `uppercase` (6), `rounded-r` (7) și culorile hex scrise direct (`#ff7a66`, `#7a2a20`, `#5a4214`, `#2a2010`, `#5a1d16`, `#18181c`, `#3b2a12`) din `crm/app` și `crm/components`
- Test: `crm/tests/e2e/schelet.spec.ts`

**Interfaces:**
- Produces, pentru toate task-urile următoare. Clasele: `.panel`, `.btn`, `.btn.pri`, `.btn.mic` (butonul mic din rânduri), `.btn.pericol` (roșu, pentru „Sigur?” și „Șterge clientul”), `.chip` + culorile `amber|green|red|blue` (fundal din aceeași culoare la 15%, fără chenar), `.lbl` (Inter 600 12.5px, `--ink-3`, fără majuscule), `.camp`, `.sticla` (sticla din prototip, cu marginea luminată `::before`), `.alerta` (caseta aurie: „Cerere nouă”, „Urmează”), `.num` (`tabular-nums`), `.eroare` (textul roșu al mesajelor).
- Clasele Tailwind din `@theme`: `bg-bg`, `bg-bg-2` (= panoul `#1c1c20`), `bg-bg-3` (= `#232328`), `border-line`, `border-line-2`, `text-ink|ink-2|ink-3`, `text-amber`, `text-green`, `text-red-t` (`#ff7a66`), `text-blue`, `rounded-r` (= 10px), `rounded-panou` (= 16px), `rounded-xl2` (= 22px).

Valorile, din prototip (varianta A):

```css
--bg:#141417; --bg-2:#1c1c20; --bg-3:#232328;
--line:rgba(255,255,255,.07); --line-2:rgba(255,255,255,.12);
--ink:#f1f1f3; --ink-2:#b4b4bb; --ink-3:#8a8a92;
--glass:rgba(30,30,34,.55); --glass-bd:rgba(255,255,255,.07); --glass-hi:rgba(255,255,255,.10);
--edge-a:rgba(255,255,255,.22); --edge-b:rgba(255,255,255,.05); --blur:28px; --shadow:rgba(0,0,0,.35);
--wall-1:#ffb52e; --wall-2:#e53222; --wall-3:#7a0e0e; --wall-op:.10;
--r:10px; --r-panou:16px; --r-xl:22px;
--sel:rgba(255,255,255,.08); --seg:rgba(255,255,255,.05); --thumb:rgba(255,255,255,.12); --btn:rgba(255,255,255,.07);
--amber:#ffb52e; --green:#4fbf8a; --red-t:#ff7a66; --blue:#6b9bd1;
--urm:rgba(255,181,46,.07); --urm-bd:rgba(255,181,46,.22);
```

- [ ] **Step 1: Schimbă testul temei în `schelet.spec.ts`.** Testul se numește „tema A: fundal grafit, titluri în Inter, fără Chakra Petch”:

```ts
expect(fundal).toBe("rgb(20, 20, 23)");
expect(font).toMatch(/^"?Inter/);
const chakra = await page.request.get("/fonts/chakra-petch-500-latin.woff2");
expect(chakra.status()).toBe(404);
const pete = await page.locator(".perete i").evaluateAll((els) => els.map((e) => getComputedStyle(e).filter));
expect(pete.length).toBe(3);
expect(pete.every((f) => f === "none")).toBe(true);
```

- [ ] **Step 2: Rulează testul și verifică că pică.**

Run: `npx playwright test tests/e2e/schelet.spec.ts`
Expected: FAIL, fontul e „Chakra Petch”.

- [ ] **Step 3: Rescrie `tema.css`.** Pune variabilele de mai sus, clasele din „Produces” (aspectul lor e cel din `prototip/crm-tema.html`, regulile `.btn`, `.chip`, `.lbl`, `.panel`, `.glass`) și fundalul `.perete`. Fundalul e fix, sub tot (`z-index: 0`, `pointer-events: none`). Are trei `<i>` cu `background: radial-gradient(closest-side, var(--wall-N), transparent)`, opacitate `var(--wall-op)`, fără `filter`, la pozițiile și mărimile din prototip (`.w1`/`.w2`/`.w3`). `body` primește `font-feature-settings: "cv11","ss01"`. `h1, h2, h3` trec pe Inter (`font-weight: 700`, `letter-spacing: -.025em`). `.camp` are colțuri de 10px, fundalul `--seg` și focusul auriu. Toate elementele cu care se poate lucra (`.btn`, `.chip` ca link, tab-urile, `.camp`) au `:focus-visible` cu inel auriu de 2px.
- [ ] **Step 4: Scoate Chakra Petch.** Scoate cele 6 blocuri din `fonturi.css`, șterge cele 6 fișiere și scoate `--label`/`--font-label`. În `app/layout.tsx`, primul copil din `<body>` devine `<div className="perete" aria-hidden><i className="w1"/><i className="w2"/><i className="w3"/></div>`.
- [ ] **Step 5: Înlocuiește clasele vechi peste tot.**
  - `font-label` → nimic, sau `font-semibold` acolo unde era titlu;
  - `uppercase` și `tracking-*` de pe etichete → scoase;
  - culorile hex scrise direct → clasele din „Produces”: `text-[#ff7a66]` → `text-red-t` sau `.eroare`, caseta `#5a4214`/`#2a2010` → `.alerta`, butonul `!border-[#7a2a20] !text-[#ff7a66]` → `.btn.pericol`.

  Verifică: `grep -rnE "font-label|Chakra|\[#[0-9a-fA-F]{3,6}\]" crm/app crm/components` nu mai găsește nimic.
- [ ] **Step 6: Rulează testele.**

Run: `npx playwright test tests/e2e/schelet.spec.ts && npm run tsc && npm run lint`
Expected: PASS, fără erori.

- [ ] **Step 7: Commit:** `crm: tema A „Grafit” (variabilele, clasele comune, Inter, fundalul cu pete)`

---

### Task 2: Aranjarea: bara laterală, bara de sus, bara de jos pe telefon

**Files:**
- Create: `crm/components/Iconite.tsx`, `crm/components/BaraSus.tsx`
- Modify: `crm/components/Navigare.tsx`, `crm/app/(app)/layout.tsx`, `crm/app/(cont)/layout.tsx`
- Test: `crm/tests/e2e/tema.spec.ts` (nou)

**Interfaces:**
- Consumes: clasele din Task 1.
- Produces:
  - `export type NumeIconita = "lead-uri" | "clienti" | "taskuri" | "program" | "echipa" | "iesi"`;
  - `export function Iconita({ nume, className }: { nume: NumeIconita; className?: string })`: SVG 24×24, `stroke="currentColor"`, `fill="none"`, `strokeWidth={1.8}`, `aria-hidden`; desenele din `prototip/crm-tema.html` (`i-inbox`, `i-users`, `i-check`, `i-cal`, `i-team`), plus o săgeată de ieșire în același stil;
  - `export type Legatura = { href: string; eticheta: string; iconita: NumeIconita }`;
  - `export function Navigare({ legaturi, unde }: { legaturi: Legatura[]; unde: "laterala" | "jos" })`;
  - `export function BaraSus({ cale, children }: { cale: { eticheta: string; href?: string }[]; children?: React.ReactNode })`, componentă de server. Ultimul element din `cale` e îngroșat, cele dinainte sunt link-uri despărțite de „›”. `children` = butoanele paginii, aliniate la dreapta.

Aranjarea, din prototip:
- **Laptop (≥768px):**
  - bara laterală e `.sticla`, fixă, la 12px de margini, lată de 236px, cu colțuri `--r-xl`;
  - conținutul are la stânga spațiu cât bara laterală (256px) și e lat de cel mult 1160px;
  - legătura activă are fundalul `--sel` și iconița aurie;
  - jos în bară stau avatarul (gradientul logo-ului la Admin), numele, rolul și „Ieși” (iconița `iesi` cu `aria-label="Ieși"`, sau textul).
- **Telefon (<768px):**
  - bara laterală nu se vede;
  - sus, o fâșie simplă (nu sticlă) cu logo, „buildwithac” și „Ieși”;
  - jos, `nav` fix cu `aria-label="Navigare"`, `.sticla`, cu colțuri mari, la 10px de margini și de zona sigură (`env(safe-area-inset-bottom)`);
  - fiecare legătură are iconița deasupra și eticheta scurtă dedesubt: „Lead-uri”, „Clienți”, „Task-uri”, „Program”, „Echipa”;
  - `main` are jos spațiu de `calc(84px + env(safe-area-inset-bottom))`.
- `app/layout.tsx` exportă `viewport = { viewportFit: "cover", themeColor: "#141417" }`.
- Bara de sus e `.sticla`, `position: sticky; top: 12px`, cu colțuri de pastilă, `mb-[26px]`. Pe telefon `top` e 8px, iar butoanele trec sub ea dacă nu încap (`flex-wrap`).
- `(cont)/layout.tsx`: cardul de intrare devine `.sticla`, cu colțuri `--r-xl`, peste fundalul cu pete; logo-ul e ca în bara laterală.

- [ ] **Step 1: Scrie testele în `tema.spec.ts`.**

```ts
test("pe laptop, bara laterală arată legătura activă", async ({ page }) => {
  await intraCa(page, "admin");
  await page.goto("/clienti");
  const nav = page.getByRole("navigation", { name: "Navigare" }).filter({ visible: true });
  await expect(nav.getByRole("link", { name: "Clienți" })).toHaveAttribute("aria-current", "page");
});

test("pe telefon, legăturile sunt jos și nu acoperă pagina", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await intraCa(page, "admin");
  const jos = page.getByRole("navigation", { name: "Navigare" }).filter({ visible: true });
  const cutie = (await jos.boundingBox())!;
  expect(cutie.y + cutie.height).toBeGreaterThan(844 - 40);
  await jos.getByRole("link", { name: "Echipa" }).click();
  await expect(page).toHaveURL(/\/echipa/);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  const ultim = await page.locator("main > *").last().boundingBox();
  expect(ultim!.y + ultim!.height).toBeLessThanOrEqual(cutie.y + 1);
});
```

- [ ] **Step 2: Rulează testele și verifică că pică.**

Run: `npx playwright test tests/e2e/tema.spec.ts`
Expected: FAIL, nu există `navigation` cu numele „Navigare”.

- [ ] **Step 3: Construiește.** Construiește `Iconite.tsx`, `Navigare.tsx` (prop `unde`), `BaraSus.tsx` și cele două layout-uri, cum scrie mai sus. `legaturiPentru(rol)` din `(app)/layout.tsx` primește și `iconita`, pentru fiecare legătură. Numele legăturilor în bara laterală rămân cele de acum („Task-urile mele”); pe telefon e „Task-uri”, cu `aria-label="Task-urile mele"`, ca testele să găsească același nume.
- [ ] **Step 4: Rulează testele.**

Run: `npx playwright test tests/e2e/tema.spec.ts tests/e2e/schelet.spec.ts tests/e2e/cont.spec.ts`
Expected: PASS.

- [ ] **Step 5: Commit:** `crm: aranjarea temei A (bara laterală de sticlă, bara de sus, bara de jos pe telefon)`

---

### Task 2b: Căsuța de căutare din bara de sus

**Files:**
- Create: `crm/components/Cautare.tsx`
- Modify: `crm/components/BaraSus.tsx`, iar dacă e nevoie, căutarea existentă din `crm/app/(app)/lead-uri/page.tsx` / `crm/lib/filtre.ts`
- Test: `crm/tests/e2e/tema.spec.ts`, `crm/tests/unit/filtre.test.ts`

**Interfaces:**
- Consumes: căutarea care există deja în lista de lead-uri (`?q=`, placeholder „Nume, telefon sau e-mail”; `lista.spec.ts` arată că găsește deja un telefon scris pe jumătate).
- Produces: `export function Cautare()`, componentă de client. E un formular `GET` spre `/lead-uri` cu câmpul `q`, `aria-label="Caută lead-uri"` și placeholderul „Caută după nume sau telefon”. `BaraSus` o arată pentru toate rolurile, în afară de Constructor (el nu vede lead-uri). Pe telefon, bara arată doar iconița de lupă, iar căsuța se deschide la apăsare.

Reguli de căutare (le verifici întâi pe cea existentă și completezi doar ce lipsește):
- **Cuvintele:** fiecare cuvânt trebuie să apară în nume (inclusiv firma de după „ · ”), fără să conteze majusculele și diacriticele: „florarie iris” găsește „Florăria Iris”.
- **Cifrele:** dacă `q` are cel puțin 3 cifre, se caută și în `telefon_norm`, după cifrele din `q`. Spațiile, punctele și un „+40” sau „0” de la început nu contează: „0722 000”, „722000” și „+40722000” găsesc același lead.
- **Scurtătura:** `Ctrl K` (pe Mac `⌘K`) mută cursorul în căsuță, ca în prototip.

- [ ] **Step 1: Scrie testele.** Testele unitare pentru cum se transformă `q` în condiții:
  - `"florarie iris"` → două cuvinte;
  - `"+40 722 000"` → cifrele `722000`;
  - `"ab"` → fără căutare după telefon.

  Testul e2e: ca `caller`, scrie „Cafeneaua” în căsuța din bara de sus, apasă Enter și verifică `/lead-uri?q=` și link-ul „Elena Marin · Cafeneaua Boabe”. Apoi caută „000 001” și găsește același lead.
- [ ] **Step 2: Rulează testele și verifică că pică.**

Run: `npx vitest run tests/unit/filtre.test.ts && npx playwright test tests/e2e/tema.spec.ts`
Expected: FAIL, căsuța nu există.

- [ ] **Step 3: Construiește.**
- [ ] **Step 4: Rulează testele.**

Run: `npx vitest run tests/unit/filtre.test.ts && npx playwright test tests/e2e/tema.spec.ts tests/e2e/lista.spec.ts`
Expected: PASS.

- [ ] **Step 5: Commit:** `crm: căutarea lead-urilor din bara de sus (nume, cuvinte, telefon)`

---

### Task 3: Cele două ecrane de probă: fișa clientului și lista de lead-uri

**Files:**
- Modify: `crm/components/Taburi.tsx`, `crm/components/fisa/Taskuri.tsx`, `crm/app/(app)/clienti/[id]/page.tsx`, `crm/app/(app)/lead-uri/page.tsx`, plus componentele din `crm/components/fisa/*` folosite pe fișă
- Test: `crm/tests/e2e/tema.spec.ts`

**Interfaces:**
- Consumes: `BaraSus`, clasele din Task 1.
- Produces:
  - `Taburi` cu aceeași semnătură, ca acum;
  - lista de tab-uri e un control segmentat, ca în prototip (`.seg`): pastilă cu fundalul `--seg`, tab-ul activ cu fundalul `--thumb` și umbră, derulare orizontală în interior (`overflow-x: auto`, fără bară de derulare);
  - conținutul tab-ului stă într-un `.panel` separat, sub comutator.

Fișa clientului, după prototip:
- **`BaraSus`:** `cale=[{eticheta:"Clienți", href:"/clienti"}, {eticheta: numele clientului}]`; butoanele de acțiune rămân unde sunt acum în pagină. Nu muta acțiunile cu formulare: e prea riscant.
- **Capul fișei:** pătratul cu inițialele (60px, colțuri 18px, auriu la 16%), `h1` de 30px, apoi pastilele: serviciul (albastru), stadiul (auriu, cu punct), „Client din …”.
- **„Urmează”:** `.panel.alerta`, eticheta aurie, bara de progres de 6px cu gradientul și „N din M task-uri gata” cu `.num`.
- **„Contact” și „Proiectul”:** rânduri ca în Setări (eticheta stânga, valoarea dreapta, linie subțire între ele, fără linie după ultimul).
- **„Proiectul”:** are deasupra cele 6 liniuțe de stadiu (gata = auriu 45%, acum = auriu, restul = `--seg`) și „Construcție · stadiul 3 din 6”. Ordinea stadiilor: `discutie, schita, constructie, revizii, livrat, mentenanta`.
- **Task-urile:** bife rotunde de 20px. Gata = verde plin cu „✓” și titlul tăiat, gri. Termenul întârziat e `text-red-t`. Rămâne `<input type="checkbox">` real, ascuns vizual peste cerc, ca testele și tastatura să meargă.
- **Parcursul:** linia verticală `--seg` și punctele din prototip (`.tl`/`.ev`). Primul eveniment (cel mai nou) are punctul auriu.
- **Fonturi:** prețurile și cifrele au `.num`; `font-mono` rămâne doar pe conturi și link-uri.

Lista de lead-uri:
- **`BaraSus`:** `cale=[{eticheta:"Lead-uri"}]`, cu „+ Lead nou” (`.btn.pri`) ca buton al paginii.
- **Cardurile de numărătoare:** `.panel`; cel activ are chenarul auriu.
- **Tabelul:** stă într-un `.panel` cu `overflow-x-auto`; antetul folosește `.lbl`; rândurile au linii subțiri; starea e o `.chip` colorată (nou = albastru, programat/ofertă = auriu, client = verde, pierdut/descalificat = roșu, restul = gri).

- [ ] **Step 1: Scrie testele în `tema.spec.ts`.**

```ts
test("fișa clientului: tab-urile sunt un comutator, la 390px fără scroll orizontal", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await intraCa(page, "admin");
  await page.goto("/clienti");
  await page.getByRole("link", { name: /Laura Ene/ }).first().click();
  await page.getByRole("tab", { name: /Parcurs/ }).click();
  await expect(page.getByRole("tab", { name: /Parcurs/ })).toHaveAttribute("aria-selected", "true");
  const lat = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(lat).toBeLessThanOrEqual(390);
});

test("bifa rotundă a unui task se poate apăsa", async ({ page }) => {
  // pe un proiect făcut în test (ca în taskuri.spec.ts), bifează un task și verifică că apare tăiat (are clasa line-through)
});
```

Al doilea test refolosește pregătirea datelor din `tests/e2e/taskuri.spec.ts` (lead nou → client → task). Verifică `getByRole("checkbox", { name: <titlul task-ului> })` → `toBeChecked()` după click și `toHaveCSS("text-decoration-line", "line-through")` pe titlu.

- [ ] **Step 2: Rulează testele și verifică că pică.**

Run: `npx playwright test tests/e2e/tema.spec.ts`
Expected: FAIL la bifă (titlul nu e tăiat).

- [ ] **Step 3: Construiește** cele două ecrane, cum scrie mai sus.
- [ ] **Step 4: Rulează testele.**

Run: `npx playwright test tests/e2e/tema.spec.ts tests/e2e/fisa-client.spec.ts tests/e2e/taskuri.spec.ts tests/e2e/lista.spec.ts tests/e2e/materiale.spec.ts`
Expected: PASS.

- [ ] **Step 5: Commit:** `crm: fișa clientului și lista de lead-uri în tema A`

---

### Task 4: Punctul de control cu Andrei (fără cod)

- [ ] **Step 1: Pornește serverul local.** Din `crm/`: `npm run dev -- --port 3100`.
- [ ] **Step 2: Arată-i lui Andrei** fișa „Laura Ene · Atelier Ceramică” și lista de lead-uri, în Chrome:
  - pe laptop, ca `admin@test.buildwithac.ro` (adresele noi vin abia în Task 6);
  - la 390px, cu iframe-uri de 390px injectate cu JS, ca la site;
  - pune alături `prototip/crm-tema.html#A`, servit cu `python -m http.server 8765` din `prototip/`.
- [ ] **Step 3: Notează ce cere** și fă schimbările pe aceeași ramură, până zice „e bine”. Dacă vrea să vadă pe iPhone, cere-i voie pentru `git push -u origin crm-tema`. Previzualizarea Vercel (proiectul `buildwithac-crm`) folosește baza de test; adresa o iei cu `npx vercel ls` din `crm/`.
- [ ] **Step 4:** Scrie „Task 4: Andrei a zis «e bine»” în jurnal (`.superpowers/sdd/2026-11-10-plan-8-crm-tema-demo/progress.md`). **Fără acordul lui nu se trece la Task 5.**

---

### Task 5: Tema pe restul ecranelor

**Files:** `crm/app/(app)/lead-uri/[id]/page.tsx`, `lead-uri/[id]/programeaza/page.tsx`, `lead-uri/nou/page.tsx`, `program/page.tsx`, `clienti/page.tsx`, `taskuri/page.tsx`, `echipa/page.tsx`, `crm/app/(cont)/intra/page.tsx`, `(cont)/parola/page.tsx` și componentele lor (`ButoaneActiuni`, `ButoaneRand`, `CalendarSloturi`, `Echipa`, `Formular*`, `MutaLa`, `StergeLead`)

**Interfaces:**
- Consumes: `BaraSus`, `Taburi`, clasele din Task 1, tiparele de pe cele două ecrane din Task 3, inclusiv ce a schimbat Andrei la punctul de control.

Reguli:
- Fiecare pagină din `(app)` începe cu `BaraSus`. Blocul vechi „`lbl` CRM + `h1`” se înlocuiește cu `BaraSus`, iar `h1` (26–30px, Inter 700) rămâne sub ea:
  - fișa de lead: Lead-uri › nume;
  - programarea: Lead-uri › nume › Programează;
  - lead nou: Lead-uri › Lead nou;
  - restul paginilor: numele paginii.
- Fișa de lead folosește aceleași panouri, rânduri ca în Setări, `Taburi` și Parcurs ca fișa clientului.
- Calendarul (`CalendarSloturi`) are orele libere ca pastile (`.chip` ca buton); ora aleasă e aurie plină.
- `FormularProgram`, căsuța „liber” din `FormularLead` și orice alt `checkbox`: comutator ca pe iPhone (`role="switch"` nu e nevoie; rămâne `checkbox`, desenat cu CSS ca pastilă de 36×22px, care se face verde când e bifat), definit o dată în `tema.css` ca `.comutator`.
- Echipa și Task-urile mele: tabelele/listele pe `.panel`, stările ca `.chip`, adresele în `font-mono`.

- [ ] **Step 1: Construiește** după regulile de mai sus, pagină cu pagină.
- [ ] **Step 2: Verifică** că `grep -rn "lbl mb-1.5\">CRM" crm/app` nu mai găsește nimic (blocul vechi de titlu a dispărut peste tot).
- [ ] **Step 3: Rulează toate testele e2e.**

Run: `npm run e2e`
Expected: toate trec. Un test care pică doar din cauza aspectului (o etichetă schimbată, un element mutat) se ajustează și se scrie în jurnal.

- [ ] **Step 4: Fă capturi.** La 1440px și la 390px, pentru fiecare ecran, în scratchpad, cu un script Playwright de unică folosință, ținut în afara proiectului. Uită-te la ele: nimic tăiat, nimic peste bara de jos, nicio majusculă rămasă.
- [ ] **Step 5: Commit:** `crm: tema A pe toate ecranele`

---

### Task 6: Echipa de test devine echipa demo; fără e-mailuri spre adrese fără căsuță

**Files:**
- Create: `crm/lib/echipa-test.ts`, `crm/tests/unit/echipa-test.test.ts`
- Modify: `crm/lib/email.ts`, `crm/app/(cont)/actiuni.ts`, `crm/scripts/seed.mts` (lista conturilor și mutarea adreselor), `crm/tests/e2e/ajutor.ts`, `crm/tests/e2e/cont.spec.ts`, `crm/tests/e2e/date.ts`, `crm/tests/rls/ajutor.ts`

**Interfaces:**
- Produces (în `lib/echipa-test.ts`):
  - `export type ContTest = "admin" | "caller" | "caller2" | "closer" | "constructor"` (cheile de acum, ca testele să nu se schimbe);
  - `export const ECHIPA_TEST: Record<ContTest, { email: string; nume: string; rol: Rol; emailVechi: string }>` cu valorile din „Ce am hotărât eu”, punctul 1. `emailVechi` = `${cheie}@test.buildwithac.ro`;
  - `export const REF_TEST = "sglkjcwsohzszktljacv"`;
  - `export function eBazaDeTest(url: string | undefined): boolean`: adevărat doar dacă `url` e `https://${REF_TEST}.supabase.co`, cu sau fără `/` la final;
  - `export function eAdresaFaraCasuta(email: string, urlBaza = process.env.NEXT_PUBLIC_SUPABASE_URL): boolean`: adevărat pentru orice adresă `@test.buildwithac.ro` (oriunde) și pentru adresele din `ECHIPA_TEST`, dar acestea doar când `eBazaDeTest(urlBaza)`. Pe producție, `mara@buildwithac.ro` ar putea fi într-o zi un om adevărat.
- Consumes: `Rol` din `@/lib/tipuri`.

- [ ] **Step 1: Scrie testul unitar `echipa-test.test.ts`.**

```ts
const TEST = "https://sglkjcwsohzszktljacv.supabase.co";
const PROD = "https://znabkoesmtoggdmehmqp.supabase.co";
it("recunoaște doar baza de test", () => {
  expect(eBazaDeTest(TEST)).toBe(true);
  expect(eBazaDeTest(TEST + "/")).toBe(true);
  expect(eBazaDeTest(PROD)).toBe(false);
  expect(eBazaDeTest(undefined)).toBe(false);
  expect(eBazaDeTest("https://sglkjcwsohzszktljacv.supabase.co.rau.ro")).toBe(false);
});
it("adresele fără căsuță", () => {
  expect(eAdresaFaraCasuta("temp123@test.buildwithac.ro", PROD)).toBe(true);
  expect(eAdresaFaraCasuta("Mara@BuildWithAC.ro", TEST)).toBe(true);
  expect(eAdresaFaraCasuta("mara@buildwithac.ro", PROD)).toBe(false);
  expect(eAdresaFaraCasuta("contact@buildwithac.ro", TEST)).toBe(false);
});
it("trimiteEmail nu cheamă Resend pentru o adresă fără căsuță", async () => {
  process.env.RESEND_API_KEY = "x";
  const f = vi.fn();
  expect(await trimiteEmail({ catre: "caller@test.buildwithac.ro", subiect: "s", text: "t", html: "h" }, f)).toBe(false);
  expect(f).not.toHaveBeenCalled();
});
```

- [ ] **Step 2: Rulează testul și verifică că pică.**

Run: `npx vitest run tests/unit/echipa-test.test.ts`
Expected: FAIL, modulul nu există.

- [ ] **Step 3: Scrie `lib/echipa-test.ts`.** Apoi:
  - `trimiteEmail` întoarce `false` înainte de `fetch` când `eAdresaFaraCasuta(e.catre)`. Invitația și „Retrimite” arată atunci linkul pe ecran (comportamentul de acum, când Resend nu merge);
  - `cereParolaNoua` nu cheamă `resetPasswordForEmail` pentru o adresă fără căsuță, dar întoarce același mesaj.
- [ ] **Step 4: Rulează testul.**

Run: `npx vitest run tests/unit/echipa-test.test.ts`
Expected: PASS.

- [ ] **Step 5: Mută adresele în seed.** `seed.mts` ia conturile din `ECHIPA_TEST`. Pentru fiecare cont caută întâi `email`, apoi `emailVechi`. Dacă îl găsește după `emailVechi`, îl mută cu `auth.admin.updateUserById(id, { email, email_confirm: true, password, ban_duration: "none" })`. Apoi `profiluri.upsert` cu `email`-ul nou. Rulat de două ori, nu dublează nimic.
- [ ] **Step 6: Trece testele pe adresele noi.**
  - `intraCa` (`tests/e2e/ajutor.ts`), `idDe` (`tests/e2e/date.ts`), `cont.spec.ts` și `emailTest` (`tests/rls/ajutor.ts`) iau adresa din `ECHIPA_TEST[cont].email`;
  - adresele temporare `temp…@test.buildwithac.ro` din teste rămân cum sunt.
- [ ] **Step 7: Rulează seed-ul și toate testele.**

Run: `npm run seed && npm test && npm run test:rls && npm run e2e`
Expected: seed-ul scrie „Gata: 5 conturi de test…”, iar toate testele trec.

- [ ] **Step 8: Commit:** `crm: echipa de test pe adrese demo; fără e-mailuri spre adrese fără căsuță`

---

### Task 7: `npm run demo`: verificarea bazei, golirea și datele de test

**Files:**
- Create: `crm/scripts/date/baza.mts`, `crm/scripts/demo.mts`
- Modify: `crm/scripts/seed.mts`, `crm/package.json` (`"demo": "tsx scripts/demo.mts"`)

**Interfaces:**
- Consumes: `ECHIPA_TEST`, `eBazaDeTest` (Task 6).
- Produces (în `scripts/date/baza.mts`; mută codul de acum din `seed.mts`):
  - `export const db: SupabaseClient<Database>`;
  - `export function cereBazaDeTest(): void`: oprește procesul cu mesaj dacă `CRM_MEDIU !== "test"` sau dacă `!eBazaDeTest(NEXT_PUBLIC_SUPABASE_URL)`. Se cheamă înainte de orice scriere, în `seed.mts` și în `demo.mts`;
  - `export async function conturi(): Promise<Record<ContTest, string>>`;
  - `export async function leaduri(ids)`, `export async function program(ids)`, `export async function fise(ids)`, `export async function curataUrme()` (ștergerea prefixelor „E2E %” etc.);
  - `export async function client(telefonNorm: string, lead: LeadNou): Promise<{ clientId: string; proiectId: string }>`, folosit și de demo;
  - `export async function golesteTot(): Promise<void>`: șterge toate rândurile din `clienti` (cascada ia proiectele și tot ce e sub ele), apoi din `lead_uri` (cascada ia cererile, evenimentele, notițele, discuțiile), apoi toate obiectele din bucketul `materiale`. `program_closer` și conturile rămân.
- `seed.mts` = `cereBazaDeTest(); await curataUrme(); ids = await conturi(); await leaduri(ids); await program(ids); await fise(ids);` + mesajul de acum.
- `demo.mts` (în acest task): `cereBazaDeTest(); await golesteTot(); ids = await conturi(); await leaduri(ids); await program(ids); await fise(ids);` + „Gata: firma demo …”. Firma demo vine în Task 8 și Task 9, scrisă **înainte** de `leaduri(ids)`. `leaduri` pune `intrat_la = acum` lead-urilor de test, deci acestea stau primele în listă și testele care citesc pagina 1 găsesc ce caută.

- [ ] **Step 1: Mută codul.** Mută codul din `seed.mts` în `baza.mts`, fără să schimbi comportamentul, și adaugă `cereBazaDeTest` și `golesteTot`.
- [ ] **Step 2: Verifică oprirea pe altă bază.**

Run: `NEXT_PUBLIC_SUPABASE_URL=https://znabkoesmtoggdmehmqp.supabase.co npx tsx scripts/demo.mts`
Expected: se oprește cu mesajul de refuz și cod de ieșire 1, fără nicio cerere spre Supabase. `.env.local` nu suprascrie variabilele deja puse: `process.loadEnvFile` nu le suprascrie; verifică asta, iar dacă nu e așa, citește `.env.local` doar pentru cheile lipsă.

- [ ] **Step 3: Rulează demo-ul și testele.**

Run: `npm run demo && npm run e2e && npm run test:rls`
Expected: toate trec (baza e golită și pusă la loc doar cu datele de test).

- [ ] **Step 4: Commit:** `crm: npm run demo (verificarea bazei de test, golirea, datele de test)`

---

### Task 8: Firma demo: lead-urile, Parcursul și programul closerului

**Files:**
- Create: `crm/scripts/date/demo-date.ts`, `crm/tests/unit/demo-date.test.ts`
- Modify: `crm/scripts/demo.mts`

**Interfaces:**
- Consumes: `db`, `ECHIPA_TEST`, `ContTest`.
- Produces (în `demo-date.ts`, fără Supabase, fără `Date.now()` înăuntru):
  - `export type Optiuni = { acum: Date; singur: boolean }`;
  - `export type LeadDemo = { nr: number; nume: string; serviciu: Serviciu; sursa: Sursa; stare: Stare; acumZile: number; caller?: ContTest; closer?: ContTest; motiv?: string; callbackPesteOre?: number; raspunsuri?: { intrebare: string; raspuns: string }[]; utm?: Record<string, string>; notite: { autor: ContTest; acumZile: number; text: string }[]; parcurs: { tip: string; autor?: ContTest; acumZile: number; detalii?: Record<string, unknown> }[] }`;
  - `export function leaduriDemo(o: Optiuni): LeadDemo[]`;
  - `export function discutiiDemo(o: Optiuni, leaduri: LeadDemo[]): { nr: number; incepe: Date; minute: 30 }[]`: pentru lead-urile „programat”, în următoarele 5 zile lucrătoare, între 10:00 și 18:00, ora României (`Europe/Bucharest`), fără suprapuneri;
  - `export const telefonDemo = (nr: number) => \`0700 100 ${String(nr).padStart(3, "0")}\``, iar `telefonNormDemo` = `40700100` + 3 cifre (nu se ciocnesc cu seed-ul `407000000NN` și nici cu e2e `40799…`).

Conținutul (scris de mână, ca text credibil):
- **48 de lead-uri.** Sursele: `formular_site`, `reclama_meta`, `reclama_tiktok`, `recomandare`, `cold_calling`, `dm_instagram`; „adăugat de mână” înseamnă `creat_de` = Admin.
- **Stările:** toate cele 9; cele mai multe sunt `nou`, `fara_raspuns` și `callback`, iar 5 sunt `programat`.
- **Vârsta:** `acumZile` între 1 și 80 (sub cele 90 de zile după care jobul zilnic șterge).
- **Lead-urile din reclame** au `raspunsuri` la întrebările formularului de reclamă (afacerea, ce vrea să rezolve, bugetul), iar cele de pe site au „Descriere”.
- **Notițe și Parcurs:** 1–3 notițe credibile; un parcurs care se potrivește cu starea (preluat, n-a răspuns, a răspuns, programat…), cu zilele în ordine.
- **Tipurile din `parcurs`** sunt exact cele pe care le scrie aplicația în `evenimente` (vezi `lib/parcurs.ts` și trigger-ele din `supabase/migrations/20261110000003_triggere.sql`), ca Parcursul să le afișeze cu textul lor.
- **`singur: true`:** fiecare `caller`/`closer`/`autor` devine `"admin"`.

Scrierea în `demo.mts`:
1. Inserează lead-urile cu `stare`, `intrat_la = acum − acumZile`, `caller_id`, `closer_id`, `creat_de`.
2. Pentru fiecare lead, inserează cererea, notițele și evenimentele cu `la`-ul lor.
3. Șterge evenimentele pe care trigger-ele le-au pus la inserare cu `la = acum`, ca Parcursul să nu arate „acum” peste tot.
4. Inserează discuțiile pentru lead-urile „programat” (closerul e `ioana`; cu `--singur`, `admin`; programul admin-ului se pune doar în modul singur, L–V 10–18).

- [ ] **Step 1: Scrie testul unitar `demo-date.test.ts`.**

```ts
const acum = new Date("2026-11-12T09:00:00Z"); // o miercuri
const L = leaduriDemo({ acum, singur: false });
it("are 40–60 de lead-uri, din toate sursele cerute și în toate stările", () => {
  expect(L.length).toBeGreaterThanOrEqual(40); expect(L.length).toBeLessThanOrEqual(60);
  for (const s of ["formular_site", "reclama_meta", "reclama_tiktok", "recomandare", "cold_calling"]) expect(L.some((l) => l.sursa === s)).toBe(true);
  for (const s of ["nou","fara_raspuns","a_raspuns","callback","programat","oferta_trimisa","client","pierdut","descalificat"]) expect(L.some((l) => l.stare === s)).toBe(true);
});
it("nimic de test, nimic real, totul sub 90 de zile", () => {
  const text = JSON.stringify(L);
  expect(text).not.toMatch(/test|e2e|demo|lorem/i);
  expect(text).not.toMatch(/[şţŞŢ]/);
  expect(L.every((l) => l.acumZile >= 1 && l.acumZile <= 80)).toBe(true);
  expect(new Set(L.map((l) => l.nr)).size).toBe(L.length);
  expect(new Set(L.map((l) => l.nume)).size).toBe(L.length);
});
it("parcursul e în ordine și nu trece de ziua intrării", () => {
  for (const l of L) { const z = l.parcurs.map((p) => p.acumZile); expect(z.every((x) => x <= l.acumZile)).toBe(true); expect([...z].sort((a, b) => b - a)).toEqual(z); }
});
it("singur: totul e al adminului", () => {
  const S = leaduriDemo({ acum, singur: true });
  expect(S.every((l) => (l.caller ?? "admin") === "admin" && (l.closer ?? "admin") === "admin")).toBe(true);
});
it("discuțiile cad în zile lucrătoare, 10–18 ora României, fără suprapuneri", () => {
  const D = discutiiDemo({ acum, singur: false }, L);
  expect(D.length).toBe(L.filter((l) => l.stare === "programat").length);
  for (const d of D) {
    const ora = Number(new Intl.DateTimeFormat("ro-RO", { timeZone: "Europe/Bucharest", hour: "numeric", hour12: false }).format(d.incepe));
    expect(ora).toBeGreaterThanOrEqual(10); expect(ora).toBeLessThan(18);
    const zi = new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Bucharest", weekday: "short" }).format(d.incepe);
    expect(["Sat", "Sun"]).not.toContain(zi);
    expect(d.incepe.getTime()).toBeGreaterThan(acum.getTime());
  }
  const t = D.map((d) => d.incepe.getTime()).sort();
  for (let i = 1; i < t.length; i++) expect(t[i] - t[i - 1]).toBeGreaterThanOrEqual(30 * 60_000);
});
```
- [ ] **Step 2: Rulează testul și verifică că pică.**

Run: `npx vitest run tests/unit/demo-date.test.ts`
Expected: FAIL, modulul nu există.

- [ ] **Step 3: Scrie `demo-date.ts`** (datele și cele două funcții).
- [ ] **Step 4: Rulează testul.**

Run: `npx vitest run tests/unit/demo-date.test.ts`
Expected: PASS.

- [ ] **Step 5: Scrie lead-urile în `demo.mts`** (pașii de mai sus) și adaugă `--singur` (`process.argv.includes("--singur")`).
- [ ] **Step 6: Rulează demo-ul de două ori.**

Run: `npm run demo && npm run demo`
Expected: de fiecare dată aceleași numere în mesajul final: „Gata: firma demo, N lead-uri, …”.

- [ ] **Step 7: Rulează testele e2e.**

Run: `npm run e2e`
Expected: PASS (lead-urile de test sunt primele în listă).

- [ ] **Step 8: Commit:** `crm: firma demo (lead-urile, Parcursul, discuțiile programate)`

---

### Task 9: Firma demo: clienții și proiectele

**Files:**
- Modify: `crm/scripts/date/demo-date.ts`, `crm/scripts/demo.mts`, `crm/tests/unit/demo-date.test.ts`

**Interfaces:**
- Consumes: `client()` din `baza.mts`, `leaduriDemo` (lead-urile cu `stare: "client"` devin clienți).
- Produces:
  - `export type ProiectDemo = { titlu: string; serviciu: Serviciu; stadiu: Stadiu; pret: number; incasat: number; termenPesteZile: number | null; inchisAcumZile?: number; procentRadu?: number; taskuri: { titlu: string; om: ContTest; termenPesteZile: number; gata: boolean }[]; materiale: { titlu: string; url: string; nota?: string; om: ContTest }[]; conturi: { serviciu: string; cont: string; al_cui: "client" | "firma"; unde_parola: UndeParola }[]; livrari: { titlu: string; link: string; nota?: string; stare: StareLivrare }[]; notite: { autor: ContTest; text: string }[] }`;
  - `export type ClientDemo = { nrLead: number; clientDinAcumZile: number; proiecte: ProiectDemo[] }`;
  - `export function clientiDemo(o: Optiuni): ClientDemo[]`.

Conținutul:
- **5 clienți demo.** Cu Laura Ene și Andreea Pop din seed sunt 7 (designul cere 6–8).
- **Serviciile și stadiile:** toate serviciile (`site`, `automatizari`, `1la1`, `altceva`) și toate cele 6 stadii, adunat cu seed-ul.
- **Proiectele:** unul are colaborarea încheiată (`inchisAcumZile` ≈ 40, stadiul `mentenanta`); unul are două proiecte (al doilea e o automatizare la `discutie`).
- **Task-urile:** 3–8 pe proiect, câteva întârziate (`termenPesteZile < 0`, `gata: false`) și unul cu termenul azi (`termenPesteZile: 0`).
- **Materialele:** doar link-uri (Drive cu `exemplu-…`, `exemplu.ro`).
- **Conturile:** fără parole.
- **Livrările:** toate cele 3 stări.
- **Radu** e pe 3 proiecte, cu 30% la site-uri și 40% la automatizări. Cu `singur: true`, nimeni în afară de Admin nu e pe proiecte (`procentRadu` ignorat, `om` = `admin`).

Scrierea în `demo.mts`, pentru fiecare client:
1. `client(telefonNormDemo(nrLead), …)`.
2. Actualizează primul proiect, inserează proiectele în plus și tot ce e sub ele (ca în `fise()` din `baza.mts`).
3. Pune `clienti.creat_la` la `acum − clientDinAcumZile` și `proiecte.inchis_la` la `acum − inchisAcumZile` (dacă e cazul).
4. Pune la `evenimente_proiect` zile credibile (aceeași regulă ca la lead-uri: fără „acum” peste tot).

Numele coloanelor exacte se iau din `lib/baza.types.ts`.

- [ ] **Step 1: Adaugă testele în `demo-date.test.ts`.**

```ts
const C = clientiDemo({ acum, singur: false });
it("clienții acoperă serviciile, stadiile și cazurile cerute", () => {
  expect(C.length).toBe(5);
  const P = C.flatMap((c) => c.proiecte);
  for (const s of ["discutie","schita","constructie","revizii","livrat","mentenanta"]) expect(P.some((p) => p.stadiu === s)).toBe(true);
  expect(C.some((c) => c.proiecte.length === 2)).toBe(true);
  expect(P.some((p) => p.inchisAcumZile !== undefined)).toBe(true);
  expect(P.some((p) => p.taskuri.some((t) => t.termenPesteZile < 0 && !t.gata))).toBe(true);
  expect(P.some((p) => p.taskuri.some((t) => t.termenPesteZile === 0))).toBe(true);
  for (const s of ["trimis","aprobat","de_refacut"]) expect(P.some((p) => p.livrari.some((l) => l.stare === s))).toBe(true);
  expect(P.every((p) => p.incasat <= p.pret)).toBe(true);
});
it("fiecare client vine dintr-un lead demo cu starea „client”", () => {
  const L = leaduriDemo({ acum, singur: false });
  for (const c of C) expect(L.find((l) => l.nr === c.nrLead)?.stare).toBe("client");
});
it("link-urile sunt doar spre domenii de exemplu", () => {
  const url = C.flatMap((c) => c.proiecte.flatMap((p) => [...p.materiale.map((m) => m.url), ...p.livrari.map((l) => l.link)]));
  expect(url.every((u) => /exemplu/.test(u))).toBe(true);
});
it("singur: doar Admin pe proiecte", () => {
  const S = clientiDemo({ acum, singur: true }).flatMap((c) => c.proiecte);
  expect(S.every((p) => p.procentRadu === undefined && p.taskuri.every((t) => t.om === "admin"))).toBe(true);
});
```

- [ ] **Step 2: Rulează testele și verifică că pică.**

Run: `npx vitest run tests/unit/demo-date.test.ts`
Expected: FAIL, `clientiDemo` nu există.

- [ ] **Step 3: Scrie `clientiDemo`.** Dacă e nevoie, ajustează lead-urile cu starea `client` din Task 8 ca să fie exact 5.
- [ ] **Step 4: Rulează testele.**

Run: `npx vitest run tests/unit/demo-date.test.ts`
Expected: PASS.

- [ ] **Step 5: Scrie clienții în `demo.mts`.**
- [ ] **Step 6: Rulează demo-ul (normal, singur, iar normal) și toate testele.**

Run: `npm run demo && npm run demo -- --singur && npm run demo && npm test && npm run test:rls && npm run e2e`
Expected: totul trece; mesajul final are aceleași numere la cele două rulări normale.

- [ ] **Step 7: Fă capturile demo-ului.** Cu un script de unică folosință din scratchpad, ia capturi ca Andrei (`andrei@`), ca Mara, ca Ioana și ca Radu, la 1440px și la 390px, pe:
  - lista de lead-uri;
  - o fișă de lead;
  - Program;
  - Clienți;
  - o fișă de client;
  - Task-urile mele;
  - Echipa.

  Uită-te la ele: fără „E2E”, fără `@test.`, fără date care arată „acum” peste tot. Repetă după `npm run demo -- --singur`.
- [ ] **Step 8: Commit:** `crm: firma demo (clienții, proiectele, modul singur)`

---

### Task 10: Verificarea, previzualizarea și unirea

- [ ] **Step 1: Rulează verificările CRM-ului.** Din `crm/`: `npm test`, `npm run test:rls`, `npm run e2e`, `npm run tsc`, `npm run lint`. Toate trebuie să treacă.
- [ ] **Step 2: Verifică că site-ul n-a fost atins.** `git diff main --stat -- site/` nu arată nimic. Dacă arată ceva, din `site/`: `npx vitest run`, `npm run verifica`, `npm run lint`.
- [ ] **Step 3: Verificarea finală.** Un subagent face verificarea întregii ramuri (`superpowers:requesting-code-review`). Anunță-i consumul lui Andrei înainte. Repară ce e critic sau important.
- [ ] **Step 4: Urcă ramura și dă-i previzualizarea.** Cu „da”-ul lui Andrei: `git push -u origin crm-tema`, iar adresa previzualizării o iei cu `npx vercel ls` din `crm/`. Rulează `npm run demo` înainte, ca baza de test să fie plină. Andrei se uită pe laptop și pe iPhone, cu `andrei@buildwithac.ro` și parola de test.
- [ ] **Step 5: Unește în `main`.** La „e bine”: unirea `crm-tema` → `main`, push, `npx vercel ls` (publicarea de Production pornește), `curl -sI https://crm.buildwithac.ro/intra` dă 200. Producția nu are nevoie de migrații și nu e atinsă de `npm run demo`.
- [ ] **Step 6: Scrie stadiul.** Actualizează „DE AICI CONTINUĂM” în `docs/progres-brainstorming.md` și memoria (`crm-buildwithac.md`): adresele noi de pe test, `npm run demo [-- --singur]`. Urmează bucata 2, încasările.
