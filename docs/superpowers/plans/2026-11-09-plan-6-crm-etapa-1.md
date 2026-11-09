# CRM-ul buildwithac, etapa 1 (lead-urile): planul de implementare

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** o aplicație separată, `crm.buildwithac.ro`, în care intră singure lead-urile din formularul de pe site și din cele 3 formulare Tally, plus cele adăugate de mână. Andrei și echipa (Admin / Caller / Closer / Constructor) le sună, le programează și le transformă în clienți, iar permisiunile sunt verificate în baza de date.

**Architecture:** aplicație Next.js 16 nouă în `crm/`, lângă `site/`, cu proiect Vercel separat. Datele, conturile și permisiunile stau în Supabase (Postgres + Auth). Regulile de acces stau în Row Level Security plus un trigger care oprește schimbările nepermise și scrie singur Parcursul. Logica fără bază de date (telefoane, stări, sloturi, filtre, Tally) stă în funcții pure din `crm/lib/`, testate cu vitest. Paginile citesc cu sesiunea omului (RLS se aplică). Doar rutele de intrare și jobul zilnic folosesc cheia de serviciu. Site-ul trimite lead-ul la CRM cu un secret, în paralel cu e-mailul de acum.

**Tech Stack:** Next.js 16.4 (App Router, `proxy.ts`), TypeScript, Tailwind 4, `@supabase/supabase-js` + `@supabase/ssr`, Supabase CLI (migrații), zod, Resend (REST, cu `fetch`, plus SMTP pentru e-mailurile de autentificare), vitest, Playwright, Vercel Cron.

**Spec:** `docs/superpowers/specs/2026-11-09-crm-design.md`

## Global Constraints

- **Înainte de orice cod Next.js: citește `site/AGENTS.md`** și ghidurile din `crm/node_modules/next/dist/docs/` (în Next 16, `middleware.ts` se numește `proxy.ts`, iar `cookies()` e `async`). Fără `cacheComponents` în CRM: toate paginile sunt dinamice.
- Comenzile CRM-ului se rulează din `crm/`, cele ale site-ului din `site/`. Serverul de dev al CRM-ului merge pe portul **3100** (site-ul are 3000/3001).
- Texte în română, ș/ț cu virgulă (niciodată ş/ţ), tonul din `CLAUDE.md`. Persoana I singular în ce ajunge la clienți.
- Domeniul, adresele de e-mail, id-urile formularelor Tally și adresa site-ului stau **doar** în `crm/lib/config.ts`.
- Fără GSAP, Lenis, colaj sau fotografii. Culorile și fonturile stau în variabile CSS (`crm/app/tema.css`), luate din `prototip/crm-clienti.html`, ca tema să se schimbe dintr-un singur loc.
- Fonturile (Chakra Petch, Inter, JetBrains Mono) sunt fișiere `.woff2` locale cu `@font-face`, ca la site (`site/app/fonturi.css`), fără `next/font/google`.
- Gândit pentru ~1440px. La 390px doar se deschide și se citește (fără scroll orizontal pe pagină; tabelele pot avea scroll propriu).
- Fără înscriere liberă. Fără parole de clienți în baza de date. Fără mesaje automate trimise lead-urilor.
- Cheile (Supabase service role, Resend, `CRM_SECRET_INTRARE`, secretul Tally, `CRON_SECRET`) stau doar în Vercel și în `.env.local`. Nu le ceri lui Andrei în capturi.
- **Două proiecte Supabase**, în același cont nou al firmei, regiunea Frankfurt (`eu-central-1`): `buildwithac-crm-test` (dev, teste, date de test, capturi) și `buildwithac-crm` (producție, doar date reale). Așa, datele de test nu se amestecă niciodată cu cele reale.
- Ora afișată și calculată e mereu `Europe/Bucharest`. În baza de date: `timestamptz`.
- Ramura: `crm`. În `main` ajunge doar etapa terminată și verificată de Andrei. Commit-urile sunt în română și se termină cu `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Pașii din conturi (Supabase, Vercel, Resend, Tally, Cloudflare) i se dau lui Andrei **unul câte unul**, cu numele exacte ale butoanelor. Pașii grei (build-uri, subagenți) se anunță înainte.
- Înainte de orice unire în `main`: din `site/`, `npx vitest run`, `npm run verifica`, `npm run lint`. Din `crm/`: `npx vitest run`, `npm run test:rls`, `npx tsc --noEmit -p .`, `npm run lint`, `npx playwright test`.

## Review Focus

1. **Același om trimite de două ori** (dublu-click, Tally care reîncearcă webhook-ul, formular pe site și apoi în Tally, telefon scris `0721 123 456` și apoi `+40721123456`): rămâne un singur lead, cu două cereri în Parcurs, iar reîncercarea Tally cu același `responseId` nu adaugă nimic (vitest Task 2 pentru telefoane; test RLS/integrare Task 5).
2. **Doi calleri apasă „Îmi iau lead-ul” în aceeași secundă:** doar unul îl primește, celălalt vede „L-a luat deja X” (test RLS Task 3: al doilea `update` nu schimbă nimic).
3. **Doi calleri programează aceeași oră la același closer:** a doua programare e respinsă de baza de date, iar callerul vede orele libere reîmprospătate (test RLS Task 9, constrângerea de excludere).
4. **Schimbarea orei (25 oct. 2026, 28 mar. 2027):** sloturile și callback-urile „mâine la 10:00” cad la ora corectă din România (vitest Task 2 și Task 9).
5. **CRM-ul cade sau răspunde greu** cât omul trimite formularul de pe site: omul vede „Am primit” în cel mult ~8 s, iar e-mailul spune clar că lead-ul n-a intrat în CRM (vitest Task 6).

---

## Harta fișierelor

```
crm/
  app/
    layout.tsx, tema.css, fonturi.css      tema din prototip, fonturile locale
    (cont)/intra/page.tsx                   conectarea
    (cont)/parola/page.tsx                  parola nouă (după invitație sau „Am uitat parola”)
    auth/confirm/route.ts                   verifică linkul din e-mail (token_hash)
    (app)/layout.tsx                        bara laterală, omul conectat
    (app)/lead-uri/page.tsx                 lista
    (app)/lead-uri/nou/page.tsx             lead adăugat de mână
    (app)/lead-uri/[id]/page.tsx            fișa
    (app)/lead-uri/[id]/actiuni.ts          server actions pe fișă
    (app)/clienti/page.tsx                  lista simplă a clienților
    (app)/program/page.tsx                  programul săptămânal al closerului
    (app)/echipa/page.tsx, actiuni.ts       doar Admin: invitații, roluri, dezactivare, mutare
    api/intrare/site/route.ts               lead din formularul site-ului
    api/intrare/tally/route.ts              webhook Tally
    api/cron/zilnic/route.ts                retenția de 90 de zile, „ping”, copia de luni
  components/                               ButoaneActiuni, Parcurs, CalendarSloturi, FiltreLeaduri…
  lib/
    config.ts                               domeniu, e-mailuri, formularele Tally
    tipuri.ts                               Rol, Stare, Sursa, Serviciu (aceleași valori ca enum-urile SQL)
    telefon.ts                              normalizare, WhatsApp
    stari.ts                                ce buton duce în ce stare, cine are voie
    timp.ts                                 ora României, scurtăturile de callback
    sloturi.ts                              orele libere ale unui closer
    filtre.ts                               parametrii din URL → filtrul listei
    tally.ts                                semnătura și transformarea răspunsului Tally
    intrare.ts                              primesteCerere: dedublare + scriere + notificare
    notificare.ts                           e-mailul „lead nou” prin Resend
    supabase/server.ts, admin.ts, proxy.ts  clienții Supabase
    baza.types.ts                           generat de Supabase CLI
  supabase/migrations/*.sql                 schema, RLS, trigger-e
  scripts/seed.ts                           conturile și lead-urile de test (doar pe proiectul de test)
  tests/unit/*.test.ts                      funcțiile pure
  tests/rls/*.test.ts                       permisiunile, pe proiectul de test, cu utilizatori reali
  tests/e2e/*.spec.ts                       Playwright, 1440px
  proxy.ts, vercel.json
site/lib/utm.ts, site/lib/crm.ts            parametrii din link, trimiterea la CRM
```

---

### Task 0: Ramura și documentele

- [ ] **Step 1:** din `main` la zi: `git checkout -b crm`. Rezultat: `git branch --show-current` → `crm`.
- [ ] **Step 2:** comite `docs/superpowers/specs/2026-11-09-crm-design.md`, `prototip/crm-clienti.html`, `docs/progres-brainstorming.md` și acest plan. **Nu** adăuga clipurile din `Exemple/` (sunt mari). Mesaj: `docs: designul și planul CRM-ului, etapa 1`.

### Task 1: Scheletul aplicației și tema

**Files:**
- Create: `crm/` (cu `npx create-next-app@16.4.2 crm --ts --tailwind --eslint --app --no-src-dir --import-alias "@/*"`, apoi aliniat la `site/`: aceleași versiuni de `next`, `react`, `vitest`, `@playwright/test`, `eslint-config-next`)
- Create: `crm/app/tema.css`, `crm/app/fonturi.css`, `crm/public/fonturi/*.woff2`, `crm/app/layout.tsx`, `crm/lib/config.ts`, `crm/lib/tipuri.ts`
- Create: `crm/vitest.config.ts` (copie după `site/vitest.config.ts`, mediu `node` implicit), `crm/playwright.config.ts` (un singur proiect `desktop`, 1440×900, server `npm run dev -- --port 3100`)
- Modify: `.gitignore` (adaugă `crm/test-results/`, `crm/playwright-report/`)
- Test: `crm/tests/unit/tipuri.test.ts`, `crm/tests/e2e/schelet.spec.ts`

**Interfaces:**
- Produces:
  ```ts
  // lib/tipuri.ts: valorile sunt și numele enum-urilor SQL din Task 3
  export const ROLURI = ["admin", "caller", "closer", "constructor"] as const;
  export const STARI = ["nou", "fara_raspuns", "a_raspuns", "callback", "programat", "oferta_trimisa", "client", "pierdut", "descalificat"] as const;
  export const SURSE = ["formular_site", "tally_site", "tally_automatizari", "tally_ghid", "cold_calling", "recomandare", "dm_instagram", "dm_tiktok", "altceva"] as const;
  export const SERVICII = ["site", "automatizari", "1la1", "altceva"] as const;  // aceleași chei ca SERVICII_CONTACT din site
  export type Rol = (typeof ROLURI)[number]; // la fel Stare, Sursa, Serviciu
  export const ETICHETE: { stare: Record<Stare, string>; sursa: Record<Sursa, string>; serviciu: Record<Serviciu, string>; rol: Record<Rol, string> };
  export const SURSE_MANUALE: Sursa[]; // ["cold_calling","recomandare","dm_instagram","dm_tiktok","altceva"]
  // lib/config.ts
  export const CRM: { domeniu: "crm.buildwithac.ro"; url: "https://crm.buildwithac.ro"; emailAdmin: "contact@buildwithac.ro"; emailExpeditor: "crm@buildwithac.ro"; urlSite: "https://buildwithac.ro";
    formulareTally: { Qo1xzg: { sursa: "tally_site"; serviciu: "site" }; M1X8qg: { sursa: "tally_automatizari"; serviciu: "automatizari" }; jeZGX9: { sursa: "tally_ghid"; serviciu: "1la1" } } };
  ```
- Etichetele stărilor: Nou, Fără răspuns, A răspuns, Callback, Programat, Ofertă trimisă, Client, Pierdut, Descalificat. Ale surselor: Formular site, Tally Site, Tally Automatizări, Tally Ghid, Cold calling, Recomandare, DM Instagram, DM TikTok, Altceva. Ale rolurilor: Admin, Caller, Closer, Constructor.

- [ ] **Step 1: Testul** `tipuri.test.ts`: fiecare cheie din `STARI`, `SURSE`, `SERVICII`, `ROLURI` are etichetă nevidă în `ETICHETE`; nicio etichetă nu conține `ş` sau `ţ`; `SERVICII` e egal cu cheile din `site/lib/contact.ts` → `SERVICII_CONTACT` (import relativ `../../../site/lib/contact`).
- [ ] **Step 2:** `npx vitest run` → FAIL (lipsesc fișierele).
- [ ] **Step 3:** scrie `tipuri.ts`, `config.ts`, tema: variabilele din `:root` ale prototipului (`--bg`, `--bg-2`, `--bg-3`, `--line`, `--line-2`, `--ink`, `--ink-2`, `--ink-3`, `--amber`, `--orange`, `--red`, `--green`, `--blue`, `--grad`, `--r`, `--label`, `--mono`), mapate în `@theme` de Tailwind. Copiază `.woff2` pentru Inter și JetBrains Mono din `site/public/` (unde le pune `site/app/fonturi.css`) și adaugă Chakra Petch 500/600/700 (subsetul `latin-ext`, din pachetul `@fontsource/chakra-petch`, copiat în `public/fonturi/`, nu folosit ca dependență). `layout.tsx`: `lang="ro"`, `<meta name="robots" content="noindex, nofollow">`, titlul „CRM buildwithac”.
- [ ] **Step 4:** `schelet.spec.ts`: `/` răspunde, fundalul `body` e `rgb(20, 20, 23)`, fontul `h1` începe cu „Chakra Petch”. `npx vitest run` și `npx playwright test` → PASS. `npm run lint`, `npx tsc --noEmit -p .` → fără erori.
- [ ] **Step 5:** commit `crm: scheletul aplicației și tema din prototip`.

### Task 2: Funcțiile pure (telefon, stări, ora României)

**Files:**
- Create: `crm/lib/telefon.ts`, `crm/lib/stari.ts`, `crm/lib/timp.ts`
- Test: `crm/tests/unit/telefon.test.ts`, `stari.test.ts`, `timp.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export function normalizeazaTelefon(t: string): string | null;   // doar cifre, cu prefixul țării; null dacă are <7 sau >15 cifre
  export function normalizeazaEmail(e: string | null | undefined): string | null; // trim + lowercase; null dacă nu are „@”
  export function linkWhatsApp(telefonNorm: string): string;          // https://wa.me/<cifre>
  export function linkTelefon(telefonNorm: string): string;           // tel:+<cifre>

  export type Actiune = "ia_lead" | "nu_raspunde" | "a_raspuns" | "callback" | "programeaza" | "oferta_trimisa" | "client" | "pierdut" | "descalificat";
  export type LeadPentruActiune = { stare: Stare; caller_id: string | null; closer_id: string | null };
  export function actiuniPermise(lead: LeadPentruActiune, rol: Rol, eu: string): Actiune[];
  export function stareDupa(a: Exclude<Actiune, "ia_lead">): Stare; // nu_raspunde→fara_raspuns, a_raspuns→a_raspuns, callback→callback, programeaza→programat, oferta_trimisa→oferta_trimisa, client→client, pierdut→pierdut, descalificat→descalificat

  export const FUS = "Europe/Bucharest";
  export function laOraRomaniei(zi: string /* "2026-10-25" */, ora: string /* "10:00" */): Date;
  export function ziuaRomaniei(d: Date): string;                      // "2026-10-25"
  export type ScurtaturaCallback = "o_ora" | "trei_ore" | "maine_10" | "maine_16" | "doua_zile";
  export function scurtaturaCallback(s: ScurtaturaCallback, acum: Date): Date;
  ```
- Regulile din `actiuniPermise` (aceleași le impune trigger-ul din Task 3):
  - lead fără caller: Caller/Closer/Admin au `ia_lead`; Constructor nu are nimic.
  - Admin: toate acțiunile, oricând.
  - Caller pe lead-ul lui (`caller_id === eu`): `nu_raspunde`, `a_raspuns`, `callback`, `descalificat`, `oferta_trimisa`, iar `programeaza` doar dacă `stare` e `a_raspuns`, `callback` sau `programat`. Niciodată `client` sau `pierdut`.
  - Closer pe lead-ul lui (`caller_id === eu` sau `closer_id === eu`): ce are callerul, plus `client` și `pierdut`.
  - Lead în `client`: nicio acțiune în afară de Admin.

- [ ] **Step 1: Testele.**
  - `telefon.test.ts`: `"0721 123 456"`, `"+40 721 123 456"`, `"0040-721-123-456"`, `"(0721) 123.456"` → toate `"40721123456"`; `"+44 7911 123456"` → `"447911123456"`; `"123"` → `null`; `normalizeazaEmail(" Ion@Gmail.COM ")` → `"ion@gmail.com"`; `linkWhatsApp("40721123456")` → `"https://wa.me/40721123456"`.
  - `stari.test.ts`: un caller pe un lead liber are doar `["ia_lead"]`; callerul nu are niciodată `client`/`pierdut`; `programeaza` lipsește pe `nou` și există pe `a_raspuns`; un caller pe lead-ul altuia are `[]`; closerul are `client`; constructorul are `[]` peste tot.
  - `timp.test.ts`: `laOraRomaniei("2026-10-24","10:00").toISOString()` → `"2026-10-24T07:00:00.000Z"`; `laOraRomaniei("2026-10-26","10:00")` → `"2026-10-26T08:00:00.000Z"`; `laOraRomaniei("2027-03-28","10:00")` → `"2027-03-28T07:00:00.000Z"`; `scurtaturaCallback("maine_10", new Date("2026-10-24T20:30:00Z"))` (23:30 în România, sâmbătă) → `"2026-10-25T08:00:00.000Z"` (duminică, după schimbarea orei); `o_ora` → acum + 3.600.000 ms.
- [ ] **Step 2:** `npx vitest run` → FAIL.
- [ ] **Step 3:** implementează. Prefixul: `00` la început se scoate; un număr care începe cu `0` și are 10 cifre e românesc → `40` + fără `0`. `laOraRomaniei` calculează decalajul cu `Intl.DateTimeFormat(…, { timeZone: FUS, timeZoneName: "longOffset" })`, fără bibliotecă.
- [ ] **Step 4:** `npx vitest run` → PASS.
- [ ] **Step 5:** commit `crm: telefoane, stări și ora României`.

### Task 3: Supabase de test, schema și permisiunile

**Files:**
- Create: `crm/supabase/config.toml` (`npx supabase init`), `crm/supabase/migrations/20261110000001_schema.sql`, `…02_rls.sql`, `…03_triggere.sql`
- Create: `crm/lib/supabase/server.ts`, `admin.ts`, `crm/lib/baza.types.ts` (`npx supabase gen types typescript --linked`)
- Create: `crm/scripts/seed.ts`, `crm/tests/rls/ajutor.ts`, `crm/tests/rls/lead-uri.test.ts`, `crm/vitest.rls.config.ts`
- Modify: `crm/package.json` (scripturi `"seed": "tsx scripts/seed.ts"`, `"test:rls": "vitest run -c vitest.rls.config.ts"`, `"tipuri": "supabase gen types typescript --linked > lib/baza.types.ts"`)

**Pașii lui Andrei (unul câte unul, înainte de Step 1):** contul Supabase nou pe adresa firmei (o alege el) → organizația → proiectul `buildwithac-crm-test`, regiunea Central EU (Frankfurt), parola bazei salvată în managerul lui de parole → `! npx supabase login` în terminal → îmi spune Project ref-ul (din Project Settings → General) → pune în `crm/.env.local` `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY` (din Project Settings → API Keys) și `CRM_MEDIU=test`. Eu rulez `npx supabase link --project-ref <ref>`. Notează limitele planului gratuit văzute la creare (pauza, copiile de siguranță) în `docs/progres-brainstorming.md` (spec §3, **[de verificat]**).

**Interfaces:**
- Produces (tabelele, toate cu RLS activat):
  - `profiluri(id uuid pk → auth.users on delete cascade, nume text, email text, rol rol not null, activ bool default true, durata_discutie_min int default 30, creat_la timestamptz default now())`
  - `lead_uri(id uuid pk default gen_random_uuid(), nume text not null, telefon text, telefon_norm text unique, email text, email_norm text unique, serviciu serviciu not null, sursa sursa not null, stare stare not null default 'nou', caller_id uuid → profiluri, closer_id uuid → profiluri, callback_la timestamptz, incercari int default 0, motiv text, intrat_la timestamptz default now(), creat_de uuid → profiluri, creat_la timestamptz default now())`, cu `check (telefon_norm is not null or email_norm is not null)`
  - `cereri(id uuid pk, lead_id uuid → lead_uri on delete cascade, sursa sursa, id_extern text unique, raspunsuri jsonb not null default '[]', utm jsonb not null default '{}', primita_la timestamptz default now())`. `raspunsuri` = `[{ intrebare: string, raspuns: string }]`.
  - `evenimente(id bigint identity pk, lead_id uuid → lead_uri on delete cascade, autor_id uuid → profiluri, tip text not null, detalii jsonb default '{}', la timestamptz default now())`
  - `notite(id uuid pk, lead_id → lead_uri on delete cascade, autor_id → profiluri default auth.uid(), text text not null, link_vocal text, la timestamptz default now())`
  - `clienti(id uuid pk, lead_id uuid unique → lead_uri on delete set null, nume, telefon, email, serviciu, sursa, caller_id, closer_id, creat_la timestamptz default now())`
  - `lib/supabase/server.ts`: `export async function supabase(): Promise<SupabaseClient<Database>>` (sesiunea omului, RLS); `lib/supabase/admin.ts`: `export function admin(): SupabaseClient<Database>` (cheia de serviciu, doar pe server).
  - funcții SQL `rol_curent() returns rol` (rolul din `profiluri` doar dacă `activ`, altfel `null`; `security definer`, `stable`, `set search_path = ''`).
- **RLS** (`rol_curent()` null = nimic):
  - `profiluri`: select pentru orice rol activ; update doar admin.
  - `lead_uri`: select pentru admin, caller, closer; insert pentru admin, caller, closer, cu `creat_de = auth.uid()` și `sursa` din cele manuale; update pentru admin, pentru cine e `caller_id`/`closer_id`, și pentru caller/closer pe lead-urile cu `caller_id is null`; delete doar admin.
  - `cereri`, `evenimente`: select dacă omul vede lead-ul. Nimeni nu scrie direct, doar trigger-ele și cheia de serviciu.
  - `notite`: select dacă vede lead-ul; insert dacă poate face update pe lead.
  - `clienti`: select pentru admin; pentru caller/closer doar unde `caller_id` sau `closer_id` e el; constructorul nu vede nimic în etapa 1.
- **Trigger-ul `inainte_de_schimbare_lead`** (before update, `security definer`), care **respinge** cu `raise exception` dacă cel conectat nu e admin și:
  - schimbă `caller_id` altfel decât din `null` în `auth.uid()`;
  - schimbă `closer_id`, în afară de cazul în care starea nouă e `programat` (programarea și reprogramarea din Task 9);
  - pune `stare` în `client` sau `pierdut` și rolul nu e `closer`;
  - schimbă `nume`, `serviciu`, `sursa`, `intrat_la`, `creat_de`.
  - Cheia de serviciu (`auth.uid()` null) trece.
- **Trigger-ul `dupa_schimbare_lead`** (after insert/update, `security definer`) scrie în `evenimente`: `creat` la insert; `stare` (`{de, in}`) la schimbarea stării; `incercare` când crește `incercari`; `caller`/`closer` (`{de, in}`) la schimbarea omului; `callback` (`{la}`). `autor_id = auth.uid()`. Când `stare` devine `client`, inserează rândul în `clienti` (din câmpurile lead-ului).
- `ajutor.ts` produce `conecteazaCa(cont: "admin" | "caller" | "caller2" | "closer" | "constructor"): Promise<SupabaseClient<Database>>` (se conectează cu contul de test) și reexportă `admin()`.
- `seed.ts`: **se oprește cu eroare dacă `CRM_MEDIU !== "test"`**. Creează (cu `auth.admin.createUser`, `email_confirm: true`) conturile `admin@test.buildwithac.ro`, `caller@…`, `caller2@…`, `closer@…`, `constructor@…`, toate cu parola din `CRM_PAROLA_TEST`, plus cel puțin un lead pentru fiecare serviciu și fiecare sursă, în stări diferite, cu nume românești inventate și numere `0700 000 0xx`. Rulat de două ori, nu dublează nimic.

- [ ] **Step 1: Testele RLS** (`lead-uri.test.ts`; fiecare test își creează lead-ul cu `admin()` și îl șterge la final):
  - `callerul vede toate lead-urile` (și pe cele ale lui `caller2`);
  - `constructorul nu vede niciun lead`;
  - `callerul își ia un lead liber`: update `caller_id = eu` reușește, iar `evenimente` are un `caller` cu `{de: null, in: eu}`;
  - `al doilea caller nu ia lead-ul luat`: `caller2` face update cu filtrul `.is("caller_id", null)` și primește 0 rânduri, iar `caller_id` rămâne primul;
  - `callerul nu poate muta lead-ul la altcineva` (eroare);
  - `callerul nu poate pune „client”` (eroare); `closerul poate`, iar în `clienti` apare un rând cu același `lead_id`;
  - `callerul nu poate șterge` (0 rânduri); `adminul poate`;
  - `un cont dezactivat nu vede nimic` (pune `activ = false` pe `caller2`, select → `[]`, apoi îl reactivează);
  - `nimeni nu scrie direct în evenimente` (insert de la admin conectat → eroare).
- [ ] **Step 2:** `npm run test:rls` → FAIL.
- [ ] **Step 3:** scrie migrațiile, aplică-le cu `npx supabase db push`, generează tipurile (`npm run tipuri`), scrie `server.ts` (`createServerClient` din `@supabase/ssr`, cu `await cookies()`), `admin.ts` (`createClient` cu `SUPABASE_SECRET_KEY`, `persistSession: false`; importat doar din cod de server, cu `import "server-only"`), `seed.ts`. Rulează `npm run seed`.
- [ ] **Step 4:** `npm run test:rls` → PASS. `npx supabase db lint` și sfaturile de securitate (`get_advisors`, tipul `security`) → fără avertismente despre RLS.
- [ ] **Step 5:** commit `crm: schema, permisiunile și datele de test`.

### Task 4: Conectarea, invitația și parola

**Files:**
- Create: `crm/proxy.ts`, `crm/lib/supabase/proxy.ts`, `crm/app/(cont)/intra/page.tsx`, `crm/app/(cont)/parola/page.tsx`, `crm/app/(cont)/actiuni.ts`, `crm/app/auth/confirm/route.ts`, `crm/app/(app)/layout.tsx`, `crm/lib/eu.ts`
- Test: `crm/tests/e2e/cont.spec.ts`

**Pasul lui Andrei, în proiectul de test:** Authentication → Sign In / Providers: „Allow new users to sign up” oprit; Authentication → URL Configuration: Site URL `http://localhost:3100`. Template-urile „Invite user” și „Reset password” se schimbă (texte în română date de mine) ca link-ul să fie `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=invite` (respectiv `type=recovery`).

**Interfaces:**
- Produces: `export async function eu(): Promise<{ id: string; nume: string; rol: Rol }>` în `lib/eu.ts` (redirect la `/intra` dacă nu e nimeni conectat sau contul e inactiv). Folosit de toate paginile din `(app)`.
- `proxy.ts` reîmprospătează sesiunea Supabase (modelul oficial `updateSession` din `@supabase/ssr`) și trimite la `/intra` orice cerere fără sesiune, **în afară de** `/intra`, `/parola`, `/auth/*`, `/api/intrare/*`, `/api/cron/*` și fișierele statice.
- Bara laterală (`(app)/layout.tsx`, după prototip): Lead-uri, Clienți, Program (doar closer și admin), Echipa (doar admin); jos, numele, rolul și „Ieși”. Constructorul vede doar Clienți.

- [ ] **Step 1: Testele e2e** (`cont.spec.ts`, cu conturile de test):
  - fără sesiune, `/lead-uri` duce la `/intra`;
  - parola greșită arată „E-mailul sau parola nu se potrivesc.”;
  - adminul se conectează și vede în bara laterală „Echipa”; callerul nu o vede;
  - `/echipa` deschis direct de caller duce la `/lead-uri`;
  - „Ieși” duce la `/intra`, iar `/lead-uri` nu mai merge.
- [ ] **Step 2:** `npx playwright test cont` → FAIL.
- [ ] **Step 3:** implementează. `auth/confirm` apelează `supabase.auth.verifyOtp({ type, token_hash })` și trimite la `/parola`. Pe `/parola`: două câmpuri, minim 10 caractere, apoi `updateUser({ password })` și `/lead-uri`. Pe `/intra`: link „Am uitat parola” (`resetPasswordForEmail`, cu mesaj identic dacă adresa există sau nu).
- [ ] **Step 4:** `npx playwright test cont` → PASS.
- [ ] **Step 5:** commit `crm: conectarea, invitația și parola`.

### Task 5: Intrarea lead-urilor (site, Tally) și notificarea

**Files:**
- Create: `crm/lib/intrare.ts`, `crm/lib/tally.ts`, `crm/lib/notificare.ts`, `crm/app/api/intrare/site/route.ts`, `crm/app/api/intrare/tally/route.ts`
- Test: `crm/tests/unit/tally.test.ts`, `crm/tests/unit/intrare.test.ts`, `crm/tests/unit/notificare.test.ts`, `crm/tests/rls/intrare.test.ts`, `crm/tests/unit/fixtures/tally-*.json`

**Interfaces:**
- Consumes: `normalizeazaTelefon`, `normalizeazaEmail` (Task 2), `admin()` (Task 3), `CRM.formulareTally` (Task 1).
- Produces:
  ```ts
  export type CerereNoua = { nume: string; telefon: string | null; email: string | null; serviciu: Serviciu; sursa: Sursa;
    raspunsuri: { intrebare: string; raspuns: string }[]; utm: Record<string, string>; idExtern: string | null };
  export type LeadGasit = { id: string; stare: Stare } | null;
  export type Decizie = "lead_nou" | "leaga_de_lead" | "leaga_de_client" | "redeschide";
  export function decide(gasit: LeadGasit): Decizie;  // null→lead_nou; client→leaga_de_client; pierdut/descalificat→redeschide; altfel→leaga_de_lead
  export async function primesteCerere(c: CerereNoua, db: SupabaseClient): Promise<{ id: string; decizie: Decizie | "duplicat" }>;
  export function verificaSemnaturaTally(corpBrut: string, semnatura: string | null, secret: string): boolean;
  export function dinTally(corp: unknown): CerereNoua | null;   // null dacă formularul nu e în CRM.formulareTally
  export function construiesteNotificare(l: { id: string; nume: string; telefon: string | null; serviciu: Serviciu; sursa: Sursa }, decizie: Decizie): { subiect: string; text: string; html: string };
  export async function trimiteNotificare(…, f?: typeof fetch): Promise<boolean>;
  ```
- `POST /api/intrare/site`: antetul `Authorization: Bearer <CRM_SECRET_INTRARE>`, altfel 401. Corpul: `{ nume, telefon, serviciu, descriere, utm? }` (verificat cu zod). Răspunde `200 { id }`. Descrierea intră în `raspunsuri` ca `{ intrebare: "Descriere", raspuns }`.
- `POST /api/intrare/tally`: citește corpul ca text, verifică semnătura din antetul `tally-signature` (HMAC-SHA256, base64, cu `TALLY_SECRET`; **[de verificat]** formatul exact în documentația Tally la implementare și notat în comentariu) → 401 dacă nu se potrivește. Formular necunoscut → 200 fără scriere (ca Tally să nu reîncerce). Eroare de bază de date → 500 (ca Tally să reîncerce). **[de verificat]** dacă Tally reîncearcă și de câte ori; notat în `docs/progres-brainstorming.md`.
- `dinTally`: numele = câmpul cu eticheta care conține „nume” (fără diacritice, litere mici), altfel primul `INPUT_TEXT`; telefonul = primul `INPUT_PHONE_NUMBER`; e-mailul = primul `INPUT_EMAIL`; `HIDDEN_FIELDS` cu cheile `utm_*` intră în `utm`, nu în `raspunsuri`; toate celelalte câmpuri intră în `raspunsuri` (opțiunile alese se scriu cu textul lor, separate prin „, ”); `idExtern` = `data.responseId`.
- `primesteCerere` (cu cheia de serviciu): dacă `idExtern` există deja în `cereri` → `"duplicat"`, nu scrie nimic. Caută lead-ul după `telefon_norm`, apoi după `email_norm`. Apoi, după `decide`: `lead_nou` → insert lead + cerere; `leaga_de_lead` → insert cerere + eveniment `cerere_noua`; `leaga_de_client` → la fel, plus notificarea „Client existent: cerere nouă”; `redeschide` → `stare = 'nou'`, `intrat_la = now()`, `motiv = null`, păstrează `caller_id`, plus cerere și eveniment `redeschis`. Dacă insert-ul lead-ului dă conflict pe `telefon_norm`/`email_norm` (doi trimiși în aceeași clipă), reia o dată căutarea.
- **Notificarea** pleacă de la `CRM.emailExpeditor` la `CRM.emailAdmin` pentru orice cerere, **în afară de** sursa `formular_site` (site-ul trimite deja e-mailul lui, cu link la fișă; Task 6). Subiectul: `Lead nou: <Serviciu> · <Nume>` (sau `Client existent: …`, `Lead redeschis: …`), pe un singur rând. Corpul are nume, telefon (link `tel:`), serviciu, sursă și `CRM.url/lead-uri/<id>`. HTML-ul e escapat ca în `site/lib/contact.ts`. Notificarea eșuată nu face ruta să eșueze.

- [ ] **Step 1: Testele.**
  - `tally.test.ts`: semnătura corectă → `true`; un octet schimbat în corp → `false`; antet lipsă → `false`; fixture-ul Formular Site → `sursa "tally_site"`, `serviciu "site"`, telefonul și e-mailul găsite, `utm.utm_campaign` citit din câmpul ascuns și absent din `raspunsuri`; un `formId` necunoscut → `null`; un câmp cu mai multe opțiuni → `"Logo, Texte"`.
  - `intrare.test.ts`: `decide` pentru `null`, `nou`, `callback`, `client`, `pierdut`, `descalificat`.
  - `notificare.test.ts`: `<script>` în nume iese escapat; un `\n` în nume nu ajunge în subiect; link-ul are id-ul lead-ului.
  - `rls/intrare.test.ts` (pe proiectul de test): aceeași cerere de două ori cu telefoane scrise diferit → un lead, două cereri; același `idExtern` de două ori → a doua oară `"duplicat"`; un lead `pierdut` primește o cerere → `stare "nou"` și `intrat_la` nou. Rutele se testează importând direct `POST` (ca `site/tests/unit/ruta-contact.test.ts`): `/api/intrare/site` fără secret → 401; `/api/intrare/tally` cu semnătura greșită → 401.
- [ ] **Step 2:** `npx vitest run` și `npm run test:rls` → FAIL.
- [ ] **Step 3:** implementează. Fixture-urile Tally se fac după un răspuns real de test: Andrei completează o dată fiecare formular, cu webhook-ul trimis temporar la un URL de pe webhook.site, sau, dacă nu vrea, după exemplul din documentația Tally. Datele personale din fixture se înlocuiesc cu unele inventate.
- [ ] **Step 4:** testele → PASS.
- [ ] **Step 5:** commit `crm: lead-urile intră singure din site și Tally`.

### Task 6: Site-ul trimite lead-ul la CRM și păstrează parametrii din link

**Files:**
- Create: `site/lib/utm.ts`, `site/lib/crm.ts`, `site/components/PastreazaUtm.tsx`
- Modify: `site/app/layout.tsx` (pune `<PastreazaUtm />`), `site/components/home/FormularContact.tsx` (trimite și `utm`), `site/lib/contact.ts` (`verificaCerere` acceptă `utm` opțional; `construiesteEmail` primește rezultatul CRM-ului), `site/app/api/contact/route.ts`, `site/lib/config.ts` (adaugă `crm: "https://crm.buildwithac.ro"`)
- Test: `site/tests/unit/utm.test.ts`, `site/tests/unit/contact.test.ts`, `site/tests/unit/ruta-contact.test.ts`

**Interfaces:**
- Produces:
  ```ts
  // site/lib/utm.ts
  export const CHEI_UTM = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const;
  export function citesteUtm(search: string): Record<string, string>;   // doar cheile din CHEI_UTM, fiecare tăiată la 200 de caractere
  // site/lib/crm.ts
  export async function trimiteLaCrm(c: CerereContact & { utm: Record<string, string> }, mediu: { url?: string; secret?: string }, f?: typeof fetch, ms?: number): Promise<{ id: string } | null>;
  // site/lib/contact.ts (schimbat)
  export function construiesteEmail(c: CerereContact, acum: Date, crm?: { id: string } | null): { subiect; text; html };
  ```
- `PastreazaUtm` (client): la încărcarea oricărei pagini, dacă URL-ul are vreun `utm_*`, scrie `citesteUtm(location.search)` în `sessionStorage` (`bwac_utm`), în `try/catch`. Primul link câștigă: nu suprascrie ce e deja acolo.
- În `/api/contact`: întâi `trimiteLaCrm` cu limita de **4 s**, apoi e-mailul la Resend (ca acum, 8 s). E-mailul primește rezultatul: cu `{ id }`, are rândul „În CRM: <SITE.crm>/lead-uri/<id>”; cu `null`, are rândul „ATENȚIE: lead-ul n-a intrat în CRM. Adaugă-l de mână.” Răspunsul către om e `ok` dacă **măcar unul** din CRM și e-mail a reușit; `indisponibil` doar dacă amândouă au căzut. Fără `CRM_URL` sau `CRM_SECRET_INTRARE` în mediu, `trimiteLaCrm` întoarce `null` fără să încerce.

- [ ] **Step 1: Testele.** `utm.test.ts`: `?utm_source=meta&utm_campaign=site-nov&x=1` → `{ utm_source: "meta", utm_campaign: "site-nov" }`; valoare de 500 de caractere → 200. `contact.test.ts`: `utm` lipsă sau greșit (număr, listă) nu face cererea invalidă; e-mailul cu `crm = null` conține „n-a intrat în CRM”; cu `{ id: "abc" }` conține `/lead-uri/abc`. `ruta-contact.test.ts`: CRM-ul nu răspunde în 4 s și Resend merge → `200 ok`, iar e-mailul are avertismentul; CRM merge și Resend dă 500 → `200 ok`; amândouă cad → `503`.
- [ ] **Step 2:** `npx vitest run` din `site/` → FAIL.
- [ ] **Step 3:** implementează.
- [ ] **Step 4:** din `site/`: `npx vitest run`, `npm run lint`, `npx tsc --noEmit -p .` → PASS. `npx playwright test contact` → PASS (formularul arată la fel).
- [ ] **Step 5:** commit `site: formularul trimite lead-ul și în CRM, cu parametrii din link`.

### Task 7: Lista lead-urilor

**Files:**
- Create: `crm/lib/filtre.ts`, `crm/app/(app)/lead-uri/page.tsx`, `crm/components/Numaratoare.tsx`, `crm/components/FiltreLeaduri.tsx`, `crm/components/RandLead.tsx`, `crm/app/(app)/lead-uri/actiuni.ts` (`iaLead`)
- Test: `crm/tests/unit/filtre.test.ts`, `crm/tests/e2e/lista.spec.ts`

**Interfaces:**
- Consumes: `eu()` (Task 4), `actiuniPermise`, `linkWhatsApp`, `linkTelefon`, `scurtaturaCallback`/`ziuaRomaniei` (Task 2), `ETICHETE` (Task 1).
- Produces:
  ```ts
  export type Perioada = "azi" | "ieri" | "7zile" | "luna" | "tot";
  export type Scurtatura = "callback_azi" | "callback_intarziat" | "nesunate" | "ale_mele";
  export type Filtru = { q?: string; perioada: Perioada; stare?: Stare; sursa?: Sursa; serviciu?: Serviciu; om?: string; scurtatura?: Scurtatura; pagina: number };
  export function dinParametri(p: Record<string, string | string[] | undefined>): Filtru;   // valorile necunoscute se ignoră; implicit perioada "tot", pagina 1
  export function intervalPerioada(p: Perioada, acum: Date): { de?: Date; pana?: Date };    // granițele zilelor în ora României
  export async function iaLead(id: string): Promise<{ ok: true } | { ok: false; mesaj: string }>;
  ```
- Pagina: sus, numărătoarea pe stări (Nou, Fără răspuns, Callback, Programat, Ofertă trimisă; un click o pune ca filtru). Dedesubt, căutarea (nume, telefon, e-mail; telefonul se caută și normalizat), perioada, filtrele și cele 4 scurtături ca pastile. Tabelul are coloanele: Nume (link la fișă), Serviciu, Sursă, Stare, Callback (roșu dacă a trecut), Intrat, Caller, iar la dreapta acțiunile rândului: WhatsApp, Sună, Copiază numărul, „Îmi iau lead-ul” (doar pe lead-urile libere, după `actiuniPermise`). 50 pe pagină, cele mai noi primele; „callback azi” și „callback întârziat” se ordonează după oră. Filtrul stă în URL, ca o listă filtrată să se poată deschide din nou.
- `iaLead` face update cu `.eq("id", id).is("caller_id", null)`. Cu 0 rânduri, citește lead-ul și întoarce `L-a luat deja <nume>.`

- [ ] **Step 1: Testele.** `filtre.test.ts`: `dinParametri({ stare: "xyz", pagina: "-3" })` → fără stare, pagina 1; `intervalPerioada("azi", new Date("2026-10-24T22:30:00Z"))` → `de` = `2026-10-24T21:00:00.000Z` (miezul nopții în România, 25 oct.). `lista.spec.ts` (callerul de test): vede numărătoarea și cel puțin un lead din seed; caută după `0700 000 0` și găsește; „Îmi iau lead-ul” pe un lead liber îl face să apară în „ale mele”; link-ul WhatsApp începe cu `https://wa.me/40700`; la 390px, pagina nu are scroll orizontal (`document.documentElement.scrollWidth <= 390`).
- [ ] **Step 2:** testele → FAIL.
- [ ] **Step 3:** implementează, cu aspectul din `prototip/crm-clienti.html` (pastilele `.chip`, tabelul cu linii fine, cifrele în `--mono`).
- [ ] **Step 4:** testele → PASS. **Arată-i lui Andrei pagina în browser** (contul admin de test, pe `localhost:3100`) și notează ce cere.
- [ ] **Step 5:** commit `crm: lista lead-urilor`.

### Task 8: Fișa lead-ului și butoanele

**Files:**
- Create: `crm/app/(app)/lead-uri/[id]/page.tsx`, `crm/app/(app)/lead-uri/[id]/actiuni.ts`, `crm/components/AcumUrmeaza.tsx`, `crm/components/ButoaneActiuni.tsx`, `crm/components/Parcurs.tsx`, `crm/components/TaburiLead.tsx`
- Test: `crm/tests/e2e/fisa.spec.ts`

**Interfaces:**
- Consumes: `actiuniPermise`, `stareDupa`, `scurtaturaCallback`, `laOraRomaniei` (Task 2), `eu()` (Task 4).
- Produces (server actions, toate cu sesiunea omului, deci cu RLS și trigger-ul din Task 3):
  ```ts
  export async function aplicaActiune(id: string, a: Exclude<Actiune, "ia_lead" | "programeaza">, extra?: { callbackLa?: string /* ISO */; motiv?: string }): Promise<{ ok: true } | { ok: false; mesaj: string }>;
  export async function adaugaNotita(id: string, text: string, linkVocal?: string): Promise<{ ok: true } | { ok: false; mesaj: string }>;
  ```
- `nu_raspunde` crește `incercari` și pune `fara_raspuns`. `callback` cere `callbackLa` în viitor. `pierdut` și `descalificat` cer `motiv` (măcar 3 caractere). Orice altă acțiune golește `callback_la`. Eroarea din trigger devine mesajul „Nu ai voie să faci asta pe lead-ul ăsta.”
- Fișa, după EasyGrow și prototipul A: în stânga, cardul „Acum / Urmează” (ce e de făcut: „Sună-l”, „Callback azi la 16:00”, „Discuție programată: joi, 14:00 cu <closer>”), contactul (cu WhatsApp / Sună / Copiază), sursa, serviciul, `utm`-urile dacă există, callerul și closerul. În dreapta, butoanele mari (doar cele din `actiuniPermise`; „Programează discuția” deschide calendarul din Task 9), apoi tab-urile **Parcurs** (evenimentele, cele mai noi sus, cu autorul și ora), **Răspunsuri** (fiecare cerere, cu data și răspunsurile ei), **Notițe** (text + link de notă vocală), **Detalii** (toate câmpurile). Callback-ul are scurtăturile din Task 2 plus „Altă dată” (zi și oră).
- Doar pentru Admin, în cardul cu oamenii: „Mută la…” (caller sau closer), cu `export async function mutaLead(id: string, camp: "caller_id" | "closer_id", la: string | null)`. Mutarea intră în Parcurs prin trigger.

- [ ] **Step 1: Testele e2e** (callerul de test, pe un lead creat în test cu cheia de serviciu): „Nu răspunde” de două ori → Parcursul are două „Fără răspuns” și stă în `fara_raspuns`; „Callback → Mâine 10:00” → cardul spune „Callback mâine la 10:00”; „Client” nu apare pentru caller; „Descalificat” fără motiv arată „Scrie motivul.”; o notiță apare în tab-ul Notițe cu numele callerului; pe un lead al lui `caller2`, callerul vede fișa fără butoane; adminul mută lead-ul la `caller2` cu „Mută la…” și Parcursul arată mutarea.
- [ ] **Step 2:** `npx playwright test fisa` → FAIL.
- [ ] **Step 3:** implementează.
- [ ] **Step 4:** `npx playwright test fisa` → PASS. **Arată-i lui Andrei fișa în browser.**
- [ ] **Step 5:** commit `crm: fișa lead-ului și butoanele`.

### Task 9: Programul closerilor și „Programează discuția”

**Files:**
- Create: `crm/supabase/migrations/20261110000004_programari.sql`, `crm/lib/sloturi.ts`, `crm/app/(app)/program/page.tsx`, `crm/app/(app)/program/actiuni.ts`, `crm/components/CalendarSloturi.tsx`
- Modify: `crm/app/(app)/lead-uri/[id]/actiuni.ts` (adaugă `programeaza`), `crm/lib/baza.types.ts` (regenerat), `crm/scripts/seed.ts` (program pentru closerul de test: luni–vineri 10:00–18:00, 30 min)
- Test: `crm/tests/unit/sloturi.test.ts`, `crm/tests/rls/programari.test.ts`, `crm/tests/e2e/programare.spec.ts`

**Interfaces:**
- Produces (tabele):
  - `program_closer(id uuid pk, closer_id → profiluri on delete cascade, zi smallint check (zi between 1 and 7) /* 1 = luni */, de_la time, pana_la time, check (de_la < pana_la))`. Select: orice rol activ. Scriere: closerul pe rândurile lui, adminul pe toate.
  - `discutii(id uuid pk, lead_id → lead_uri on delete cascade, closer_id → profiluri, interval tstzrange not null, creat_de uuid default auth.uid(), creat_la timestamptz default now(), exclude using gist (closer_id with =, interval with &&))` (extensia `btree_gist`). Select: cine vede lead-ul. Insert: cine poate face update pe lead.
  ```ts
  export type Interval = { de: Date; pana: Date };
  export type ZiProgram = { zi: 1|2|3|4|5|6|7; de_la: string /* "10:00" */; pana_la: string };
  export function sloturiLibere(program: ZiProgram[], durataMin: number, ocupate: Interval[], acum: Date, zile: number): Date[];
  // începuturile sloturilor din următoarele `zile` zile, în ora României, fără cele care s-au suprapus cu `ocupate` și fără cele care încep în mai puțin de o oră de la `acum`
  export async function programeaza(id: string, closerId: string, incepe: string /* ISO */): Promise<{ ok: true } | { ok: false; mesaj: string }>;
  export async function salveazaProgram(closerId: string, zile: ZiProgram[], durataMin: number): Promise<{ ok: true } | { ok: false; mesaj: string }>;
  ```
- `programeaza`: insert în `discutii` (`[incepe, incepe + durata)`), apoi update pe lead cu `closer_id = closerId`, `stare = 'programat'`. Dacă insert-ul cade pe excludere: „Ora asta tocmai s-a ocupat. Alege alta.” și calendarul se reîncarcă. Trigger-ul din Task 3 lasă callerul să schimbe `closer_id` doar împreună cu `stare = 'programat'`. Evenimentul din Parcurs (`programat`) are `{ closer, la }`.
- În fișă: „Programează discuția” → lista closerilor activi (rolul `closer`, plus adminul) → calendarul cu următoarele 14 zile, sloturile pe zile, ora în România.
- `/program`: closerul își alege zilele, intervalul (un interval pe zi) și durata (15/30/45/60 min). Adminul poate alege orice closer dintr-o listă.

- [ ] **Step 1: Testele.** `sloturi.test.ts`: luni 10:00–12:00, 30 min, fără ocupate → 4 sloturi luni; un slot ocupat 10:30–11:00 dispare doar el; o discuție de 45 min de la 10:15 scoate 10:00, 10:30 și 11:00 (sloturile de 30 min care se suprapun cu ea); `acum` = luni 10:20 → primul slot e 11:30; programul de duminică 25 oct. 2026 10:00 dă `2026-10-25T08:00:00.000Z`, iar cel de sâmbătă 24 oct. dă `2026-10-24T07:00:00.000Z`. `rls/programari.test.ts`: doi calleri inserează aceeași oră la același closer → al doilea primește eroare de excludere; callerul nu poate scrie în programul closerului. `programare.spec.ts`: callerul programează pe un lead în `a_raspuns`, alege closerul de test și primul slot; fișa spune „Discuție programată”, iar slotul nu mai apare când deschide calendarul pe alt lead.
- [ ] **Step 2:** testele → FAIL.
- [ ] **Step 3:** implementează și aplică migrația (`npx supabase db push`, apoi `npm run tipuri`, `npm run seed`).
- [ ] **Step 4:** testele → PASS. **Arată-i lui Andrei calendarul.**
- [ ] **Step 5:** commit `crm: programul closerilor și programarea discuției`.

### Task 10: Lead adăugat de mână și lista clienților

**Files:**
- Create: `crm/app/(app)/lead-uri/nou/page.tsx`, `crm/app/(app)/lead-uri/nou/actiuni.ts`, `crm/app/(app)/clienti/page.tsx`
- Test: `crm/tests/e2e/manual-clienti.spec.ts`

**Interfaces:**
- Consumes: `primesteCerere` (Task 5) **nu** se folosește aici: adăugarea manuală merge cu sesiunea omului (RLS). Consumă `normalizeazaTelefon`/`normalizeazaEmail` (Task 2), `SURSE_MANUALE` (Task 1).
- Produces: `export async function adaugaLead(d: { nume: string; telefon?: string; email?: string; serviciu: Serviciu; sursa: Sursa; nota?: string }): Promise<{ ok: true; id: string } | { ok: false; mesaj: string }>`
- Formularul: nume, telefon, e-mail (măcar unul din ele), serviciu, sursa (doar `SURSE_MANUALE`), o notiță opțională. Lead-ul se creează cu `caller_id` = cel care l-a adăugat (adminul îl poate lăsa liber, cu o bifă „Las-l liber”). Dacă telefonul sau e-mailul există deja, nu se creează nimic: „Omul ăsta e deja în CRM.” cu link la fișa lui (sau „e deja în CRM, la alt caller”, fără link, dacă RLS nu-l lasă să-l vadă; tot conflictul de unicitate îl spune). La sursa „Cold calling” pe proiectul de producție apare, până la verificarea legală (Task 12), avertismentul „Cold calling: verifică întâi regulile (spec §9).”
- Când lead-ul e adăugat de altcineva decât adminul, pleacă notificarea din Task 5 (`trimiteNotificare`, decizia `lead_nou`).
- `/clienti`: tabelul simplu (Nume, Serviciu, Sursă, Caller, Closer, Client din), după RLS. Un click duce la fișa lead-ului din care a venit. Constructorul vede „Aici apar clienții la care lucrezi, după ce te pune Andrei pe un proiect.”

- [ ] **Step 1: Testele e2e:** callerul adaugă un lead „Cold calling” → ajunge pe fișa lui, cu el drept caller și evenimentul „creat”; același telefon încă o dată → „Omul ăsta e deja în CRM.”; closerul marchează „Client” pe lead-ul lui → lead-ul apare în `/clienti`; constructorul vede textul de mai sus și niciun rând.
- [ ] **Step 2:** `npx playwright test manual-clienti` → FAIL.
- [ ] **Step 3:** implementează.
- [ ] **Step 4:** testele → PASS.
- [ ] **Step 5:** commit `crm: lead-uri adăugate de mână și lista clienților`.

### Task 11: Echipa (invitații, roluri, dezactivare, mutare)

**Files:**
- Create: `crm/app/(app)/echipa/page.tsx`, `crm/app/(app)/echipa/actiuni.ts`, `crm/supabase/migrations/20261110000005_muta.sql`
- Test: `crm/tests/rls/echipa.test.ts`, `crm/tests/e2e/echipa.spec.ts`

**Interfaces:**
- Produces:
  ```ts
  export async function invita(email: string, nume: string, rol: Rol): Promise<{ ok: true } | { ok: false; mesaj: string }>;   // auth.admin.inviteUserByEmail + rândul din profiluri
  export async function schimbaRol(id: string, rol: Rol): Promise<…>;
  export async function seteazaActiv(id: string, activ: boolean): Promise<…>;  // la dezactivare și auth.admin.updateUserById(id, { ban_duration: "876000h" }); la reactivare "none"
  export async function mutaTot(de: string, la: string): Promise<{ ok: true; mutate: number } | { ok: false; mesaj: string }>;
  ```
  Funcția SQL `muta_lead_uri(de uuid, la uuid) returns int` (`security invoker`; funcționează doar pentru admin, prin trigger) mută `caller_id` și `closer_id` de pe lead-urile deschise (nu `client`/`pierdut`/`descalificat`); fiecare mutare intră în Parcurs prin trigger-ul din Task 3.
- Fiecare acțiune verifică întâi, pe server, că `eu().rol === "admin"`; abia apoi folosește `admin()` (cheia de serviciu, pentru Auth). Adminul nu se poate dezactiva și nu-și poate schimba singur rolul.
- Pagina: tabelul oamenilor (nume, e-mail, rol, activ, câte lead-uri deschise are), formularul de invitație și, la fiecare om inactiv cu lead-uri, „Mută tot la…”.

- [ ] **Step 1: Testele.** `rls/echipa.test.ts`: callerul nu poate face update pe `profiluri` (0 rânduri); `muta_lead_uri` apelată de caller → eroare; apelată de admin → întoarce numărul de lead-uri deschise ale lui `caller2`, iar Parcursul fiecăruia are evenimentul `caller`. `echipa.spec.ts` (admin): invitația cu o adresă `@test.buildwithac.ro` apare în tabel ca „Invitat”; dezactivarea lui `caller2` face ca, la conectarea lui `caller2`, să apară „Contul tău e oprit. Vorbește cu Andrei.” (apoi testul îl reactivează).
- [ ] **Step 2:** testele → FAIL.
- [ ] **Step 3:** implementează și aplică migrația.
- [ ] **Step 4:** testele → PASS.
- [ ] **Step 5:** commit `crm: echipa, invitațiile și mutarea lead-urilor`.

### Task 12: Jobul zilnic (retenția de 90 de zile, „ping”, copia de luni)

**Files:**
- Create: `crm/app/api/cron/zilnic/route.ts`, `crm/lib/retentie.ts`, `crm/vercel.json`
- Test: `crm/tests/unit/retentie.test.ts`, `crm/tests/rls/retentie.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export const ZILE_PASTRARE = 90;
  export function dataLimita(acum: Date): Date;                       // acum − 90 de zile
  export function eLuni(acum: Date): boolean;                         // în ora României
  export async function stergeVechi(db: SupabaseClient, acum: Date): Promise<number>;   // lead-urile care nu sunt „client” și au intrat_la < dataLimita
  export async function copieSaptamanala(db: SupabaseClient, f?: typeof fetch): Promise<boolean>;
  ```
- `vercel.json`: `{ "crons": [{ "path": "/api/cron/zilnic", "schedule": "0 4 * * *" }] }` (o dată pe zi, cât permite Hobby). Ruta cere `Authorization: Bearer <CRON_SECRET>`, altfel 401.
- Ruta: șterge lead-urile vechi (cererile, notițele, evenimentele și discuțiile lor pleacă prin `on delete cascade`). Clienții nu se șterg în etapa 1: regula lor (un an după ultimul proiect) vine cu proiectele, în etapa 2. Citirea face și „ping”-ul care ține Supabase treaz. Lunea trimite la `CRM.emailAdmin` un e-mail „Copia CRM-ului, <data>” cu un atașament `crm-<data>.json` (toate tabelele, fără `auth`), prin Resend. Dacă a șters ceva, e-mailul de luni spune câte.
- **Pe proiectul de test**, jobul nu șterge datele din seed: `seed.ts` le pune `intrat_la` = acum, iar `npm run seed` se poate rula din nou.

- [ ] **Step 1: Testele.** `retentie.test.ts`: `dataLimita(new Date("2026-11-10T04:00:00Z"))` → `2026-08-12T04:00:00.000Z`; `eLuni` pentru `2026-11-09T22:30:00Z` (marți 00:30 în România) → `false`. `rls/retentie.test.ts`: un lead `pierdut` cu `intrat_la` de acum 91 de zile se șterge, împreună cu cererea lui; unul de acum 89 de zile rămâne; un `client` de acum 200 de zile rămâne; ruta fără secret → 401.
- [ ] **Step 2:** testele → FAIL.
- [ ] **Step 3:** implementează.
- [ ] **Step 4:** testele → PASS.
- [ ] **Step 5:** commit `crm: jobul zilnic, retenția și copia săptămânală`.

### Task 13: Producția și verificarea lui Andrei

Nu e cod nou. Pași în conturi, dați lui Andrei **unul câte unul**; după fiecare, verific eu ce se poate verifica.

- [ ] **Step 1: Supabase de producție.** Proiectul `buildwithac-crm`, Frankfurt. Eu: `npx supabase link --project-ref <ref-prod>` și `npx supabase db push` (fără `seed`). Auth: înscrierea oprită, Site URL `https://crm.buildwithac.ro`, Redirect URLs `https://crm.buildwithac.ro/**`, template-urile în română din Task 4, **SMTP personalizat** prin Resend (`smtp.resend.com`, portul 465, utilizatorul `resend`, parola = o cheie Resend nouă, numai pentru trimitere; expeditorul `crm@buildwithac.ro`). Contul lui Andrei: îl invit cu `invita` dintr-un script o singură dată sau din panoul Supabase („Invite user”), apoi îi pun rolul `admin` cu un `update` din SQL Editor (îi dau comanda exactă).
- [ ] **Step 2: Vercel.** Proiect nou din același repo, Root Directory `crm`, ramura de producție `main`. Variabilele: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `RESEND_API_KEY`, `CRM_SECRET_INTRARE` (generat cu `openssl rand -hex 32`), `TALLY_SECRET`, `CRON_SECRET`, `CRM_MEDIU=productie`. Domeniul `crm.buildwithac.ro` (înregistrarea CNAME în Cloudflare, ca la site, cu proxy-ul oprit). La proiectul `site` din Vercel: `CRM_URL=https://crm.buildwithac.ro` și același `CRM_SECRET_INTRARE`.
- [ ] **Step 3: Tally.** La fiecare din cele 3 formulare: câmpurile ascunse `utm_source`, `utm_medium`, `utm_campaign`, `utm_content` (Andrei, în editor, cu blocul „Hidden fields”), apoi Integrations → Webhooks → `https://crm.buildwithac.ro/api/intrare/tally`, cu „Signing secret” = `TALLY_SECRET`.
- [ ] **Step 4: Confidențialitatea.** Înainte de primul lead real: textul nou din `site/app/confidentialitate/page.tsx` (datele stau în Supabase, în UE, Frankfurt; cine le vede; cele 90 de zile, șterse automat), scris cu Andrei, în tonul site-ului. Test: `site/tests/e2e/pagini.spec.ts` verifică apariția cuvântului „Supabase” pe pagină.
- [ ] **Step 5: Cold calling.** Întrebarea din spec §9 trece prin skill-ul `legal-advisor-ro`. Răspunsul se notează în `docs/progres-brainstorming.md`. Până atunci, sursa „Cold calling” se folosește doar pe proiectul de test (avertismentul din Task 10 rămâne până la răspuns).
- [ ] **Step 6: Verificările.** Din `site/` și `crm/`, comenzile din Global Constraints → toate trec. `git push` pe `crm` → Vercel face previzualizările (pentru CRM, cu variabilele proiectului de **test**, puse la „Preview”).
- [ ] **Step 7: Andrei verifică pe previzualizare,** pe laptop: se conectează cu contul de test admin, apoi caller, apoi closer, și urmează drumul unui lead (din formularul site-ului de previzualizare → lista → „Îmi iau lead-ul” → „A răspuns” → programare → „Client”). Pe telefon: doar se deschide și se citește.
- [ ] **Step 8: Unirea.** La „da”-ul lui Andrei: `main` ← `crm`, `git push`. Apoi un lead real de probă (Andrei, cu numărul lui, din formularul de pe `buildwithac.ro` și dintr-un formular Tally) intră în CRM-ul de producție, iar Andrei îl șterge după.
- [ ] **Step 9:** stadiul în `docs/progres-brainstorming.md` („DE AICI CONTINUĂM”: etapa 1 live, ce urmează e etapa 2) și în memorie.
