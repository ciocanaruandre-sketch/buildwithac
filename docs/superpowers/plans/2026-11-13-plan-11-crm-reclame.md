# CRM, etapa 3, bucata 3: lead-urile din reclame și pagina „Reclame”: planul

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Un lead venit pe formularul site-ului dintr-o reclamă Meta sau TikTok intră singur în CRM cu sursa și reclama lui. Pagina „Reclame” (doar Admin) arată, pe fiecare reclamă, lead-urile, discuțiile, clienții, banii cheltuiți și banii încasați, cu un verdict.

**Architecture:** Clasificarea UTM-urilor e un fișier pur, `crm/lib/reclame.ts`, folosit de ruta de intrare (sursa) și de `primesteCerere` (reclama). Reclamele și legătura lead → reclamă stau în două tabele noi, apărate de RLS doar pentru Admin. Legătura are contoare (discuție, client, bani de la clienții șterși) puse de trigger-e în clipa întâmplării. Când lead-ul sau clientul dispare, rândul rămâne anonim, deci cifrele nu scad. Cifrele paginii vin dintr-o singură funcție SQL, `reclame_cifre()`. Pe site, `?serviciu=` alege pastila din formular și duce la `#formular`.

**Tech Stack:** Next.js 16 (App Router, Server Actions), Supabase (Postgres, RLS, plpgsql), vitest (unit + `test:rls`), Playwright, Tailwind v4 cu tema „Grafit”. Pe site: Next.js 16, Lenis.

**Spec:** `docs/superpowers/specs/2026-11-13-crm-reclame-design.md`. Macheta: `prototip/crm-reclame.html`, **varianta B** (servită cu `python -m http.server 8765` din `prototip/`). Designul mare al CRM-ului: `docs/superpowers/specs/2026-11-09-crm-design.md`.

## Ce am hotărât eu în plan (de confirmat de Andrei)

1. **Ștergerea de mână a unui lead („Șterge lead-ul”) îl scoate și din cifrele reclamei.** Ștergerea automată de după 90 de zile îl păstrează, anonim. Butonul îl folosești pentru lead-uri de probă sau greșite, iar acelea n-au ce căuta în cifre. Cele două ștergeri se deosebesc după cine le face: cron-ul folosește cheia de serviciu, butonul pe tine.
2. **La unire, cheltuielile se adună.** Dacă una e goală, rămâne cealaltă.
3. **Textul de lipit în Ads Manager stă chiar pe pagina „Reclame”:** pe ecranul gol și într-un panou „Ce lipesc în Ads Manager”, care se deschide la cerere. Nu e nevoie de alt document.
4. **„Reclame” intră în meniu după „Finanțe”.** Pe telefon, meniul de jos are atunci 7 intrări la Admin.
5. **Coloana veche `proiecte.incasat_lei` se scoate chiar în bucata asta.** Codul de pe `main` n-o mai citește (am verificat: doar `scripts/date/baza.mts` o mai scrie), deci migrația pe producție înainte de unire nu strică site-ul live.
6. **Un nume de reclamă se compară exact** (cu majuscule și diacritice), după ce se taie spațiile de la capete și se scurtează la 120 de caractere. Meta trimite numele la fel de fiecare dată.
7. **Execuția:** de ales (vezi finalul).

## Global Constraints

- Totul în română, cu ș/ț cu virgulă (niciodată ş/ţ), în cod, mesaje, teste și date demo.
- Codul CRM în `crm/`. Înainte de cod Next.js, citește `crm/AGENTS.md` (sau `site/AGENTS.md` pentru site).
- Tema „Grafit”: clasele din `crm/app/tema.css` (`.panel`, `.btn`, `.chip`, `.lbl`, `.camp`, `.num`), fără culori hex noi în componente. Meta = `blue`, TikTok = turcoazul din machetă (`#5fd4d0`) adăugat **o dată** ca variabilă în `tema.css`.
- Sume în lei întregi, 0–10.000.000, citite cu `citesteLei` și afișate cu `lei()` din `crm/lib/proiecte.ts`.
- O cerere e din reclamă doar cu `utm_medium=reclama` **și** `utm_campaign` sau `utm_content` nevid (spec §3.1). Valorile `utm_source` pentru Meta: `fb`, `ig`, `facebook`, `instagram`, `msg`, `an`, `meta`; pentru TikTok: `tiktok`. Comparate fără majuscule.
- Textele verdictului, exact ca în spec §3.6 (copiate în Task 1).
- Totul se apără în RLS, nu doar pe ecran: tabelele noi sunt doar pentru Admin, cu test în `crm/tests/rls/`.
- Funcțiile SQL noi: `security definer set search_path = ''` doar acolo unde trebuie să treacă peste RLS (trigger-ele). Cele chemate de pe pagină sunt `security invoker` și se bazează pe RLS-ul de Admin. Cheia de serviciu trece, pentru `npm run demo` și teste. Au `revoke … from public, anon` și `grant execute … to authenticated, service_role`.
- Mesajele din `raise exception` (P0001) ajung pe ecran prin `mesajDinBaza`: frază întreagă, în română.
- Migrațiile: `20261113000007_reclame.sql`, `20261113000008_reclame_cifre.sql`. Se aplică pe **test** de Andrei, cu `!` (permisiunile agentului refuză `db push`): `npm run sb -- db push --remote --yes`, apoi `npm run tipuri`. Pe **producție** se aplică doar în Task 8, cu „da”-ul lui Andrei.
- Fără pixel, fără cookie-uri, fără API Meta/TikTok, fără filtru de perioadă.
- La final trec toate, din `crm/`: `npm test`, `npm run test:rls`, `npm run e2e`, `npm run tsc`, `npm run lint`. Din `site/`: `npx vitest run`, `npm run verifica`, `npm run lint`, `npx playwright test tests/e2e/contact.spec.ts`.
- Commit-urile sunt în română și se termină cu `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **Link organic cu UTM de Instagram** (`utm_source=instagram`, fără `utm_medium=reclama`, de exemplu din bio). Lead-ul rămâne „Formular site”, nu se face nicio reclamă, iar UTM-urile se păstrează pe cerere. Unit în Task 1, RLS în Task 3.
2. **Un om care există deja ca lead sau client trimite iar formularul, din reclamă.** Nu se leagă de reclamă, nu se face reclamă nouă și sursa lui nu se schimbă. RLS în Task 3.
3. **Cron-ul de 90 de zile șterge un lead; Adminul șterge un client.** Lead-urile, discuțiile, clienții și banii reclamei rămân aceiași. Ștergerea de mână a unui lead îl scoate din cifre. RLS în Task 2.
4. **Nume de reclamă lung (peste 120 de caractere), cu diacritice sau emoji, sau cu spații la capete.** Același nume intră la aceeași reclamă de fiecare dată, iar lookup-ul și inserarea folosesc aceeași tăiere. Unit în Task 1, RLS în Task 3.
5. **390px.** Meniul de jos are 7 intrări vizibile, cardurile stau pe o coloană și nu apare derulare orizontală. Pe site, `/?serviciu=site#formular` ajunge la formular cu „Site” ales, chiar și cu Lenis și animațiile GSAP. E2E în Task 5 și Task 4.

---

## Harta fișierelor

| Fișier | Ce face |
|---|---|
| `crm/lib/reclame.ts` | pur: clasificarea UTM-urilor, verdictul, ordinea, totalurile, textele pentru Ads Manager |
| `crm/supabase/migrations/20261113000007_reclame.sql` | tabelele `reclame` și `reclame_lead_uri`, RLS, trigger-ele cu contoare, `atribuie_reclama`, `sterge_client` înlocuită, scoaterea `proiecte.incasat_lei` |
| `crm/supabase/migrations/20261113000008_reclame_cifre.sql` | `reclame_cifre()`, `uneste_reclame()` |
| `crm/app/api/intrare/site/route.ts`, `crm/lib/intrare.ts` | sursa din UTM, legarea lead-ului nou de reclamă |
| `crm/app/(app)/reclame/page.tsx`, `actiuni.ts` | pagina și acțiunile ei (cheltuit, + Reclamă, unește, șterge) |
| `crm/components/reclame/*.tsx` | `CardReclama`, `Cheltuit`, `AdaugaReclama`, `UnesteCu`, `TextAdsManager` |
| `crm/app/(app)/layout.tsx`, `crm/components/Iconite.tsx` | intrarea din meniu și iconița |
| `crm/app/(app)/lead-uri/[id]/page.tsx` | reclama pe fișa lead-ului, în cuvinte |
| `crm/scripts/date/demo-date.ts`, `demo-scrie.mts`, `baza.mts` | reclamele demo; fără `proiecte.incasat_lei` |
| `site/components/home/FormularContact.tsx` (+ un mic ajutor în `site/lib/contact.ts`) | `?serviciu=` alege pastila și duce la formular |

---

### Task 0: Planul pe ramură

- [ ] **Step 1:** Pe ramura `crm-reclame`, unde designul și macheta sunt deja comise (38be856): `git add docs/superpowers/plans/2026-11-13-plan-11-crm-reclame.md && git commit -m "docs: planul bucății 3 a CRM-ului, „Reclame”"`.

---

### Task 1: Calculele pure (`lib/reclame.ts`)

**Files:**
- Create: `crm/lib/reclame.ts`, `crm/tests/unit/reclame.test.ts`

**Interfaces:**
- Produces:
  - `type Platforma = "meta" | "tiktok"`
  - `type ReclamaUtm = { platforma: Platforma; campanie: string; nume: string }`
  - `reclamaDinUtm(utm: Record<string, string>): ReclamaUtm | null`. Fiecare valoare se taie la capete și se scurtează la 120 de caractere (`taie(s)`). `campanie` = `utm_campaign` sau `""`. `nume` = `utm_content`, iar dacă lipsește, `utm_campaign`. Fără `utm_medium=reclama` sau fără platformă cunoscută → `null`.
  - `sursaDinUtm(utm): "reclama_meta" | "reclama_tiktok" | "formular_site"`, după `reclamaDinUtm`.
  - `type CifreReclama = { id: string; platforma: Platforma; campanie: string; nume: string; cheltuit_lei: number | null; lead_uri: number; discutii: number; clienti: number; incasat_lei: number; mai_vin_lei: number }` (= rândurile din `reclame_cifre()`, Task 5)
  - `castig(r): number | null` (`null` fără sumă), `peLead(r)`, `peClient(r)` (`null` la împărțire la 0 sau fără sumă).
  - `verdict(r): { ton: "green" | "red" | "amber"; text: string }`. Textele (cu `lei()` și raportul cu o zecimală și virgulă, de exemplu „7,3”):
    - fără sumă → amber, „Scrie cât ai cheltuit ca să vezi dacă merită.”
    - 0 clienți → red, „Niciun client încă. {lead_uri} lead-uri, {peLead} fiecare.” (cu 0 lead-uri: „Niciun lead încă.”)
    - câștig ≥ 0 → green, „Aduce bani: la 1 leu cheltuit ai încasat {raport} lei.” (cheltuit 0 → „Aduce bani fără cheltuială.”)
    - câștig < 0 → amber, „Încă pe minus, dar mai vin {mai_vin}.” (fără „mai vin”: red, „Pe minus: {castig}.”)
  - `ordoneaza(r[]): CifreReclama[]`. Întâi cele cu sumă, după câștig descrescător. La final cele fără sumă, după lead-uri descrescător.
  - `totaluri(r[]): { cheltuit; lead_uri; clienti; incasat; mai_vin; reclame; peLead; peClient }`
  - `TEXT_META`, `TEXT_TIKTOK`: textul exact de lipit (spec §3.2).

- [ ] **Step 1: Verifică pe web macro-urile** (spec §3.2, „de verificat”). La Meta: numele câmpului „Parametri URL” din Ads Manager în română și valorile lui `{{site_source_name}}`. La TikTok: macro-urile pentru numele campaniei și al reclamei. Scrie ce ai găsit, cu sursa, în jurnal. Dacă un macro diferă de spec, folosește-l pe cel adevărat și notează abaterea.
- [ ] **Step 2: Scrie testele** în `tests/unit/reclame.test.ts`:
  - `"Meta din reclamă"`: `{utm_source:"ig", utm_medium:"reclama", utm_campaign:"Site-uri pentru cafenele", utm_content:"Clip cafenea"}` → `{platforma:"meta", campanie:"Site-uri pentru cafenele", nume:"Clip cafenea"}`; `sursaDinUtm` → `"reclama_meta"`. La fel pentru `fb`, `Facebook`, `INSTAGRAM`, `msg`, `an`, `meta`.
  - `"TikTok din reclamă"`: `utm_source:"tiktok"` → `"reclama_tiktok"`.
  - `"link organic din bio nu e reclamă"`: `{utm_source:"instagram", utm_campaign:"bio"}` → `null`, `"formular_site"`.
  - `"fără campanie și fără nume nu e reclamă"`: `{utm_source:"fb", utm_medium:"reclama"}` → `null`.
  - `"platformă necunoscută nu e reclamă"`: `utm_source:"google"` → `null`.
  - `"numele lung se taie la 120, spațiile de la capete dispar"`: `"  " + "ă".repeat(150) + " "` → `"ă".repeat(120)`; cu emoji, rezultatul are cel mult 120 de unități și același input dă mereu același rezultat.
  - `"fără utm_content, numele e campania"`.
  - Verdictul: cele 4 cazuri din machetă, cu textele exacte. De exemplu `{cheltuit_lei:620, lead_uri:14, clienti:2, incasat_lei:4500, mai_vin_lei:2000}` → green, „Aduce bani: la 1 leu cheltuit ai încasat 7,3 lei.”; `{cheltuit_lei:380, lead_uri:9, clienti:0}` → red, „Niciun client încă. 9 lead-uri, 42 lei fiecare.”
  - `ordoneaza`: câștigurile `[3880, -380, 2750, null, 1200]` → ordinea `3880, 2750, 1200, -380, null`.
  - `totaluri`: pe cele 5 reclame din machetă → cheltuit 1.750, lead-uri 44, clienți 5, încasat 9.200, mai vin 4.300.
- [ ] **Step 3: Rulează și verifică că pică.** Run: `npm test -- reclame`. Expected: FAIL (modulul nu există).
- [ ] **Step 4: Scrie `lib/reclame.ts`** după Interfaces.
- [ ] **Step 5: Rulează.** Run: `npm test -- reclame`. Expected: PASS.
- [ ] **Step 6: Commit:** `crm: calculele reclamelor (UTM, verdict, ordine, totaluri)`

---

### Task 2: Tabelele, contoarele și curățenia

**Files:**
- Create: `crm/supabase/migrations/20261113000007_reclame.sql`, `crm/tests/rls/reclame.test.ts`
- Modify: `crm/lib/baza.types.ts` (generat), `crm/scripts/date/baza.mts:229` (fără `incasat_lei`), `crm/tests/rls/ajutor.ts` (dacă ai nevoie de un ajutor `reclamaDeTest`)

**Interfaces:**
- Produces (SQL):
  - `reclame (id uuid pk, platforma text check in ('meta','tiktok'), campanie text not null default '' check length ≤ 120, nume text not null check length 1–120, cheltuit_lei int null check 0–10000000, unita_in uuid null references reclame(id) on delete cascade, creat_la timestamptz default now(), unique (platforma, campanie, nume))`
  - `reclame_lead_uri (id uuid pk, reclama_id uuid not null references reclame on delete cascade, lead_id uuid unique null references lead_uri on delete set null, client_id uuid null` **fără FK** (`sterge_client` îl golește), `a_avut_discutie boolean not null default false, client boolean not null default false, incasat_sters_lei int not null default 0, creat_la)`. Fără nume, telefon sau text liber.
  - `atribuie_reclama(p_lead uuid, p_platforma text, p_campanie text, p_nume text) returns uuid`. Caută reclama după `(platforma, campanie, nume)`. Dacă are `unita_in`, merge la aceea. Dacă nu există, o face. Apoi inserează legătura (`on conflict (lead_id) do nothing`). Întoarce id-ul reclamei. `security definer` (scrie în `reclame_lead_uri`, unde RLS-ul dă doar citire), cu verificarea din interior: doar cheia de serviciu sau Admin („Doar Adminul leagă reclamele.”).
  - Trigger `after insert on discutii` → `a_avut_discutie = true` pe rândul lead-ului.
  - Trigger `after insert on clienti` → `client = true, client_id = new.id` pe rândul lead-ului (`new.lead_id`).
  - Trigger `before delete on lead_uri`: dacă `auth.uid() is not null` (ștergere de mână), șterge rândul din `reclame_lead_uri`. Altfel (cron, cheie de serviciu), FK-ul pune `lead_id` pe null și rândul rămâne anonim. **Atenție:** `sterge_client` șterge și el lead-ul cu `auth.uid()` setat, de aceea își anonimizează întâi rândul (pasul de mai jos), iar trigger-ul nu șterge un rând cu `client = true`.
  - `sterge_client(c)` înlocuită (pornește de la ultima versiune, `20261113000003_returnari_plati.sql:92`). După verificarea comisioanelor și înainte de orice ștergere: `update reclame_lead_uri set incasat_sters_lei = incasat_sters_lei + <net>, client_id = null where client_id = c`, unde `<net> = sum(incasat_lei - returnat_lei)` din `transe` încasate cu `tip <> 'inainte'` pe proiectele clientului.
  - RLS pe ambele tabele: doar Admin (select/insert/update/delete pe `reclame`; doar select pe `reclame_lead_uri`, pe care o scriu doar funcțiile și trigger-ele).
  - `alter table proiecte drop column incasat_lei`.

- [ ] **Step 1: Scrie testele** în `tests/rls/reclame.test.ts`:
  - `"doar Adminul vede și scrie reclamele"`: ca `caller`, `closer` și `constructor`, `select` pe `reclame` și `reclame_lead_uri` → `[]`, iar `insert` pe `reclame` → eroare. Ca `admin`, insertul merge.
  - `"atribuirea face reclama o dată și leagă lead-ul"`: două lead-uri cu `atribuie_reclama(…, 'meta', 'C', 'R')` dau același id de reclamă și 2 rânduri de legătură.
  - `"o discuție programată se numără și rămâne după reprogramare"`: `programeaza_discutie` pe lead → `a_avut_discutie = true`; după reprogramare (care șterge discuția veche) rămâne `true`.
  - `"lead-ul devenit client"`: `update stare = 'client'` → `client = true`, `client_id` = id-ul clientului.
  - `"cron-ul șterge lead-ul, cifrele rămân"`: ștergere cu cheia de serviciu → rândul există, cu `lead_id null`.
  - `"Adminul șterge lead-ul de mână, iese din cifre"`: `delete` ca `admin` → rândul nu mai există.
  - `"clientul șters își lasă banii la reclamă, fără legătură spre el"`: client din reclamă, tranșă de 2.000 încasată, cu 500 returnați, plus o tranșă `inainte` de 1.000. După `rpc("sterge_client")`: `incasat_sters_lei = 1500`, `client_id null`, `lead_id null`, `client = true`.
  - `"proiecte nu mai are incasat_lei"`: `select("incasat_lei")` pe `proiecte` → eroare de coloană.
- [ ] **Step 2: Rulează și verifică că pică.** Run: `npm run test:rls -- reclame`. Expected: FAIL.
- [ ] **Step 3: Scrie migrația.** Scoate `incasat_lei` din `baza.mts:229`. Caută `incasat_lei` pe `proiecte` în cod, vederi și funcții (`transe.incasat_lei` rămâne). Cere-i lui Andrei să aplice migrația pe test cu `!`, apoi rulează `npm run tipuri`.
- [ ] **Step 4: Rulează.** Run: `npm run test:rls`. Expected: PASS, inclusiv toate testele vechi (`stergere-client`, `finante`, `retentie`).
- [ ] **Step 5: Commit:** `crm: reclamele în baza de date, cu cifre care nu scad la ștergere`

---

### Task 3: Intrarea din reclamă

**Files:**
- Modify: `crm/app/api/intrare/site/route.ts`, `crm/lib/intrare.ts`, `crm/tests/rls/intrare.test.ts`

**Interfaces:**
- Consumes: `sursaDinUtm`, `reclamaDinUtm` (Task 1); `atribuie_reclama` (Task 2).
- Produces: ruta pune `sursa: sursaDinUtm(utm ?? {})`. `primesteCerere`, doar la `decizie === "lead_nou"`, cheamă `atribuie_reclama` dacă `reclamaDinUtm(c.utm)` nu e `null`. O eroare la atribuire nu pierde lead-ul: se scrie cu `console.error("intrare/reclama", e)` și cererea merge mai departe.

- [ ] **Step 1: Adaugă testele** în `tests/rls/intrare.test.ts`:
  - `"/api/intrare/site din reclamă Meta → sursa Reclamă Meta, legat de reclamă"`: utm cu `ig`/`reclama`/campanie/nume → lead-ul are `sursa = 'reclama_meta'` și un rând în `reclame_lead_uri`, la reclama cu acel nume.
  - `"link organic cu utm_source=instagram → Formular site, fără reclamă, UTM păstrat"`.
  - `"omul care există deja trimite din reclamă → nu se leagă, sursa rămâne"`: lead existent cu `formular_site`; o cerere nouă din reclamă → aceeași `sursa`, niciun rând de legătură, nicio reclamă nouă.
  - `"aceeași reclamă cu nume lung → o singură reclamă"`: două lead-uri cu `utm_content` de 150 de caractere → un singur rând în `reclame`.
  - `"reclama unită primește lead-urile cu numele vechi"`: `reclame` B cu `unita_in = A`; un lead nou cu numele lui B → legat de A.
- [ ] **Step 2: Rulează și verifică că pică.** Run: `npm run test:rls -- intrare`. Expected: FAIL.
- [ ] **Step 3: Schimbă ruta și `primesteCerere`** după Interfaces.
- [ ] **Step 4: Rulează.** Run: `npm run test:rls -- intrare` și `npm test`. Expected: PASS.
- [ ] **Step 5: Commit:** `crm: lead-urile din reclame intră singure, cu sursa și reclama lor`

---

### Task 4: Site-ul: linkul cu serviciul ales

**Files:**
- Modify: `site/components/home/FormularContact.tsx`, `site/lib/contact.ts`, `site/tests/unit/contact.test.ts`, `site/tests/e2e/contact.spec.ts`

**Interfaces:**
- Produces: `serviciuDinLink(search: string): CheieServiciu | null` în `site/lib/contact.ts` (doar cheile din `SERVICII_CONTACT`, altfel `null`). `FormularContact` îl citește la montare și alege pastila. Dacă URL-ul are `#formular`, pagina ajunge la secțiune după hidratare, prin Lenis (`ramaiLaAncora` din LenisProvider, existent), ca animațiile GSAP să nu mute ținta.

- [ ] **Step 1: Teste.** Unit: `serviciuDinLink("?serviciu=site")` → `"site"`; `"?serviciu=1la1"` → `"1la1"`; `"?serviciu=hack"` → `null`; `""` → `null`. E2E: `"/?serviciu=automatizari&utm_source=ig&utm_medium=reclama#formular la 390px: formularul e în ecran, cu Automatizări ales"`. Pastila e selectată (atributul pe care îl folosește azi chip-ul ales), iar `#formular` e în viewport după `waitForLoadState("networkidle")`.
- [ ] **Step 2: Rulează și verifică că pică.** Run (din `site/`): `npx vitest run contact` și `npx playwright test tests/e2e/contact.spec.ts`. Expected: FAIL.
- [ ] **Step 3: Implementează.** `PastreazaUtm` rămâne neatins.
- [ ] **Step 4: Rulează** cele două comenzi, plus `npm run lint`. Expected: PASS.
- [ ] **Step 5: Commit:** `site: linkul din reclamă deschide formularul cu serviciul ales`

---

### Task 5: Pagina „Reclame”

**Files:**
- Create: `crm/supabase/migrations/20261113000008_reclame_cifre.sql`, `crm/app/(app)/reclame/page.tsx`, `crm/app/(app)/reclame/actiuni.ts`, `crm/components/reclame/CardReclama.tsx`, `Cheltuit.tsx`, `AdaugaReclama.tsx`, `UnesteCu.tsx`, `TextAdsManager.tsx`, `crm/tests/e2e/reclame.spec.ts`
- Modify: `crm/app/(app)/layout.tsx` (Admin: `{ href: "/reclame", eticheta: "Reclame", iconita: "reclame" }` după Finanțe), `crm/components/Iconite.tsx` (`"reclame"`: un megafon, în stilul liniar al celorlalte), `crm/app/tema.css` (variabila turcoaz), `crm/tests/e2e/finante.spec.ts` (testul „6 intrări” devine 7), `crm/tests/rls/reclame.test.ts`

**Interfaces:**
- Consumes: `CifreReclama`, `verdict`, `ordoneaza`, `totaluri`, `TEXT_META`, `TEXT_TIKTOK` (Task 1).
- Produces (SQL, `…000008`):
  - `reclame_cifre() returns setof (id, platforma, campanie, nume, cheltuit_lei, lead_uri int, discutii int, clienti int, incasat_lei int, mai_vin_lei int)`, `security invoker`, doar reclamele cu `unita_in is null`. Câmpurile:
    - `lead_uri` = câte rânduri de legătură are reclama.
    - `discutii` = câte rânduri au `a_avut_discutie or client`.
    - `clienti` = câte rânduri au `client`.
    - `incasat_lei` = `sum(incasat_sters_lei)` + net-ul tranșelor încasate (`tip <> 'inainte'`) ale clienților cu `client_id` nenul.
    - `mai_vin_lei` = `sum(suma_lei)` din tranșele lor neîncasate.
  - `uneste_reclame(p_pastrata uuid, p_unita uuid) returns void`, `security definer` (mută rânduri din `reclame_lead_uri`), cu verificarea din interior: doar Admin sau cheia de serviciu.
    1. Mută legăturile de la `p_unita` la `p_pastrata`.
    2. Adună cheltuielile: gol + X = X, gol + gol = gol.
    3. Pune `unita_in = p_pastrata` pe `p_unita` și pe orice reclamă care trimitea la `p_unita`.

    Refuză unirea unei reclame cu ea însăși și a două platforme diferite („Poți uni doar reclame de pe aceeași platformă.”).
- Produces (acțiuni, `actiuni.ts`, toate verifică rolul Admin și întorc `{ eroare?: string }`):
  - `seteazaCheltuit(id: string, text: string)`. `citesteLei`: gol → `null`; „gresit” → „Scrie suma în lei, fără virgule.”
  - `adaugaReclama(form: FormData)`, cu `platforma`, `campanie`, `nume`, `cheltuit`. Duplicat → „Reclama asta există deja.”
  - `unesteReclame(pastrata: string, unita: string)`.
  - `stergeReclama(id: string)`. Doar fără lead-uri: „Reclama are lead-uri. Unește-o cu alta în loc s-o ștergi.”
- Pagina, după macheta B (spec §3.6):
  - titlul „Reclame”, cu subtitlul „Ce reclamă îți aduce clienți și bani”;
  - cele 4 totaluri;
  - linia „N lead-uri din reclame adăugate de mână, fără reclamă anume” (lead-urile cu `sursa` reclamă fără rând de legătură), doar dacă N > 0;
  - cardurile, puse în ordine cu `ordoneaza`, pe 2 coloane de la `md` și pe 1 sub;
  - „+ Reclamă” sus, lângă titlu;
  - „Unește cu…” și „Șterge” într-un meniu mic pe card;
  - panoul „Ce lipesc în Ads Manager”, închis implicit, cu `TEXT_META` și `TEXT_TIKTOK` într-un `<pre>` cu buton de copiere;
  - ecranul gol (nicio reclamă): o frază și panoul deschis.

  Non-Admin pe `/reclame` → `notFound()`.

- [ ] **Step 1: Testele.**
  - RLS (`reclame.test.ts`): `reclame_cifre()` pe un scenariu cunoscut. 3 lead-uri, 1 cu discuție, 1 client cu 2.000 încasați și 800 neîncasați, plus un client șters care a lăsat 1.500. Rezultat: `lead_uri 4, discutii 2, clienti 2, incasat 3500, mai_vin 800`. Ca `constructor` → `[]`. `uneste_reclame`: lead-urile și cheltuiala trec la cea păstrată, iar cea unită nu mai apare în `reclame_cifre()`.
  - E2E (`reclame.spec.ts`):
    - `"Admin: cardul arată pâlnia, banii și verdictul"`;
    - `"Admin: scrie suma cheltuită, verdictul se schimbă"` (din „Scrie cât ai cheltuit…” în „Aduce bani…”);
    - `"Admin: + Reclamă adaugă o reclamă fără lead-uri"`;
    - `"Admin: unește două reclame"`;
    - `"caller și constructor nu văd Reclame în meniu, iar /reclame dă 404"`;
    - `"390px: meniul de jos are 7 intrări vizibile, cardurile pe o coloană, fără derulare orizontală"`.

    Folosește nume de reclame unice în fiecare test, ca să nu se calce testele între ele.
- [ ] **Step 2: Rulează și verifică că pică.** Run: `npm run test:rls -- reclame` și `npm run e2e -- reclame`. Expected: FAIL.
- [ ] **Step 3: Scrie migrația.** Cere aplicarea pe test, apoi rulează `npm run tipuri`. Apoi scrie pagina, componentele și acțiunile, meniul și iconița.
- [ ] **Step 4: Rulează.** Run: `npm run test:rls`, `npm run e2e`, `npm run tsc`, `npm run lint`. Expected: PASS, inclusiv `finante.spec.ts` cu 7 intrări.
- [ ] **Step 5: Commit:** `crm: pagina Reclame (carduri cu pâlnie, cheltuit, unire)`

---

### Task 6: Reclama pe fișa lead-ului și datele demo

**Files:**
- Modify: `crm/app/(app)/lead-uri/[id]/page.tsx`, `crm/scripts/date/demo-date.ts`, `crm/scripts/date/demo-scrie.mts`, `crm/scripts/demo.mts` (golirea), `crm/tests/unit/demo-date.test.ts`, `crm/tests/e2e/fisa.spec.ts`

**Interfaces:**
- Fișa lead-ului: dacă lead-ul are reclamă, rândul „Reclamă” arată chip-ul platformei, apoi „{campanie} · {nume}”. Altfel, dacă cererea are UTM-uri, rămâne afișarea de azi (link organic). Numele reclamei nu stă în `<Ascuns>` (nu e dată personală).
- Demo:
  - `RECLAME_DEMO`: cele 5 din machetă, cu numele, campaniile și cheltuielile de acolo (620, 380, 450, `null`, 300).
  - Lead-urile demo cu `sursa` reclamă primesc `utm` cu `utm_medium: "reclama"` și numele reclamei.
  - Scriitorul cheamă `atribuie_reclama` după lead.
  - Câțiva clienți demo vin din reclame, ca toate cele 4 verdicte să apară.
  - `golesteTot` șterge și `reclame`.

- [ ] **Step 1: Teste.**
  - Unit (`demo-date.test.ts`): `"fiecare reclamă demo are cel puțin un lead, iar verdictele acoperă toate cele 4 tonuri"` (calculat cu `verdict` pe cifrele așteptate).
  - E2E (`fisa.spec.ts`): `"fișa unui lead din reclamă arată Meta · campanie · reclamă"`.
- [ ] **Step 2: Rulează și verifică că pică.**
- [ ] **Step 3: Implementează.** Rulează `npm run demo` pe test și deschide `/reclame` local, la laptop și la 390px.
- [ ] **Step 4: Rulează** `npm test`, `npm run e2e`, `npm run tsc`, `npm run lint`. Expected: PASS.
- [ ] **Step 5: Commit:** `crm: reclama pe fișa lead-ului și reclamele în datele demo`

---

### Task 7: Punctul de control vizual cu Andrei

- [ ] **Step 1:** Pornește serverul de dev din `crm/` (`npm run dev`, cu baza de test plină din `npm run demo`). Andrei intră cu `andrei@buildwithac.ro` (parola de test) și se uită la `/reclame` pe laptop și pe iPhone, apoi la fișa unui lead din reclamă. Trebuie să vadă: scrierea sumei, „+ Reclamă”, unirea, panoul „Ce lipesc în Ads Manager”.
- [ ] **Step 2:** Schimbările cerute de el se fac, se testează și se comit. Fiecare decizie a lui intră în jurnal, pe o linie „Ruling”. Oprește serverul la final (`taskkill //PID … //F //T`).

---

### Task 8: Verificarea finală, previzualizarea, producția

- [ ] **Step 1:** Toate verificările din Global Constraints, în `crm/` și în `site/`. Expected: toate PASS, cu numărul de teste notat.
- [ ] **Step 2:** Verificarea finală cu subagent (pas greu: anunță consumul și cere acordul lui Andrei). Repară criticele și importantele, iar măruntele le notezi în jurnal.
- [ ] **Step 3:** Cu „da”-ul lui Andrei: `git push -u origin crm-reclame`, apoi `npx vercel ls` (din `crm/`) pentru previzualizarea CRM-ului. Site-ul are și el previzualizare, pentru `?serviciu=`. Rulează `npm run demo` pe test. Andrei verifică pe laptop și pe iPhone cu `andrei@buildwithac.ro` și deschide pe telefon `…/?serviciu=site&utm_source=ig&utm_medium=reclama&utm_campaign=Test&utm_content=Proba#formular` de pe previzualizarea site-ului.
- [ ] **Step 4:** La „e bine” și „da” pentru producție, Andrei aplică migrațiile `20261113000007`–`000008` pe PRODUCȚIE cu `!`: `SB_MEDIU=productie npm run sb -- db push --remote=znabkoesmtoggdmehmqp`. Apoi: unirea `crm-reclame` în `main`, push, `npx vercel ls`, `curl -sI https://crm.buildwithac.ro/intra` (200), `curl -sI https://buildwithac.ro` (200). Andrei intră cu `admin@buildwithac.ro` pe „Reclame” (ecranul gol, cu textul de lipit).
- [ ] **Step 5:** Stadiul în `docs/progres-brainstorming.md` („DE AICI CONTINUĂM”) și memoria. Commit: `docs: Reclamele sunt live`.
