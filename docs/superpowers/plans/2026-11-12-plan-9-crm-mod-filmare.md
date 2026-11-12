# CRM: modul filmare — planul

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pe CRM-ul demo (baza de test), Andrei pornește un „Mod filmare” care blurează fin (4px) numele, firmele, telefoanele, e-mailurile și conturile clienților pe toate ecranele, iar `npm run demo` pune telefoane variate și credibile, fără nume în textul liber.

**Architecture:** Starea stă într-un cookie (`crm_filmare=1`), citit pe server în `app/(app)/layout.tsx`. Când e activ (și doar pe baza de test), layout-ul pune `data-filmare` pe învelișul paginii, iar un CSS din `tema.css` blurează tot ce e în `<Ascuns>`. Fiindcă totul vine din HTML-ul de pe server, nu există nicio clipă cu datele clare. Comutatorul e o acțiune de server care scrie cookie-ul, urmată de `router.refresh()`.

**Tech Stack:** Next.js 16 (App Router, `cookies()` din `next/headers`, server actions), Tailwind v4, vitest, Playwright, `tsx`.

**Spec:** `docs/superpowers/specs/2026-11-12-crm-mod-filmare-design.md` (referința vizuală: `prototip/crm-blur.html`, varianta A, 4px, cu firmele)

## Ce am hotărât eu în plan

1. **Cookie, nu localStorage:** e singurul fel în care pagina vine deja blurată de pe server. Cookie-ul nu ține de sesiunea Supabase, deci rămâne după „Ieși” și la intrarea cu alt cont, cum a cerut Andrei.
2. **Blurul e doar CSS** (`[data-filmare] .ascuns`). `<Ascuns>` randează mereu același `<span class="ascuns">`; fără context React, merge și în componentele de server, și în cele de client.
3. **Link-urile `tel:`, `mailto:` și `wa.me`** primesc în modul filmare `pointer-events: none` din CSS. Arată la fel, dar nu reacționează la hover (deci nu apare adresa în colțul browserului) și nici la click. Spec-ul zice „nu mai au adresă”; efectul cerut e același.
4. **Titlul tab-ului:** CRM-ul are deja un titlu fix, „CRM buildwithac”, pe toate paginile (nicio pagină nu-și pune numele lead-ului în titlu). Nu e nimic de schimbat; Task 3 doar verifică.
5. **Telefoanele demo:** prefix ales din listă după `nr`, apoi 6 cifre dintr-o formulă fixă. Același `nr` dă mereu același număr.

## Global Constraints

- Codul e în `crm/` (Next.js 16). Înainte de cod citește `crm/AGENTS.md` și ghidul din `node_modules/next/dist/docs/` pentru `cookies()` și server actions.
- Ramura `crm-filmare` (există deja, din `main`). Fără migrații, fără Supabase pentru preferință.
- Modul filmare există **doar** când `eBazaDeTest(process.env.NEXT_PUBLIC_SUPABASE_URL)` (din `crm/lib/echipa-test.ts`) e adevărat. Pe producție nu se randează comutatorul și nu se pune `data-filmare`, orice ar fi în cookie.
- Comutatorul îl vede doar rolul `admin`. Blurul se aplică pe **orice** cont, dacă cookie-ul e pus.
- Blurul: `filter: blur(4px)` pe un `display: inline-block`, doar pe text. Fără bandă, fără estompare, fără înlocuirea textului.
- Comutatorul arată la fel pornit și oprit. Starea apare doar în `aria-label` și `title`: „Mod filmare: pornit” / „Mod filmare: oprit”. Cât e pornit, niciun alt semn pe ecran.
- Nu se blurează: căsuțele formularelor, textul liber, echipa (nume, inițiale, e-mailuri), etichetele, stările, sumele, datele.
- Texte în română, cu diacritice cu virgulă (ș, ț). Mesajele de commit în română, terminate cu `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Toate comenzile din `crm/`. La final trec: `npx vitest run`, `npm run test:rls`, `npx playwright test`, `npm run tsc`, `npm run lint`.

## Review Focus

1. **Navigarea între pagini fără reîncărcare** (click pe un lead din listă): fișa trebuie să vină deja blurată, fără un cadru clar. Testul e în Task 3.
2. **Blurul pe iPhone (Safari):** la site, un `filter: blur` mare a dat negru pe iPhone. Aici e mic (4px) și pe text, dar trebuie văzut pe telefonul lui Andrei în previzualizare (Task 4).
3. **Cookie pus, dar pe producție:** nu se întâmplă nimic. Testul unitar din Task 2 (`filmareActiva` cu URL-ul de producție).
4. **Callerul intră cu cookie-ul pus:** vede blurat și nu vede comutatorul. Testul e în Task 2.
5. **Căutarea după telefon cu numerele noi** (bucăți de număr, cu sau fără spații) găsește lead-ul. Testul unitar e în Task 1 (forma normalizată = `normalizeazaTelefon(telefonDemo(nr))`).

---

### Task 1: Datele demo: telefoane variate, fără nume în textul liber

**Files:**
- Modify: `crm/scripts/date/demo-date.ts:1-2` (comentariul de sus), `:33-34` (`telefonDemo`, `telefonNormDemo`) și textele lead-urilor și clienților unde apar nume, firme sau telefoane
- Test: `crm/tests/unit/demo-date.test.ts:61-63` (înlocuite) + teste noi

**Interfaces:**
- Produces: `telefonDemo(nr: number): string` → `"07xx xxx xxx"`; `telefonNormDemo(nr: number): string` → `"407xxxxxxxx"`, egal cu `normalizeazaTelefon(telefonDemo(nr))` din `crm/lib/telefon.ts`. Semnăturile rămân, deci `demo-scrie.mts` nu se schimbă.

- [ ] **Step 1: Scrie testele care pică**, în `describe("firma demo: telefoanele")` și `describe("firma demo: textul liber")`:

```ts
const PREFIXE = ["0721","0722","0723","0724","0726","0730","0731","0740","0742","0744","0745","0746","0747","0748","0749","0751","0752","0753","0754","0755","0756","0757","0758","0760","0761","0762","0763","0764","0765","0766","0767","0768","0769"];

it("telefoanele sunt variate, credibile, unice și la fel la fiecare rulare", () => {
  const t = L.map((l) => telefonDemo(l.nr));
  expect(t.every((x) => /^07\d{2} \d{3} \d{3}$/.test(x))).toBe(true);
  expect(t.every((x) => PREFIXE.includes(x.slice(0, 4)))).toBe(true);
  expect(t.some((x) => x.startsWith("0700"))).toBe(false);
  expect(new Set(t).size).toBe(t.length);
  expect(new Set(t.map((x) => x.slice(0, 4))).size).toBeGreaterThanOrEqual(10);
  expect(leaduriDemo({ acum, singur: false }).map((l) => telefonDemo(l.nr))).toEqual(t);
});

it("forma normalizată se potrivește cu cea afișată (căutarea după telefon)", () => {
  for (const l of L) expect(telefonNormDemo(l.nr)).toBe(normalizeazaTelefon(telefonDemo(l.nr)));
});

it("textul liber nu conține numele, firma sau telefonul unui lead ori client", () => {
  // tot textul liber: notițele și răspunsurile lead-urilor; la clienți titluri, task-uri, materiale, conturi (doar `serviciu`), livrări, notițe, parcurs
  // pentru fiecare lead: părțile numelui de om (înainte de „·”, cuvinte de ≥3 litere, fără prenumele echipei: Andrei, Mara, Vlad, Ioana, Radu),
  // firma întreagă (după „·”) și telefonul (cu și fără spații) nu apar în niciun text liber (cuvinte întregi; firma fără diferență de majuscule)
});
```

Corpul ultimului test îl scrie executantul după regulile din comentariu. Când pică, mesajul trebuie să spună textul și numele găsit.

- [ ] **Step 2: Rulează și vezi că pică**

Run: `npx vitest run tests/unit/demo-date.test.ts`
Expected: FAIL la telefoane (încă `0700 100 …`) și, probabil, la textul liber.

- [ ] **Step 3: Implementează `telefonDemo` / `telefonNormDemo`** în `demo-date.ts`. Prefixul e `PREFIXE[(nr * 7) % PREFIXE.length]` (aceeași listă ca în test, exportată ca `PREFIXE_MOBIL`). Cele 6 cifre: `(nr * 7919 + 104729) % 1_000_000`, completate cu zerouri. Dacă testul de unicitate pică, schimbă constantele, nu forma. `telefonNormDemo` = `"40" + fără spații, fără 0-ul de la început`. Actualizează comentariul de sus („telefoane variate, văzute doar blurate în modul filmare”).

- [ ] **Step 4: Curăță textul liber** pe care îl arată testul: „Sunat-o pe Laura…” devine „Sunat clienta…”, firma din titluri devine „site-ul”, „patiseria” etc. Conturile (`cont`) pot conține domeniul firmei: se blurează pe ecran (Task 3), deci rămân.

- [ ] **Step 5: Rulează și vezi că trece**

Run: `npx vitest run tests/unit/demo-date.test.ts`
Expected: PASS, toate.

- [ ] **Step 6: Commit**

```bash
git add scripts/date/demo-date.ts tests/unit/demo-date.test.ts
git commit -m "crm: telefoane demo variate și fără nume în textul liber (modul filmare)"
```

---

### Task 2: Starea modului filmare și comutatorul

**Files:**
- Create: `crm/lib/filmare.ts`, `crm/app/(app)/filmare-actiuni.ts`, `crm/components/ComutatorFilmare.tsx`, `crm/tests/unit/filmare.test.ts`, `crm/tests/e2e/filmare.spec.ts`
- Modify: `crm/app/(app)/layout.tsx` (învelișul și cele două locuri ale comutatorului), `crm/components/Iconite.tsx` (iconița `filmare`), `crm/app/tema.css`

**Interfaces:**
- Produces:
  - `crm/lib/filmare.ts`: `export const COOKIE_FILMARE = "crm_filmare"`; `export function filmareActiva(valoareCookie: string | undefined, urlBaza: string | undefined): boolean` (adevărat doar dacă `valoareCookie === "1"` și `eBazaDeTest(urlBaza)`); `export async function inFilmare(): Promise<boolean>` (citește `cookies()` și `process.env.NEXT_PUBLIC_SUPABASE_URL`; `import "server-only"` doar în partea asta: dacă vitest nu poate importa fișierul, mută `inFilmare` în `lib/filmare-server.ts`).
  - `filmare-actiuni.ts`: `"use server"`; `export async function schimbaFilmare(): Promise<void>`. Cere `eu()` cu rolul `admin` și baza de test, altfel nu face nimic. Comută cookie-ul: `"1"` cu `path: "/"`, `maxAge: 60*60*24*365`, `sameSite: "lax"`, sau îl șterge.
  - `ComutatorFilmare({ activ }: { activ: boolean })`: client, buton rotund cu `<Iconita nume="filmare">` (o cameră de filmat, în stilul celorlalte), `aria-label`/`title` = `Mod filmare: ${activ ? "pornit" : "oprit"}`, aceleași clase în ambele stări. La click: `schimbaFilmare()`, apoi `router.refresh()`.
  - În `layout.tsx`, învelișul de sus (`<div className="min-h-screen">`) primește `data-filmare` când `await inFilmare()`.
  - CSS-ul din `tema.css` (Task 3 se bazează pe el): `[data-filmare] .ascuns { display:inline-block; filter: blur(4px); }` și `[data-filmare] a[href^="tel:"], [data-filmare] a[href^="mailto:"], [data-filmare] a[href^="https://wa.me/"] { pointer-events:none; }`.

- [ ] **Step 1: Testul unitar care pică** (`tests/unit/filmare.test.ts`):

```ts
const TEST = "https://sglkjcwsohzszktljacv.supabase.co";
const PROD = "https://znabkoesmtoggdmehmqp.supabase.co";
it("pornit doar cu cookie-ul „1” și doar pe baza de test", () => {
  expect(filmareActiva("1", TEST)).toBe(true);
  expect(filmareActiva("1", TEST + "/")).toBe(true);
  expect(filmareActiva("1", PROD)).toBe(false);
  expect(filmareActiva(undefined, TEST)).toBe(false);
  expect(filmareActiva("0", TEST)).toBe(false);
  expect(filmareActiva("1", undefined)).toBe(false);
});
```

- [ ] **Step 2: Rulează și vezi că pică**: `npx vitest run tests/unit/filmare.test.ts`. Expected: FAIL, modulul nu există.

- [ ] **Step 3: Implementează `lib/filmare.ts`**, apoi rulează din nou. Expected: PASS.

- [ ] **Step 4: Testele e2e care pică** (`tests/e2e/filmare.spec.ts`, cu `intraCa` din `./ajutor`):
  - `"adminul pornește și oprește modul filmare; rămâne după reîncărcare"`: `intraCa(page, "admin")`. Butonul cu numele „Mod filmare: oprit” e vizibil (pe laptop, în bara laterală). Click: numele devine „Mod filmare: pornit”, iar `page.locator("[data-filmare]")` are 1 element. `page.reload()`: tot pornit. Încă un click: `[data-filmare]` are 0 elemente.
  - `"fără clipire: HTML-ul de pe server vine deja în modul filmare"`: după pornire, `await page.request.get("/lead-uri")` are în text `data-filmare`.
  - `"blurul ține de browser: callerul îl vede, dar nu are comutatorul"`: într-un context nou, `context.addCookies([{ name: "crm_filmare", value: "1", url: "http://localhost:3100" }])`, `intraCa(page, "caller")`: `[data-filmare]` are 1 element și niciun buton „Mod filmare”.
  - `"comutatorul arată la fel pornit și oprit"`: `class`-ul butonului e același înainte și după click.

- [ ] **Step 5: Rulează și vezi că pică**: `npx playwright test tests/e2e/filmare.spec.ts`. Expected: FAIL, butonul nu există.

- [ ] **Step 6: Implementează** acțiunea, comutatorul, iconița, învelișul din layout și CSS-ul. Comutatorul apare doar dacă `om.rol === "admin" && eBazaDeTest(process.env.NEXT_PUBLIC_SUPABASE_URL)`: în cardul din bara laterală, între nume și „Ieși”, și în antetul de pe telefon, lângă „Ieși”.

- [ ] **Step 7: Rulează și vezi că trece**: `npx playwright test tests/e2e/filmare.spec.ts`. Expected: PASS. Rulează și `npx vitest run`: PASS.

- [ ] **Step 8: Commit**

```bash
git add lib/filmare.ts "app/(app)/filmare-actiuni.ts" components/ComutatorFilmare.tsx components/Iconite.tsx "app/(app)/layout.tsx" app/tema.css tests/unit/filmare.test.ts tests/e2e/filmare.spec.ts
git commit -m "crm: comutatorul modului filmare (doar pe baza de test, doar pentru admin)"
```

---

### Task 3: Blurul pe toate ecranele

**Files:**
- Create: `crm/components/Ascuns.tsx`
- Modify: `crm/components/BaraSus.tsx:7` (`eticheta: React.ReactNode`), `crm/app/(app)/lead-uri/page.tsx:136-137`, `crm/app/(app)/lead-uri/[id]/page.tsx:82,84,103,104,208-210`, `crm/app/(app)/lead-uri/[id]/programeaza/page.tsx:53`, `crm/app/(app)/clienti/page.tsx:82,84,140,142,144`, `crm/app/(app)/clienti/[id]/page.tsx:52,57,141,144,211,212`, `crm/app/(app)/taskuri/page.tsx:48` (doar `clienti.nume`), `crm/components/fisa/Conturi.tsx:66`
- Test: `crm/tests/e2e/filmare.spec.ts` (teste noi)

**Interfaces:**
- Consumes: CSS-ul `[data-filmare] .ascuns` și `data-filmare` din Task 2.
- Produces: `export function Ascuns({ children }: { children: React.ReactNode })` → `<span className="ascuns">{children}</span>`, fără `"use client"`, ca să meargă peste tot.

- [ ] **Step 1: Testele e2e care pică** (cu cookie-ul pus ca în Task 2, contul `admin`):
  - `"lista de lead-uri: numele și telefonul sunt blurate, starea nu"`: pe `/lead-uri`, primul rând are link-ul lead-ului în `.ascuns`, iar `getComputedStyle` pe `.ascuns` dă `filter` = `"blur(4px)"`. Pastila de stare (`.chip`) nu e în niciun `.ascuns`.
  - `"fișa lead-ului: titlul, firimitura, telefonul și e-mailul sunt blurate"`: click pe primul lead din listă (navigare fără reîncărcare). `h1 .ascuns` e vizibil, la fel bara de sus `b .ascuns`, iar textul de lângă „Telefon” e în `.ascuns`.
  - `"fișa clientului: numele, inițialele, contactul și conturile sunt blurate; prețul nu"`: deschide primul client din `/clienti`. `h1 .ascuns`, avatarul cu inițiale în `.ascuns`; textul „lei” nu e în `.ascuns`.
  - `"titlul tab-ului nu conține numele"`: pe fișa unui lead, `await page.title()` e „CRM buildwithac”.
  - `"fără modul filmare nu se blurează nimic"`: fără cookie, `.ascuns` are `filter` = `"none"`.

- [ ] **Step 2: Rulează și vezi că pică**: `npx playwright test tests/e2e/filmare.spec.ts`. Expected: FAIL (`.ascuns` nu există).

- [ ] **Step 3: Implementează `Ascuns`** și învelește fiecare loc din lista „Modify”: numele lead-ului sau clientului, `telefon ?? email`, telefonul, e-mailul, `initiale(c.nume)` și `c.cont`. La `BaraSus`, eticheta devine `<Ascuns>{l.nume}</Ascuns>`. Apoi caută locurile scăpate: `grep -rn "\.nume\b\|\.telefon\b\|\.email\b\|initiale(" app components`. Orice afișare a numelui, telefonului sau e-mailului unui **lead sau client** se învelește; echipa (`profiluri`, `om.nume`, Echipa, Program, OameniProiect, liste de selecție) nu. `ContactClient` și formularele rămân neatinse (sunt căsuțe).

- [ ] **Step 4: Rulează și vezi că trece**: `npx playwright test tests/e2e/filmare.spec.ts`. Expected: PASS.

- [ ] **Step 5: Verifică în browser, cu ochii**, la 1440px și la 390px, cu `npm run demo` rulat și modul pornit: Lead-uri, o fișă de lead, Clienți, o fișă de client (toate tab-urile), Task-urile mele, Program, Echipa. Nimic personal clar, nimic funcțional blurat, spațiile din jurul bucăților blurate rămân.

- [ ] **Step 6: Commit**

```bash
git add components/Ascuns.tsx components/BaraSus.tsx components/fisa/Conturi.tsx app tests/e2e/filmare.spec.ts
git commit -m "crm: blurul modului filmare pe toate ecranele (nume, firme, telefoane, e-mailuri, conturi)"
```

---

### Task 4: Verificarea finală, previzualizarea, unirea

**Files:** `docs/progres-brainstorming.md` (stadiul)

- [ ] **Step 1: Toate verificările**, din `crm/`: `npx vitest run`, `npm run test:rls`, `npx playwright test`, `npm run tsc`, `npm run lint`. Expected: toate curate (oprește serverul vechi de pe 3100 dacă e2e pică în masă la conectare).
- [ ] **Step 2: Verificarea cu un subagent** asupra ramurii (pas greu: anunță consumul și cere acordul lui Andrei). Repară ce iese important.
- [ ] **Step 3: Cu „da”-ul lui Andrei:** `git push -u origin crm-filmare`, `npm run demo`, adresa previzualizării din `npx vercel ls`. Andrei verifică pe laptop și pe iPhone, ca `andrei@buildwithac.ro` cu parola de test: pornește modul, trece prin ecrane, intră și ca `mara@buildwithac.ro`.
- [ ] **Step 4: La „e bine”:** unirea în `main`, push, `npx vercel ls`, `curl -sI https://crm.buildwithac.ro/intra` (200). Pe producție comutatorul nu trebuie să apară (Andrei verifică cu `admin@buildwithac.ro`).
- [ ] **Step 5: Stadiul** în `docs/progres-brainstorming.md` și în memorie; commit.
