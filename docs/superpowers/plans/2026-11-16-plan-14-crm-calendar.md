# CRM, bucata 5: discuțiile în Google Calendar · planul de implementare

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fiecare closer își conectează Google Calendar-ul de pe „Program”. Discuțiile programate în CRM intră singure în calendarul lui, iar orele în care e ocupat acolo apar gri, tăiate, la „Programează discuția”.

**Architecture:** O coadă în Postgres (`calendar_coada`), umplută de trigger-e pe `discutii` și `lead_uri`. Așa nu scapă nicio cale pe care se schimbă o discuție: programarea, schimbarea stării, schimbarea closerului, `muta_lead_uri`, cascadele, anonimizarea. Un modul de server, `lib/calendar/coada.ts`, golește coada cu cheia de serviciu și vorbește cu Google prin `lib/calendar/google.ts`, care are `fetch` injectabil. Coada se golește după acțiuni (`after()`), la deschiderea fișei sau a paginii „Azi”, la „Reîncearcă” și în jobul zilnic. Orele ocupate se cer live la Google (`freeBusy`) când se deschide „Programează”. Cheia Google (refresh token) stă criptată AES-256-GCM într-o tabelă fără niciun drept pentru utilizatori.

**Tech Stack:** Next.js 16 (App Router, `after` din `next/server`), TypeScript, Tailwind, Supabase (Postgres, `@supabase/ssr`, `@supabase/supabase-js`), `node:crypto`, Google OAuth 2.0 + Calendar API v3 prin `fetch` (fără pachet nou), vitest (unit + RLS pe baza de test), Playwright.

**Spec:** `docs/superpowers/specs/2026-11-16-crm-calendar-design.md` (aprobat). Macheta: `prototip/crm-calendar.html`, varianta **A · Gri tăiat**.

## Global Constraints

- Totul în română, cu diacritice cu virgulă (ș, ț), niciodată cu sedilă. Tonul din `CLAUDE.md`. Vocea la singular în textele pentru Andrei.
- Doar **discuțiile** ajung în calendar. Callback-urile, task-urile și tranșele nu.
- Evenimentul: în calendarul **`primary`** al closerului. Titlu `Discuție · {nume}`. Descrierea are trei rânduri: `Telefon: {telefon}`, `Serviciu: {ETICHETE.serviciu[...]}` și `Fișa: https://crm.buildwithac.ro/lead-uri/{id}` (domeniul din `CRM.url`, `lib/config.ts`). **Fără invitați, fără Meet, fără `reminders`** (rămâne memento-ul implicit al omului).
- Orele ocupate se citesc **doar din `primary`**, pe 14 zile, cu `freeBusy`, timp maxim **3 s**. Răspunsul nu se scrie nicăieri.
- Ora ocupată arată ca în varianta A: fundal transparent, contur `1px dashed var(--line-2)`, text `var(--ink-3)`, tăiată, `opacity .7`, neapăsabilă. Are `title` „Ocupat în Google Calendar” sau „Altă discuție”. Legenda: „liberă” / „ocupată (Google Calendar sau altă discuție)”.
- Textele fixe, din machetă: alerta „{Nume} n-a conectat Google Calendar. Vezi orele din programul lui din CRM; ce are în Google nu apare aici.”; alerta „Nu pot citi acum Google Calendar-ul lui {Nume}. Vezi doar programul din CRM. Poți programa, dar verifică-i ora la telefon.”; pe fișă: „✓ În Google Calendar”, „N-a ajuns în calendar” + „Reîncearcă”, „{Nume} n-are Google Calendar conectat”. Cardul de pe „Program” are cele trei stări din machetă: „Conectează Google Calendar”, „Google Calendar · conectat” + „Deconectează”, „Google Calendar · legătura a căzut” + „Conectează din nou”.
- O acțiune din CRM **nu așteaptă și nu pică** din cauza Google: sincronizarea rulează în `after()`, iar erorile ajung doar în coadă și pe fișă.
- Cheia Google nu se citește niciodată prin sesiunea utilizatorului. Doar `admin()` (cheia de serviciu) atinge `google_conexiuni` și `calendar_coada`.
- **„Deconectează”** șterge întâi toate evenimentele create de CRM în calendarul omului, și pe cele trecute, apoi revocă cheia și o uită. Ștergerile care pică se numără și se arată. **Oprirea contului** unui om din „Echipa” (`seteazaActiv(id, false)`; aplicația nu are ștergere de om) face aceeași curățenie.
- Anonimizarea și ștergerea lead-ului șterg din Google **toate** evenimentele lui, și pe cele trecute. Clienții nu se ating.
- Schimbarea numelui sau a telefonului lead-ului actualizează doar evenimentele **viitoare**.
- Variabilele de mediu noi sunt `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` și `GOOGLE_CHEIE_CRIPTARE` (32 de octeți, base64). Pentru teste mai sunt `GOOGLE_API_URL` (implicit `https://www.googleapis.com`), `GOOGLE_TOKEN_URL` (implicit `https://oauth2.googleapis.com/token`) și `GOOGLE_REVOKE_URL` (implicit `https://oauth2.googleapis.com/revoke`). Fără `GOOGLE_CLIENT_ID`, cardul de pe „Program” nu apare, iar restul CRM-ului merge ca azi.
- Înainte de cod Next.js: `crm/AGENTS.md`. Tema existentă (`crm/app/tema.css`). Laptopul pe primul loc; la 390px doar să meargă.
- Migrația se aplică **doar pe test**. Andrei o urcă cu `! cd "/c/Portofoliu AC/crm" && npm run sb -- db push --remote --yes`. Pe producție merge doar la Task 9, după „da”-ul lui.
- Comenzile se rulează din `crm/`. Commit-urile sunt în română și se termină cu `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Ramura e `crm-calendar`. Fișierele își păstrează terminațiile de rând (LF și CRLF amestecate).
- Testele care pun discuții folosesc ore departe în viitor (tiparul `peste()` din `tests/rls/programari.test.ts`) și își șterg rândurile la final, inclusiv rândurile din `calendar_coada` și `google_conexiuni`.
- Testele nu vorbesc niciodată cu Google-ul adevărat: în unit și RLS se folosește un `fetch` fals, în e2e serverul fals `tests/e2e/google-fals.mjs`.

## Review Focus

1. **Google pică sau tace la programare:** programarea reușește, lead-ul e „programat”, iar fișa arată „N-a ajuns în calendar”. La „Reîncearcă”, cu Google înapoi, apare „✓ În Google Calendar”. → test în Task 4 (coada, `fetch` care aruncă) și în Task 8 (e2e, serverul fals întoarce 503).
2. **Omul a scos accesul din contul Google** (`invalid_grant` la reîmprospătare): conexiunea trece în `cazut`, cardul arată „legătura a căzut”, „Programează” arată alerta „Nu pot citi…” și nu crapă. După reconectare, discuțiile rămase intră singure. → test în Task 4 și în Task 6.
3. **Două goliri ale cozii în același timp** (`after()` și cron, sau două tab-uri) nu creează două evenimente pentru aceeași discuție. → test în Task 4 (două `golesteCoada` în paralel, un singur POST).
4. **Schimbarea închisă în masă:** `muta_lead_uri` mută discuțiile viitoare la alt closer. Fiecare dispare din calendarul vechi și apare în cel nou. Discuția ștearsă prin cascadă (lead șters) înainte să fi ajuns în Google nu lasă nimic în urmă. → test în Task 1 (trigger-ele) și în Task 4.
5. **Callerul deschide „Programează” pentru alt closer:** vede doar gri, fără titluri, iar adresa Gmail a closerului nu ajunge la el. `calendar_stari()` întoarce `email` doar pentru sine și pentru Admin. → test în Task 1.

---

## File Structure

| Fișier | Ce face |
|---|---|
| `crm/supabase/migrations/20261116000014_calendar.sql` (nou) | `google_conexiuni`, `calendar_coada`, coloanele noi pe `discutii`, trigger-ele care umplu coada, `calendar_ia_din_coada`, `calendar_stari` |
| `crm/lib/calendar/criptare.ts` (nou, `server-only`) | `cripteaza`, `decripteaza` (AES-256-GCM) |
| `crm/lib/calendar/eveniment.ts` (nou, pur) | `corpEveniment` |
| `crm/lib/calendar/google.ts` (nou, `server-only`) | apelurile HTTP către Google, cu `fetch` injectabil |
| `crm/lib/calendar/coada.ts` (nou, `server-only`) | `golesteCoada`, `deconecteaza`, `ocupatGoogle` |
| `crm/lib/calendar/dupa.ts` (nou, `server-only`) | `sincronizeazaDupa()`, adică `after()` + `golesteCoada` |
| `crm/app/api/google/conectare/route.ts`, `crm/app/api/google/intoarcere/route.ts` (noi) | conectarea OAuth |
| `crm/app/(app)/program/page.tsx`, `crm/app/(app)/program/actiuni.ts` | cardul Google, „Deconectează” |
| `crm/components/calendar/CardGoogle.tsx` (nou) | cardul cu cele 3 stări |
| `crm/lib/sloturi.ts`, `crm/components/CalendarSloturi.tsx`, `crm/app/(app)/lead-uri/[id]/programeaza/page.tsx`, `crm/app/tema.css` | orele gri |
| `crm/components/calendar/RandCalendar.tsx` (nou), `crm/app/(app)/lead-uri/[id]/page.tsx`, `crm/app/(app)/lead-uri/[id]/actiuni.ts` | rândul de pe fișă, „Reîncearcă”, sincronizarea după acțiuni |
| `crm/app/(app)/lead-uri/actiuni.ts`, `crm/app/(app)/echipa/actiuni.ts`, `crm/app/(app)/azi/page.tsx`, `crm/app/api/cron/zilnic/route.ts`, `crm/lib/intrare.ts` | sincronizarea după acțiuni, curățenia la oprirea contului, cron-ul |
| teste: `crm/tests/rls/calendar.test.ts`, `crm/tests/rls/calendar-coada.test.ts`, `crm/tests/unit/calendar-criptare.test.ts`, `crm/tests/unit/calendar-eveniment.test.ts`, `crm/tests/unit/calendar-google.test.ts`, `crm/tests/unit/sloturi.test.ts`, `crm/tests/e2e/calendar.spec.ts`, `crm/tests/e2e/google-fals.mjs`, `crm/playwright.config.ts` | |

---

### Task 0: Planul pe ramură

- [ ] **Step 1:** pe `crm-calendar`, `git status` e curat, apoi:

```bash
git add docs/superpowers/plans/2026-11-16-plan-14-crm-calendar.md
git commit -m "docs: planul calendarului din CRM"
```

---

### Task 1: Migrația (tabelele, coada, trigger-ele)

**Files:**
- Create: `crm/supabase/migrations/20261116000014_calendar.sql`
- Modify: `crm/lib/baza.types.ts` (regenerat cu `npm run tipuri`)
- Test: `crm/tests/rls/calendar.test.ts`

**Interfaces:**
- Produces:
  - `google_conexiuni(om_id uuid pk → profiluri on delete cascade, email text not null, refresh_criptat text not null, stare text not null check in ('ok','cazut') default 'ok', conectat_la timestamptz default now())`. RLS pornit, **nicio regulă și niciun `grant`** pentru `authenticated`/`anon`.
  - `discutii` + `google_event_id text null`, `google_om_id uuid null` (în calendarul cui e evenimentul; fără FK), `calendar_stare text null check in ('ok','eroare','neconectat')` (null = în așteptare).
  - `calendar_coada(id bigint identity pk, actiune text check in ('scrie','sterge'), discutie_id uuid null, om_id uuid null, event_id text null, incercari int default 0, ultima_eroare text null, luat_la timestamptz null, creat_la timestamptz default now())`, fără FK. Index unic parțial `(discutie_id) where actiune = 'scrie'`: un singur „scrie” per discuție. RLS pornit, fără drepturi pentru utilizatori.
  - trigger-e `security definer`, care scriu în coadă:
    - `discutii` **insert**: `scrie(discutie_id)`;
    - `discutii` **update** de `incepe_la`/`sfarseste_la`: `scrie`. Update de `closer_id` cu `google_event_id` pus: `sterge(om_id = old.google_om_id, event_id = old.google_event_id)`, apoi `google_event_id`/`google_om_id`/`calendar_stare` = null pe rând și `scrie`. Update de `neprezentat_la`: nimic;
    - `discutii` **delete** (inclusiv cascadă), cu `old.google_event_id` pus: `sterge(old.google_om_id, old.google_event_id)`. Ștergerea scoate și „scrie”-ul în așteptare al discuției;
    - `lead_uri` update cu `anonimizat_la` din null în valoare: `sterge` pentru **toate** discuțiile lead-ului care au `google_event_id` (apoi coloanele pe null) și scoate „scrie”-urile lor;
    - `lead_uri` update de `nume`/`telefon`: `scrie` pentru discuțiile **viitoare** ale lead-ului.
  - `calendar_ia_din_coada(limita int, p_discutie uuid default null, p_om uuid default null) returns setof calendar_coada`: ia cu `for update skip locked` rândurile cu `luat_la` null sau mai vechi de 2 minute, filtrate opțional, le pune `luat_la = now()` și le întoarce. Doar `service_role` are `execute`.
  - `calendar_stari() returns table(om_id uuid, conectat boolean, stare text, email text)`: pentru oamenii activi cu rol `closer`/`admin`. `email` e null pentru oricine nu e el însuși sau Admin. `execute` pentru `authenticated`; verifică `rol_curent()` înăuntru (constructorul nu primește nimic).

- [ ] **Step 1: Testele care pică**, în `crm/tests/rls/calendar.test.ts` (tiparul din `programari.test.ts`):
  - `programarea pune un „scrie” în coadă`: `programeaza_discutie`, apoi un rând `actiune='scrie'` cu `discutie_id`;
  - `reprogramarea nu dublează „scrie”`: două programări ale aceluiași lead, apoi cel mult un „scrie” pe discuția nouă și niciunul pe cea veche (ștearsă);
  - `schimbarea closerului cu eveniment pus`: (prin `admin()`) se pune `google_event_id='ev1'`, `google_om_id=closer`, apoi `muta_lead_uri(closer, closer2)` → în coadă `sterge(om=closer, event='ev1')` + `scrie(discutie)`, iar pe discuție `google_event_id` e null;
  - `lead șters prin cascadă`: discuția cu `google_event_id='ev2'`, apoi `delete` pe lead → `sterge(event='ev2')`, iar „scrie”-ul rămas al discuției dispare;
  - `anonimizarea șterge și evenimentele trecute`: o discuție din trecut și una viitoare, ambele cu `google_event_id`; `update lead_uri set anonimizat_la = now()` → două rânduri `sterge`;
  - `numele schimbat atinge doar viitorul`: o discuție trecută și una viitoare; `update nume` → un singur „scrie”, pe cea viitoare;
  - `nimeni nu citește cheile`: `conecteazaCa("admin").from("google_conexiuni").select()` și `.from("calendar_coada").select()` → eroare sau `[]`;
  - `calendar_stari ascunde e-mailul`: conexiune de test pentru `closer` (prin `admin()`); callerul vede `conectat=true`, `email=null`; closerul își vede e-mailul; Adminul îl vede; constructorul primește `[]`.
- [ ] **Step 2:** `npm run test:rls -- calendar`. Rezultatul așteptat: FAIL (tabelele lipsesc).
- [ ] **Step 3:** Scrie migrația. Trigger-ele de pe `discutii` sunt `after` și `for each row`. Cel de pe `lead_uri` rulează după cele existente (`discutii_dupa_lead`). Toate funcțiile au `set search_path = ''` și `revoke ... from public, anon, authenticated` (în afară de `calendar_stari`).
- [ ] **Step 4:** Îi ceri lui Andrei să urce migrația pe **test**: `! cd "/c/Portofoliu AC/crm" && npm run sb -- db push --remote --yes`. Apoi `npm run tipuri`.
- [ ] **Step 5:** `npm run test:rls -- calendar` → PASS. `npm run test:rls` (toată suita) → PASS (`programari`, `kpi`, `retentie`, `revizie` neatinse).
- [ ] **Step 6:** Commit: `crm: calendarul, migrația (coada, cheile Google, trigger-ele)`.

---

### Task 2: Criptarea și evenimentul (pure)

**Files:**
- Create: `crm/lib/calendar/criptare.ts`, `crm/lib/calendar/eveniment.ts`
- Test: `crm/tests/unit/calendar-criptare.test.ts`, `crm/tests/unit/calendar-eveniment.test.ts`

**Interfaces:**
- Produces:
  - `cripteaza(text: string, cheie?: string): string` și `decripteaza(sir: string, cheie?: string): string`. Cheia implicită e `process.env.GOOGLE_CHEIE_CRIPTARE`. Formatul e `v1.<iv b64url>.<tag b64url>.<date b64url>`. Aruncă eroare la cheie greșită sau text modificat.
  - `type DateEveniment = { leadId: string; nume: string; telefon: string | null; serviciu: Serviciu | null; incepe: string; sfarseste: string }`
  - `corpEveniment(d: DateEveniment): { summary: string; description: string; start: { dateTime: string; timeZone: "Europe/Bucharest" }; end: {...} }`

- [ ] **Step 1: Testele care pică:**
  - `cripteaza/decripteaza dus-întors` dă același text;
  - două criptări ale aceluiași text dau șiruri diferite (IV nou);
  - `decripteaza` cu altă cheie sau cu un caracter schimbat aruncă eroare;
  - `corpEveniment` dă `summary === "Discuție · Cafeneaua Colț"`, iar `description` conține exact `Telefon: 0722 000 000`, `Serviciu: Site făcut de la zero` și `Fișa: https://crm.buildwithac.ro/lead-uri/<id>`; `start.timeZone === "Europe/Bucharest"`;
  - fără telefon sau fără serviciu, rândul respectiv lipsește (nu apare „null”);
  - obiectul nu are `attendees`, `conferenceData` sau `reminders`.
- [ ] **Step 2:** `npx vitest run calendar-criptare calendar-eveniment` → FAIL.
- [ ] **Step 3:** Implementează. Criptarea: `createCipheriv("aes-256-gcm", Buffer.from(cheie, "base64"), iv12)`. Eticheta serviciului vine din `ETICHETE.serviciu` (`lib/stari.ts`), iar domeniul din `CRM.url`.
- [ ] **Step 4:** Testele → PASS. Commit: `crm: calendarul, criptarea cheii și corpul evenimentului`.

---

### Task 3: Clientul Google

**Files:**
- Create: `crm/lib/calendar/google.ts`
- Test: `crm/tests/unit/calendar-google.test.ts`

**Interfaces:**
- Produces (fiecare funcție primește `f: typeof fetch = fetch` ca ultim parametru):
  - `SCOPURI: string[]`, adică `openid`, `email`, `https://www.googleapis.com/auth/calendar.events` și `https://www.googleapis.com/auth/calendar.freebusy`. **Pasul 1 verifică numele în documentația Google** (developers.google.com/workspace/calendar/api/auth). Dacă `calendar.freebusy` nu există sau nu acoperă `freeBusy.query`, alege cel mai îngust scope care o acoperă și scrie motivul în comentariu.
  - `urlConectare(o: { redirect: string; stare: string }): string`: `https://accounts.google.com/o/oauth2/v2/auth`, cu `access_type=offline`, `prompt=consent`, `include_granted_scopes=true` și `response_type=code`.
  - `schimbaCod(cod: string, redirect: string, f?): Promise<{ refresh: string; email: string }>`: e-mailul se ia din `id_token` (partea din mijloc, decodată; vine direct de la Google prin TLS, nu se verifică semnătura).
  - `tokenAcces(refresh: string, f?): Promise<string>`: aruncă `GoogleCazut` la `invalid_grant`, altfel `GoogleEroare`.
  - `scrieEveniment(acces: string, corp: object, eventId: string | null, f?): Promise<string>`: `POST .../calendar/v3/calendars/primary/events` sau `PATCH .../events/{id}`. Un 404/410 la PATCH face POST. Întoarce `id`.
  - `stergeEveniment(acces: string, eventId: string, f?): Promise<void>`: 404/410 = gata.
  - `ocupat(acces: string, de: Date, pana: Date, f?): Promise<{ de: Date; pana: Date }[]>`: `POST .../calendar/v3/freeBusy` cu `items: [{ id: "primary" }]` și `AbortSignal.timeout(3000)`.
  - `revoca(refresh: string, f?): Promise<void>`: nu aruncă.
  - `class GoogleCazut extends Error` și `class GoogleEroare extends Error`.
  - Adresele de bază vin din `GOOGLE_API_URL`, `GOOGLE_TOKEN_URL` și `GOOGLE_REVOKE_URL` (cu valorile implicite din Global Constraints).

- [ ] **Step 1: Testele care pică** (cu `fetch` fals care înregistrează cererile):
  - `urlConectare` conține `access_type=offline`, `prompt=consent`, toate scope-urile și `state`;
  - `schimbaCod` trimite `grant_type=authorization_code` și întoarce `refresh` și e-mailul din `id_token`;
  - `tokenAcces` cu răspuns 400 `{"error":"invalid_grant"}` → `GoogleCazut`; cu 500 → `GoogleEroare`;
  - `scrieEveniment(…, null)` → POST; `scrieEveniment(…, "ev1")` → PATCH pe `/events/ev1`; PATCH cu 404 → POST;
  - `stergeEveniment` cu 410 nu aruncă;
  - `ocupat` transformă `calendars.primary.busy` în intervale `Date`; un `fetch` care nu răspunde în 3 s → aruncă (se testează cu timere false sau cu un semnal deja anulat).
- [ ] **Step 2:** `npx vitest run calendar-google` → FAIL.
- [ ] **Step 3:** Implementează.
- [ ] **Step 4:** PASS. Commit: `crm: calendarul, clientul Google`.

---

### Task 4: Coada și deconectarea

**Files:**
- Create: `crm/lib/calendar/coada.ts`, `crm/lib/calendar/dupa.ts`
- Test: `crm/tests/rls/calendar-coada.test.ts` (pe baza de test, cu `admin()` și `fetch` fals)

**Interfaces:**
- Consumes: Task 1 (tabelele, `calendar_ia_din_coada`), Task 2, Task 3.
- Produces:
  - `golesteCoada(db: SupabaseClient<Database>, f?: typeof fetch, o?: { discutie?: string; om?: string; limita?: number }): Promise<{ facute: number; esuate: number }>`. Limita implicită e 20. Pentru fiecare rând luat:
    - `scrie`: citește discuția și lead-ul. Dacă discuția nu mai există, rândul se scoate. Dacă closerul n-are conexiune, `calendar_stare='neconectat'` și rândul se scoate. Dacă evenimentul e în calendarul altcuiva (`google_om_id` ≠ closer), se pune `sterge` pentru cel vechi și se creează unul nou. Altfel `scrieEveniment` → `google_event_id`, `google_om_id`, `calendar_stare='ok'`, rândul se scoate;
    - `sterge`: fără conexiune pentru `om_id`, rândul se scoate. Altfel `stergeEveniment`, apoi rândul se scoate;
    - la eroare: `incercari+1`, `ultima_eroare`, `luat_la=null`, `calendar_stare='eroare'` (doar la `scrie`). La `GoogleCazut` se pune și `google_conexiuni.stare='cazut'`;
    - cheile se decriptează o singură dată pe om, într-o golire.
  - `deconecteaza(db, omId: string, f?): Promise<{ nesterse: number }>`: golește întâi coada omului (`om`). Apoi șterge toate evenimentele din `discutii where google_om_id = omId`, pune coloanele pe null, `revoca`, șterge conexiunea și rândurile `sterge` rămase ale omului. Ce n-a mers se numără în `nesterse`.
  - `ocupatGoogle(db, omId: string, de: Date, pana: Date, f?): Promise<{ stare: "ok"; ocupate: Interval[] } | { stare: "neconectat" | "nu_pot" }>`: `nu_pot` la orice eroare sau timeout. La `GoogleCazut` pune și `stare='cazut'`.
  - `sincronizeazaDupa(o?: { discutie?: string }): void` (în `dupa.ts`): `after(() => golesteCoada(admin(), fetch, o).catch(console.error))`.

- [ ] **Step 1: Testele care pică:**
  - `scrie creează evenimentul`: conexiune de test (`cripteaza("r1")`), programare, `golesteCoada` cu `fetch` fals (token → `a1`, POST → `{id:"ev9"}`) → discuția are `google_event_id='ev9'`, `calendar_stare='ok'`, iar coada e goală;
  - `reprogramarea face PATCH`: după cel de sus, schimbi `incepe_la` → următoarea golire trimite un PATCH pe `/events/ev9`;
  - `Google aruncă`: `fetch` care aruncă → `calendar_stare='eroare'`, `incercari=1`, rândul rămâne; a doua golire cu `fetch` bun → `ok`;
  - `invalid_grant`: conexiunea devine `cazut`, iar discuția `eroare`;
  - `fără conexiune`: `calendar_stare='neconectat'`, coada e goală, niciun `fetch`;
  - `două goliri în paralel`: `Promise.all([golesteCoada(...), golesteCoada(...)])` pe aceeași discuție → **un singur** POST;
  - `deconecteaza`: două discuții cu eveniment (una trecută) → două DELETE, un apel de revocare, conexiunea ștearsă, `nesterse=0`; cu un DELETE care întoarce 500 → `nesterse=1`, iar conexiunea e ștearsă oricum;
  - `ocupatGoogle`: `fetch` fals cu `busy` → `{stare:"ok", ocupate:[…]}`; fără conexiune → `neconectat`; `fetch` care aruncă → `nu_pot`.
- [ ] **Step 2:** `npm run test:rls -- calendar-coada` → FAIL.
- [ ] **Step 3:** Implementează.
- [ ] **Step 4:** PASS, plus `npm run test:rls -- calendar`. Commit: `crm: calendarul, coada și deconectarea`.

---

### Task 5: Conectarea și cardul de pe „Program”

**Files:**
- Create: `crm/app/api/google/conectare/route.ts`, `crm/app/api/google/intoarcere/route.ts`, `crm/components/calendar/CardGoogle.tsx`
- Modify: `crm/app/(app)/program/page.tsx`, `crm/app/(app)/program/actiuni.ts`, `crm/app/(app)/echipa/actiuni.ts` (`seteazaActiv`)

**Interfaces:**
- Consumes: Task 3 (`urlConectare`, `schimbaCod`), Task 4 (`golesteCoada`, `deconecteaza`), Task 2 (`cripteaza`).
- Produces:
  - `GET /api/google/conectare`: doar `admin`/`closer` conectat. Pune cookie-ul `google_stare` (aleator, httpOnly, `sameSite=lax`, 10 minute) și redirecționează la `urlConectare` cu `redirect = ${origin}/api/google/intoarcere`.
  - `GET /api/google/intoarcere`: verifică `state` față de cookie (altfel `/program?google=eroare`). La `error=access_denied` → `/program?google=anulat`. Altfel `schimbaCod` → upsert `google_conexiuni` (`stare='ok'`), apoi `scrie` în coadă pentru toate discuțiile **viitoare** ale omului fără `calendar_stare='ok'`, apoi `golesteCoada({om})` și `/program?google=ok`.
  - `deconecteazaGoogle(): Promise<Rezultat & { nesterse?: number }>` în `program/actiuni.ts` (doar pentru sine).
  - `CardGoogle({ stare: "neconectat" | "ok" | "cazut"; email: string | null; alCuiNume: string | null; mesaj: "ok" | "anulat" | "eroare" | null })`: cu `alCuiNume` (Adminul pe programul altcuiva) arată doar un chip cu starea, fără butoane. Adresa de e-mail trece prin `<Ascuns>` (modul filmare).

- [ ] **Step 1:** Pe `program/page.tsx`, cardul stă deasupra `FormularProgram` doar când `GOOGLE_CLIENT_ID` e setat. Starea vine din `calendar_stari()`. Textele sunt cele din machetă (ecranul 2). Mesajul `?google=` apare o singură dată, deasupra cardului: „Gata, calendarul e conectat.” / „N-ai dat acces. Calendarul nu e conectat.” / „Conectarea n-a mers. Încearcă din nou.”
- [ ] **Step 2:** „Deconectează” e un buton cu confirmare, în tiparul butoanelor de ștergere existente. Textul: „Scot din Google Calendar toate discuțiile puse de CRM și opresc legătura. Continui?”. După ce merge: cu `nesterse > 0` apare „{n} evenimente n-au putut fi șterse. Șterge-le de mână din Google Calendar.”
- [ ] **Step 3:** În `seteazaActiv(id, false)`, după oprirea reușită: `after(() => deconecteaza(admin(), id))`.
- [ ] **Step 4:** `npx tsc --noEmit -p .` și `npm run lint` → curate. Commit: `crm: calendarul, conectarea Google pe „Program”`.

(Testul conectării cap-coadă se face la Task 7, cu Google-ul adevărat, și în e2e, Task 8, cu serverul fals.)

---

### Task 6: Orele gri la „Programează discuția”

**Files:**
- Modify: `crm/lib/sloturi.ts`, `crm/components/CalendarSloturi.tsx`, `crm/app/(app)/lead-uri/[id]/programeaza/page.tsx`, `crm/app/tema.css`
- Test: `crm/tests/unit/sloturi.test.ts`

**Interfaces:**
- Consumes: Task 4 (`ocupatGoogle`).
- Produces:
  - `type Slot = { la: Date; ocupat: null | "discutie" | "google" }`
  - `sloturiCuOcupate(program: ZiProgram[], durataMin: number, discutii: Interval[], google: Interval[], acum: Date, zile: number): Slot[]`. Discuția câștigă când o oră e și una, și alta. Orele de peste mai puțin de o oră rămân **scoase**, nu gri.
  - `sloturiLibere` rămâne, ca `sloturiCuOcupate(...).filter(s => !s.ocupat).map(s => s.la)` (testele vechi trec neschimbate).
  - `CalendarSloturi({ leadId, closerId, zile: { zi: string; sloturi: { la: string; ora: string; ocupat: Slot["ocupat"] }[] }[] })`.

- [ ] **Step 1: Testele care pică**, în `sloturi.test.ts`:
  - un interval Google 12:00–13:00 face ca 12:00 și 12:30 să fie `"google"`, iar 11:30 și 13:00 să rămână libere;
  - un interval Google 12:10–12:20 (parțial) face ca 12:00 să fie `"google"`;
  - o discuție la 14:00 → `"discutie"`, chiar dacă Google are și el ocupat la 14:00;
  - testele existente ale `sloturiLibere` trec.
- [ ] **Step 2:** `npx vitest run sloturi` → FAIL. **Step 3:** Implementează. **Step 4:** PASS.
- [ ] **Step 5:** Pe pagină: `ocupatGoogle(admin(), ales.id, acum, pana)` în paralel cu citirile existente. Alerta (`.alerta`) pentru `neconectat` / `nu_pot` (textele din Global Constraints) apare doar când `GOOGLE_CLIENT_ID` e setat. Legenda stă deasupra zilelor. Un `<span class="chip slot ocupat num" data-testid="slot-ocupat" title=…>` pentru orele ocupate. Mesajul „Closerul n-are ore libere…” apare doar când nu există nicio oră liberă.
- [ ] **Step 6:** În `tema.css`, lângă `.chip.slot`: `.chip.slot.ocupat` (varianta A, valorile din Global Constraints, `cursor: default`).
- [ ] **Step 7:** `npx tsc --noEmit -p .`, `npm run lint`, `npx vitest run`. Commit: `crm: calendarul, orele ocupate gri la „Programează”`.

---

### Task 7: Fișa, sincronizarea după acțiuni, „Azi”, cron-ul + aplicația Google cu Andrei

**Files:**
- Create: `crm/components/calendar/RandCalendar.tsx`
- Modify: `crm/app/(app)/lead-uri/[id]/page.tsx`, `crm/app/(app)/lead-uri/[id]/actiuni.ts`, `crm/app/(app)/lead-uri/actiuni.ts`, `crm/app/(app)/echipa/actiuni.ts` (`mutaTot`), `crm/lib/intrare.ts`, `crm/app/(app)/azi/page.tsx`, `crm/app/api/cron/zilnic/route.ts`

**Interfaces:**
- Consumes: Task 4 (`golesteCoada`, `sincronizeazaDupa`), Task 1 (`calendar_stari`).
- Produces: `reincearcaCalendar(discutieId: string): Promise<Rezultat>` în `lead-uri/[id]/actiuni.ts`, care golește coada pentru discuție **sincron** (așteaptă), apoi `revalidatePath`. `RandCalendar({ discutieId, stare: "ok" | "eroare" | "neconectat" | null, closerNume })`.

- [ ] **Step 1:** Pe fișă, sub panoul „Acum / Urmează”, când există o discuție viitoare: `RandCalendar` cu stările din Global Constraints. `null` (în așteptare) se arată ca „N-a ajuns în calendar” doar dacă discuția e mai veche de 2 minute (`creat_la`), altfel nu se arată nimic. Selectul discuției viitoare primește și `id, calendar_stare, creat_la`. Pagina cheamă `sincronizeazaDupa({ discutie })`.
- [ ] **Step 2:** `sincronizeazaDupa()` se cheamă la finalul reușit al acțiunilor `programeaza`, `aplicaActiune`, `mutaLead`, `stergeLead`, al acțiunii din `lead-uri/actiuni.ts`, al `mutaTot` și în `lib/intrare.ts` după cererea reintrată. Pe `azi/page.tsx`: `sincronizeazaDupa()`.
- [ ] **Step 3:** În cron, după anonimizare: `const calendar = await golesteCoada(db, fetch, { limita: 200 }).catch(e => { console.error("cron zilnic: calendarul", e); return null; })`. Se adaugă `calendar` în JSON-ul răspunsului. O eroare aici nu oprește restul.
- [ ] **Step 4:** `npx tsc --noEmit -p .`, `npm run lint`, `npx vitest run`, `npm run test:rls`. Commit: `crm: calendarul, rândul de pe fișă și sincronizarea după acțiuni`.
- [ ] **Step 5: Aplicația Google, cu Andrei, pas cu pas** (un pas pe mesaj, cu numele exacte ale butoanelor, verificate pe ecran la momentul ăla; fără chei în capturi). Pe Gmail-ul buildwithac, în console.cloud.google.com:
  1. proiect nou, „buildwithac CRM”;
  2. „Google Calendar API” → Enable;
  3. „Google Auth Platform” (ecranul de consimțământ): numele aplicației „buildwithac CRM”, e-mail de suport, domeniul autorizat `buildwithac.ro`, linkul de confidențialitate `https://buildwithac.ro/confidentialitate`; audiența **External**, apoi **Publish app → In production** (altfel cheile expiră în 7 zile);
  4. „Data access”: scope-urile din `SCOPURI`;
  5. „Clients” → Web application, cu adresele de întoarcere `http://localhost:3000/api/google/intoarcere`, `https://crm.buildwithac.ro/api/google/intoarcere` și adresa fixă a ramurii din Vercel (`npx vercel ls` / aliasul ramurii `crm-calendar`) + `/api/google/intoarcere`;
  6. Andrei pune singur `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` în `crm/.env.local`, plus `GOOGLE_CHEIE_CRIPTARE` (generată de el cu `! node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`). Eu nu citesc fișierul.
- [ ] **Step 6: Punctul de control vizual.** `npm run dev`, Andrei intră cu `andrei@buildwithac.ro` pe baza de test și verifică:
  - „Conectează Google Calendar”, ecranul Google cu avertizarea și înapoi pe cardul „conectat”;
  - pune în Google Calendar ceva mâine la 12 și vede ora gri la „Programează”;
  - programează o discuție și o vede pe iPhone, în Google Calendar;
  - o reprogramează, apoi o anulează (lead-ul trece pe „Pierdut”);
  - apasă „Deconectează”.

  Ce zice el trece în jurnal. Mergem mai departe doar la „e bine”.

---

### Task 8: Testele în browser, cu Google fals

**Files:**
- Create: `crm/tests/e2e/google-fals.mjs`, `crm/tests/e2e/calendar.spec.ts`
- Modify: `crm/playwright.config.ts`

**Interfaces:**
- `google-fals.mjs`: un server `node:http` pe portul **3199**:
  - `POST /token` → `{access_token:"fals", id_token:"x.<b64url {\"email\":\"test@exemplu.ro\"}>.y", refresh_token:"r"}`;
  - `POST /calendar/v3/freeBusy` → ocupat zilnic 12:00–13:00, ora României, în tot intervalul cerut;
  - `POST`/`PATCH .../events` → `{id:"ev-<n>"}`, `DELETE` → 204;
  - `POST /revoke` → 200;
  - `POST /__pica` (`{pica:true|false}`) → face ca toate răspunsurile următoare să fie 503.
- `playwright.config.ts`: `webServer` devine o listă (serverul fals + dev cu `env: { GOOGLE_API_URL: "http://localhost:3199", GOOGLE_TOKEN_URL: "http://localhost:3199/token", GOOGLE_REVOKE_URL: "http://localhost:3199/revoke", GOOGLE_CLIENT_ID: "fals", GOOGLE_CLIENT_SECRET: "fals" }`). `GOOGLE_CHEIE_CRIPTARE` vine din `.env.local`; dacă lipsește, testul pune una de test prin `env`, iar conexiunile de test se criptează cu aceeași cheie.

- [ ] **Step 1: Testele** (conexiunea închipuită se pune prin `admin()` cu `cripteaza("r")` pentru contul de test `andrei`; programul lui acoperă 12:00 în zilele de lucru):
  - `cardul „conectat” și „Deconectează”`: cardul arată „conectat”; „Deconectează” + confirmare → cardul arată „Conectează Google Calendar”;
  - `ora de 12 e gri`: pe „Programează”, cu `andrei` ales, primul `[data-testid=slot-ocupat]` cu textul „12:00” are `title` „Ocupat în Google Calendar” și nu e buton;
  - `callerul vede gri, fără e-mail`: intră ca `mara`, aceeași oră e gri, iar pagina nu conține `test@exemplu.ro`;
  - `Google pică`: `__pica` → programezi → fișa arată „N-a ajuns în calendar”; `__pica false` → „Reîncearcă” → „✓ În Google Calendar”;
  - `neconectat`: fără conexiune, alerta „Andrei n-a conectat Google Calendar.” pe „Programează”.
- [ ] **Step 2:** Oprește orice `npm run dev` din `crm/` (Next refuză al doilea server). `npx playwright test calendar` → PASS. Apoi toată suita: `npx playwright test` (un test de logare pică uneori; dacă se întâmplă, rerulează-l o dată).
- [ ] **Step 3:** Commit: `crm: calendarul, testele în browser cu Google fals`.

---

### Task 9: Verificarea finală, previzualizarea, producția

- [ ] **Step 1:** Din `crm/`: `npx vitest run`, `npm run test:rls`, `npx playwright test`, `npx tsc --noEmit -p .`, `npm run lint`. Din `site/` (neatins, dar regula cere): `npx vitest run`, `npm run verifica`, `npm run lint`.
- [ ] **Step 2:** Întreabă-l pe Andrei înainte de verificarea cu subagent și spune-i cât consumă. Apoi `superpowers:requesting-code-review` pe ramură. Repari criticele și importantele.
- [ ] **Step 3:** Cu „da”-ul lui: `git push -u origin crm-calendar`. În Vercel (proiectul `crm`), Andrei pune `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` și `GOOGLE_CHEIE_CRIPTARE` pentru **Preview** și **Production** (pas cu pas; aceeași cheie de criptare în ambele e în regulă, conexiunile stau în baze diferite).
- [ ] **Step 4:** Andrei verifică previzualizarea pe adresa fixă a ramurii (cea înscrisă la Google), pe laptop și pe iPhone, cu `andrei@buildwithac.ro`.
- [ ] **Step 5:** La „da”: migrația pe producție, `! cd "/c/Portofoliu AC/crm" && SB_MEDIU=productie npm run sb -- db push --remote=znabkoesmtoggdmehmqp --yes` (o rulează Andrei). Apoi unirea în `main` (fast-forward), push, `npx vercel ls` ca să vezi că pornește publicarea de Production, iar `crm.buildwithac.ro/intra` răspunde 200.
- [ ] **Step 6:** Andrei se conectează pe producție cu `admin@buildwithac.ro` și Gmail-ul buildwithac. Stadiul intră în `docs/progres-brainstorming.md` și în memorie.
