# Formularul de contact: planul de implementare

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** un formular în secțiunea Contact de pe homepage (nume, telefon, serviciu, descriere) care îi trimite lui Andrei cererea pe e-mail, la `contact@buildwithac.ro`, prin Resend.

**Architecture:** logica stă în `lib/contact.ts` (verificarea câmpurilor, e-mailul, trimiterea la Resend cu `fetch`). Ruta `app/api/contact/route.ts` o folosește, la fel ca `/api/abonare` cu `lib/kit.ts`. Formularul e o componentă client, `FormularContact`, pusă în `Contact.tsx`. Cardurile de servicii aleg pastila printr-un eveniment pe `window`.

**Tech Stack:** Next.js 16 (App Router), TypeScript, CSS simplu (ca `abonare.css`), vitest, Playwright, API-ul REST Resend (`POST https://api.resend.com/emails`).

**Spec:** `docs/superpowers/specs/2026-11-03-contact-site-design.md`

## Global Constraints

- **Înainte de orice cod Next.js: citește `site/AGENTS.md`.**
- Toate comenzile se rulează din `site/`.
- Textele sunt în română, cu ș/ț cu virgulă, la persoana I singular („te contactez”).
- Adresele de e-mail stau doar în `site/lib/config.ts`.
- Fără bibliotecă nouă: Resend se apelează cu `fetch`.
- Cererile nu se salvează nicăieri pe site.
- Totul se proiectează întâi la 390px.
- Nu rula `next build` fără `NEXT_DIST_DIR` cât merge serverul de dev.
- Commit-urile sunt în română și se termină cu `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Lucrul se face pe ramura `contact-site`. Nimic nu ajunge în `main` fără „da”-ul lui Andrei.
- Pașii din conturi (Resend, Cloudflare, Vercel) se dau lui Andrei **unul câte unul**, cu numele exacte ale butoanelor. Nu-i ceri cheia în capturi.

## Review Focus

1. **Dublu-tap pe „Trimite” pe un telefon lent** trimite o singură cerere. Butonul e blocat cât se trimite (test e2e în Task 4).
2. **Telefoane scrise în feluri reale** trec: `+40 721 123 456`, `0040-721-123-456`, `(0721) 123.456`, `+44 7911 123456`. Cele cu litere, cu `+` la mijloc sau cu prea puține cifre sunt respinse (vitest, Task 1).
3. **HTML sau rânduri noi în nume sau descriere** nu strică e-mailul: HTML-ul e escapat, iar subiectul e pe un singur rând (vitest, Task 1).
4. **Resend răspunde 4xx/5xx/429 sau nu răspunde în 8 s:** omul vede „Acum nu merge trimiterea…”, iar ce a scris rămâne în câmpuri (vitest, Task 2; e2e, Task 4).
5. **Corp greșit la `/api/contact`** (fără JSON, câmpuri lipsă, tipuri greșite) dă 400 `invalid`, nu 500 (vitest, Task 3).

---

### Task 0: Ramura

- [ ] **Step 1:** `git checkout -b contact-site` (din `main` la zi). Rezultat: `git branch --show-current` → `contact-site`.

### Task 1: Verificarea câmpurilor și e-mailul (`lib/contact.ts`)

**Files:**
- Create: `site/lib/contact.ts`
- Modify: `site/lib/config.ts` (adaugă `emailFormular: "formular@buildwithac.ro"` în `SITE`)
- Test: `site/tests/unit/contact.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export const SERVICII_CONTACT = [
    { cheie: "site", eticheta: "Site" },
    { cheie: "automatizari", eticheta: "Automatizări" },
    { cheie: "1la1", eticheta: "Sesiune 1 la 1 sau ghid personalizat" },
    { cheie: "altceva", eticheta: "Altceva" },
  ] as const;
  export type CheieServiciu = (typeof SERVICII_CONTACT)[number]["cheie"];
  export type CampContact = "nume" | "telefon" | "serviciu" | "descriere";
  export type CerereContact = { nume: string; telefon: string; serviciu: CheieServiciu; descriere: string };
  export function verificaCerere(date: unknown): { cerere: CerereContact } | { greseli: CampContact[] };
  export function construiesteEmail(c: CerereContact, acum: Date): { subiect: string; text: string; html: string };
  ```
  Cheile `site`, `automatizari` și `1la1` sunt aceleași ca în `SERVICII` din `components/home/Servicii.tsx`.

- [ ] **Step 1: Scrie testele care pică**, în `tests/unit/contact.test.ts`:
  - `verificaCerere` acceptă `{ nume: "  Maria Popescu ", telefon: "+40 721 123 456", serviciu: "site", descriere: "" }` și întoarce valorile după `trim`;
  - telefoane valide: `+40 721 123 456`, `0040-721-123-456`, `(0721) 123.456`, `+44 7911 123456`, `0721123456`;
  - telefoane respinse cu `greseli` care conțin `"telefon"`: `""`, `"072112"` (6 cifre), `"+40 721 123 456 789 0"` (16 cifre), `"0721abc456"`, `"0721+123456"`;
  - nume respinse: `""`, `" a "` (sub 2 caractere după trim), 81 de caractere. Numele cu diacritice sau emoji trece (`"Ștefan 🙂"`);
  - serviciu respins: lipsă, `"ghid"`, `"SITE"`;
  - descrierea de exact 1.000 de caractere trece, cea de 1.001 dă `"descriere"`; o descriere lipsă devine `""`;
  - `verificaCerere(null)`, `verificaCerere("x")` și `{ nume: 5 }` nu aruncă excepții, ci întorc `greseli`;
  - toate greșelile apar odată, în ordinea `nume, telefon, serviciu, descriere`;
  - `construiesteEmail`: subiectul e `Cerere nouă: Site · Maria Popescu`; un nume cu `\n` dă un subiect fără rânduri noi; `html` conține `href="tel:+40721123456"` (doar `+` și cifre); `<script>` din descriere apare în `html` ca `&lt;script&gt;`; descrierea goală apare ca „fără descriere”; ora e cea din București (`new Date("2026-11-03T10:00:00Z")` → textul conține `12:00`).
- [ ] **Step 2:** `npx vitest run tests/unit/contact.test.ts` → FAIL (modulul nu există).
- [ ] **Step 3: Implementează `lib/contact.ts`** cu interfețele de mai sus. Regulile, din spec:
  - numele are 2–80 de caractere după `trim`;
  - telefonul se potrivește cu `^\+?[\d\s\-.()]+$` și are 7–15 cifre;
  - descrierea are cel mult 1.000 de caractere după `trim`.
  
  Data se formatează cu `Intl.DateTimeFormat("ro-RO", { timeZone: "Europe/Bucharest", dateStyle: "long", timeStyle: "short" })`. Rândurile `text` și `html` sunt: Nume, Telefon, Serviciu (eticheta), Descriere, Trimisă.
- [ ] **Step 4:** `npx vitest run tests/unit/contact.test.ts` → PASS.
- [ ] **Step 5:** Commit: `contact: verificarea câmpurilor și e-mailul către Andrei`.

### Task 2: Trimiterea la Resend

**Files:**
- Modify: `site/lib/contact.ts`
- Test: `site/tests/unit/contact.test.ts`

**Interfaces:**
- Consumes: `CerereContact`, `construiesteEmail` (Task 1); `SITE.emailFormular`, `SITE.emailContact`.
- Produces:
  ```ts
  export type StareContact = "ok" | "invalid" | "indisponibil";
  export async function trimiteCerere(c: CerereContact, mediu: { cheie?: string }, f: typeof fetch = fetch, ms = 8000, acum = new Date()): Promise<"ok" | "indisponibil">;
  ```

- [ ] **Step 1: Scrie testele care pică**, cu un `fetch` fals:
  - fără `cheie` → `"indisponibil"`, iar `fetch` nu e apelat;
  - Resend răspunde 200 → `"ok"`. `fetch` e apelat o dată cu `https://api.resend.com/emails`, metoda `POST`, antetul `Authorization: Bearer <cheie>` și corpul `{ from: "Site buildwithac <formular@buildwithac.ro>", to: ["contact@buildwithac.ro"], subject, text, html }`, cu valorile din `construiesteEmail`;
  - răspunsurile 401, 422, 429 și 500 → `"indisponibil"`;
  - un `fetch` care aruncă `AbortError` (timp depășit) → `"indisponibil"`;
  - semnalul trimis e `AbortSignal` (testul verifică `init.signal` instanceof `AbortSignal`).
- [ ] **Step 2:** `npx vitest run tests/unit/contact.test.ts` → FAIL.
- [ ] **Step 3: Implementează `trimiteCerere`.** Timpul-limită se face cu `AbortSignal.timeout(ms)`, ca în `lib/kit.ts`. Expeditorul și destinatarul se iau din `SITE`.
- [ ] **Step 4:** `npx vitest run tests/unit/contact.test.ts` → PASS.
- [ ] **Step 5:** Commit: `contact: trimiterea prin Resend`.

### Task 3: Ruta `/api/contact` (și verificarea originii, comună)

**Files:**
- Create: `site/lib/origine.ts`, `site/app/api/contact/route.ts`
- Modify: `site/app/api/abonare/route.ts` (importă `dinSite` din `lib/origine.ts` și scoate copia locală)
- Test: `site/tests/unit/ruta-contact.test.ts`; `tests/unit/ruta-abonare.test.ts` trebuie să treacă neschimbat

**Interfaces:**
- Consumes: `verificaCerere`, `trimiteCerere`, `StareContact` (Tasks 1–2).
- Produces:
  - `export function dinSite(cerere: Request): boolean` în `lib/origine.ts`;
  - `POST /api/contact` cu corpul JSON `{ nume, telefon, serviciu, descriere?, website? }`, care răspunde:
    - `{ stare: "ok" }` cu 200;
    - `{ stare: "invalid", camp: CampContact }` cu 400;
    - `{ stare: "indisponibil" }` cu 503, sau cu 403 când originea e greșită.

- [ ] **Step 1: Scrie testele care pică.** Folosește modelul din `ruta-abonare.test.ts`, cu `trimiteCerere` mock-uit prin `vi.mock("@/lib/contact", …)`, păstrând `verificaCerere` real:
  - o cerere bună → 200 `{ stare: "ok" }`; `trimiteCerere` e apelat o dată cu cererea verificată și `{ cheie: process.env.RESEND_API_KEY }`;
  - capcana `website` completată → 200 `{ stare: "ok" }`, fără trimitere;
  - originea de pe alt site sau fără `Origin` → 403, fără trimitere;
  - telefonul greșit → 400 `{ stare: "invalid", camp: "telefon" }`;
  - un corp care nu e JSON (`body: "nu e json"`) → 400 `invalid`, nu 500;
  - `trimiteCerere` dă `"indisponibil"` → 503.
- [ ] **Step 2:** `npx vitest run tests/unit/ruta-contact.test.ts` → FAIL.
- [ ] **Step 3: Implementează `lib/origine.ts`**, mutând `dinSite` din ruta de abonare fără să-l schimbi, apoi ruta `/api/contact`. Ordinea din rută: origine → capcană → `verificaCerere` (prima greșeală merge în `camp`) → `trimiteCerere`.
- [ ] **Step 4:** `npx vitest run` → PASS, toate testele (și `ruta-abonare`).
- [ ] **Step 5:** Commit: `contact: ruta /api/contact; verificarea originii, comună cu abonarea`.

### Task 4: Formularul pe homepage

**Files:**
- Create: `site/components/home/FormularContact.tsx`, `site/components/home/formular-contact.css`
- Modify: `site/components/home/Contact.tsx` (cardul vine după `.cways`, înainte de `.note2`)
- Test: `site/tests/e2e/contact.spec.ts`

**Interfaces:**
- Consumes: `SERVICII_CONTACT`, `verificaCerere`, `CampContact`, `CheieServiciu` (Task 1); `POST /api/contact` (Task 3); `useHidratat` din `lib/hidratat.ts`.
- Produces: `export function FormularContact(): JSX.Element` (componentă client). Ascultă pe `window` evenimentul `"contact:serviciu"` (`CustomEvent<CheieServiciu>`) și alege pastila din `detail`.

**Textele exacte** (din spec, §4):

| Loc | Text |
|---|---|
| Titlul cardului (`h3`) | `Vrei să <span class="serif gtxt">colaborăm?</span>` |
| Sub titlu | „Lasă-mi numele și telefonul, iar eu revin în cel mai scurt timp posibil.” |
| Etichetele câmpurilor | „Numele tău”, „Telefon”, „Serviciu dorit”, „Descriere (opțional)” |
| Exemplele din câmpuri | „ex. Maria Popescu”, „07xx xxx xxx” |
| Textul din descriere | „Ce firmă ai și ce ți-ar plăcea să rezolvi.”; la „Altceva”: „Spune-mi ce ai în minte.” |
| Fraza de lângă buton | „Folosesc numele și telefonul doar ca să te contactez despre cererea ta. Detalii în politica de confidențialitate.” („politica de confidențialitate” e link spre `/confidentialitate`) |
| Butonul | „Trimite”; cât se trimite: „Se trimite…” |
| După trimitere | „Am primit. <span class="serif gtxt">Mersi!</span>” + `<div class="hand">te contactez în 1–2 zile</div>` |
| Greșeli | `nume`: „Scrie-mi cum te cheamă.” · `telefon`: „Numărul nu pare complet. Verifică-l o dată.” · `serviciu`: „Alege ce te interesează.” · `descriere`: „Descrierea e prea lungă.” |
| Eșec la trimitere (orice în afară de `ok`) | „Acum nu merge trimiterea. Încearcă puțin mai târziu sau scrie-mi pe Instagram.” („scrie-mi pe Instagram” e link spre `SITE.instagram.url`) |

**Comportamentul:**
- La „Trimite”, `verificaCerere` rulează și în browser. Fiecare greșeală apare sub câmpul ei, cu `aria-invalid` și `aria-describedby`, iar focusul merge pe primul câmp greșit. Dacă serverul răspunde `invalid` cu `camp`, se arată aceeași greșeală.
- `textarea` are `maxLength={1000}`. Telefonul are `type="tel"`, `inputMode="tel"` și `autoComplete="tel"`. Numele are `autoComplete="name"`.
- Pastilele sunt `<button type="button" aria-pressed>` într-un `role="group"` cu `aria-labelledby` spre „Serviciu dorit”. Se poate alege doar o pastilă.
- Capcana `website` e ascunsă, ca în `FormularAbonare.tsx`.
- Butonul e blocat până la hidratare și cât se trimite. Fetch-ul are timp-limită de 20 s.
- La `ok`, cardul înlocuiește formularul cu mesajul (`role="status"`). La eșec, câmpurile își păstrează textul.
- CSS-ul se copiază din `prototip/contact.html`: regulile `.fcard` … `.fcard.sent .ok` (rândurile 36–63) și regula de telefon `.fgrid { grid-template-columns: 1fr }` din media query. Toate se pun sub `.contact` în `formular-contact.css`, cu culorile din variabilele site-ului (`--color-cream`, `--color-muted`, `--grad`). Pastila a treia, mai lungă, poate trece pe rândul ei.

- [ ] **Step 1: Scrie testele e2e care pică** în `tests/e2e/contact.spec.ts` (rulează pe `mobil` și `desktop`). `/api/contact` e interceptat cu `page.route`, ca în `home.spec.ts` › „abonare”:
  - formularul are titlul „Vrei să colaborăm?”, cele 4 pastile și link spre `/confidentialitate`;
  - „Trimite” cu formularul gol arată „Scrie-mi cum te cheamă.”, „Numărul nu pare complet.…” și „Alege ce te interesează.”, iar focusul e pe „Numele tău”. Nu pleacă nicio cerere (contorul de cereri interceptate rămâne 0);
  - un clic pe „Altceva” schimbă textul din descriere în „Spune-mi ce ai în minte.”;
  - pastilele se aleg cu tastatura (Tab până la „Site”, apoi Space → `aria-pressed="true"`);
  - când serverul răspunde 200 `{ stare: "ok" }`, apare „Am primit. Mersi!”. Corpul trimis conține `nume`, `telefon`, `serviciu: "site"`;
  - **dublu-tap:** când răspunsul întârzie 2 s, butonul scrie „Se trimite…” și e `disabled`. Două clicuri rapide → exact o cerere;
  - când serverul răspunde 429 cu HTML, apare „Acum nu merge trimiterea.”, iar numele și telefonul sunt tot în câmpuri;
  - când serverul răspunde 400 `{ stare: "invalid", camp: "telefon" }`, apare greșeala de la telefon;
  - fără `RESEND_API_KEY` (serverul de dev, fără interceptare), trimiterea arată mesajul de eșec, nu „Am primit”.
- [ ] **Step 2:** `npx playwright test tests/e2e/contact.spec.ts` → FAIL.
- [ ] **Step 3: Implementează `FormularContact`, CSS-ul și locul din `Contact.tsx`**, după tabelul și lista de mai sus.
- [ ] **Step 4:** `npx playwright test tests/e2e/contact.spec.ts tests/e2e/home.spec.ts` → PASS.
- [ ] **Step 5: Arată-i lui Andrei în browser** formularul pe homepage (`npm run dev`, Chrome, la 390px și pe calculator): gol, cu greșeli, după trimitere. Aplică ce schimbă.
- [ ] **Step 6:** Commit: `contact: formularul în secțiunea Contact`.

### Task 5: Linkurile de pe cardurile de servicii

**Files:**
- Create: `site/components/home/LinkServiciu.tsx` (client)
- Modify: `site/components/home/Servicii.tsx`, `site/components/home/home.css` (`.scard .soon` devine stilul linkului)
- Test: `site/tests/e2e/contact.spec.ts`
- Prototip: `prototip/link-servicii.html` (variantele textului)

**Interfaces:**
- Consumes: evenimentul `"contact:serviciu"` și `CheieServiciu` (Tasks 1, 4).
- Produces: `export function LinkServiciu({ cheie, children }: { cheie: CheieServiciu; children: ReactNode })`, care randează `<a href="#contact">`. La clic, trimite `window.dispatchEvent(new CustomEvent("contact:serviciu", { detail: cheie }))` și lasă Lenis (`anchors: true`) să deruleze. Fără JavaScript, linkul tot ajunge la `#contact`.

- [ ] **Step 1: Variantele textului.** În `prototip/link-servicii.html`, cardurile de servicii (copiate din homepage) au un comutator cu 3 variante ale linkului [ale lui Claude, de exemplu: „Vreau asta →”, „Hai să vorbim →”, „Cere detalii →”]. Le servești cu `python -m http.server 8765` din `prototip/` și i le arăți lui Andrei la 390px. **Te oprești până alege.**
- [ ] **Step 2: Scrie testul care pică:** pe homepage, un clic pe linkul cardului „Automatizări” face ca `#contact` să fie în ecran, iar pastila „Automatizări” are `aria-pressed="true"`. Un clic apoi pe linkul de la „Sesiune 1 la 1” mută alegerea pe „Sesiune 1 la 1 sau ghid personalizat”.
- [ ] **Step 3:** `npx playwright test tests/e2e/contact.spec.ts` → FAIL.
- [ ] **Step 4: Implementează `LinkServiciu`** și înlocuiește `<span className="soon">în curând</span>` cu textul ales de Andrei.
- [ ] **Step 5:** `npx playwright test tests/e2e/contact.spec.ts tests/e2e/home.spec.ts` → PASS.
- [ ] **Step 6:** Commit: `servicii: linkurile spre formularul de contact`.

### Task 6: Pagina de confidențialitate

**Files:**
- Modify: `site/app/confidentialitate/page.tsx`
- Test: `site/tests/e2e/pagini.spec.ts`

- [ ] **Step 1: Află cele 3 lucruri [de verificat]:**
  - (a) îl întrebi pe Andrei unde ajunge `contact@`: în iCloud Mail sau redirecționat mai departe, în Gmail;
  - (b) pe resend.com: cât păstrează Resend e-mailurile trimise și jurnalele pe planul gratuit, și dacă perioada se poate scurta;
  - (c) baza transferului în SUA: DPF sau clauze standard, din DPA-ul Resend.
  
  Notează sursele în `docs/progres-brainstorming.md`.
- [ ] **Step 2: Scrie testul care pică** în `pagini.spec.ts`: `/confidentialitate` conține „formularul de contact”, „Resend” și „90 de zile”.
- [ ] **Step 3:** `npx playwright test tests/e2e/pagini.spec.ts` → FAIL.
- [ ] **Step 4: Completează pagina** după spec, §7:
  - la „Ce date și de ce”: o intrare nouă, „Cererile din formularul de contact”;
  - la „Pe ce temei”: formularul de contact intră la art. 6(1)(b);
  - la „Cine mai vede datele”: Resend (SUA) și căsuța în care ajunge `contact@` (după răspunsul de la (a)); fraza despre transferuri include Resend;
  - la „Cât timp le păstrez”: 90 de zile dacă nu se ajunge la colaborare, ștergere de mână, lunar; plus ce păstrează Resend (de la (b)).
  
  Tonul și forma sunt ca la intrarea despre Tally.
- [ ] **Step 5:** `npx playwright test tests/e2e/pagini.spec.ts` → PASS.
- [ ] **Step 6: Verifică textul cu skill-ul `legal-advisor-ro`.** Aplică ce cere și arată-i lui Andrei schimbările.
- [ ] **Step 7:** Commit: `confidențialitate: formularul de contact și Resend`.

### Task 7: Resend, cu Andrei, și proba pe previzualizare

Pași în conturile lui Andrei, **unul câte unul**. Verifici din afară tot ce se poate verifica (DNS cu `nslookup`, răspunsul rutei).

- [ ] **Step 1:** În Resend, Andrei face echipa nouă „buildwithac” în contul lui existent (comutatorul de echipă din colțul din stânga sus). Domeniul celuilalt proiect rămâne neatins.
- [ ] **Step 2:** În Resend → **Domains** → **Add Domain**: `buildwithac.ro`, regiunea cea mai apropiată de UE pe care o oferă Resend.
- [ ] **Step 3:** Înregistrările DNS cerute de Resend se pun în Cloudflare, **DNS only**. Verifici că niciuna nu e pe `@` cu MX sau SPF: iCloud și Kit trebuie să rămână neatinse. Verifici cu `nslookup -type=TXT resend._domainkey.buildwithac.ro` și `nslookup -type=MX send.buildwithac.ro`. Apoi Andrei apasă **Verify** în Resend, până apare „Verified”.
- [ ] **Step 4:** Resend → **API Keys** → **Create API Key**: permisiunea „Sending access”, domeniul `buildwithac.ro`. Andrei o pune direct în Vercel → Settings → Environment Variables: `RESEND_API_KEY`, **Sensitive**, Production + Preview. Nu ți-o arată.
- [ ] **Step 5:** `npx vitest run`, `npm run verifica`, `npm run lint`, `npx tsc --noEmit -p .` → toate curate. Apoi `git push -u origin contact-site`.
- [ ] **Step 6:** Pe previzualizarea Vercel, de pe telefon, Andrei trimite o cerere adevărată. Confirmă că e-mailul a ajuns în `contact@`, cu subiectul „Cerere nouă: …” și cu telefonul apăsabil. Dacă a ajuns în spam, notezi și vedeți împreună.

### Task 8: Firewall, unirea în `main`, stadiul

- [ ] **Step 1:** Vercel → Firewall → regulă nouă, „Limita contact”: Request Path equals `/api/contact` **AND** Method equals `POST` → Rate Limit, Fixed Window 60 s, **3** cereri, cheie IP → 429. Verifici în ecran că între condiții e **AND**, nu OR. Abia apoi Andrei apasă **Publish**.
- [ ] **Step 2:** `npm run e2e:prod` → PASS.
- [ ] **Step 3:** Ceri „da”-ul lui Andrei. Apoi unești în `main` (`git checkout main && git merge --ff-only contact-site && git push`) și ștergi ramura (local și pe GitHub).
- [ ] **Step 4:** Proba limitei pe producție: 5 × `curl -s -o /dev/null -w "%{http_code}\n" -X POST https://buildwithac.ro/api/contact -H "Origin: https://buildwithac.ro" -H "Content-Type: application/json" -d '{"nume":"x"}'`. Rezultat așteptat: 3 × `400`, apoi `429`. Nu se trimite niciun e-mail, pentru că cererea e invalidă.
- [ ] **Step 5:** Pe telefon, Andrei verifică homepage-ul live: linkurile de la servicii și formularul.
- [ ] **Step 6:** Actualizezi „DE AICI CONTINUĂM” din `docs/progres-brainstorming.md` și memoria. Commit `docs: stadiul la <data> (formularul de contact live)` și push.
