# CRM, etapa 3, bucata 2: Finanțe (încasări, rate, comisioane): planul

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fiecare proiect are un plan de plată cu tranșe și scadențe. O tranșă încasată naște comisioanele oamenilor, iar Andrei le bifează când îi plătește. Pagina „Finanțe” arată dintr-o privire ce întârzie, ce urmează și ce s-a încasat.

**Architecture:** Banii stau în baza de date, în tabele noi apărate de RLS. Operațiile care mișcă bani le face câte o funcție SQL, într-o singură tranzacție: încasarea, anularea, returnarea, „Am plătit tot” și mentenanța. Paginile doar le cheamă. Calculele de afișare stau într-un fișier pur, `crm/lib/finante.ts`, testat cu vitest: etichete, stări, coloane, totaluri, planul de plată. Ce vede un om din echipă vine din două funcții `security definer` care întorc doar rândurile lui.

**Tech Stack:** Next.js 16 (App Router, Server Actions), Supabase (Postgres, RLS, plpgsql), vitest (unit + `test:rls`), Playwright, Tailwind v4 cu tema „Grafit”.

**Spec:** `docs/superpowers/specs/2026-11-12-crm-finante-design.md`. Machetele: `prototip/crm-incasari.html` (varianta A, tab-ul de pe fișă) și `prototip/crm-bani.html` (varianta B, pagina din meniu), servite cu `python -m http.server 8765` din `prototip/`. Designul mare al CRM-ului: `docs/superpowers/specs/2026-11-09-crm-design.md`.

## Ce am hotărât eu în plan (de confirmat de Andrei)

1. **Callerul și closerul stau în alt tabel decât constructorii** (`proiect_vanzari`). Astfel, procentul lor nu le deschide fișa proiectului. `proiect_oameni` rămâne doar pentru constructori, ca azi.
2. **Plata parțială taie tranșa în două.** Partea venită devine o tranșă încasată. Restul devine o tranșă nouă cu aceeași scadență și eticheta „… · rest” (de exemplu „Rata 2 din 4 · rest”). Dacă pentru tranșa veche a plecat deja e-mailul de întârziere, restul nu mai primește altul.
3. **„Urmează” la omul din echipă arată data doar pentru tranșele care n-au trecut de scadență.** Cele întârziate apar sus, cu „în așteptare” în loc de dată. Altfel omul ar vedea că un client întârzie.
4. **Când pui un constructor pe proiect, procentul e completat din procentele de bază.** Îl poți schimba înainte de „Salvează”. „Mută tot la…” pune și el procentul de bază.
5. **Coloana veche `incasat_lei` rămâne în bază, necitită, până la bucata următoare.** Pe producție, migrațiile se aplică înainte de unire. Dacă o scot acum, site-ul live ar pica câteva minute.
6. **„+ Tranșă” cere suma, data și un nume** (implicit „Tranșă”).
7. **Mentenanța își face singură tranșele cu ~35 de zile înainte.** Le face jobul zilnic și, imediat, pornirea sau schimbarea abonamentului.
8. **Execuția:** în sesiune, ca la bucata 1 (de confirmat).

## Global Constraints

- Totul în română, cu ș/ț cu virgulă (niciodată ş/ţ), în cod, mesaje, teste și date demo.
- Codul în `crm/`. Înainte de cod Next.js, citește `crm/AGENTS.md`.
- Tema „Grafit” existentă: clasele din `crm/app/tema.css` (`.panel`, `.btn`, `.chip`, `.lbl`, `.camp`, `.kv`, `.num`), fără culori hex noi în componente.
- Doar lei, sume întregi (`int`, 0–10.000.000, ca `pret_lei`); procentele `numeric(5,2)`, 0–100, citite cu `citesteProcent`.
- Comisionul = `round(suma × procent / 100)`, la leu (ca `comision()` din `crm/lib/proiecte.ts`).
- Zilele sunt în ora României (`ziuaRomaniei`, `Europe/Bucharest`). În SQL: `(now() at time zone 'Europe/Bucharest')::date`.
- Mesajele din `raise exception` (cod P0001) ajung pe ecran prin `mesajDinBaza`: se scriu în română, ca frază întreagă.
- Contul Admin nu primește niciodată comisioane. Comisioanele cu procent 0 nu se fac.
- Fără facturi, fără grafice, fără export, fără e-mailuri către oamenii din echipă.
- Totul se apără în RLS, nu doar pe ecran. Fiecare regulă de acces are test în `crm/tests/rls/`.
- Modul filmare: numele clienților și ale firmelor de pe ecranele noi stau în `<Ascuns>`. Sumele nu se blurează.
- Migrațiile se numesc `2026111300000N_<nume>.sql`. Se aplică pe **test** cu `npm run sb -- db push --remote`, apoi `npm run tipuri`. Pe **producție** se aplică doar în Task 12, cu „da”-ul lui Andrei.
- Funcțiile SQL care mișcă bani: `security definer set search_path = ''`. Refuză orice utilizator conectat care nu e Admin. Cheia de serviciu (`auth.uid() is null`) trece, pentru `npm run demo` și teste. Au `revoke … from public, anon` și `grant execute … to authenticated, service_role`.
- La final trec toate, din `crm/`: `npm test`, `npm run test:rls`, `npm run e2e`, `npm run tsc`, `npm run lint`.
- Commit-urile sunt în română și se termină cu `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **Un procent schimbat după încasare.** Comisioanele deja făcute nu se schimbă, plătite sau nu. Se completează doar cele cu „procent nestabilit”. Test RLS în Task 2.
2. **Anularea unei încasări greșite după ce Andrei a plătit deja un comision din ea.** Anularea trebuie refuzată cu mesaj, iar banii omului nu se ating. Test RLS în Task 2.
3. **Returnarea parțială când o parte din comisioane e plătită, iar alta nu.** Cel plătit primește un minus. Celui neplătit i se scade suma. Totalul omului iese corect, chiar negativ. Test RLS în Task 3 și unit pe `dePlatitOm` în Task 5.
4. **Rate cu prima zi pe 31** (sau 29–30). Lunile scurte trec pe ultima zi a lunii, nu pe 1–3 ale lunii următoare. Unit pe `adaugaLuni` în Task 5.
5. **390px cu 6 intrări în meniul de jos și trei coloane pe Finanțe.** Fără derulare orizontală, toate intrările vizibile. E2E în Task 7.

---

## Harta fișierelor

| Fișier | Ce face |
|---|---|
| `crm/supabase/migrations/20261113000001_finante.sql` | tabelele, RLS-ul, procentele de bază, callerul și closerul pe proiectele noi, mutarea `incasat_lei` în tranșe |
| `crm/supabase/migrations/20261113000002_incasari.sql` | `incaseaza`, `anuleaza_incasare`, completarea procentelor nestabilite |
| `crm/supabase/migrations/20261113000003_returnari_plati.sql` | `returneaza`, `plateste_tot`, bifa pe un rând, ștergerea clientului blocată |
| `crm/supabase/migrations/20261113000004_mentenanta.sql` | abonamentele, `genereaza_mentenanta`, `muta_taskuri` cu procentul de bază |
| `crm/supabase/migrations/20261113000005_vederi_echipa.sql` | `comisioanele_mele()`, `comisioane_viitoare()` |
| `crm/lib/finante.ts` | calculele pure: planul de plată, etichete, stări, coloane, totaluri |
| `crm/lib/alerte-finante.ts` | e-mailul de întârziere și lista pentru e-mailul de luni |
| `crm/app/(app)/clienti/[id]/actiuni-finante.ts` | acțiunile de pe tab-ul Finanțe și cardul „Oameni și procente” |
| `crm/components/fisa/Finante.tsx` | tab-ul (cronologia tranșelor, comisioanele sub ele, mentenanța, butoanele) |
| `crm/components/fisa/PlanPlata.tsx`, `Returnare.tsx`, `Abonament.tsx`, `OameniProcente.tsx` | formularele tab-ului și cardul din stânga |
| `crm/components/finante/Incaseaza.tsx` | butonul „Am încasat” + formularul lui, același pe fișă și pe pagina Finanțe |
| `crm/app/(app)/finante/page.tsx`, `actiuni.ts` | pagina din meniu, la Admin și la ceilalți |
| `crm/components/finante/*.tsx` | coloanele, „De plătit echipei”, „Procente de bază”, listele omului |

---

### Task 0: Planul pe ramură

- [ ] **Step 1:** Pe ramura `crm-finante`, unde designul și machetele sunt deja comise (d69899d): `git add docs/superpowers/plans/2026-11-13-plan-10-crm-finante.md && git commit -m "docs: planul bucății 2 a CRM-ului, „Finanțe”"`.

---

### Task 1: Tabelele, permisiunile și datele vechi

**Files:**
- Create: `crm/supabase/migrations/20261113000001_finante.sql`, `crm/tests/rls/finante.test.ts`
- Modify: `crm/lib/baza.types.ts` (generat), `crm/lib/tipuri.ts`, `crm/tests/rls/proiecte.test.ts` (dacă testul cu `incasat_lei` pică)

**Interfaces:**
- Produces (SQL):
  - `create type public.tip_transa as enum ('odata', 'avans', 'rest', 'rata', 'extra', 'mentenanta', 'inainte')`
  - `procente_baza (categorie text check in ('site','automatizari','1la1','altceva','mentenanta'), rol public.rol check in ('caller','closer','constructor'), procent numeric(5,2) null check 0–100, primary key (categorie, rol))`, cu toate cele 15 rânduri, toate cu procent gol.
  - `proiect_vanzari (proiect_id → proiecte on delete cascade, om_id → profiluri on delete cascade, procent numeric(5,2) null, adaugat_la, primary key (proiect_id, om_id))`. Trigger: la adăugare, omul trebuie să fie caller sau closer cu contul pornit („Aici se pun doar calleri și closeri cu contul pornit.”).
  - `transe (id uuid pk, proiect_id → proiecte on delete cascade, tip tip_transa, eticheta text 1–60, suma_lei int 1–10000000, scadenta date not null, incasata_la date, incasat_lei int, returnat_lei int not null default 0, returnata_la date, abonament_id uuid null, alerta_trimisa_la timestamptz, creat_la)`. Check: `(incasata_la is null) = (incasat_lei is null)` și `returnat_lei <= coalesce(incasat_lei, 0)`. Index pe `(proiect_id, scadenta)` și unul parțial pe `scadenta where incasata_la is null`.
  - `comisioane (id uuid pk, tip text check in ('comision','minus'), transa_id → transe on delete set null, proiect_id → proiecte on delete set null, om_id → profiluri on delete cascade, procent numeric(5,2) null, baza_lei int, suma_lei int null, nota text, platit_la date, creat_la)`. Check: la `minus`, `suma_lei < 0`. Index pe `(om_id) where platit_la is null`.
  - Trigger `inainte_de_transa`: o tranșă încasată nu se schimbă și nu se șterge direct. Câmpurile `incasata_la`, `incasat_lei`, `returnat_lei` și `returnata_la` se schimbă doar din funcțiile din Task 2–3. Funcțiile se recunosc după `current_setting('finante.functie', true) = '1'`, pus cu `set_config(…, true)`. Mesajul: „Tranșa e încasată. Anulează încasarea întâi.”
  - Trigger `inainte_de_comision`: un update direct poate schimba doar `platit_la`, și doar dacă `suma_lei` nu e gol („Procentul nu e stabilit încă.”). Excepții: punerea pe null a lui `proiect_id` sau `transa_id` (cascada de la ștergere) și funcțiile.
  - Trigger `dupa_proiect_nou` (after insert on `proiecte`): pune în `proiect_vanzari` callerul și closerul clientului, dacă au rolul `caller`/`closer`, cu procentul de bază pentru `(serviciu, rol)`.
- Produces (TS, `lib/tipuri.ts`): `TIPURI_TRANSA` și `type TipTransa`.

RLS:
- `procente_baza`, `transe`: doar Admin (select/insert/update/delete; la `procente_baza` doar select/update).
- `proiect_vanzari`: Admin tot; omul își citește doar rândul lui.
- `comisioane`: Admin citește tot și face update (restul îl hotărăște trigger-ul); omul își citește doar rândurile lui; fără insert/delete pentru `authenticated` (le fac doar funcțiile).

Datele vechi:
- Pentru fiecare proiect cu `incasat_lei > 0`: o tranșă `tip 'inainte'`, eticheta „Încasat înainte de Finanțe”, `suma_lei = incasat_lei`, scadența și încasarea pe data migrării.
- Pentru fiecare om cu procent > 0 pe proiect (constructorii din `proiect_oameni`): un comision plătit cu data migrării și nota „dinainte de Finanțe”.
- Pentru proiectele existente: callerul și closerul clientului în `proiect_vanzari`, cu procent gol.

- [ ] **Step 1: Scrie testele în `tests/rls/finante.test.ts`**, cu ajutoarele din `tests/rls/ajutor.ts` (`clientDeTest`, `conecteazaCa`, `idDe`, `omTemporar`):
  - `"callerul și closerul clientului intră pe proiectul nou, cu procentul de bază"`: pune `procente_baza (site, caller) = 10`, fă un client cu `caller_id = idDe("caller")`, `closer_id = idDe("closer")`, `serviciu: "site"`. `proiect_vanzari` are 2 rânduri: callerul cu `10`, closerul cu `null`. La final, golește procentul la loc.
  - `"un caller cu procent pe proiect nu vede proiectul"`: conectat ca `caller`, `from("proiecte").select("id").eq("id", proiectId)` → `[]`. `from("proiect_vanzari")` → doar rândul lui.
  - `"doar Adminul citește și scrie tranșele și procentele de bază"`: ca `caller`, `closer` și `constructor` (pus pe proiect), `select` pe `transe` și `procente_baza` → `[]`. `insert` pe `transe` → eroare sau 0 rânduri. Ca `admin`, insertul merge.
  - `"omul își vede doar comisioanele lui"`: inserează cu cheia de serviciu un comision pentru `constructor` și unul pentru `caller`. Constructorul vede 1 rând; callerul vede 1 rând, pe al lui.
  - `"nimeni nu adaugă sau nu șterge comisioane direct, nici Adminul"`: `insert` ca `admin` → eroare.
  - `"Adminul nu poate bifa direct o tranșă ca încasată"`: ca `admin`, `update({ incasata_la: azi, incasat_lei: 100 })` pe o tranșă neîncasată → eroare. Testul „o tranșă încasată nu se schimbă și nu se șterge direct” se adaugă în Task 2, după ce există `incaseaza`.
- [ ] **Step 2: Rulează-le și verifică că pică.** Run: `npm run test:rls -- finante`. Expected: FAIL (tabelele nu există).
- [ ] **Step 3: Scrie migrația `20261113000001_finante.sql`** după Interfaces. Aplic-o pe test (`npm run sb -- db push --remote`), apoi `npm run tipuri`, apoi adaugă `TIPURI_TRANSA` în `lib/tipuri.ts`.
- [ ] **Step 4: Rulează testele.** Run: `npm run test:rls`. Expected: PASS, inclusiv testele vechi (cele 86 de permisiuni).
- [ ] **Step 5: Commit:** `crm: tabelele finanțelor, permisiunile și încasatul vechi mutat în tranșe`

---

### Task 2: Încasarea și comisioanele

**Files:**
- Create: `crm/supabase/migrations/20261113000002_incasari.sql`
- Modify: `crm/tests/rls/finante.test.ts`, `crm/lib/baza.types.ts`

**Interfaces:**
- Produces:
  - `incaseaza(t uuid, suma int, zi date, peste boolean default false) returns uuid`. Pașii:
    1. Blochează tranșa (`for update`). Trebuie să fie neîncasată („Tranșa e deja încasată.”), cu `suma > 0`. Dacă `suma > suma_lei` și `not peste`: „Suma e mai mare decât tranșa. Confirmă.”
    2. Dacă `suma < suma_lei`: inserează restul, cu `suma_lei - suma`, aceeași `scadenta`, `tip`, `abonament_id` și `alerta_trimisa_la`, plus eticheta + „ · rest” (o singură dată). Tranșa veche rămâne cu `suma_lei = suma`.
    3. Pune `incasata_la = zi` și `incasat_lei = suma`.
    4. Face câte un comision pentru fiecare om cu procent din `proiect_oameni` ∪ `proiect_vanzari`, inclusiv pentru conturile oprite (rămân pe listă cât Adminul nu le scoate). Fără conturile cu rolul `admin`, fără procentul 0. Task 4 înlocuiește funcția: pentru tranșele cu `abonament_id`, lista vine din `abonament_oameni`. `baza_lei = suma`, `suma_lei = round(suma * procent / 100)` sau null dacă procentul e gol.
    5. Întoarce id-ul tranșei încasate.
  - `anuleaza_incasare(t uuid) returns void`. Refuză dacă vreun comision din tranșă e plătit („Ai plătit deja un comision din ea. Folosește returnarea.”) sau dacă `returnat_lei > 0`. Șterge comisioanele tranșei și golește câmpurile încasării. Restul tăiat la încasare rămâne tranșă separată.
  - Trigger-e `after update of procent` pe `proiect_oameni` și `proiect_vanzari`: comisioanele **neplătite cu `suma_lei` gol** ale omului de pe acel proiect, din tranșele fără abonament, primesc `procent` și `suma_lei` din noul procent. La procentul 0 se șterg. Nimic altceva nu se atinge.

- [ ] **Step 1: Adaugă testele.**
  - `"încasarea face comisioanele: constructorul 30%, callerul 10%, Adminul nimic"`: proiect cu Radu 30% și callerul 10%; tranșă de 2.000 → `incaseaza(t, 2000, azi)`. Comisioane: `[{om: constructor, suma: 600}, {om: caller, suma: 200}]`, niciunul pentru admin.
  - `"plata parțială taie tranșa: 1.200 din 2.000"`: după `incaseaza(t, 1200, azi)`, tranșa `t` are `suma_lei 1200` și e încasată. Există o tranșă nouă de 800, neîncasată, cu aceeași scadență, eticheta „… · rest”. Comisionul lui Radu e 360.
  - `"plata mai mare cere confirmare"`: `incaseaza(t, 2500, azi)` → eroarea cu „Confirmă”. Cu `peste = true` merge, iar comisionul e calculat din 2.500.
  - `"procentul schimbat după încasare nu atinge comisioanele făcute"`: încasează, schimbă procentul lui Radu de la 30 la 50. Comisionul rămâne 600.
  - `"procentul nestabilit se completează când Adminul îl pune"`: Radu fără procent. După încasare, comisionul are `suma_lei null`. După procentul 25, comisionul are 500. Comisioanele plătite deja nu se schimbă.
  - `"o tranșă încasată nu se schimbă și nu se șterge direct"`: după `incaseaza`, `update({ suma_lei: 1 })` și `delete()` ca `admin` → eroarea „Tranșa e încasată. Anulează încasarea întâi.”
  - `"anularea merge doar cât niciun comision nu e plătit"`: încasează, anulează. Tranșa e iar neîncasată și fără comisioane. Încasează din nou, plătește comisionul lui Radu, anulează → eroarea „Ai plătit deja…”.
  - `"doar Adminul încasează"`: `rpc("incaseaza", …)` ca `constructor` → eroare.
- [ ] **Step 2: Rulează și verifică că pică.** Run: `npm run test:rls -- finante`. Expected: FAIL (funcțiile nu există).
- [ ] **Step 3: Scrie migrația. Aplic-o pe test, apoi `npm run tipuri`.**
- [ ] **Step 4: Rulează testele.** Run: `npm run test:rls`. Expected: PASS.
- [ ] **Step 5: Commit:** `crm: încasarea tranșelor și comisioanele, cu procentul înghețat`

---

### Task 3: Returnarea, plata către om și ștergerea clientului

**Files:**
- Create: `crm/supabase/migrations/20261113000003_returnari_plati.sql`
- Modify: `crm/tests/rls/finante.test.ts`, `crm/tests/rls/stergere-client.test.ts`, `crm/app/(app)/clienti/[id]/actiuni.ts` (`stergeClient` folosește `mesajDinBaza`)

**Interfaces:**
- Produces:
  - `returneaza(t uuid, suma int, zi date) returns void`. Tranșa trebuie să fie încasată, cu `0 < suma <= incasat_lei - returnat_lei` („Poți returna cel mult X lei.”). Pentru fiecare comision de tip `comision` al tranșei, `parte = round(suma * procent / 100)`:
    - Dacă e neplătit: `suma_lei -= parte` și `baza_lei -= suma`. Dacă suma ajunge la ≤ 0, rândul se șterge. Dacă `suma_lei` e gol, scade doar baza.
    - Dacă e plătit: rând nou `tip 'minus'`, cu același om, proiect, tranșă și procent, `baza_lei = -suma`, `suma_lei = -parte`, `nota = 'returnare'`, neplătit.

    Apoi `returnat_lei += suma` și `returnata_la = zi`.
  - `plateste_tot(om uuid, zi date) returns int`. Totalul = suma comisioanelor neplătite cu `suma_lei` nenul, minusurile intrând cu semnul lor. Dacă totalul e ≤ 0: „Nu e nimic de plătit.” Altfel, pune `platit_la = zi` pe toate aceste rânduri, inclusiv minusurile, și întoarce totalul. Comisioanele cu procent nestabilit rămân.
  - Bifa pe un singur rând: `update comisioane set platit_la = … | null where id = …`, ca Admin, prin RLS și trigger-ul din Task 1.
  - `sterge_client(c)` (înlocuită): înainte de orice ștergere, dacă există comisioane neplătite pe proiectele clientului, inclusiv minusuri și cele cu procent nestabilit: `raise exception 'Mai ai de plătit comisioane din proiectele lui. Plătește-le întâi.'`. Comisioanele plătite rămân, cu `proiect_id` și `transa_id` puse pe null de cascadă.

- [ ] **Step 1: Adaugă testele.**
  - `"returnarea întreagă: comisionul neplătit dispare, cel plătit devine minus"`: Radu 30% (plătit) și callerul 10% (neplătit) pe o încasare de 2.000. Returnează 2.000. Callerul nu mai are comisionul. Radu are un minus de −600, neplătit. Tranșa are `returnat_lei 2000`.
  - `"returnarea parțială scade proporțional"`: returnează 500 din 2.000. Comisionul neplătit al callerului ajunge 150. Radu, plătit, primește un minus de −150.
  - `"„Am plătit tot” stinge minusurile și întoarce diferența"`: Radu are un comision nou de 900 și un minus de −600. `plateste_tot` întoarce 300, iar toate rândurile au `platit_la`.
  - `"„Am plătit tot” refuză când totalul e zero sau negativ"`: doar minusul de −600 → eroarea „Nu e nimic de plătit.”
  - `"bifa pe un rând cu procent nestabilit e refuzată"`.
  - În `stergere-client.test.ts`: `"ștergerea e blocată cât sunt comisioane de plătit"`, cu mesajul exact. `"după plată, clientul se șterge, iar comisioanele plătite rămân fără proiect"`: rândul există, cu `proiect_id null`.
- [ ] **Step 2: Rulează și verifică că pică.**
- [ ] **Step 3: Scrie migrația, aplic-o pe test, apoi `npm run tipuri`.** În `stergeClient` (din `actiuni.ts`), mesajul de eroare devine `mesajDinBaza(error, "Clientul n-a putut fi șters. Încearcă din nou.")`.
- [ ] **Step 4: Rulează testele.** Run: `npm run test:rls`. Expected: PASS.
- [ ] **Step 5: Commit:** `crm: returnările, plata către om și ștergerea clientului cu comisioane neplătite`

---

### Task 4: Mentenanța, „Mută tot la…” și vederile omului

**Files:**
- Create: `crm/supabase/migrations/20261113000004_mentenanta.sql`, `crm/supabase/migrations/20261113000005_vederi_echipa.sql`
- Modify: `crm/tests/rls/finante.test.ts`, `crm/app/api/cron/zilnic/route.ts`

**Interfaces:**
- Produces:
  - `abonamente (id, proiect_id → proiecte on delete cascade, suma_lei int 1–10000000, zi int 1–28, porneste date, oprit_la date null, creat_la)`, cu cel mult un abonament pornit pe proiect (unique parțial `where oprit_la is null`). `transe.abonament_id → abonamente on delete cascade`, plus un unique pe `(abonament_id, scadenta)`.
  - `abonament_oameni (abonament_id → abonamente on delete cascade, om_id → profiluri on delete cascade, procent numeric(5,2) null, primary key)`. RLS: doar Admin. Trigger `after update of procent`, ca la Task 2, dar pe tranșele abonamentului.
  - `genereaza_mentenanta(pana date) returns int`. Pentru fiecare abonament pornit, pentru fiecare lună: scadența = `make_date(an, luna, zi)`. Se face tranșa dacă `porneste <= scadenta <= pana` și nu există deja. Tranșa e `tip 'mentenanta'`, cu eticheta „Mentenanță ” + luna în română, cu literă mică (`ianuarie`…`decembrie`). Întoarce câte a făcut.
  - `porneste_abonament(p uuid, suma int, zi int, porneste date, om uuid) returns uuid`:
    1. Inserează abonamentul.
    2. Pune în `abonament_oameni` constructorul ales, cu procentul de bază `(mentenanta, constructor)`, chiar dacă e gol.
    3. Pune callerul și closerul din `proiect_vanzari`, doar dacă procentul lor de bază la mentenanță e > 0.
    4. Cheamă `genereaza_mentenanta(azi + 35)`.
  - `schimba_abonament(a uuid, suma int, zi int) returns void`: șterge tranșele neîncasate ale abonamentului cu `scadenta >= azi`, schimbă suma și ziua, apoi regenerează.
  - `opreste_abonament(a uuid) returns void`: `oprit_la = azi` și șterge tranșele neîncasate cu `scadenta >= azi`. Cele întârziate rămân.
  - `incaseaza` (înlocuită): pentru tranșele cu `abonament_id`, comisioanele vin din `abonament_oameni`, cu aceleași reguli. Trigger-ul de completare a procentelor nestabilite din Task 2 atinge doar tranșele fără abonament.
  - `muta_taskuri` (înlocuită): când pune omul nou pe proiect, procentul vine din `procente_baza (proiect.serviciu, constructor)`.
  - `comisioanele_mele() returns table (id uuid, tip text, client text, eticheta text, procent numeric, baza_lei int, suma_lei int, platit_la date, creat_la timestamptz)`: rândurile din `comisioane` cu `om_id = auth.uid()`. `client` e null dacă proiectul a fost șters.
  - `comisioane_viitoare() returns table (client text, proiect text, eticheta text, suma_lei int, procent numeric, comision int, scadenta date)`. Tranșele neîncasate de pe proiectele unde omul are procent: `proiect_oameni` sau `proiect_vanzari` la tranșele obișnuite, `abonament_oameni` la mentenanță. Fără procentul 0. `comision` e null dacă procentul e gol. **`scadenta` e null când e în trecut** (hotărârea 3). Ordonate după scadență.
  - Ambele funcții sunt `security definer`, cu `grant` doar pentru `authenticated`.
  - Cron-ul zilnic (`route.ts`) cheamă `rpc("genereaza_mentenanta", { pana: ziuaPeste(acum, 35) })` înainte de copia de luni. O eroare se scrie în log și nu oprește restul.

- [ ] **Step 1: Adaugă testele.**
  - `"pornirea abonamentului face tranșele lunilor până la +35 de zile"`: `porneste = azi`, `zi = 5`. Tranșele au scadențe pe 5 ale lunii, între azi și azi+35, cu eticheta „Mentenanță <luna>”. A doua chemare a `genereaza_mentenanta` întoarce 0.
  - `"comisionul de mentenanță merge la omul abonamentului, nu la lista proiectului"`: procentul de bază `(mentenanta, constructor) = 50`, încasează o tranșă de 300 → Radu 150. Callerul nu are nimic, cu procentul lui de bază la mentenanță gol.
  - `"oprirea șterge tranșele viitoare, nu și pe cele întârziate"`: inserează cu cheia de serviciu o tranșă a abonamentului cu scadența trecută, oprește. Rămâne doar cea întârziată.
  - `"comisioane_viitoare: omul își vede tranșele, fără data celor întârziate, fără proiectele altora"`. Ca `constructor` pe proiect: o tranșă viitoare (cu dată) și una întârziată (`scadenta null`). Ca `caller2`, fără procent pe proiect: `[]`.
  - `"comisioanele_mele dă «client» null după ștergerea clientului"`.
  - `"„Mută tot la…” pune omul nou cu procentul de bază"`.
- [ ] **Step 2: Rulează și verifică că pică.**
- [ ] **Step 3: Scrie cele două migrații, aplică-le pe test, apoi `npm run tipuri`. Adaugă chemarea în cron.**
- [ ] **Step 4: Rulează testele.** Run: `npm run test:rls && npm test`. Expected: PASS.
- [ ] **Step 5: Commit:** `crm: mentenanța lunară, „Mută tot la…” cu procentul de bază și vederile omului`

---

### Task 5: Calculele pure (`lib/finante.ts`)

**Files:**
- Create: `crm/lib/finante.ts`, `crm/tests/unit/finante.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export type Transa = { id: string; proiect_id: string; tip: TipTransa; eticheta: string; suma_lei: number; scadenta: string; incasata_la: string | null; incasat_lei: number | null; returnat_lei: number; abonament_id: string | null };
  export type StareTransa = "incasata" | "returnata" | "intarziata" | "urmeaza";
  export type AlegerePlan =
    | { fel: "odata"; zi: string }
    | { fel: "avans"; avans: { lei: number } | { procent: number }; ziAvans: string; ziRest: string }
    | { fel: "rate"; nr: number; primaZi: string };
  export type TransaNoua = { tip: TipTransa; eticheta: string; suma_lei: number; scadenta: string };
  export type ComisionOm = { tip: "comision" | "minus"; suma_lei: number | null; platit_la: string | null };

  export const LUNI: readonly string[]; // „ianuarie” … „decembrie”
  export function adaugaLuni(zi: string, n: number): string;
  export function planDePlata(pret: number, a: AlegerePlan): TransaNoua[];
  export function descrierePlan(t: Pick<Transa, "tip" | "abonament_id">[]): string;
  export function stareTransa(t: Transa, azi: string): StareTransa;
  export function incasatNet(t: Pick<Transa, "incasat_lei" | "returnat_lei">): number;
  export function totaluriProiect(t: Transa[]): { pret: number; incasat: number; deIncasat: number; sumaTranse: number };
  export function coloaneIncasari<T extends Transa>(t: T[], azi: string): { intarzie: T[]; urmeaza: T[]; incasate: T[]; cifre: { incasatLuna: number; programatLuna: number; urmeazaLuna: number; intarziate: number } };
  export function dePlatitOm(c: ComisionOm[]): { total: number; poatePlati: boolean; nestabilite: number };
  ```
- Regulile:
  - `adaugaLuni`: aceeași zi a lunii, iar în lunile scurte, ultima zi a lunii (`2027-01-31` + 1 → `2027-02-28`).
  - `planDePlata`:
    - „odata”: o tranșă `odata`, eticheta „Toată suma”.
    - „avans”: avansul (`lei`, sau `round(pret × procent / 100)`) plus restul, cu etichetele „Avans” și „Restul”.
    - „rate”: `floor(pret / nr)` pe fiecare rată, diferența pe ultima, scadențe lunare cu `adaugaLuni`, eticheta „Rata i din nr”.
  - `descrierePlan` (fără tranșele de mentenanță): „Tot odată”, „Avans + rest”, „N rate lunare”, „Fără plan” când nu are tranșe. Altfel, „N tranșe”.
  - `stareTransa`:
    - încasată și `returnat_lei > 0` → `returnata`;
    - încasată → `incasata`;
    - `scadenta < azi` → `intarziata`;
    - altfel `urmeaza`.
  - `totaluriProiect`: doar tranșele fără `abonament_id`. `incasat = Σ incasatNet`, `deIncasat = Σ suma_lei` pe cele neîncasate, `sumaTranse = incasat + deIncasat`. `pret` vine din proiect: funcția îl primește în plus sau îl lasă în pagină. Hotărăște implementatorul, cu testul de mai jos.
  - `coloaneIncasari` (cu mentenanța inclusă):
    - `intarzie`: neîncasate cu `scadenta < azi`, cele mai vechi sus;
    - `urmeaza`: neîncasate cu `azi <= scadenta <= azi+30`, după dată;
    - `incasate`: `incasata_la` în luna lui `azi`, cele mai noi sus.
  - Cifrele:
    - `incasatLuna` = `Σ incasatNet` din `incasate`;
    - `programatLuna` = `Σ suma_lei` al tranșelor cu scadența în luna curentă;
    - `urmeazaLuna` = neîncasate cu scadența în luna curentă și `>= azi`;
    - `intarziate` = `Σ intarzie`.
  - `dePlatitOm`: `total` = Σ `suma_lei` neplătite și nenule (minusurile negative), `poatePlati = total > 0`, `nestabilite` = câte neplătite au `suma_lei` null.

- [ ] **Step 1: Scrie testele** cu aceste valori:
  - `adaugaLuni("2027-01-31", 1)` → `"2027-02-28"`; `adaugaLuni("2028-01-31", 1)` → `"2028-02-29"`; `adaugaLuni("2026-11-13", 3)` → `"2027-02-13"`.
  - `planDePlata(6000, { fel: "rate", nr: 4, primaZi: "2026-11-30" })`: sumele `[1500, 1500, 1500, 1500]`, scadențele `["2026-11-30", "2026-12-30", "2027-01-30", "2027-02-28"]`, etichetele „Rata 1 din 4”…„Rata 4 din 4”.
  - `planDePlata(1000, { fel: "rate", nr: 3, … })` → `[333, 333, 334]`.
  - `planDePlata(6000, { fel: "avans", avans: { procent: 30 }, … })` → `[1800, 4200]`, cu etichetele „Avans” și „Restul”.
  - `stareTransa`: o tranșă cu `scadenta = azi` e `urmeaza`, una cu `scadenta = ieri` e `intarziata`.
  - `coloaneIncasari`: o tranșă cu scadența peste 31 de zile nu e în nicio coloană; o încasare din luna trecută nu e în `incasate`.
  - `dePlatitOm([{comision 900}, {minus −600}, {comision null}])` → `{ total: 300, poatePlati: true, nestabilite: 1 }`. Doar `{minus −600}` → `{ total: -600, poatePlati: false }`.
  - `totaluriProiect`: o tranșă de mentenanță încasată nu intră în `incasat`; o returnare de 500 din 2.000 dă `incasat 1500`.
- [ ] **Step 2: Rulează și verifică că pică.** Run: `npx vitest run tests/unit/finante.test.ts`. Expected: FAIL.
- [ ] **Step 3: Scrie `lib/finante.ts`.**
- [ ] **Step 4: Rulează.** Expected: PASS.
- [ ] **Step 5: Commit:** `crm: calculele finanțelor (planul de plată, stări, coloane, totaluri)`

---

### Task 6: Tab-ul „Finanțe” de pe fișa clientului

**Files:**
- Create: `crm/app/(app)/clienti/[id]/actiuni-finante.ts`, `crm/components/fisa/Finante.tsx`, `PlanPlata.tsx`, `Returnare.tsx`, `Abonament.tsx`, `OameniProcente.tsx`, `crm/components/finante/Incaseaza.tsx`, `crm/tests/e2e/finante-fisa.spec.ts`
- Modify: `crm/app/(app)/clienti/[id]/page.tsx`, `crm/components/fisa/DateProiect.tsx`, `crm/app/(app)/clienti/[id]/actiuni.ts` (`salveazaProiect` fără încasat), `crm/components/fisa/OameniProiect.tsx` (procentul precompletat), `crm/tests/e2e/clienti.spec.ts`, `crm/tests/e2e/fisa-client.spec.ts`

**Interfaces:**
- Consumes: funcțiile SQL din Task 2–4, `lib/finante.ts` (Task 5).
- Produces (acțiuni, toate `Promise<Rezultat>` din `actiuni.ts`, doar Admin, cu `mesajDinBaza`):
  - `facePlan(proiectId, a: AlegerePlan)`: refuză dacă proiectul are tranșe neîncasate fără abonament („Proiectul are deja un plan. Schimbă-l.”);
  - `schimbaPlan(proiectId, a: AlegerePlan)`: șterge tranșele neîncasate fără abonament, apoi le pune pe cele noi. Cele încasate rămân;
  - `adaugaTransa(proiectId, d: { eticheta: string; suma: string; zi: string })`, `schimbaTransa(transaId, d)`, `stergeTransa(transaId)`;
  - `incaseaza(transaId, d: { suma: string; zi: string; peste: boolean })`: data nu poate fi în viitor („Data încasării nu poate fi în viitor.”);
  - `anuleazaIncasare(transaId)`, `returneaza(transaId, d: { suma: string; zi: string })`;
  - `bifeazaComision(comisionId, platit: boolean)`;
  - `pornesteAbonament(proiectId, d: { suma: string; zi: string; porneste: string; omId: string })`, `schimbaAbonament(abonamentId, d)`, `opresteAbonament(abonamentId)`;
  - `puneVanzator(proiectId, omId, procent: string)` (upsert în `proiect_vanzari`), `scoateVanzator(proiectId, omId)`, `schimbaProcentAbonament(abonamentId, omId, procent: string)`.

  Fiecare face `revalidatePath` pe fișă, pe `/clienti` și pe `/finante`.
- `<Incaseaza transaId suma auriu? />` (client component): butonul „Am încasat” deschide suma și data, precompletate. Dacă suma e mai mare decât tranșa, cere confirmarea („Suma e mai mare decât tranșa. Încasez X lei?”), apoi trimite `peste: true`.

Ce se vede (după macheta `crm-incasari.html#A`, cu „Finanțe” în loc de „Bani”):
- **Tab-ul „Finanțe”**: îl primește în `<Taburi>` doar Admin, între „Livrat” și „Notițe”.
  - Sus: Preț, Încasat (verde), De încasat.
  - Avertismentul „Tranșele fac X din Y lei”, când `sumaTranse ≠ pret` și prețul e pus.
  - Cardurile tranșelor, după scadență, cu cele trei stări:
    - sub o tranșă încasată, rândurile comisioanelor (inițiale, nume, procent, sumă, bulina „De plătit” / „Plătit <data>”);
    - sub cea întârziată, „La încasare: Radu 30% (600 lei)…”.
  - Cardul Mentenanță.
  - Butoanele „+ Tranșă”, „Schimbă planul de plată”, „Marchează o returnare”.
  - Fără plan: textul „Proiectul n-are încă un plan de plată.” și formularul `PlanPlata`, cu cele trei feluri.
- **Coloana din stânga, la Admin:**
  - cardul „Rată întârziată” (roșu) cât timp o tranșă întârzie;
  - în cardul „Proiectul”, rândul „Încasat” = `totaluriProiect().incasat` și rândul nou „Plată” (`descrierePlan`);
  - cardul **„Oameni și procente”** (`OameniProcente`): constructorii (din `proiect_oameni`), callerul și closerul (din `proiect_vanzari`), fiecare cu procentul care se poate schimba. Se poate adăuga un caller sau closer și se poate scoate cineva de pe listă;
  - rândul „Lucrează” rămâne lista constructorilor, iar adăugarea lor se face tot prin `OameniProiect`, cu procentul precompletat din `procente_baza`.
- **Capul fișei:** chipul roșu „Rată întârziată” cât timp o tranșă întârzie.
- **`DateProiect`:** câmpul „Încasat (lei)” dispare.
- **La constructor:**
  - „Încasat” dispare;
  - „Comisionul tău” = suma comisioanelor lui pe proiect, citite din `comisioane` (RLS): „X lei primiți · Y lei de primit”, sau „nestabilit încă” când n-are niciunul și procentul e gol.

  Funcția `comision()` din `lib/proiecte.ts` rămâne doar dacă o mai folosește cineva. Altfel iese, cu testul ei.
- Numele clienților și ale oamenilor sunt în `<Ascuns>`, unde sunt nume de clienți.

- [ ] **Step 1: Scrie testele e2e în `finante-fisa.spec.ts`**, ca Admin (`andrei@`), pe un client nou făcut în test, ca în `clienti.spec.ts`:
  - `"planul în 4 rate face 4 tranșe și scrie «4 rate lunare»"`;
  - `"«Am încasat» cu suma întreagă: tranșa devine încasată, Încasat crește, sub ea apare comisionul lui Radu"`, cu Radu pus cu 30%;
  - `"plata parțială lasă un rest «· rest» cu aceeași dată"`;
  - `"tranșa întârziată arată chipul roșu în capul fișei și cardul «Rată întârziată»"` (o tranșă cu scadența ieri, inserată cu `db()`);
  - `"bulina «De plătit» devine «Plătit <data>» și se poate anula"`;
  - `"constructorul nu vede tab-ul Finanțe și nici Încasat; vede «Comisionul tău»"`.

  În `clienti.spec.ts`, testul care scria „Încasat (lei)” scrie doar prețul și termenul, iar verificarea din bază nu mai cere `incasat_lei`.
- [ ] **Step 2: Rulează-le și verifică că pică.** Run: `npx playwright test finante-fisa`. Expected: FAIL.
- [ ] **Step 3: Scrie acțiunile și componentele.**
- [ ] **Step 4: Rulează.** Run: `npx playwright test finante-fisa clienti fisa-client && npm run tsc && npm run lint`. Expected: PASS.
- [ ] **Step 5: Commit:** `crm: tab-ul Finanțe de pe fișa clientului (planul, încasarea, comisioanele, mentenanța)`

---

### Task 7: Pagina „Finanțe”, la Admin, și meniul

**Files:**
- Create: `crm/app/(app)/finante/page.tsx`, `crm/app/(app)/finante/actiuni.ts`, `crm/components/finante/Incasari.tsx`, `DePlatitEchipei.tsx`, `ProcenteBaza.tsx`, `crm/tests/e2e/finante.spec.ts`
- Modify: `crm/app/(app)/layout.tsx` (`legaturiPentru`), `crm/components/Iconite.tsx` (`"finante"`), `crm/components/Navigare.tsx` (`SCURT`, dacă trebuie)

**Interfaces:**
- Consumes: `coloaneIncasari`, `dePlatitOm`, `stareTransa` (Task 5); `<Incaseaza>` (Task 6); `bifeazaComision` (Task 6).
- Produces:
  - `platesteTot(omId: string): Promise<Rezultat>` (`plateste_tot` cu ziua de azi);
  - `schimbaProcentBaza(categorie: string, rol: Rol, procent: string): Promise<Rezultat>`.
- Meniul: `{ href: "/finante", eticheta: "Finanțe", iconita: "finante" }`, la **toate** rolurile, după „Program” la Admin (înainte de „Echipa”) și la final la ceilalți. Iconița e un SVG cu linie, ca celelalte (de exemplu o bancnotă sau un portofel).

Pagina, la Admin (după `crm-bani.html#B`):
- Titlul „Finanțe” și data de azi.
- Trei tab-uri, cu `<Taburi>`: „Încasări”, „De plătit echipei” (cu `numar` = câți oameni au rânduri neplătite) și „Procente de bază”.
- **Încasări:**
  - cele trei cifre (cu bara „din X lei programați luna asta”);
  - cele trei coloane: Întârzie (cu totalul în cap și „N zile” cu roșu), Urmează · 30 de zile, Încasate · <luna>;
  - pe fiecare card: clientul (`<Ascuns>`), eticheta, suma, data;
  - în primele două coloane, `<Incaseaza>`: auriu la cele întârziate, gri la celelalte;
  - apăsarea pe card deschide `/clienti/<id>?proiect=<id>`, dar butonul nu o declanșează;
  - pe 390px, coloanele stau una sub alta.
- **De plătit echipei:**
  - câte un bloc pe om: nume, rol, total (auriu) și numărul de comisioane;
  - rândurile: „<client> · <eticheta> (<procent>%) — <sumă>”, minusurile cu semnul minus, „client șters” când proiectul nu mai există, „procent nestabilit” fără sumă (cu link spre fișă);
  - bifă pe fiecare rând de comision (nu pe minusuri);
  - „Am plătit tot” e activ doar când `poatePlati`. Altfel, blocul arată „îți datorează X lei”.
- **Procente de bază:** tabelul 5 × 3, cu textul „Se pun singure pe fiecare proiect nou. Pe un proiect anume le schimbi din fișa clientului.” Fiecare celulă e un câmp care se salvează la ieșirea din el (`onBlur`), cu mesaj de eroare sub tabel.

- [ ] **Step 1: Scrie testele e2e în `finante.spec.ts`:**
  - `"Admin: o tranșă întârziată apare în «Întârzie», cu zilele; «✓ Am încasat» o mută în «Încasate»"`;
  - `"Admin: o tranșă peste 10 zile e în «Urmează · 30 de zile»"`;
  - `"Admin: «Am plătit tot» bifează comisioanele omului"`;
  - `"Admin: procentul de bază se salvează"`: schimbă, reîncarcă și vede valoarea;
  - `"390px: meniul de jos are 6 intrări vizibile și pagina nu se derulează pe orizontală"`: `document.documentElement.scrollWidth <= 390` pe `/finante`, `/clienti` și o fișă de client;
  - `"modul filmare: numele clienților de pe Finanțe sunt blurate"`, cu același tipar ca `filmare.spec.ts`.
- [ ] **Step 2: Rulează-le și verifică că pică.**
- [ ] **Step 3: Scrie pagina, componentele, iconița și meniul.**
- [ ] **Step 4: Rulează.** Run: `npx playwright test finante && npm run tsc && npm run lint`. Expected: PASS.
- [ ] **Step 5: Commit:** `crm: pagina Finanțe (încasări, de plătit echipei, procente de bază) și intrarea din meniu`

---

### Task 8: Pagina „Finanțe” la constructor, closer și caller

**Files:**
- Create: `crm/components/finante/ComisioaneleMele.tsx`
- Modify: `crm/app/(app)/finante/page.tsx`, `crm/tests/e2e/finante.spec.ts`, `crm/tests/rls/finante.test.ts` (dacă lipsește ceva)

**Interfaces:**
- Consumes: `rpc("comisioanele_mele")`, `rpc("comisioane_viitoare")` (Task 4).

Ce se vede:
- Fără tab-uri.
- Titlul „Finanțe”, cu subtitlul „Comisioanele tale, din banii încasați de la clienți.”
- Trei cifre: **De primit** (auriu, `dePlatitOm().total`), **Primit în <luna>** (verde) și **Urmează, dacă plătesc clienții** (`Σ comision` din viitoare).
- Trei liste:
  - De primit: neplătite, inclusiv minusurile;
  - Urmează: viitoare, cele fără dată sus, cu „în așteptare”;
  - Primite: cele mai noi sus.
- Rândul: „<client> · <eticheta> · <procent>% din <baza>” și suma. Clientul e în `<Ascuns>`, „client șters” dacă e null.

- [ ] **Step 1: Teste e2e:**
  - `"Radu își vede comisioanele, nu și ale callerului, și nu vede cuvântul «Întârzie»"`;
  - `"Mara (caller) vede «Finanțe» în meniu și doar rândurile ei"`.
- [ ] **Step 2: Rulează și verifică că pică.**
- [ ] **Step 3: Scrie vederea.**
- [ ] **Step 4: Rulează.** Run: `npx playwright test finante`. Expected: PASS.
- [ ] **Step 5: Commit:** `crm: pagina Finanțe pentru oamenii din echipă (comisioanele lor)`

---

### Task 9: Punctul de control cu Andrei (fără cod)

- [ ] **Step 1:** Pune câteva date de probă pe baza de test (un client cu plan în rate, o tranșă întârziată, o încasare cu comision), cu un script de unică folosință din scratchpad sau din ecran. `npm run demo` vine abia în Task 11.
- [ ] **Step 2:** Pornește `npm run dev` (port 3000). Arată-i lui Andrei, în browser, la 1440px și la 390px:
  - fișa clientului cu tab-ul Finanțe;
  - formularul planului de plată (toate cele trei feluri);
  - „Am încasat” cu plata parțială;
  - pagina Finanțe (cele trei tab-uri);
  - pagina ca Radu;
  - meniul de jos cu 6 intrări.
- [ ] **Step 3:** Notează ce schimbă Andrei în jurnal (`.superpowers/sdd/2026-11-13-plan-10-crm-finante/progress.md`) și fă schimbările înainte de Task 10. Fiecare schimbare are commit-ul ei.

---

### Task 10: Alertele, lista „Clienți”, „Mută tot la…” și copia de luni

**Files:**
- Create: `crm/lib/alerte-finante.ts`, `crm/tests/unit/alerte-finante.test.ts`
- Modify: `crm/app/api/cron/zilnic/route.ts`, `crm/lib/retentie.ts` (`TABELE`, `ORDINE`, lista din e-mailul de luni), `crm/tests/unit/retentie.test.ts`, `crm/app/(app)/clienti/page.tsx`, `crm/app/(app)/echipa/actiuni.ts`, `crm/components/Echipa.tsx`

**Interfaces:**
- Produces:
  ```ts
  export type TransaIntarziata = { transaId: string; clientId: string; proiectId: string; client: string; eticheta: string; suma_lei: number; scadenta: string };
  export function construiesteAlerta(t: TransaIntarziata[], azi: string): Omit<Email, "catre">;
  export async function transeIntarziate(db: Db, azi: string, doarNetrimise: boolean): Promise<TransaIntarziata[]>;
  export async function trimiteAlerteIntarziere(db: Db, f: typeof fetch, acum: Date): Promise<number>;
  ```
  - `trimiteAlerteIntarziere` ia tranșele neîncasate cu `scadenta < azi` și `alerta_trimisa_la is null` și trimite **un singur** e-mail cu toate, la `CRM.emailAdmin`. Subiectul: „Întârzie N tranșe” sau „Întârzie o tranșă”. Fiecare rând: clientul, eticheta, suma, „N zile” (`zileIntarziere`) și link-ul `CRM.url/clienti/<id>?proiect=<id>`. Abia **după** ce `trimiteEmail` întoarce `true`, pune `alerta_trimisa_la = now()` pe ele. Fără nimic de trimis, nu trimite nimic.
  - `construiesteCopia` primește un parametru în plus, `intarziate: TransaIntarziata[] = []`, și adaugă lista „Tranșe întârziate (N):”.
  - `TABELE` primește `procente_baza`, `proiect_vanzari`, `transe`, `comisioane`, `abonamente`, `abonament_oameni`. `ORDINE` primește cheile compuse: `procente_baza: ["categorie","rol"]`, `proiect_vanzari: ["proiect_id","om_id"]` și `abonament_oameni: ["abonament_id","om_id"]`.
- „Clienți”, la Admin: pe rândul proiectului, pastila roșie „Rată întârziată · N zile” (cea mai veche tranșă întârziată a proiectului).
- „Mută tot la…”: când omul plecat are rânduri în `proiect_oameni`/`proiect_vanzari` pe proiecte cu tranșe, mesajul de după mutare adaugă „Comisioanele de pe proiectele lor nu se mută singure.”

- [ ] **Step 1: Teste unit:**
  - `construiesteAlerta` cu 2 tranșe → subiectul „Întârzie 2 tranșe”, ambele linkuri, „3 zile”;
  - `trimiteAlerteIntarziere` cu un `fetch` fals care pică nu marchează nimic (Db fals, ca în testele de retenție);
  - `construiesteCopia` cu întârziate are lista;
  - `TABELE` conține tabelele noi.
- [ ] **Step 2: Rulează și verifică că pică.**
- [ ] **Step 3: Scrie codul.** Cron-ul cheamă `trimiteAlerteIntarziere` după `genereaza_mentenanta`, într-un `catch` separat.
- [ ] **Step 4: Rulează.** Run: `npm test && npx playwright test clienti echipa`. Expected: PASS.
- [ ] **Step 5: Commit:** `crm: e-mailul de întârziere, pastila de pe Clienți și finanțele în copia de luni`

---

### Task 11: `npm run demo` cu finanțe și pagina de confidențialitate

**Files:**
- Modify: `crm/scripts/date/demo-date.ts`, `crm/scripts/date/demo-scrie.mts`, `crm/scripts/date/baza.mts` (`fise()`: Laura are un plan în locul lui `incasat_lei: 1200`), `crm/scripts/demo.mts`, `crm/tests/unit/demo-date.test.ts`; poate `site/app/confidentialitate/page.tsx`

**Interfaces:**
- `ProiectDemo`: `incasat` iese și intră:
  - `plata?: AlegerePlanDemo`: ca `AlegerePlan`, cu zilele date ca „peste N zile” (`ziPesteZile`), relative la `acum`;
  - `incasari?: { rata: number; suma?: number; acumZile: number; platit?: boolean }[]`: indexul tranșei din plan; `suma` lipsă = toată; `platit` = comisioanele ei plătite cu aceeași zi;
  - `returnare?: { rata: number; suma: number; acumZile: number }`;
  - `abonament?: { suma: number; zi: number; pornitAcumZile: number; incasateLuni: number }`.
- `export const PROCENTE_BAZA_DEMO`: site 30/10/10, automatizări 40/10/10, 1 la 1 20/10/10, altceva 30/10/10, mentenanță 50/0/0 (constructor/caller/closer).
- Scrierea folosește funcțiile SQL (`incaseaza`, `returneaza`, `porneste_abonament`) cu cheia de serviciu. Comisioanele „plătite” primesc `platit_la` printr-un update.

Conținutul (pe cei 5 clienți demo existenți):
- toate cele trei feluri de plan;
- ≥ 2 tranșe întârziate (una de ~3 zile, una de ~11 zile);
- o tranșă plătită parțial;
- o returnare parțială pe o tranșă cu comisionul deja plătit, deci un minus;
- un abonament pornit, cu luna trecută încasată;
- comisioane plătite și de plătit pentru Radu, Mara și Ioana;
- ≥ 2 tranșe în următoarele 30 de zile.

Cu `--singur`:
- nimeni în afară de Admin nu e pe proiecte și nu e în `proiect_vanzari`, deci nu apar comisioane;
- procentele de bază rămân completate;
- planurile și încasările rămân.

- [ ] **Step 1: Teste unit în `demo-date.test.ts`:**
  - fiecare fel de plan apare;
  - ≥ 2 tranșe cu scadența în trecut și fără încasare;
  - o încasare parțială (`suma` < suma tranșei);
  - o returnare pe o tranșă cu `platit: true`;
  - un abonament;
  - ≥ 2 tranșe cu scadența între azi și azi+30;
  - `singur: true` → `procentRadu` lipsă peste tot.
- [ ] **Step 2: Rulează și verifică că pică.** Apoi scrie datele și scrierea.
- [ ] **Step 3: Rulează.** Run: `npm run demo && npm run demo -- --singur && npm run demo && npm test && npm run test:rls && npm run e2e`. Expected: totul trece.
- [ ] **Step 4: Capturi.** Cu un spec Playwright temporar în `tests/e2e/`, șters după, ia capturi pe `/finante` și pe o fișă cu tab-ul Finanțe:
  - ca Andrei (cu modul filmare pornit și oprit);
  - ca Radu;
  - ca Mara;
  - la 1440px și la 390px.

  Uită-te la ele: coloanele pline, nume blurate în modul filmare, fără „E2E” sau `@test.`.
- [ ] **Step 5: Pagina de confidențialitate.** Citește `site/app/confidentialitate/page.tsx`. Dacă enumeră ce ține CRM-ul despre clienți, scrie o propoziție despre plăți (sume și date ale plăților, fără date bancare) și **arat-o lui Andrei înainte de a o pune**. Dacă o pune, rulează din `site/`: `npx vitest run`, `npm run verifica`, `npm run lint`.
- [ ] **Step 6: Commit:** `crm: firma demo cu finanțe (planuri, întârzieri, comisioane, mentenanță)`

---

### Task 12: Verificarea, previzualizarea, producția și unirea

- [ ] **Step 1: Rulează verificările CRM-ului.** Din `crm/`: `npm test`, `npm run test:rls`, `npm run e2e`, `npm run tsc`, `npm run lint`. Toate trebuie să treacă.
- [ ] **Step 2: Verificarea finală.** Un subagent verifică toată ramura (`superpowers:requesting-code-review`), cu atenție la RLS și la funcțiile de bani. **Anunță-i lui Andrei consumul înainte.** Repară ce e critic sau important.
- [ ] **Step 3: Previzualizarea.** Cu „da”-ul lui Andrei: `npm run demo`, `git push -u origin crm-finante`, iar adresa o iei cu `npx vercel ls` din `crm/`. Andrei verifică pe laptop și pe iPhone cu `andrei@buildwithac.ro`, apoi cu `radu@buildwithac.ro` și `mara@buildwithac.ro` (parola de test).
- [ ] **Step 4: Producția, doar la „da”-ul lui Andrei.**
  1. Migrațiile: `SB_MEDIU=productie npm run sb -- db push --remote=znabkoesmtoggdmehmqp`. Sunt adăugiri; `incasat_lei` rămâne, deci codul vechi merge mai departe.
  2. Unirea `crm-finante` → `main`, apoi `git push`.
  3. `npx vercel ls` (publicarea de Production), apoi `curl -sI https://crm.buildwithac.ro/intra` → 200.
  4. Andrei intră cu `admin@buildwithac.ro` și deschide „Finanțe”.
- [ ] **Step 5: Stadiul.** Actualizează „DE AICI CONTINUĂM” în `docs/progres-brainstorming.md` și memoria (`crm-buildwithac.md`). Rămâne:
  - de scos coloana `incasat_lei`, într-o migrație din bucata următoare;
  - de întrebat dacă tokenul de producție se mai păstrează (bucata 3, lead-urile din reclame, poate cere migrații).

  Urmează bucata 3.
