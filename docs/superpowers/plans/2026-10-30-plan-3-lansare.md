# Plan 3: abonarea, siguranța, lucrurile mici, lansarea

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Abonarea de pe site ajunge cu adevărat în Kit, e apărată de abuz și se termină cu un e-mail care nu cade în spam; se închid lucrurile mici amânate din Planurile 1 și 2; lansarea rămâne pregătită pentru când sunt gata ghidurile.

**Architecture:** Partea A e cod, pe ramura `plan-3`, fără conturile lui Andrei. Partea B se face în conturile lui Andrei (Cloudflare, Kit, Vercel): el dă click-urile, Claude scrie textele și verifică din afară (DNS, `curl`). Partea C (lansarea) vine **după** ghidurile ANIMATII și TRADING, decizia lui Andrei din 2026-10-30.

**Tech Stack:** Next.js 16 (citește `site/AGENTS.md` înainte de cod), React 19, Vitest, Playwright, Kit API v4, Vercel Firewall, Cloudflare DNS.

**Spec:** `docs/superpowers/specs/2026-10-22-site-buildwithac-design.md`; lista exactă e în `docs/progres-brainstorming.md`, „DE AICI CONTINUĂM”.

## Global Constraints

- Textele în română, cu ș/ț cu virgulă; tonul din `CLAUDE.md` (tu, fraze scurte, fără reclamă).
- Domeniul, e-mailurile și link-urile stau doar în `site/lib/config.ts`.
- Înainte de unirea în `main`, din `site/`: `npx vitest run`, `npm run verifica`, `npm run lint`, `npx tsc --noEmit -p .`.
- Nu rula `next build` fără `NEXT_DIST_DIR` cât merge `npm run dev`.
- Commit-uri în română, terminate cu `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Orice schimbare vizibilă (butonul, pagina de confirmare) i se arată lui Andrei în browser, la 390px.
- `www` nu se pune (decizia lui Andrei).

## Review Focus

1. **Kit nu răspunde** (rețea blocată, Kit căzut): butonul nu rămâne la nesfârșit în „Se trimite…”; omul vede mesajul „Acum nu merge abonarea…”. Testul e în Task 1.
2. **Limita din Firewall răspunde cu o pagină HTML 429, nu cu JSON**: formularul arată mesajul „indisponibil”, nu se blochează. Testul e în Task 1 (răspuns care nu e JSON).
3. **Tab din ultimul link al meniului ☰** ajunge înapoi pe ✕, nu în pagina din spate. Testul e în Task 2.
4. **O imagine a ghidului lipsește când rulezi `npm run pdf`**: comanda se oprește cu numele imaginii, nu așteaptă la nesfârșit și nu face un PDF cu o gaură. Testul e în Task 3.
5. **Un ghid stricat ajunge pe `main`**: build-ul de producție de pe Vercel pică, iar site-ul live rămâne cel vechi. Testul e în Task 4.

---

## Partea A: codul (ramura `plan-3`, fără conturi)

### Task 0: Ramura și curățenia git

- [x] **Curățenia (2026-10-30, cu acordul lui Andrei):** `fluiditate`, `plan-1-site` și `previzualizare` erau deja unite în `main`. Le-am șters local și pe GitHub; a rămas doar `main`.
- [ ] **Step 1:** Din `main` curat: `git switch -c plan-3`.

### Task 1: Abonarea nu mai așteaptă la nesfârșit

**Files:**
- Modify: `site/lib/kit.ts`, `site/components/FormularAbonare.tsx`
- Test: `site/tests/unit/abonare.test.ts`, `site/tests/e2e/home.spec.ts` (sau unde e deja testat formularul)

**Interfaces:**
- Produces: `aboneaza(email: string, mediu: MediuKit, f?: typeof fetch, ms?: number): Promise<StareAbonare>`, cu `ms` implicit `8000`, pe fiecare cerere către Kit.

- [ ] **Step 1: Testele care pică.** În `abonare.test.ts`, „Kit nu răspunde → indisponibil”: un `fetch` fals care nu se rezolvă niciodată, dar respinge la `signal` abort; `aboneaza("ana@exemplu.ro", { cheie: "k", formular: "1" }, f, 20)` dă `"indisponibil"`. În testul e2e al formularului: `page.route("/api/abonare", …)` care răspunde cu `status: 429`, `contentType: "text/html"` și corpul `<html>Too Many Requests</html>`; după click, butonul revine activ și mesajul e textul `indisponibil`. Separat: cu o rută care întârzie 2 s, butonul are textul **Se trimite…** și e dezactivat.
- [ ] **Step 2:** `npx vitest run tests/unit/abonare.test.ts` → pică (testul de timeout ține până la timeout-ul Vitest).
- [ ] **Step 3: Codul.** În `kit.ts`, fiecare `f(...)` primește `signal: AbortSignal.timeout(ms)`; abort-ul cade în `catch`-ul existent. În `FormularAbonare.tsx`, `fetch`-ul primește `signal: AbortSignal.timeout(20000)`, iar textul butonului e `stare === "trimite" ? "Se trimite…" : "Mă abonez"`. Răspunsul fără JSON intră deja în `catch` → `indisponibil`, deci verifici doar că testul trece.
- [ ] **Step 4:** `npx vitest run` și `npx playwright test tests/e2e/home.spec.ts` → trec.
- [ ] **Step 5:** Îi arăți lui Andrei butonul în „Se trimite…”, la 390px (ruta întârziată din test, în browser).
- [ ] **Step 6:** Commit `abonare: limită de timp la Kit și „Se trimite…” pe buton`.

### Task 2: Focusul rămâne în ferestre și în pista de ghiduri

**Files:**
- Create: `site/lib/capcana-focus.ts`
- Modify: `site/components/layout/Nav.tsx`, `site/components/ghid/CasetaPdf.tsx`, eventual `site/components/home/SectiuneGhiduri.tsx`
- Test: `site/tests/e2e/cadru.spec.ts` (meniul), `site/tests/e2e/ghid.spec.ts` (caseta PDF), `site/tests/e2e/home-ghiduri.spec.ts` (pista)

**Interfaces:**
- Produces: `useCapcanaFocus(ref: RefObject<HTMLElement | null>, activ: boolean): void`. Cât e `activ`, Tab de pe ultimul element focusabil din `ref` merge pe primul, iar Shift+Tab de pe primul merge pe ultimul.

- [ ] **Step 1: Testele care pică.** La 390px: deschizi ☰, apeși Tab de `LINKURI.length + SOCIAL.length + 1` ori; `document.activeElement` e tot în `.mmenu`. După Escape, focusul e pe butonul ☰. Același lucru pentru `.mbox` din caseta PDF, după click pe **Primește-l pe Instagram** (revenirea pe buton există deja; o verifică testul).
- [ ] **Step 2:** `npx playwright test tests/e2e/cadru.spec.ts tests/e2e/ghid.spec.ts` → pică.
- [ ] **Step 3: Codul.** Hook-ul ascultă `keydown` pe `document` doar cât e activ. Elementele focusabile: `a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])` din `ref`. În `Nav.tsx`: un `ref` pe `.mmenu`, unul pe ☰; la închidere, focusul revine pe ☰, ca în `CasetaPdf`.
- [ ] **Step 4:** Testele trec.
- [ ] **Step 5: Pista, verificare de mână** (desktop, 1280px, mișcarea nu e redusă): pe homepage, mergi cu Tab până în cardurile din `SectiuneGhiduri` și treci prin toate. Fiecare card focusat trebuie să fie vizibil în ecran. Dacă e, scrii testul care fixează asta (`boundingBox` al cardului focusat e în viewport) și treci mai departe. Dacă nu: la `focusin` pe un card, derulezi pagina la poziția din `ScrollTrigger`-ul pistei care aduce cardul în ecran: `start + (card.offsetLeft / (pista.scrollWidth - innerWidth)) * (end - start)`, limitată la `[start, end]`, prin `lenis.curent?.scrollTo(y, { immediate: true })`. Apoi testul.
- [ ] **Step 6:** Commit `accesibilitate: focusul rămâne în meniu, în caseta PDF și în pistă`.

### Task 3: Mărunțișurile din ghiduri și din PDF

**Files:**
- Modify: `site/lib/ghiduri.ts` (`ascundeCodul`), `site/scripts/pdf/tipar.ts`
- Test: `site/tests/unit/ghiduri.test.ts`, `site/tests/unit/pdf.test.ts`

- [ ] **Step 1: Testele care pică.**
  - `ascundeCodul("a\n~~~\nș ţ\n~~~\nb")` are aceeași lungime ca intrarea și nu conține `ţ` (blocurile cu `~~~` se ascund ca cele cu ```` ``` ````).
  - `numePdf("ghid", ["ghidX0123456789abXpdf"])` nu refolosește fișierul (punctul din `.pdf` e literal); `numePdf("ghid", ["ghid-0123456789ab.pdf"])` îl refolosește.
  - Un test Playwright: `tiparesteGhid(page, "data:text/html,<img src='http://127.0.0.1:9/lipsa.png'>")`. Imaginea a eșuat deja la `networkidle`, adică exact cazul care azi așteaptă la nesfârșit. Promisiunea respinge în cel mult 5 s, cu un mesaj care conține `lipsa.png`. Dacă `pdf.test.ts` nu poate porni un browser, testul merge în `tests/e2e/pdf.spec.ts`.
- [ ] **Step 2:** Le rulezi → pică.
- [ ] **Step 3: Codul.**
  - `ascundeCodul`: aceeași înlocuire și pentru `/~~~[\s\S]*?~~~/g`.
  - `numePdf`: `\\.pdf` în șablonul regex.
  - `tiparesteGhid`: aștepți doar imaginile cu `!i.complete`; după așteptare, cele cu `naturalWidth === 0` aruncă eroarea `Imagini care nu s-au încărcat: <src-uri>`. Înainte de `page.pdf`, `page.addStyleTag({ content: "nextjs-portal{display:none!important}" })`, ca indicatorul Next de pe serverul de dev să nu intre în PDF.
- [ ] **Step 4:** `npx vitest run` → trece; `npm run pdf -- harvey-agent-clienti` face același PDF (același nume, 12 pagini).
- [ ] **Step 5:** Commit `ghiduri: ~~~ ascuns, numePdf exact, PDF-ul se oprește la imagini lipsă`.

### Task 4: Indexarea, pachetul și paza pe `main`

**Files:**
- Modify: `site/app/robots.ts`, `site/next.config.ts`, `site/package.json`, `site/scripts/verifica-ghid.ts` (doar dacă trebuie)
- Test: `site/tests/e2e/meta.spec.ts`, `site/tests/prod/productie.spec.ts`

- [ ] **Step 1: Robots.** În producție, robots nu mai are `disallow: "/pdf/"`: crawlerul trebuie să poată deschide PDF-ul ca să vadă `X-Robots-Tag: noindex`. În `productie.spec.ts`: `robots.txt` nu conține `/pdf/`, iar un PDF răspunde cu `x-robots-tag: noindex, nofollow` (antetul e deja în `next.config.ts`).
- [ ] **Step 2: Pachetul.** În `next.config.ts`: `outputFileTracingExcludes: { "/ghiduri/[slug]": ["./public/pdf/**"] }`. Verifici cu `NEXT_DIST_DIR=.next-plan3 npx next build` că în `.next-plan3/server/app/ghiduri/[slug]/page.js.nft.json` nu mai apare `public/pdf`. Construcția durează ~1-2 min; o anunți.
- [ ] **Step 3: Paza.** În `package.json`: `"prebuild": "tsx scripts/verifica-ghid.ts --productie"`. Cu `--productie`, scriptul rulează doar dacă `VERCEL_ENV === "production"` (altfel scrie `verifica: sar, nu e producție` și iese cu 0); în producție verifică toate ghidurile adevărate, ca fără argument. Test: un ghid de probă cu sedilă, rulat cu `VERCEL_ENV=production`, iese cu cod ≠ 0; fără variabilă iese cu 0. Pe Vercel, un cod ≠ 0 oprește build-ul, iar site-ul live rămâne cel vechi.
- [ ] **Step 4: 404.** Nu se mai reproduce (verificat 2026-10-30: `/ghiduri/nu-exista-…` dă 404, și la MISS, și la HIT). Testul de producție „un ghid inexistent duce la 404-ul nostru” verifică și `response.status() === 404` la prima cerere, pe un slug nou (`nu-exista-${Date.now()}`).
- [ ] **Step 5:** `npm run e2e:prod` (~2 min, anunțat) → trece.
- [ ] **Step 6:** Commit `producție: PDF-urile văd noindex, pachet mai mic, build-ul pică la un ghid stricat`.

### Task 5: Unirea Părții A

- [ ] **Step 1:** Din `site/`: `npx vitest run`, `npm run verifica`, `npm run lint`, `npx tsc --noEmit -p .` → curate.
- [ ] **Step 2:** `git push -u origin plan-3`; Andrei verifică previzualizarea pe telefon (meniul, abonarea, un ghid, PDF-ul).
- [ ] **Step 3:** La „merge”: unirea în `main` și push.

---

## Partea B: conturile (Andrei dă click-urile, Claude scrie textele și verifică)

Ordinea contează: DMARC → Kit → cheile în Vercel → Firewall. Se poate începe în paralel cu Partea A.

### Task 6: DMARC

- [ ] **Step 1:** Andrei pune în Cloudflare: tip `TXT`, nume `_dmarc`, conținut `v=DMARC1; p=none;`, proxy oprit.
- [ ] **Step 2:** Claude verifică: `nslookup -type=TXT _dmarc.buildwithac.ro 1.1.1.1` arată `v=DMARC1; p=none;`.

### Task 7: Kit

- [ ] **Step 1: Verificarea, înainte de click-uri.** Claude verifică în documentația Kit de azi: planul gratuit (limita de abonați), dacă cheile API v4 merg pe planul gratuit, ce înregistrări cere autentificarea domeniului și **ce se întâmplă cu abonații neconfirmați** (se șterg singuri sau nu, după cât timp). Îi dă lui Andrei pașii, cu numele exacte ale butoanelor.
- [ ] **Step 2:** Andrei își face cont Kit și pune expeditorul `ac@buildwithac.ro`. Autentificarea domeniului: înregistrările date de Kit intră în Cloudflare, cu proxy oprit. Claude verifică înregistrările cu `nslookup`.
- [ ] **Step 3:** Andrei face formularul (doar pentru API, nu se pune pe site), cu dubla confirmare pornită. Claude scrie în română textul e-mailului de confirmare (subiect, corp, butonul) și Andrei îl lipește.
- [ ] **Step 4: Întoarcerea pe site** (decizia lui Andrei, 2026-10-30). După confirmare, Kit trimite omul la `https://buildwithac.ro/?abonat=1#<id-ul secțiunii de e-mail>`. Acolo, în locul formularului, secțiunea de newsletter (`SectiuneEmail`) scrie: „Felicitări! De acum îți vin pe e-mail noutățile din AI și ghidurile noi.” (textul final se stabilește cu Andrei). Test e2e: cu `?abonat=1`, mesajul e vizibil, iar formularul nu; fără parametru, formularul e acolo. I se arată lui Andrei la 390px. Adresa intră în setările formularului din Kit (redirecționarea după confirmare).
- [ ] **Step 5:** Andrei pune în Vercel → Settings → Environment Variables, pentru Production și Preview: `KIT_API_KEY` și `KIT_FORM_ID`. Apoi Redeploy pe producție.
- [ ] **Step 6: Proba.** Andrei se abonează de pe telefon, pe `buildwithac.ro`, cu adresa lui. Așteptat: „Gata! Verifică-ți e-mailul…”, e-mailul de confirmare în inbox, nu în spam; după confirmare, abonatul e activ în Kit. Claude verifică antetele e-mailului (Andrei le copiază): `spf=pass`, `dkim=pass`, `dmarc=pass`.

### Task 8: Confidențialitatea spune cât rămân abonările neconfirmate

**Files:** Modify: `site/app/confidentialitate/page.tsx` (secțiunea „Cât timp le păstrez”)

- [ ] **Step 1:** După ce aflăm în Task 7 ce face Kit, Claude scrie fraza: fie „Dacă nu confirmi în N zile, Kit șterge adresa”, fie regula lui Andrei (de exemplu, șterge lunar din Kit neconfirmații mai vechi de 30 de zile). Andrei alege.
- [ ] **Step 2:** Testul din `pagini.spec.ts` verifică fraza; commit; unire după verificări.

### Task 9: Limita de cereri în Vercel Firewall

- [ ] **Step 1:** Claude verifică (skill `vercel:vercel-firewall`) dacă regulile de limitare merg pe planul lui Andrei și cum se pun: din panou sau din CLI, după `vercel link`.
- [ ] **Step 2:** Regula: calea este `/api/abonare`, metoda `POST`, fereastră fixă de 60 s, 5 cereri pe IP, acțiunea **429**. Andrei o pune din panou, sau Claude din CLI, cu acordul lui.
- [ ] **Step 3: Proba, fără să ajungă ceva în Kit:** 7 cereri `curl -X POST https://buildwithac.ro/api/abonare -H "Origin: https://buildwithac.ro" -H "Content-Type: application/json" -d '{"email":"x"}'`. Primele 5 dau 400 (adresa nu e validă), următoarele dau 429.

---

## Partea C: lansarea (după ghidurile ANIMATII și TRADING)

Nu se planifică acum în detaliu (Andrei decide pe bucăți). Lista de pornire:
- cele 3 ghiduri de la lansare live (SITE, ANIMATII, TRADING); exemplele `animatii-video-cu-claude` și `claude-tradingview-mcp` se înlocuiesc cu ghidurile adevărate;
- peretele de clipuri: clipurile provizorii se înlocuiesc cu ale lui Andrei (le dă el);
- primul e-mail din Kit, cu ghidurile de până atunci (Claude scrie textul, Andrei îl trimite);
- o trecere finală pe telefon prin tot site-ul;
- ce înseamnă „lansarea” pe TikTok/Instagram: decizia lui Andrei.
