# CRM-ul buildwithac, etapa 2 (clienții și proiectele): planul de implementare

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** fiecare client din CRM are fișa lui (varianta A din prototip): proiectele cu stadiu, preț și termen, task-urile, materialele, conturile, ce i s-a livrat, notițele și parcursul. Andrei vede dintr-o privire stadiul fiecărui proiect, iar constructorul vede doar proiectele pe care e pus, cu prețul și comisionul lui.

**Architecture:** totul atârnă de un tabel nou, `proiecte` (un client poate avea mai multe). Task-urile, materialele, conturile, livrările, notițele și parcursul țin de proiect, așa că o singură regulă de acces le acoperă pe toate: `lucreaza_la(proiect)` = Adminul sau un constructor pus pe proiect, verificată în baza de date (RLS). Regulile pe coloane (constructorul schimbă doar stadiul) și Parcursul stau în trigger-e, ca la etapa 1. Calculele (progres, întârzieri, comision) sunt funcții pure în `crm/lib/proiecte.ts`. Fișierele stau într-un bucket privat din Supabase Storage și se urcă direct din browser, cu un link semnat.

**Tech Stack:** cel din etapa 1 (Next.js 16.4, TypeScript, Tailwind 4, `@supabase/supabase-js` + `@supabase/ssr`, zod, vitest, Playwright, Vercel Cron), plus Supabase Storage.

**Spec:** `docs/superpowers/specs/2026-11-09-crm-design.md` (§4 rolurile, §5 „Etapa 2”, §9 datele). Prototipul fișei: `prototip/crm-clienti.html`, secțiunea `#vA`.

## Global Constraints

- **Înainte de orice cod Next.js: citește `crm/AGENTS.md`** și ghidurile din `crm/node_modules/next/dist/docs/`. Toate paginile CRM-ului sunt dinamice (fără `cacheComponents`).
- Comenzile se rulează din `crm/`. Serverul de dev merge pe portul **3100**.
- Texte în română, ș/ț cu virgulă (niciodată ş/ţ), tonul din `CLAUDE.md`.
- Domeniul și adresele stau **doar** în `crm/lib/config.ts`. Culorile și fonturile vin **doar** din variabilele din `crm/app/tema.css` (clasele `.panel`, `.chip`, `.btn`, `.lbl`, `.camp`). Fără GSAP, Lenis, colaj, fotografii.
- Gândit pentru ~1440px. La 390px doar se deschide și se citește: fără scroll orizontal pe pagină (tabelele pot avea scroll propriu).
- **Fără parole în CRM.** Fără mesaje automate trimise clienților.
- Ora și „azi” sunt mereu `Europe/Bucharest` (`ziuaRomaniei` din `lib/timp.ts`). Termenele sunt `date` (`YYYY-MM-DD`), momentele sunt `timestamptz`.
- Banii sunt **lei întregi** (`int`), afișați „2.400 lei”.
- **Permisiunile se verifică în baza de date**, nu doar în pagină. Paginile și acțiunile citesc cu sesiunea omului (`lib/supabase/server.ts`). Cheia de serviciu (`lib/supabase/admin.ts`) rămâne doar la rutele de intrare, jobul zilnic, seed și teste.
- Mesajele brute Postgres (în engleză) nu ajung niciodată în pagină: acțiunile noi trec erorile prin `mesajDinBaza` (Task 2).
- Migrațiile noi se numesc `2026111100000N_<nume>.sql` și se aplică pe **test** cu `npm run sb -- db push --remote`, apoi `npm run tipuri`. Pe **producție** se aplică doar în Task 10, cu „da”-ul lui Andrei. Baza de producție nu se citește din sesiune.
- Ramura: `crm-etapa-2`. În `main` ajunge doar etapa terminată și văzută de Andrei. Commit-urile sunt în română și se termină cu `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Pașii grei (build-uri, subagenți, suita e2e întreagă) se anunță înainte.
- Înainte de unirea în `main`, din `crm/`: `npx vitest run`, `npm run test:rls`, `npm run tsc`, `npm run lint`, `npx playwright test`. Din `site/`: `npx vitest run`, `npm run verifica`, `npm run lint`.

## Ce am hotărât eu în plan (de confirmat cu Andrei)

Designul lasă structura la constructor. Astea sunt alegerile care se văd în aplicație:

1. **Proiectul se face singur** când un lead devine client, cu serviciul lead-ului și stadiul „Discuție”. Adminul completează apoi prețul, termenul și oamenii. Alte proiecte se adaugă din fișă, cu „+ Proiect nou”.
2. **Banii, în etapa 2:** doar două cifre pe proiect, „Preț” și „Încasat”, scrise de Admin. Încasările pe rânduri (avans, rest) vin în etapa 3.
3. **Comisionul constructorului:** procentul se scrie pentru fiecare om, pe fiecare proiect, când îl pui pe proiect (poate rămâne gol). Constructorul vede prețul, procentul lui și cât înseamnă din banii încasați. Nu vede procentul altcuiva.
4. **Pe un proiect se pun doar conturi cu rolul Constructor.** Adminul e pe toate. Callerul și closerul văd, ca acum, doar lista clienților lor; fișa clientului (cu bani și materiale) n-o deschid.
5. **Constructorul** vede contactul clientului, lucrează pe task-uri, materiale, conturi, livrări și notițe și poate schimba stadiul. Prețul, încasatul, termenul și oamenii le schimbă doar Adminul.
6. **Fișierele:** cel mult 25 MB fiecare, în Supabase Storage (planul gratuit are 1 GB în total). Link-urile (Drive, Figma) rămân varianta pentru ce e mare.
7. **Răspunsurile din Tally** se pun la Materiale ca link, de mână. Nu construim o legătură automată cu Tally.
8. **La Conturi, „unde e parola” e o listă de ales** (la client / la buildwithac / manager de parole / —), nu un câmp liber, ca să nu ajungă nimeni să scrie parola acolo.
9. **Sfârșitul colaborării:** Adminul apasă „Închide proiectul”. Când toate proiectele unui client sunt închise de peste un an, e-mailul de luni îl trece la „de șters”, iar Adminul îl șterge din fișă cu „Șterge clientul” (pleacă și fișierele, și lead-ul din care a venit). Nu se șterge nimic singur.
10. **Starea „Nu mai sunați”** e Task 9, opțional: se construiește doar dacă Andrei zice „da”.

## Review Focus

1. **Constructorul cere direct prin API ce nu-i al lui** (proiectul altcuiva, task-urile, un fișier din Storage, procentul unui coleg): primește zero rânduri sau eroare. Teste RLS în Task 1, 4, 5, 6, 7.
2. **Lead-ul devine client de două ori** (closerul îl marchează, Adminul îl mută înapoi și iar „Client”) sau clientul există dinaintea etapei 2: rămâne un singur client, cu exact un proiect făcut automat. Test RLS Task 1.
3. **Termenul „azi” în jurul miezului nopții și la schimbarea orei:** un task cu termenul de azi nu e „întârziat”, iar ziua se socotește în România, nu în UTC. Vitest Task 2.
4. **Încărcarea unui fișier se oprește la jumătate, fișierul e prea mare sau are un nume ciudat** (`../`, diacritice, 300 de caractere): nu rămâne niciun rând fără fișier, omul vede un mesaj clar, numele e curățat. Vitest + e2e Task 7.
5. **Ștergerea unui client lasă ceva în urmă:** fișierele din Storage sau lead-ul în starea „client”, pe care jobul de 90 de zile nu-l mai șterge niciodată. Test RLS și e2e în Task 8.

---

## Harta fișierelor

```
crm/
  supabase/migrations/
    20261111000001_proiecte.sql        proiecte, proiect_oameni, taskuri, evenimente_proiect, lucreaza_la, trigger-e
    20261111000002_muta_taskuri.sql    „Mută tot la…” pentru task-uri
    20261111000003_notite_livrari.sql  notite_proiect, livrari
    20261111000004_conturi_materiale.sql  conturi, materiale
    20261111000005_fisiere.sql         bucketul „materiale” și regulile lui
    20261111000006_nu_mai_sunati.sql   doar dacă se face Task 9
  lib/
    tipuri.ts                          + STADII, STARI_LIVRARE, AL_CUI, UNDE_PAROLA și etichetele lor
    proiecte.ts                        progres, întârzieri, ordinea task-urilor, comision, lei
    parcurs.ts                         + descrieEvenimentProiect
    erori.ts                           mesajDinBaza
    fisiere.ts                         numeCurat, marimeCitibila, MARIME_MAXIMA
    retentie.ts                        + clienții cu colaborarea încheiată, tabelele noi în copia de luni
    supabase/browser.ts                clientul din browser, doar pentru urcarea fișierelor
  app/(app)/
    clienti/page.tsx                   tabelul cu proiecte (Admin, Constructor); lista veche (Caller, Closer)
    clienti/[id]/page.tsx              fișa clientului
    clienti/[id]/actiuni.ts            proiectul, oamenii, contactul, închiderea, ștergerea
    clienti/[id]/actiuni-taskuri.ts    task-urile
    clienti/[id]/actiuni-fisa.ts       notițe, livrări, conturi, materiale
    materiale/[id]/route.ts            descărcarea unui fișier (link semnat, 60 s)
    taskuri/page.tsx                   „Task-urile mele”
  components/
    Taburi.tsx                         fostul TaburiLead (același cod, alt nume)
    fisa/DateProiect.tsx, Stadiu.tsx, OameniProiect.tsx, ContactClient.tsx
    fisa/Taskuri.tsx, Notite.tsx, Livrari.tsx, Conturi.tsx, Materiale.tsx
    fisa/ProiectNou.tsx, InchideProiect.tsx, StergeClient.tsx
  tests/unit/proiecte.test.ts, erori.test.ts, fisiere.test.ts, retentie.test.ts (extins)
  tests/rls/proiecte.test.ts, taskuri.test.ts, fisa.test.ts, fisiere.test.ts, stergere-client.test.ts
  tests/e2e/clienti.spec.ts, taskuri.spec.ts, fisa-client.spec.ts, materiale.spec.ts
  scripts/seed.mts                     clienții de test, cu fișa plină
```

Ordinea tab-urilor din fișă, la final (din prototip): **Task-uri, Materiale, Conturi, Livrat, Notițe, Parcurs**. Tab-urile apar pe rând, pe măsură ce task-urile de mai jos le construiesc; fiecare task își pune tab-ul la locul lui din ordinea asta.

---

### Task 0: Ramura și documentele

- [ ] **Step 1:** ești pe `crm-etapa-2` (făcută din `main` la zi). Verifică: `git branch --show-current` → `crm-etapa-2`.
- [ ] **Step 2:** comite acest plan și `docs/progres-brainstorming.md`. **Nu** adăuga clipurile din `Exemple/`. Mesaj: `docs: planul CRM-ului, etapa 2`.

### Task 1: Baza de date: proiectele, oamenii, task-urile, parcursul

**Files:**
- Create: `crm/supabase/migrations/20261111000001_proiecte.sql`, `crm/tests/rls/proiecte.test.ts`
- Modify: `crm/lib/tipuri.ts`, `crm/lib/baza.types.ts` (generat), `crm/tests/rls/ajutor.ts`, `crm/tests/unit/tipuri.test.ts`

**Interfaces:**
- Consumes: `rol_curent()`, trigger-ul `dupa_schimbare_lead`, `leadDeTest`, `conecteazaCa`, `idDe`, `admin` (etapa 1).
- Produces:
  - SQL: tabelele de mai jos; `public.lucreaza_la(p uuid) returns boolean`; `public.oameni_proiect(p uuid) returns table (om_id uuid)`; `public.titlu_implicit(s public.serviciu) returns text`.
  - `lib/tipuri.ts`: `STADII = ["discutie","schita","constructie","revizii","livrat","mentenanta"] as const`, `type Stadiu`, `ETICHETE.stadiu` = Discuție / Schiță / Construcție / Revizii / Livrat / Mentenanță.
  - `tests/rls/ajutor.ts`: `clientDeTest(camp?): Promise<{ lead: Lead; clientId: string; proiectId: string }>` (lead cu cheia de serviciu, apoi `update stare = 'client'`), `omTemporar(rol, activ?)` mutat aici din `echipa.test.ts` și lărgit la `"constructor"`, `stergeClient(leadId)` (șterge clientul, apoi lead-ul).

- [ ] **Step 1: Scrie testele RLS, care pică** (`tests/rls/proiecte.test.ts`). `constructor` = contul din seed, `c2` = `omTemporar("constructor")`.

```ts
it("lead-ul devine client → un client și exact un proiect, în «discutie», cu serviciul lead-ului", async () => {
  const { lead, clientId, proiectId } = await clientDeTest({ serviciu: "automatizari" });
  const { data } = await admin().from("proiecte").select("id, stadiu, serviciu, titlu, incasat_lei, pret_lei").eq("client_id", clientId);
  expect(data).toEqual([{ id: proiectId, stadiu: "discutie", serviciu: "automatizari", titlu: "Automatizări", incasat_lei: 0, pret_lei: null }]);
  // marcat din nou „Client”: nimic nu se dublează
  await admin().from("lead_uri").update({ stare: "oferta_trimisa" }).eq("id", lead.id);
  await admin().from("lead_uri").update({ stare: "client" }).eq("id", lead.id);
  expect((await admin().from("clienti").select("id").eq("lead_id", lead.id)).data).toHaveLength(1);
  expect((await admin().from("proiecte").select("id").eq("client_id", clientId)).data).toHaveLength(1);
});
it("constructorul nepus pe proiect nu vede nici proiectul, nici clientul; pus pe proiect, le vede", async () => {
  // select proiecte / clienti după id → [] ; după insert în proiect_oameni (cu cheia de serviciu) → câte 1 rând
});
it("constructorul de pe proiect schimbă stadiul (apare în parcurs), dar nu prețul", async () => {
  // update { stadiu: "schita" } → fără eroare; evenimente_proiect are { tip: "stadiu", detalii: { de: "discutie", in: "schita" } }
  // update { pret_lei: 1 } → error.message === "Doar Adminul schimbă datele proiectului."
});
it("constructorul își vede doar rândul lui din proiect_oameni; oameni_proiect îi dă toți colegii", async () => {
  // proiect cu constructor (30) și c2 (40): select procent → [{ om_id: constructor, procent: 30 }]; rpc oameni_proiect → 2 id-uri
});
it("oameni_proiect, cerut de un constructor din afara proiectului → niciun rând", async () => {});
it("pe proiect se pun doar constructori cu contul pornit", async () => {
  // adminul (conectat) inserează callerul → error.message === "Pe proiect se pun doar constructori cu contul pornit."
});
it("callerul nu vede proiectele, nici pe ale clientului lui", async () => {});
it("constructorul vede din profiluri doar pe el, Adminii și colegii de proiect; programul closerilor deloc", async () => {
  // emailurile văzute conțin admin@ și constructor@, nu conțin caller@ și closer@; după ce c2 e pus pe același proiect, îl conțin și pe c2
  // select program_closer → []
});
```

- [ ] **Step 2:** rulează `npm run test:rls -- proiecte`. Așteptat: pică (tabelul `proiecte` nu există).

- [ ] **Step 3: Scrie migrația.** Tabelele (interfața pentru restul planului):

```sql
create type public.stadiu as enum ('discutie', 'schita', 'constructie', 'revizii', 'livrat', 'mentenanta');

create table public.proiecte (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clienti (id) on delete cascade,
  titlu text not null check (length(titlu) between 1 and 120),
  serviciu public.serviciu not null,
  stadiu public.stadiu not null default 'discutie',
  pret_lei int check (pret_lei between 0 and 10000000),
  incasat_lei int not null default 0 check (incasat_lei between 0 and 10000000),
  termen date,
  inchis_la timestamptz,
  creat_de uuid references public.profiluri (id) on delete set null,
  creat_la timestamptz not null default now()
);
create table public.proiect_oameni (
  proiect_id uuid not null references public.proiecte (id) on delete cascade,
  om_id uuid not null references public.profiluri (id) on delete cascade,
  procent numeric(5,2) check (procent between 0 and 100),
  adaugat_la timestamptz not null default now(),
  primary key (proiect_id, om_id)
);
create table public.taskuri (
  id uuid primary key default gen_random_uuid(),
  proiect_id uuid not null references public.proiecte (id) on delete cascade,
  titlu text not null check (length(titlu) between 1 and 200),
  om_id uuid references public.profiluri (id) on delete set null,
  termen date,
  gata boolean not null default false,
  gata_la timestamptz,
  creat_de uuid default auth.uid() references public.profiluri (id) on delete set null,
  creat_la timestamptz not null default now()
);
-- Parcursul proiectului: scris doar de trigger-e
create table public.evenimente_proiect (
  id bigint generated always as identity primary key,
  proiect_id uuid not null references public.proiecte (id) on delete cascade,
  autor_id uuid references public.profiluri (id) on delete set null,
  tip text not null,
  detalii jsonb not null default '{}',
  la timestamptz not null default now()
);
```

  Plus indecși pe fiecare cheie străină (`proiecte.client_id`, `proiect_oameni.om_id`, `taskuri.proiect_id`, `taskuri.om_id`, `evenimente_proiect (proiect_id, la desc)`), RLS pornit pe toate, `revoke all … from anon`, `grant select, insert, update, delete … to authenticated`. Regulile:

  - `lucreaza_la(p)`: `security definer`, `stable`, `search_path = ''`. Adevărat dacă `rol_curent() = 'admin'`, sau `rol_curent() = 'constructor'` și există rândul `(p, auth.uid())` în `proiect_oameni`. `execute` doar pentru `authenticated`.
  - `oameni_proiect(p)`: `security definer`; întoarce `om_id` din `proiect_oameni` doar dacă `lucreaza_la(p)`.
  - `proiecte`: citire și schimbare cu `lucreaza_la(id)`; adăugare și ștergere doar Admin.
  - `proiect_oameni`: citire Admin sau `om_id = auth.uid()`; scriere doar Admin.
  - `taskuri`: toate cele patru operații cu `lucreaza_la(proiect_id)`.
  - `evenimente_proiect`: doar citire, cu `lucreaza_la(proiect_id)`.
  - `clienti`: politica de citire primește încă o ramură (constructor, dacă există un proiect al clientului cu `lucreaza_la`); politici noi `clienti_schimbare` și `clienti_stergere`, doar Admin.
  - `profiluri_citire` se înlocuiește: Admin, Caller, Closer văd tot; Constructorul vede rândul lui, Adminii și oamenii cu care împarte un proiect (funcție ajutătoare `security definer`, ca politica să nu se cheme pe ea însăși). `program_citire` devine `rol_curent() in ('admin','caller','closer')`. (Asta închide minor-ul amânat „constructorul vede toate profilurile”.)
  - Trigger `before update` pe `proiecte`: cheia de serviciu și Adminul trec; altfel, dacă `inchis_la` nu e gol → `Proiectul e închis.`; dacă se schimbă orice altă coloană decât `stadiu` → `Doar Adminul schimbă datele proiectului.` (ambele cu `raise exception` simplu, cod `P0001`).
  - Trigger `before insert or update` pe `proiect_oameni`: omul trebuie să aibă rolul `constructor` și `activ`; altfel `Pe proiect se pun doar constructori cu contul pornit.`
  - Trigger `before insert or update` pe `taskuri`: `proiect_id` nu se schimbă; `om_id` e gol, un Admin sau un om de pe proiect, altfel `Task-ul se dă doar cuiva din proiect.`; când `gata` devine adevărat, `gata_la = now()`, când devine fals, `gata_la = null`.
  - Parcursul (trigger-e `after`, `security definer`): `proiecte` insert → `proiect_creat` `{titlu, serviciu}`; stadiu schimbat → `stadiu` `{de, in}`; `inchis_la` pus → `inchis`, scos → `redeschis`. `proiect_oameni` insert → `om_adaugat` `{om}`; delete → `om_scos` `{om}` și task-urile negata ale omului din proiectul acela rămân fără om (`om_id = null`).
  - `titlu_implicit`: `site` → `Site`, `automatizari` → `Automatizări`, `1la1` → `Sesiune 1 la 1 / ghid`, `altceva` → `Proiect`.
  - `dupa_schimbare_lead` (`create or replace`, restul rămâne la fel): `insert into clienti … on conflict (lead_id) do nothing returning id`; dacă a întors un id, adaugă proiectul `(client_id, titlu_implicit(new.serviciu), new.serviciu, creat_de = auth.uid())`.
  - La sfârșitul migrației: un proiect pentru fiecare client care n-are niciunul (clienții de dinainte).

- [ ] **Step 4:** aplică pe test (`npm run sb -- db push --remote`), `npm run tipuri`, adaugă `STADII` și etichetele în `lib/tipuri.ts`; în `tests/unit/tipuri.test.ts`, un test că `Object.keys(ETICHETE.stadiu)` are exact valorile din `STADII`.
- [ ] **Step 5:** `npm run test:rls` și `npx vitest run`. Așteptat: trec toate, inclusiv cele din etapa 1 (`echipa.test.ts` folosește acum `omTemporar` din `ajutor.ts`).
- [ ] **Step 6:** commit: `crm: baza de date pentru proiecte, oameni și task-uri`.

### Task 2: Calculele fără bază de date

**Files:**
- Create: `crm/lib/proiecte.ts`, `crm/lib/erori.ts`, `crm/tests/unit/proiecte.test.ts`, `crm/tests/unit/erori.test.ts`
- Modify: `crm/lib/parcurs.ts`

**Interfaces:**
- Consumes: `ETICHETE`, `Stadiu` (Task 1); `ziuaRomaniei` (întoarce `YYYY-MM-DD`; confirmă în `lib/timp.ts`).
- Produces (`lib/proiecte.ts`):

```ts
export type TaskScurt = { id: string; titlu: string; om_id: string | null; termen: string | null; gata: boolean; gata_la: string | null; creat_la: string };
export function progres(t: { gata: boolean }[]): { gata: number; total: number; procent: number };
/** Câte zile a trecut termenul. 0 dacă n-are termen, e azi sau e în viitor. `azi` și `termen` sunt YYYY-MM-DD. */
export function zileIntarziere(termen: string | null, azi: string): number;
/** Negata întâi: termen crescător, cele fără termen la urmă, apoi după creat_la. Gata la sfârșit, cele mai recente sus. */
export function ordoneazaTaskuri<T extends TaskScurt>(t: T[]): T[];
export function urmatorulTask<T extends TaskScurt>(t: T[]): T | null;
/** Doar task-urile negata. */
export function grupeazaTaskuri<T extends TaskScurt>(t: T[], azi: string): { intarziate: T[]; azi: T[]; urmeaza: T[]; faraTermen: T[] };
/** Din banii încasați efectiv, rotunjit la leu. null dacă procentul nu e stabilit. */
export function comision(incasatLei: number, procent: number | null): number | null;
export function lei(n: number | null): string; // „2.400 lei”; „—” la null
```

  `lib/erori.ts`: `mesajDinBaza(e: { code?: string; message: string } | null, implicit: string): string` — întoarce `e.message` doar pentru codul `P0001` (mesajele noastre din trigger-e, în română); pentru orice altceva, `implicit`.
  `lib/parcurs.ts`: `descrieEvenimentProiect(e: Eveniment, nume: (id: unknown) => string): string`.

- [ ] **Step 1: Testele, care pică.**

```ts
// proiecte.test.ts
const t = (x: Partial<TaskScurt>): TaskScurt => ({ id: "1", titlu: "t", om_id: null, termen: null, gata: false, gata_la: null, creat_la: "2026-11-01T10:00:00Z", ...x });
expect(progres([])).toEqual({ gata: 0, total: 0, procent: 0 });
expect(progres([t({ gata: true }), t({}), t({})])).toEqual({ gata: 1, total: 3, procent: 33 });
expect(zileIntarziere("2026-11-10", "2026-11-10")).toBe(0);      // termenul de azi nu e întârziat
expect(zileIntarziere("2026-11-07", "2026-11-10")).toBe(3);
expect(zileIntarziere("2026-10-24", "2026-10-26")).toBe(2);      // peste schimbarea orei (25 oct. 2026)
expect(zileIntarziere(null, "2026-11-10")).toBe(0);
expect(zileIntarziere("2026-11-12", "2026-11-10")).toBe(0);
// ordinea: [termen 7 nov, termen 13 nov, fără termen, gata] indiferent de ordinea de intrare; urmatorulTask → cel cu 7 nov; null când toate sunt gata
// grupeazaTaskuri(…, "2026-11-10"): 7 nov → intarziate; 10 nov → azi; 13 nov → urmeaza; fără termen → faraTermen; cele gata, nicăieri
expect(comision(1200, 30)).toBe(360);
expect(comision(1001, 33.33)).toBe(334);
expect(comision(1200, null)).toBeNull();
expect(lei(2400)).toBe("2.400 lei");
expect(lei(0)).toBe("0 lei");
expect(lei(null)).toBe("—");
// parcurs
expect(descrieEvenimentProiect({ tip: "stadiu", detalii: { de: "schita", in: "constructie" }, la: "", autor_id: null }, nume)).toBe("Stadiu: Schiță → Construcție");
// proiect_creat → „Proiect nou: Site”; om_adaugat → „Mihai adăugat în proiect”; om_scos → „Mihai scos din proiect”;
// inchis → „Proiect închis”; redeschis → „Proiect redeschis”; livrat → „Trimis clientului: Schița (v2)”;
// livrare_stare → „Schița (v2): Aprobat”; tip necunoscut → tipul, ca text
// erori.test.ts
expect(mesajDinBaza({ code: "P0001", message: "Proiectul e închis." }, "Nu s-a salvat.")).toBe("Proiectul e închis.");
expect(mesajDinBaza({ code: "42501", message: "new row violates row-level security policy" }, "Nu ai voie.")).toBe("Nu ai voie.");
expect(mesajDinBaza(null, "x")).toBe("x");
```

- [ ] **Step 2:** `npx vitest run tests/unit/proiecte.test.ts tests/unit/erori.test.ts` → pică (modulele lipsesc).
- [ ] **Step 3:** scrie funcțiile. `zileIntarziere` scade zilele ca date UTC la miezul nopții (`Date.UTC(an, lună, zi)`), nu ca momente locale, ca schimbarea orei să nu mănânce o zi.
- [ ] **Step 4:** rulează din nou → trec.
- [ ] **Step 5:** commit: `crm: calculele pentru proiecte (progres, termene, comision)`.

### Task 3: Pagina Clienți și fișa clientului (scheletul)

**Files:**
- Create: `crm/app/(app)/clienti/[id]/page.tsx`, `crm/app/(app)/clienti/[id]/actiuni.ts`, `crm/components/fisa/DateProiect.tsx`, `Stadiu.tsx`, `OameniProiect.tsx`, `ContactClient.tsx`, `crm/tests/e2e/clienti.spec.ts`
- Modify: `crm/app/(app)/clienti/page.tsx`, `crm/app/(app)/lead-uri/[id]/page.tsx`, `crm/components/TaburiLead.tsx` → `crm/components/Taburi.tsx` (doar numele), `crm/tests/e2e/date.ts`

**Interfaces:**
- Consumes: tot din Task 1 și 2; `eu`, `cerRol`, `cand`, `linkWhatsApp`, `descrieEveniment`.
- Produces:
  - `actiuni.ts` (toate întorc `Rezultat = { ok: true } | { ok: false; mesaj: string }` și cheamă `revalidatePath` pe fișă):
    `schimbaStadiu(proiectId: string, stadiu: Stadiu)`, `salveazaProiect(proiectId: string, d: { titlu: string; pretLei: string; incasatLei: string; termen: string })`, `adaugaOm(proiectId: string, omId: string, procent: string)` (upsert: același om cu alt procent îl schimbă), `scoateOm(proiectId: string, omId: string)`, `salveazaContact(clientId: string, d: { nume: string; telefon: string; email: string })`.
  - Fișa: `/clienti/[id]?proiect=<uuid>`; `data-testid` `urmeaza`, `proiect`, `parcurs`.
  - `tests/e2e/date.ts`: `clientNou(camp?): Promise<{ leadId: string; clientId: string; proiectId: string }>`; `stergeLead` existent rămâne curățenia (șterge clientul, apoi lead-ul; proiectele pleacă prin cascade).

**Ce face pagina `/clienti`:**
- Caller și Closer: tabelul din etapa 1, neschimbat (clienții lor, link la fișa de lead).
- Admin și Constructor: **un rând pe proiect**, cu coloanele Client (link la `/clienti/<id>?proiect=<id>`, telefonul dedesubt) · Proiect (titlul) · Stadiu (pastilă; `Închis` dacă `inchis_la`) · Progres (bara + `6/11`) · Predare (termenul; roșu dacă a trecut și stadiul e înainte de „Livrat”) · Lucrează (numele, din `proiect_oameni` la Admin, din `oameni_proiect` la Constructor) · Client din. Proiectele închise la coadă. Ce vede fiecare hotărăște RLS.
- Gol, la Constructor: „Aici apar clienții la care lucrezi, după ce te pune Andrei pe un proiect.” (textul de acum). Gol, la Admin: textul de acum.

**Ce face fișa `/clienti/[id]`:**
- `cerRol("admin", "constructor")`. Clientul se citește cu sesiunea omului; fără rând → `notFound()`. Id-ul se verifică întâi cu aceeași expresie ca la fișa de lead.
- Proiectul ales: cel din `?proiect=`, dacă e printre cele vizibile; altfel primul neînchis, altfel primul. Dacă sunt mai multe, un rând de pastile-link „Proiecte” deasupra grilei.
- Antet: firimitura „Clienți / fișa”, numele, pastilele: titlul proiectului (albastru), stadiul (auriu), „Client din 28 oct.”, „Închis” (roșu) dacă e cazul.
- Stânga (grila `320px / 1fr`, ca la fișa de lead):
  - **Urmează** (`data-testid="urmeaza"`): titlul lui `urmatorulTask`; „Termen: joi, 13 nov.” și, dacă e cazul, „· întârziat 3 zile” (o zi: „întârziat o zi”); bara de progres (`var(--grad)`); „6 din 11 task-uri gata”. Fără task-uri: „Niciun task încă.” Toate gata: „Toate task-urile sunt gata.”
  - **Contact:** Telefon, E-mail, „WhatsApp: deschide →”. La Admin: butonul „Schimbă” (`ContactClient`, formular cu Nume, Telefon, E-mail) și, dacă există `lead_id`, link-ul „Fișa de lead →”.
  - **Proiectul** (`data-testid="proiect"`): Serviciu, Stadiu, Preț, Încasat, Predare, Lucrează, A venit din (sursa). Stadiul e un `select` (`Stadiu`) pentru Admin și pentru constructorul de pe proiect, cât proiectul nu e închis. La Admin: „Schimbă” (`DateProiect`: Titlu, Preț (lei), Încasat (lei), Termen de predare) și `OameniProiect` (fiecare om cu procentul lui și „Scoate”; dedesubt un `select` cu constructorii activi nepuși încă, câmpul „Procent” și „Adaugă”). La Constructor, un rând în plus: „Comisionul tău” = `30% · 360 lei din ce s-a încasat`, sau „nestabilit încă” când procentul e gol.
- Dreapta: `Taburi`. În acest task, doar **Parcurs**: `evenimente_proiect` ale proiectului ales, iar la Admin și `evenimente` ale lead-ului, amestecate și ordonate descrescător după `la`.
- Validarea din `salveazaProiect`: titlul 1–120 de caractere; prețul gol = fără preț; prețul și încasatul sunt numere întregi între 0 și 10.000.000 (spațiile și punctele se scot înainte: „2.400” = 2400), altfel „Scrie suma în lei, fără zecimale.”; termenul gol sau `YYYY-MM-DD`. `adaugaOm`: procentul gol = nestabilit; altfel între 0 și 100 (virgula e acceptată: „33,5”), altfel „Procentul e între 0 și 100.” Erorile din bază trec prin `mesajDinBaza(error, "Nu s-a salvat. Încearcă din nou.")`.
- În fișa de lead, la starea „client”: textul din „Acum / Urmează” devine „E client.”, iar Adminul are dedesubt link-ul „Deschide fișa clientului →”.

- [ ] **Step 1: Testele e2e, care pică** (`clienti.spec.ts`, cu `clientNou()` și curățenie în `afterEach`):
  1. *Adminul completează proiectul:* `/clienti` arată clientul cu pastila „Discuție”; click pe nume → fișa; „Schimbă” în Proiectul: Preț `2400`, Încasat `1200`, termen peste 10 zile → `getByTestId("proiect")` conține „2.400 lei” și „1.200 lei”; schimbă stadiul în „Schiță” → `getByTestId("parcurs")` conține „Stadiu: Discuție → Schiță”.
  2. *Constructorul își vede comisionul:* Adminul adaugă „Radu Stan” cu `30` → „Lucrează” îl arată. `intraCa("constructor")`: `/clienti` arată clientul; fișa conține „2.400 lei” și „30% · 360 lei din ce s-a încasat”; nu există niciun buton „Schimbă” și niciun „Scoate”.
  3. *Cine n-are voie:* constructorul, pe fișa unui client la care nu lucrează → pagina 404; callerul, pe `/clienti/<id>` → ajunge pe `/lead-uri`.
  4. *Preț greșit:* Preț `abc` → „Scrie suma în lei, fără zecimale.”, iar panoul rămâne cu „—”.
  5. *Din fișa de lead:* Adminul, pe fișa lead-ului devenit client, apasă „Deschide fișa clientului →” → URL `/clienti/<clientId>`.
- [ ] **Step 2:** `npx playwright test clienti` → pică.
- [ ] **Step 3:** construiește pagina, fișa, acțiunile și componentele. Urmează modelele din etapa 1 (`FormularNotita`, `MutaLa`, `StergeLead` pentru formularele mici cu `useTransition` și mesaj de eroare).
- [ ] **Step 4:** `npx playwright test clienti fisa manual-clienti` (fișa de lead s-a atins) și `npm run tsc`, `npm run lint` → trec.
- [ ] **Step 5:** arată-i lui Andrei fișa în browser (`npm run dev`, ca `admin@test.buildwithac.ro`), înainte de tab-uri. Commit: `crm: pagina Clienți și fișa clientului`.

### Task 4: Task-urile și „Task-urile mele”

**Files:**
- Create: `crm/app/(app)/clienti/[id]/actiuni-taskuri.ts`, `crm/components/fisa/Taskuri.tsx`, `crm/app/(app)/taskuri/page.tsx`, `crm/supabase/migrations/20261111000002_muta_taskuri.sql`, `crm/tests/rls/taskuri.test.ts`, `crm/tests/e2e/taskuri.spec.ts`
- Modify: `crm/app/(app)/clienti/[id]/page.tsx`, `crm/app/(app)/layout.tsx`, `crm/app/(app)/echipa/actiuni.ts`, `crm/components/Echipa.tsx`, `crm/app/(app)/echipa/page.tsx`

**Interfaces:**
- Consumes: `taskuri`, `lucreaza_la` (Task 1); `ordoneazaTaskuri`, `grupeazaTaskuri`, `zileIntarziere` (Task 2).
- Produces: `adaugaTask(proiectId: string, d: { titlu: string; omId: string; termen: string })`, `bifeazaTask(id: string, gata: boolean)`, `schimbaTask(id: string, d: { titlu: string; omId: string; termen: string })`, `stergeTask(id: string)`, toate `Promise<Rezultat>`; SQL `public.muta_taskuri(de uuid, la uuid) returns int`.

**Ce se vede:**
- Tab-ul **Task-uri** (primul, cu numărul lor): fiecare rând are căsuța de bifat, titlul (tăiat când e gata), apoi „Nume · 13 nov.” și „· întârziat” în roșu când termenul a trecut și nu e gata. Ordinea: `ordoneazaTaskuri`. Sus, formularul „+ Task”: Titlu, Cine (`select`: „— nimeni —”, Adminii, oamenii de pe proiect), Termen (`type="date"`). Pe fiecare rând: „Schimbă” și „Șterge”. Lucrează pe ele Adminul și constructorii de pe proiect.
- Pagina **`/taskuri`** („Task-urile mele”), pentru Admin și Constructor (`cerRol`): task-urile negata cu `om_id` = eu, de la toți clienții, în grupele **Întârziate** (roșu), **Azi**, **Urmează**, **Fără termen**; grupele goale nu apar. Pe rând: căsuța, titlul, termenul și „Client · Proiect”, link la fișă. Gol: „Niciun task pe numele tău.”
- Meniul: „Task-urile mele” după „Clienți”, la Admin și la Constructor.
- **Echipa → „Mută tot la…”** mută și task-urile: `muta_taskuri` (doar Admin; `la` trebuie să fie Admin sau constructor activ, altfel `Task-urile trec doar la un constructor cu contul pornit sau la Admin.`) trece task-urile negata ale lui `de` pe numele lui `la`; dacă `la` e constructor și nu e pe proiectul respectiv, îl pune (fără procent). Întoarce câte a mutat. `mutaTot` din `echipa/actiuni.ts` cheamă `muta_lead_uri` pentru Caller/Closer și `muta_taskuri` pentru Constructor, iar numărul „deschise” din pagina Echipa numără, la constructori, task-urile negata.

- [ ] **Step 1: Testele RLS, care pică** (`taskuri.test.ts`):

```ts
it("constructorul din afara proiectului nu vede și nu adaugă task-uri", async () => {
  // select → []; insert → error (RLS)
});
it("constructorul de pe proiect adaugă un task și și-l bifează: gata_la se pune singur, la debifare se golește", async () => {});
it("task-ul nu se poate da unui om din afara proiectului", async () => {
  // insert cu om_id = caller → error.message === "Task-ul se dă doar cuiva din proiect."
});
it("scos de pe proiect: task-urile lui negata rămân fără om, cele gata îl păstrează", async () => {});
it("muta_taskuri: constructorul nu are voie; Adminul mută task-urile negata și îl pune pe omul nou pe proiect", async () => {
  // rpc ca constructor → error.message conține "Doar Adminul"; ca admin → întoarce 2; cel gata rămâne la omul vechi;
  // proiect_oameni are rândul (proiect, c2) cu procent null
});
```

- [ ] **Step 2: Testele e2e, care pică** (`taskuri.spec.ts`):
  1. Adminul, pe fișa unui client cu „Radu Stan” pe proiect: „+ Task” cu titlul „Pagina de meniu: pozele de la client”, Cine „Radu Stan”, termenul de ieri → rândul conține „întârziat”; `getByTestId("urmeaza")` conține titlul, „întârziat o zi” și „0 din 1 task-uri gata”.
  2. `intraCa("constructor")`, `/taskuri`: sub „Întârziate” apare task-ul, cu numele clientului; îl bifează → dispare; pe fișă, „Urmează” arată „Toate task-urile sunt gata.” și „1 din 1 task-uri gata”.
  3. Titlu gol → „Scrie ce e de făcut.”; nu se adaugă nimic.
  4. Callerul n-are „Task-urile mele” în meniu, iar `/taskuri` îl duce la `/lead-uri`.
- [ ] **Step 3:** `npm run test:rls -- taskuri` și `npx playwright test taskuri` → pică.
- [ ] **Step 4:** scrie migrația `muta_taskuri` (aplic-o, `npm run tipuri`), acțiunile, componenta, pagina, meniul, legătura din Echipa.
- [ ] **Step 5:** rulează din nou cele două suite plus `npx playwright test echipa clienti` → trec. `npm run tsc`, `npm run lint`.
- [ ] **Step 6:** commit: `crm: task-urile din fișă și pagina „Task-urile mele”`.

### Task 5: Notițele și „Livrat”

**Files:**
- Create: `crm/supabase/migrations/20261111000003_notite_livrari.sql`, `crm/app/(app)/clienti/[id]/actiuni-fisa.ts`, `crm/components/fisa/Notite.tsx`, `crm/components/fisa/Livrari.tsx`, `crm/tests/rls/fisa.test.ts`, `crm/tests/e2e/fisa-client.spec.ts`
- Modify: `crm/lib/tipuri.ts`, `crm/app/(app)/clienti/[id]/page.tsx`

**Interfaces:**
- Produces:
  - SQL:
    ```sql
    create type public.stare_livrare as enum ('trimis', 'aprobat', 'de_refacut');
    create table public.notite_proiect (
      id uuid primary key default gen_random_uuid(),
      proiect_id uuid not null references public.proiecte (id) on delete cascade,
      autor_id uuid default auth.uid() references public.profiluri (id) on delete set null,
      text text not null check (length(text) between 1 and 5000),
      la timestamptz not null default now()
    );
    create table public.livrari (
      id uuid primary key default gen_random_uuid(),
      proiect_id uuid not null references public.proiecte (id) on delete cascade,
      titlu text not null check (length(titlu) between 1 and 200),
      link text check (link ~ '^https?://'),
      nota text check (length(nota) <= 1000),
      stare public.stare_livrare not null default 'trimis',
      adaugat_de uuid default auth.uid() references public.profiluri (id) on delete set null,
      adaugat_la timestamptz not null default now()
    );
    ```
    Notițe: citire și adăugare cu `lucreaza_la(proiect_id)` (la adăugare și `autor_id = auth.uid()`); ștergere doar Admin; fără schimbare. Livrări: toate operațiile cu `lucreaza_la(proiect_id)`. Parcurs: livrare nouă → `livrat` `{titlu}`; stare schimbată → `livrare_stare` `{titlu, in}`.
  - `lib/tipuri.ts`: `STARI_LIVRARE`, `type StareLivrare`, `ETICHETE.livrare` = Trimis / Aprobat / De refăcut.
  - `actiuni-fisa.ts`: `adaugaNotitaProiect(proiectId: string, text: string)`, `stergeNotitaProiect(id: string)`, `adaugaLivrare(proiectId: string, d: { titlu: string; link: string; nota: string })`, `schimbaStareLivrare(id: string, stare: StareLivrare)`, `stergeLivrare(id: string)`, toate `Promise<Rezultat>`.

**Ce se vede:** tab-ul **Livrat** (rând: titlul ca link dacă are link, nota dedesubt cu gri, data, pastila stării: Trimis auriu, Aprobat verde, De refăcut roșu; starea se schimbă dintr-un `select` pe rând; formular „+ Trimis clientului”: Ce i-ai trimis, Link (opțional), Notă (opțional)). Tab-ul **Notițe** (formular cu un câmp de text și „Adaugă notița”; notițele ca la fișa de lead: autor · când, textul cu rândurile păstrate; „Șterge” doar la Admin).

- [ ] **Step 1: Testele RLS, care pică** (`fisa.test.ts`): constructorul din afara proiectului nu vede și nu adaugă notițe sau livrări; cel de pe proiect adaugă o notiță, dar n-o poate șterge (0 rânduri șterse) și nu poate scrie una în numele altcuiva (`autor_id` străin → eroare); livrarea nouă pune în parcurs `livrat`, iar `update { stare: "aprobat" }` pune `livrare_stare` cu `{ in: "aprobat" }`; `link: "javascript:alert(1)"` → eroare (constrângerea).
- [ ] **Step 2: Testele e2e, care pică** (`fisa-client.spec.ts`): constructorul de pe proiect scrie notița „Vrea meniul pe categorii.” → apare cu numele lui; adaugă livrarea „Schița paginii principale (v2)” cu link → pastila „Trimis”; o trece pe „Aprobat” → pastila „Aprobat”, iar tab-ul Parcurs conține „Trimis clientului: Schița paginii principale (v2)” și „Schița paginii principale (v2): Aprobat”. Link `ftp://x` → „Linkul trebuie să înceapă cu https://”.
- [ ] **Step 3:** rulează ambele → pică. **Step 4:** migrația (aplicată, tipuri), acțiunile, componentele, tab-urile la locul lor. **Step 5:** rulează din nou → trec; `npm run tsc`, `npm run lint`.
- [ ] **Step 6:** commit: `crm: notițele proiectului și ce s-a livrat`.

### Task 6: Conturile și materialele (link-uri)

**Files:**
- Create: `crm/supabase/migrations/20261111000004_conturi_materiale.sql`, `crm/components/fisa/Conturi.tsx`, `crm/components/fisa/Materiale.tsx`
- Modify: `crm/lib/tipuri.ts`, `crm/app/(app)/clienti/[id]/actiuni-fisa.ts`, `crm/app/(app)/clienti/[id]/page.tsx`, `crm/tests/rls/fisa.test.ts`, `crm/tests/e2e/fisa-client.spec.ts`

**Interfaces:**
- Produces:
  - SQL:
    ```sql
    create type public.al_cui as enum ('client', 'firma');
    create type public.unde_parola as enum ('la_client', 'la_firma', 'manager_parole', 'nu_e_cazul');
    create table public.conturi (
      id uuid primary key default gen_random_uuid(),
      proiect_id uuid not null references public.proiecte (id) on delete cascade,
      serviciu text not null check (length(serviciu) between 1 and 120),
      cont text not null check (length(cont) between 1 and 200),
      al_cui public.al_cui not null,
      unde_parola public.unde_parola not null default 'nu_e_cazul',
      adaugat_de uuid default auth.uid() references public.profiluri (id) on delete set null,
      adaugat_la timestamptz not null default now()
    );
    create table public.materiale (
      id uuid primary key default gen_random_uuid(),
      proiect_id uuid not null references public.proiecte (id) on delete cascade,
      titlu text not null check (length(titlu) between 1 and 200),
      nota text check (length(nota) <= 500),
      url text check (url ~ '^https?://'),
      cale text unique,          -- calea din Storage (Task 7)
      marime int,
      adaugat_de uuid default auth.uid() references public.profiluri (id) on delete set null,
      adaugat_la timestamptz not null default now(),
      check ((url is null) <> (cale is null))
    );
    ```
    Ambele: citire, adăugare și ștergere cu `lucreaza_la(proiect_id)`; fără schimbare (greșeala se șterge și se scrie din nou).
  - `lib/tipuri.ts`: `ETICHETE.alCui` = `client`: „al clientului”, `firma`: „buildwithac”; `ETICHETE.undeParola` = „la client”, „la buildwithac”, „manager de parole”, „—”.
  - `actiuni-fisa.ts`: `adaugaCont(proiectId: string, d: { serviciu: string; cont: string; alCui: string; undeParola: string })`, `stergeCont(id: string)`, `adaugaLink(proiectId: string, d: { titlu: string; url: string; nota: string })`, `stergeMaterial(id: string)`.

**Ce se vede:** tab-ul **Conturi**: tabelul Serviciu · Cont (mono) · Al cui (pastilă verde „al clientului” / aurie „buildwithac”) · Parola; formularul are două câmpuri de text (Serviciu, Cont) și două liste de ales. Sub tabel, mereu vizibil, avertismentul din prototip, cuvânt cu cuvânt: „**Parolele** nu stau în CRM. Aici scrii doar ce cont e, al cui e și unde e parola.” Câmpul „Cont” are textul ajutător „numele contului sau adresa, nu parola”. Tab-ul **Materiale**: rând cu eticheta `URL`, titlul (nota dedesubt), „Nume · 29 oct.”, „deschide” (link în filă nouă, `rel="noreferrer"`), „Șterge”; formular „+ Link”: Titlu, Link, Notă (opțional).

- [ ] **Step 1: Testele, care pică.** RLS (în `fisa.test.ts`): constructorul din afară nu vede conturile și materialele; cel de pe proiect adaugă și șterge; un material fără `url` și fără `cale` → eroare; cu amândouă → eroare; `unde_parola: "parola123"` → eroare (nu e în listă). e2e (în `fisa-client.spec.ts`): Adminul adaugă contul „Domeniu (ROTLD)” / „cafeneauacolt.ro” / „al clientului” / „la client” → rândul apare, iar textul „Parolele nu stau în CRM.” e vizibil; adaugă link-ul „Logo și culori” → „deschide” are `href`-ul scris; îl șterge → dispare.
- [ ] **Step 2:** rulează → pică. **Step 3:** migrația, acțiunile, componentele, tab-urile. **Step 4:** rulează → trec; `npm run tsc`, `npm run lint`.
- [ ] **Step 5:** commit: `crm: conturile și materialele (link-uri)`.

### Task 7: Materialele: fișiere încărcate

**Files:**
- Create: `crm/supabase/migrations/20261111000005_fisiere.sql`, `crm/lib/fisiere.ts`, `crm/lib/supabase/browser.ts`, `crm/app/(app)/materiale/[id]/route.ts`, `crm/tests/unit/fisiere.test.ts`, `crm/tests/rls/fisiere.test.ts`, `crm/tests/e2e/materiale.spec.ts`
- Modify: `crm/app/(app)/clienti/[id]/actiuni-fisa.ts`, `crm/components/fisa/Materiale.tsx`, `crm/next.config.ts` (doar dacă are o politică `connect-src`: adaugă adresa Supabase)

**Interfaces:**
- Consumes: `materiale` (Task 6), `lucreaza_la`.
- Produces:
  - SQL: bucketul privat `materiale` (`public = false`, `file_size_limit = 26214400`); politici pe `storage.objects` pentru `authenticated` (citire, adăugare, ștergere): `bucket_id = 'materiale' and public.lucreaza_la(((storage.foldername(name))[1])::uuid)`.
  - `lib/fisiere.ts`: `MARIME_MAXIMA = 25 * 1024 * 1024`; `numeCurat(nume: string): string`; `marimeCitibila(n: number): string`.
  - `lib/supabase/browser.ts`: `supabaseBrowser()` (`createClient` cu cheia publică, fără sesiune păstrată); folosit doar la `uploadToSignedUrl`.
  - `actiuni-fisa.ts`: `pregatesteIncarcare(proiectId: string, nume: string, marime: number): Promise<{ ok: true; cale: string; token: string } | { ok: false; mesaj: string }>`; `confirmaFisier(proiectId: string, d: { titlu: string; cale: string; marime: number; nota: string }): Promise<Rezultat>`; `stergeMaterial` șterge acum și fișierul.
  - `GET /materiale/<id>`: citește materialul cu sesiunea omului (fără rând → 404), face un link semnat de 60 s cu `download: <numele fișierului>` și redirecționează (307).

**Cum merge încărcarea:** omul alege fișierul → `pregatesteIncarcare` verifică mărimea și face calea `<proiectId>/<uuid>/<numeCurat>` și link-ul semnat de urcare (cu sesiunea omului, deci regula din Storage se aplică) → browserul urcă direct în Supabase (`uploadToSignedUrl`), nu prin Vercel (care oprește la 4,5 MB) → `confirmaFisier` verifică două lucruri: calea începe cu `<proiectId>/` și fișierul chiar există în bucket; apoi scrie rândul. Dacă rândul nu se poate scrie, fișierul se șterge. Titlul gol = numele fișierului. Rândul arată eticheta cu extensia (`PDF`, `ZIP`, `IMG` pentru jpg/png/webp, altfel `FIȘ`), mărimea („1,2 MB”) și „deschide” → `/materiale/<id>`.

**Mesaje:** peste 25 MB → „Fișierul are peste 25 MB. Pune-l pe Drive și adaugă link-ul.”; urcarea întreruptă → „Fișierul n-a ajuns. Încearcă din nou.”; cât urcă, butonul e oprit și scrie „Se încarcă…”.

- [ ] **Step 1: Testele unitare, care pică** (`fisiere.test.ts`):

```ts
expect(numeCurat("Poze meniu (24).zip")).toBe("Poze-meniu-24.zip");
expect(numeCurat("../../etc/passwd")).toBe("etc-passwd");
expect(numeCurat("Șablon ofertă.PDF")).toBe("Sablon-oferta.pdf");
expect(numeCurat("")).toBe("fisier");
expect(numeCurat("...")).toBe("fisier");
expect(numeCurat("a".repeat(300) + ".png")).toHaveLength(80);          // păstrează „.png” la sfârșit
expect(numeCurat("a".repeat(300) + ".png").endsWith(".png")).toBe(true);
expect(marimeCitibila(900)).toBe("900 B");
expect(marimeCitibila(1_258_291)).toBe("1,2 MB");
```

- [ ] **Step 2: Testele RLS, care pică** (`fisiere.test.ts`): constructorul de pe proiect urcă un `Buffer` mic în `<proiectId>/<uuid>/test.txt` → fără eroare și îl poate descărca; constructorul din afara proiectului: `download` pe aceeași cale → eroare, `createSignedUploadUrl` în dosarul proiectului → eroare, `list(<proiectId>)` → `[]`; callerul, la fel. Curățenie: fișierele de test se șterg cu cheia de serviciu.
- [ ] **Step 3: Testul e2e, care pică** (`materiale.spec.ts`): Adminul alege cu `setInputFiles` un fișier text de câțiva octeți, numit `Textele paginilor.txt` → apare rândul „Textele paginilor.txt” cu mărimea; click pe „deschide” pornește o descărcare (`page.waitForEvent("download")`) cu numele `Textele-paginilor.txt`; „Șterge” → rândul dispare, iar `db().storage.from("materiale").list(<proiectId>)` nu mai are nimic. Al doilea test: `pregatesteIncarcare` chemată prin interfață cu un fișier declarat de 26 MB (fișier rar, generat în test) → mesajul cu „peste 25 MB” și niciun rând nou.
- [ ] **Step 4:** rulează cele trei suite → pică. **Step 5:** scrie migrația (aplică, tipuri) și codul. Dacă `createSignedUploadUrl` cu sesiunea omului nu trece prin regulile din Storage pe proiectul nostru, oprește-te și notează în jurnal: varianta de rezervă e ca acțiunea să verifice `lucreaza_la` printr-un `select` pe `proiecte` și să facă link-ul cu cheia de serviciu.
- [ ] **Step 6:** rulează din nou → trec; `npm run tsc`, `npm run lint`.
- [ ] **Step 7:** commit: `crm: fișiere încărcate la materiale`.

### Task 8: Mai multe proiecte, cererea nouă a unui client, închiderea și ștergerea

**Files:**
- Create: `crm/components/fisa/ProiectNou.tsx`, `InchideProiect.tsx`, `StergeClient.tsx`, `crm/tests/rls/stergere-client.test.ts`
- Modify: `crm/app/(app)/clienti/[id]/actiuni.ts`, `crm/app/(app)/clienti/[id]/page.tsx`, `crm/lib/retentie.ts`, `crm/lib/notificare.ts`, `crm/app/api/intrare/site/route.ts`, `crm/tests/unit/retentie.test.ts`, `crm/tests/unit/notificare.test.ts`, `crm/tests/rls/retentie.test.ts`, `crm/tests/e2e/clienti.spec.ts`

**Interfaces:**
- Produces:
  - `actiuni.ts`: `adaugaProiect(clientId: string, d: { titlu: string; serviciu: Serviciu }): Promise<{ ok: true; id: string } | { ok: false; mesaj: string }>`; `inchideProiect(proiectId: string, inchis: boolean): Promise<Rezultat>`; `stergeClient(clientId: string): Promise<Rezultat>`.
  - `lib/retentie.ts`: `ZILE_DUPA_COLABORARE = 365`; `clientiDeSters(proiecte: { client_id: string; inchis_la: string | null }[], acum: Date): string[]`; `TABELE` primește `proiecte`, `proiect_oameni`, `taskuri`, `evenimente_proiect`, `notite_proiect`, `livrari`, `conturi`, `materiale`; `construiesteCopia` primește un al cincilea parametru, `deSters: { id: string; nume: string }[] = []`.
  - `lib/notificare.ts`: `LeadNotificare` primește `clientId?: string`; când e pus, link-ul din e-mail duce la `/clienti/<clientId>`.

**Ce se vede și ce se întâmplă:**
- **„+ Proiect nou”** (doar Admin, lângă pastilele proiectelor): Titlu și Serviciu → proiect nou în „Discuție”; fișa se deschide pe el.
- **Clientul existent trimite iar formularul de pe site:** e-mailul „Client existent: cerere nouă” duce acum la fișa clientului (ruta `api/intrare/site` caută clientul după `lead_id` când decizia e `leaga_de_client`). În fișă, la Admin, deasupra grilei apare o bandă aurie cât timp cea mai nouă cerere e mai nouă decât cel mai nou proiect: „Cerere nouă · ieri, 21:14. Răspunsurile sunt în fișa de lead.”, cu link-ul „Fișa de lead →” și butonul „+ Proiect nou”. Cererea apare și în Parcurs („A trimis o cerere nouă · Formular site”, din evenimentele lead-ului).
- **„Închide proiectul” / „Redeschide proiectul”** (doar Admin, în panoul Proiectul): pune sau scoate `inchis_la`. Proiectul închis are pastila „Închis”, iar constructorul nu-i mai poate schimba stadiul (trigger-ul din Task 1).
- **„Șterge clientul”** (doar Admin, jos în coloana din stânga, cu confirmare ca la `StergeLead`; textul: „Ștergi definitiv clientul, cu proiectele, task-urile, notițele și fișierele lui. Nu se poate anula.”). Ordinea în acțiune: 1) fișierele din Storage ale tuturor proiectelor (listează dosarul fiecărui proiect, pe două niveluri, și șterge tot, inclusiv fișierele urcate și neconfirmate); 2) lead-ul din care a venit (altfel rămâne pe veci în starea „client”); 3) clientul (restul pleacă prin cascade). Dacă pasul 1 dă eroare, nu se șterge nimic și omul vede „Fișierele n-au putut fi șterse. Încearcă din nou.” După ștergere: `/clienti`.
- **E-mailul de luni** primește un paragraf, doar când e cazul: „Clienți cu colaborarea încheiată de peste un an (N). Șterge-i din fișa lor, cum promite pagina de confidențialitate:”, cu numele și link-ul fișei fiecăruia. `citesteTot` ordonează acum după o cheie dată pe tabel (`proiect_oameni` n-are coloana `id`: se ordonează după `proiect_id`, apoi `om_id`).

- [ ] **Step 1: Testele unitare, care pică.**

```ts
// retentie.test.ts
const acum = new Date("2027-12-01T04:00:00Z");
const zile = (n: number) => new Date(acum.getTime() - n * 86_400_000).toISOString();
expect(clientiDeSters([{ client_id: "a", inchis_la: zile(366) }], acum)).toEqual(["a"]);
expect(clientiDeSters([{ client_id: "a", inchis_la: zile(364) }], acum)).toEqual([]);
// un proiect deschis ține clientul, oricât de vechi e celălalt
expect(clientiDeSters([{ client_id: "a", inchis_la: zile(900) }, { client_id: "a", inchis_la: null }], acum)).toEqual([]);
// se numără de la ultimul proiect închis
expect(clientiDeSters([{ client_id: "a", inchis_la: zile(900) }, { client_id: "a", inchis_la: zile(10) }], acum)).toEqual([]);
// construiesteCopia cu deSters = [{ id: "c1", nume: "Cafeneaua Colț" }] → textul conține „Clienți cu colaborarea încheiată de peste un an (1)” și `${CRM.url}/clienti/c1`; fără deSters, paragraful lipsește
// notificare.test.ts: construiesteNotificare({ …, clientId: "c1" }, "leaga_de_client").text conține `${CRM.url}/clienti/c1` și nu conține „/lead-uri/”
```

- [ ] **Step 2: Testele RLS, care pică.** `stergere-client.test.ts` testează regulile din bază, nu acțiunea (acțiunile au nevoie de cookie-uri; pe ea o acoperă testul e2e 3): constructorul și callerul nu pot șterge un client (`delete` → 0 rânduri); după ce Adminul (conectat) șterge lead-ul și clientul, nu mai există proiecte, task-uri, materiale, conturi, livrări, notițe, evenimente pentru el (numără fiecare tabel după `proiect_id`). În `retentie.test.ts`: `copieSaptamanala` trimite un JSON care are toate cele 16 tabele (testul existent verifică atașamentul: lărgește lista).
- [ ] **Step 3: Testele e2e, care pică** (în `clienti.spec.ts`):
  1. Adminul adaugă proiectul „Automatizare rezervări” (Automatizări) → două pastile la „Proiecte”, fișa e pe cel nou, în „Discuție”; `/clienti` are două rânduri pentru același client.
  2. „Închide proiectul” → pastila „Închis”; constructorul de pe proiect nu mai are `select`-ul de stadiu.
  3. Client cu un fișier urcat: „Șterge clientul”, confirmă → `/clienti` nu-l mai are; în bază nu mai există nici lead-ul, nici fișierul (`list` pe dosarul proiectului → gol).
  4. Banda de cerere nouă: test cu date puse de cheia de serviciu (o cerere cu `primita_la` = acum pe lead-ul clientului) → banda e vizibilă cu „Cerere nouă”; după „+ Proiect nou”, dispare.
- [ ] **Step 4:** rulează suitele → pică. **Step 5:** scrie codul. **Step 6:** rulează din nou toate suitele CRM-ului (`npx vitest run`, `npm run test:rls`, `npx playwright test`; anunță: suita e2e întreagă durează câteva minute) → trec; `npm run tsc`, `npm run lint`.
- [ ] **Step 7:** commit: `crm: mai multe proiecte, închiderea, ștergerea clientului, e-mailul de luni`.

### Task 9 (opțional): starea „Nu mai sunați”

**Se construiește doar dacă Andrei zice „da”.** Dacă zice „nu” sau „mai târziu”, sari la Task 10 și notează în `docs/progres-brainstorming.md`.

**Ce face:** un om care spune „nu mă mai sunați” ajunge pe o listă de numere. Lista ține și după ce lead-ul se șterge la 90 de zile (ăsta e rostul ei), deci numărul de telefon se păstrează mai mult decât restul datelor. De aceea, **înainte de cod**, textul paginii de confidențialitate se scrie cu Andrei (un paragraf: păstrez doar numărul, doar ca să nu te mai sun) și se verifică prin skill-ul `legal-advisor-ro`.

**Files:**
- Create: `crm/supabase/migrations/20261111000006_nu_mai_sunati.sql`, `crm/tests/rls/nu-mai-sunati.test.ts`
- Modify: `crm/lib/stari.ts`, `crm/components/ButoaneActiuni.tsx`, `crm/app/(app)/lead-uri/[id]/actiuni.ts`, `crm/app/(app)/lead-uri/nou/actiuni.ts`, `crm/lib/retentie.ts` (`TABELE`), `crm/tests/unit/stari.test.ts`, `crm/tests/e2e/fisa.spec.ts`, `crm/tests/e2e/manual-clienti.spec.ts`, `site/app/confidentialitate/page.tsx`, `site/tests/e2e/pagini.spec.ts`

**Interfaces:**
- Produces: tabelul `public.nu_mai_sunati (telefon_norm text primary key, adaugat_de uuid references profiluri on delete set null, adaugat_la timestamptz not null default now())`, citit de Admin/Caller/Closer, scris doar de funcția `public.nu_mai_sunati(p_lead uuid) returns void` (`security definer`; are voie cine poate descalifica lead-ul: Adminul sau omul al cărui e lead-ul; pune numărul pe listă și mută lead-ul în `descalificat` cu motivul „Nu mai sunați”, într-o singură tranzacție); Adminul poate scoate un număr (`delete`). `Actiune` primește `"nu_mai_sunati"`, permisă exact unde e permis `"descalificat"`.
- În fișa de lead: butonul „Nu mai sunați”, cu confirmarea „Numărul intră pe lista «Nu mai sunați» și nu mai poate fi adăugat de mână.”
- `adaugaLead` (de mână): un număr de pe listă e refuzat cu „Numărul e pe lista «Nu mai sunați».”
- Formularul de pe site **nu** verifică lista: dacă omul scrie el, e cererea lui. Lead-ul se redeschide ca de obicei, iar numărul iese de pe listă (în `primesteCerere`, cu cheia de serviciu).

- [ ] **Step 1:** textul de confidențialitate, cu Andrei și `legal-advisor-ro`. **Step 2:** testele, care pică: RLS (callerul pe lead-ul altuia → eroare; pe al lui → lead `descalificat`, motiv „Nu mai sunați”, numărul pe listă; callerul nu poate șterge de pe listă; lead-ul șters, numărul rămâne), unit (`actiuniPermise`), e2e (butonul din fișă; lead de mână cu același număr → mesajul de refuz), intrare (cererea de pe site scoate numărul de pe listă). **Step 3:** rulează → pică. **Step 4:** cod. **Step 5:** rulează → trec. **Step 6:** commit: `crm: starea „Nu mai sunați”`.

### Task 10: Datele de test, verificarea, previzualizarea, unirea

**Files:**
- Modify: `crm/scripts/seed.mts`, `site/app/confidentialitate/page.tsx` (doar dacă hotărâm cu Andrei o frază nouă), `docs/progres-brainstorming.md`, memoria

- [ ] **Step 1: Seed-ul** (rulat de mai multe ori nu dublează nimic; doar pe test). Clientul „Laura Ene · Atelier Ceramică” primește fișa din prototip: proiectul „Site de la zero”, stadiul Construcție, preț 2.400, încasat 1.200, predarea peste 18 zile, Radu Stan pe proiect cu 30%; 6 task-uri (3 gata, unul cu termenul trecut, două viitoare, dintre care unul al lui Radu); 3 materiale (link-uri); 4 conturi (cele din prototip, cu domeniul `atelierceramica.ro`); 2 livrări (una Aprobat, una Trimis); 2 notițe. Un al doilea client, „Mihai Radu · Pizzeria Forno” (lead nou, numărul 15, trecut prin `update` în „client”), cu două proiecte: „Site” în Mentenanță (toate task-urile gata) și „Automatizare comenzi” în Discuție. Curățenia de la sfârșit primește și prefixele clienților făcuți de testele noi. `npm run seed` → mesajul „Gata: …” și fișele se văd în browser.
- [ ] **Step 2: Verificarea completă** (anunță: câteva minute). Din `crm/`: `npx vitest run`, `npm run test:rls`, `npm run tsc`, `npm run lint`, `npx playwright test`. Din `site/`: `npx vitest run`, `npm run verifica`, `npm run lint`. Toate trec. Deschide fișa la 390px: se citește, fără scroll orizontal pe pagină.
- [ ] **Step 3: Verificarea finală a ramurii** cu un subagent pe modelul cel mai capabil (anunță consumul): diferența față de `main`, cu Review Focus și §4 din spec în față. Problemele critice și importante se repară; cele mici se notează în jurnal.
- [ ] **Step 4: Previzualizarea.** `git push -u origin crm-etapa-2`; adresa previzualizării CRM-ului se ia din `npx vercel ls` (din `crm/`). Andrei verifică pe laptop, pe baza de **test**: ca `admin@test.buildwithac.ro` (fișa Laurei, un task nou, un fișier urcat, un proiect nou) și ca `constructor@test.buildwithac.ro` (vede doar clienții lui, comisionul lui, „Task-urile mele”), amândouă cu parola de test. Spune-i de fiecare dată adresa exactă a contului.
- [ ] **Step 5: Confidențialitatea.** Citește cu Andrei paragraful despre CRM de pe `/confidentialitate`: clienții („cât durează colaborarea plus un an”) sunt deja acolo. De hotărât cu el dacă se adaugă o frază despre materialele clientului (fișiere și link-uri ținute în Supabase, șterse odată cu clientul). Dacă da, se scrie cu el și se adaugă un test în `site/tests/e2e/pagini.spec.ts`.
- [ ] **Step 6: Producția, doar la „da”-ul lui Andrei.** Întâi migrațiile: `SB_MEDIU=productie npm run sb -- db push --remote=znabkoesmtoggdmehmqp` (fără seed; sunt doar adăugiri, deci codul vechi merge mai departe). Apoi unirea `crm-etapa-2` → `main` (fast-forward), `git push`, verifică în `npx vercel ls` că au pornit ambele publicări de Production, apoi `curl -I https://crm.buildwithac.ro/intra` → 200. Andrei intră cu `admin@buildwithac.ro` pe `crm.buildwithac.ro` și deschide „Clienți”.
- [ ] **Step 7: Stadiul.** Actualizează „DE AICI CONTINUĂM” din `docs/progres-brainstorming.md` și memoria (`crm-buildwithac.md`): ce e live, ce a rămas (tokenul de producție din `crm/.env.productie.local`: se expiră dacă etapa 3 nu vine curând), ce urmează (etapa 3 sau lansarea site-ului, la alegerea lui Andrei). Commit: `docs: CRM-ul, etapa 2, e live`.

---

## Ce rămâne pe dinafară (pentru etapa 3 sau mai târziu)

- Încasările pe rânduri (avans, rest, rate), comisioanele callerilor și closerilor, procentele implicite pe serviciu și rol.
- Dashboard, KPI, calendarul extern, lead-urile din reclame intrate singure.
- Client adăugat direct, fără lead (acum: îl adaugi ca lead de mână și îl marchezi „Client”).
- Legătura automată cu Tally pentru răspunsurile clienților.
- Minor-urile din verificarea etapei 1 care nu țin de clienți (jurnalul `.superpowers/sdd/2026-11-09-plan-6-crm-etapa-1/progress.md`, liniile „Final: minor”). Etapa 2 închide două: profilurile văzute de constructor (Task 1) și mesajele brute Postgres, pentru acțiunile noi (Task 2).
- Tema finală („mai iPhone”), cu variante în browser.
