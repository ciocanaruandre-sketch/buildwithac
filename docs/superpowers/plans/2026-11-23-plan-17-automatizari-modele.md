# Plan 17: automatizările de vânzare (4 modele cu clipuri)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 4 automatizări n8n care merg cu adevărat (reamintiri, cererea de recenzie, răspuns în primul minut, asistentul de pe site), rulate pe „Conu' Leonida” în contul de probă n8n Cloud, salvate ca modele gata de pus la client, fiecare cu scenariul clipului.

**Architecture:** Logica stă în noduri Code ale căror surse sunt fișiere `cod/*.js` testate cu `node:test` (fiecare fișier = corpul exact al nodului). Fluxurile se construiesc în contul de probă prin MCP-ul oficial (planul B: SDK → `validate_workflow` → `create_workflow_from_code` → `test_workflow` cu date fixate), apoi rulează pe bune cu conturile lui Andrei, se exportă și se curăță cu `curata.mjs`. Un test verifică că nodul Code din `flux*.json` e identic cu fișierul testat.

**Tech Stack:** n8n Cloud (proba, n8n 2.48.x), MCP-ul oficial n8n, Google Calendar / Sheets / Gmail, Twilio, Anthropic (Claude Haiku 5.5 / Sonnet 5.5), `@n8n/chat`, Node `node:test`.

**Spec:** `docs/superpowers/specs/2026-11-23-automatizari-modele-design.md`

## Global Constraints

- Româna cu diacritice cu virgulă (ș, ț), niciodată sedilă, în tot ce se scrie: fluxuri, README, mesaje, scenarii. Excepție: textele SMS sunt **fără diacritice** (costă dublu cu ele).
- Ideile din ghidul lui Angello, da; textele, numele și mesajele lui, nu (nici parafrazate îndeaproape).
- Tonul din `CLAUDE.md` și în mesajele către clienții firmei: scurt, sigur, fără reclamă, fără semnele textului făcut cu AI.
- Modelele 1 și 2 (reamintiri, recenzie): **fără nod AI**. Modelul 3: Claude Haiku 5.5. Modelul 4: întâi Haiku 5.5; Sonnet 5.5 doar dacă Haiku greșește (decizia lui Andrei la Task 8).
- Telefoanele se scriu `+407…`. Fusul orar: `Europe/Bucharest` (setarea fluxului și orele din mesaje).
- Fiecare flux: legat de `flux-erori`; citirile din Sheets fără „continuă la eroare”; după Twilio, nimic din `$json` în afară de `sid`/`status`/`error`; salvat oprit, curățat cu `curata.mjs`.
- **Niciun mesaj real către altcineva decât Andrei.** Singurul telefon și singurul e-mail reale din demonstrație sunt ale lui. Credentialele le pune Andrei în interfața n8n, niciodată în chat.
- Fluxurile programate: cron `0,30 8-21 * * *`, fus `Europe/Bucharest` (cam 840 de rulări pe lună; se ajustează la programul clientului).
- Înainte de orice scriere în n8n: serverul MCP încărcat se numește `n8n-demo-buildwithac`.
- Pașii grei (încărcarea `get_workflow_sdk_reference`, ~50 KB; subagenți; rulări lungi) se anunță lui Andrei înainte.
- Fiecare model se exportă în `modele/` **imediat** ce Andrei zice „e bine”: contul de probă expiră (pe la 2026-12-06).
- Commit-urile în română, terminate cu `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Ramura: `automatizari-modele`. Unirea în `main` doar la „da”-ul lui Andrei.

**Abatere de la spec, aleasă de constructor (spec-ul o permite: „unul sau mai multe fluxuri pe model”):** modelele 1 și 2 stau împreună în `modele/programari/`. Ele împart același flux programat (`flux-verificare.json`), care face reamintirile, anunțul de mutare și cererea de recenzie, fiecare pornită dintr-o setare. Motivul: rulările. Două fluxuri programate separate ar consuma dublu din cele 2.500 de pe Starter. Confirmarea pe loc e fluxul `flux-confirmare.json`, cu câte un declanșator Google Calendar pentru fiecare calendar (un declanșator nu poate citi lista din setări). Se vând tot ca două automatizări separate.

## Review Focus

1. **Ora din mesaje după fusul României**, inclusiv în preajma schimbării orei (29 martie, 25 octombrie): Google dă uneori ore în UTC (`…Z`), iar clientul trebuie să vadă ora locală. Test în Task 4 (`confirmare.js`, ora `12:30Z` → „14:30”; o dată din 29 martie 2027).
2. **Evenimentele de o zi întreagă** (concediu, „închis”) și cele fără telefon/e-mail nu trebuie să strice fluxul și nici să primească mesaje. Test în Task 4 (`verificare.js`).
3. **Evenimentele recurente** (un client fix la 3 săptămâni): citirea din calendar trebuie să le desfacă în apariții separate. Test structural în Task 4 (nodurile de citire au opțiunea de desfacere, verificată cu `get_node_types`).
4. **Telefonul scris în orice formă în descriere** (`tel: +40 722-123-456`, `0040722123456`, `TELEFON:0722123456`). Test în Task 4 (`confirmare.js`).
5. **Data spusă în cuvinte în chat** („mâine”, „sâmbătă”): asistentul trebuie să știe data de azi, în ora României. Test structural în Task 8 (instrucțiunile agentului conțin data de azi calculată cu `Europe/Bucharest`).

---

## Interfețele comune (folosite de toate task-urile)

**Setările** (ieșirea fluxului `setari-firma`, citită în fiecare flux cu `$('Setări firmă').first().json`):

| Câmp | Tip | Exemplu demo |
|---|---|---|
| `firma_nume`, `firma_adresa`, `firma_telefon` | text | `Conu' Leonida`, `Str. Exemplu 12, București`, `0722 000 000` (inventat) |
| `program` | obiect `{ "0": null, "1": ["10:00","20:00"], …, "6": ["10:00","16:00"] }` (cheia = ziua săptămânii, 0 = duminică) | |
| `oameni` | listă `[{ "nume": "Vlad", "calendar_id": "…", "servicii": ["Tuns", "Tuns + barbă"] }]` | doi frizeri inventați |
| `servicii` | listă `[{ "nume": "Tuns", "durata_min": 30, "pret": "80 lei" }]` | |
| `link_programare`, `link_recenzie`, `link_dezabonare` | text (URL) | |
| `canal` | `email` / `sms` / `ambele` | |
| `email_patron`, `telegram_chat_id` (gol = fără Telegram) | text | e-mailul lui Andrei |
| `ton` | `prietenos` / `elegant` | `prietenos` |
| `sheet_id` | text | tabelul demo |
| `reamintiri`, `recenzie` | `da` / `nu` | `da` |
| `reamintire_1_min`, `reamintire_2_min` | număr | 1440, 120 (demo: 6, 3) |
| `recenzie_dupa_min`, `recenzie_a_doua_zile` (0 = oprită), `recenzie_pauza_zile` | număr | 120, 0, 90 (demo: 2, 0, 90) |
| `neprezentare_culoare`, `neprezentare_titlu` | text | `11` (Tomato), `NU A VENIT` |
| `informatii_asistent` | text lung (întrebări frecvente) | |
| `model_ai_mesaj`, `model_ai_asistent` | text (ID-ul modelului) | `claude-haiku-5-5` |

**Tabelul firmei** (Google Sheet, `sheet_id`), foile și coloanele exacte:
- `Jurnal`: `data`, `model`, `tip`, `eveniment_id`, `ora_programare`, `contact`, `canal`, `stare`, `detalii`. `tip` ∈ `confirmare`, `mutata`, `reamintire_1`, `reamintire_2`, `recenzie`, `recenzie_2`, `sarit`. Cheia unei trimiteri: `eveniment_id` + `ora_programare` + `tip` (+ `contact`).
- `Nu trimite`: `contact`, `data`, `sursa` (`sms` / `email` / `manual`).
- `Cereri`: `data`, `nume`, `telefon`, `email`, `cerere`, `mesaj`, `raspuns`, `varianta` (`ai` / `fix`), `stare`.

**Un mesaj de trimis** (ieșirea nodurilor Code care pregătesc trimiteri): `{ trimite: boolean, motiv?: string, tip, eveniment_id, ora_programare, canal: "email"|"sms", contact, subiect?, text }`. Un item cu `trimite: false` merge doar în `Jurnal` (cu `tip: "sarit"` și `motiv` în `detalii`).

**Formatul programării** (din spec): titlul `<Serviciul> – <Numele clientului>`; în descriere, rânduri `Telefon: …` și/sau `Email: …`; omul = calendarul.

---

### Task 1: Pregătirea: testele pentru cod, clientul de demonstrație, conturile

**Files:**
- Create: `servicii/automatizari/modele-cod.test.mjs`
- Modify: `servicii/automatizari/modele.test.mjs` (modelele cu mai multe fluxuri)
- Create: `clienti/demo-buildwithac/fisa.md`, `clienti/demo-buildwithac/jurnal.md`
- Andrei creează: `clienti/demo-buildwithac/automatizari/.chei.env` (ignorat)

**Interfaces:**
- Produces: `ruleaza(cod: string, input: object[], noduri?: Record<string, object[]>, acum?: string) → object[]` în `modele-cod.test.mjs` (rulează corpul unui nod Code cu `$input`, `$(nume)`, `$now` = `{ toMillis, toISO }` la ora `acum`); `codDin(model, fisierFlux, numeNod) → string`; regula „nodul Code = fișierul `cod/<nume>.js`”.
- Produces: `fluxuriDin(model) → { fisier, flux }[]` în `modele.test.mjs` (toate `flux*.json` dintr-un dosar).

- [ ] **Step 1: Verifică în contul de probă** (prin Andrei, în interfață): câte zile mai are proba. Dacă mai puțin de 7, spune-i lui Andrei și întreabă dacă începem direct pe un cont de probă nou.
- [ ] **Step 2: Verifică în documentația n8n** (MCP `n8n-docs` sau docs.n8n.io): (a) `$now` există în nodul Code (Luxon); (b) rulările sub-fluxurilor (*Execute Workflow*) se numără sau nu în limita Cloud; (c) declanșatorul Google Calendar consumă rulări când nu găsește nimic. Notează răspunsurile (cu link-uri) în `clienti/demo-buildwithac/jurnal.md`. Dacă (b) = se numără: setările trec în câte un nod Set pe flux (spec, „Setările”), iar Task 2 se schimbă în consecință. Spune-i lui Andrei înainte.
- [ ] **Step 3: Testele care pică.** În `modele.test.mjs`: testele „curat” și „după SMS” rulează pentru fiecare `flux*.json` din fiecare dosar (nu doar `flux.json`); `ASTEPTATE` primește `setari-firma`, `dezabonare`, `programari`, `raspuns-primul-minut`, `asistent-site`, iar testul de existență cere măcar un `flux*.json` și un `README.md`. În `modele-cod.test.mjs`: helper-ele de mai sus și un test-santinelă `ruleaza("return [{json:{t:$now.toMillis()}}]", [], {}, "2026-11-27T10:00:00+02:00")` → `t === Date.parse("2026-11-27T08:00:00Z")`.
- [ ] **Step 4:** `node --test "servicii/automatizari/*.test.mjs"` → FAIL doar pe dosarele noi lipsă (cele existente trec).
- [ ] **Step 5:** Clientul de demonstrație: `fisa.md` (firmă inventată „Conu' Leonida”, frizerie, doi frizeri inventați, ce se demonstrează, „Concept: nu e client real”), `jurnal.md`. Andrei scrie `.chei.env` (`N8N_API_URL=https://proba-buildwithac.app.n8n.cloud`, `N8N_API_KEY=` gol, `N8N_MCP_ACCESS_TOKEN=<tokenul lui de Member>`). `node servicii/automatizari/client-activ.mjs demo-buildwithac` → Andrei repornește sesiunea → `search_workflows` răspunde din contul de probă.
- [ ] **Step 6: Conturile, cu Andrei, câte unul pe mesaj:** în Google-ul lui, două calendare („Conu' Leonida – Vlad”, „Conu' Leonida – Radu”) și un Sheet „Conu' Leonida – demo” cu foile și coloanele exacte de mai sus; în n8n (*Credentials*): Google Calendar, Google Sheets, Gmail (OAuth, contul lui). Cheia Anthropic și Twilio vin la task-urile care le cer.
- [ ] **Step 7:** `git status`: din `clienti/demo-buildwithac/` apar doar `fisa.md` și `jurnal.md`. **Commit** `automatizari: pregătirea modelelor de vânzare (teste pentru cod, clientul demo)`.

---

### Task 2: `setari-firma`

**Files:**
- Create: `servicii/automatizari/modele/setari-firma/flux.json`, `README.md`, `tabel.md`, `cod/verifica-setarile.js`
- Test: `servicii/automatizari/modele-cod.test.mjs`

**Interfaces:**
- Produces: fluxul `setari-firma` (*Execute Workflow Trigger* → Set „Setări” → Code „Verifică setările”) care întoarce un item cu câmpurile din tabelul „Setările”. Toate fluxurile următoare îl cheamă într-un nod numit exact **`Setări firmă`**.

- [ ] **Step 1: Testele care pică** (`verifica-setarile.js`, rulat cu `ruleaza`):
  - setări complete (demo) → un item, neschimbat, cu `program`, `oameni`, `servicii` ca obiecte (nu text JSON);
  - `firma_nume: "CONFIG_NUMELE_FIRMEI"` → aruncă o eroare al cărei mesaj conține `firma_nume`;
  - `oameni: "[{nu e json"` → aruncă, mesajul conține `oameni`;
  - un om cu un serviciu care nu e în `servicii` → aruncă, mesajul conține numele serviciului;
  - `canal: "whatsapp"` → aruncă, mesajul conține `canal`.
- [ ] **Step 2:** `node --test servicii/automatizari/modele-cod.test.mjs` → FAIL.
- [ ] **Step 3:** Scrie `cod/verifica-setarile.js`: parsează câmpurile JSON dacă vin ca text, verifică cele de mai sus, întoarce `[{ json: setari }]`.
- [ ] **Step 4:** Testele → PASS.
- [ ] **Step 5: Construiește fluxul în proba** (încarcă `using-n8n-mcp-skills`; anunță încărcarea `get_workflow_sdk_reference`): Set-ul cu valorile demo din tabel, Code-ul cu conținutul exact al fișierului. `validate_workflow` → `create_workflow_from_code` → fusul orar `Europe/Bucharest`. Publică-l pe `flux-erori` în proba, dacă nu mai există (din `modele/flux-erori`, e-mailul lui Andrei).
- [ ] **Step 6:** `tabel.md`: foile și coloanele exacte (secțiunea „Tabelul firmei”), cum se face tabelul la client. `README.md`: ce face, câmpurile cu explicația fiecăruia, „completezi o singură dată, pentru toate modelele”.
- [ ] **Step 7: Exportul:** Andrei descarcă JSON-ul (meniul fluxului → *Download*) în `clienti/demo-buildwithac/automatizari/fluxuri/` → `node servicii/automatizari/curata.mjs <export> setari-firma` → valorile demo devin `CONFIG_…` (listele rămân ca exemplu, cu nume inventate). Testul de sincronizare: Code-ul din `flux.json` = `cod/verifica-setarile.js`.
- [ ] **Step 8:** `node --test "servicii/automatizari/*.test.mjs"` → PASS pentru `setari-firma`. **Commit** `automatizari: modelul setari-firma`.

---

### Task 3: `dezabonare`

**Files:**
- Create: `servicii/automatizari/modele/dezabonare/flux.json`, `README.md`, `cod/dezabonare.js`
- Test: `servicii/automatizari/modele-cod.test.mjs`

**Interfaces:**
- Consumes: `Setări firmă` (Task 2), foaia `Nu trimite`.
- Produces: două webhook-uri: `POST /dezabonare-sms` (Twilio, mesaje primite: `Body`, `From`) și `GET /dezabonare?c=<contact în base64url>`. `link_dezabonare` din setări = adresa celui de-al doilea; mesajele construiesc link-ul cu `link_dezabonare + "?c=" + base64url(email)`.

- [ ] **Step 1: Testele care pică** (`dezabonare.js`):
  - `{ body: { Body: "Stop", From: "+40712345678" } }` → `[{ json: { contact: "+40712345678", sursa: "sms" } }]`;
  - `Body: "nu mai trimiteti, STOP."`, `From: "0040712345678"` → contact `+40712345678`;
  - `Body: "Dezabonare"` → un item; `Body: "Mulțumesc, ne vedem joi"` → `[]`;
  - `{ query: { c: base64url("Mihai@Exemplu.ro") } }` → contact `mihai@exemplu.ro`, sursa `email`;
  - `{ query: { c: "%%%" } }` → `[]`.
- [ ] **Step 2:** testele → FAIL. **Step 3:** scrie `cod/dezabonare.js` (cuvintele: `stop`, `dezabonare`, `dezabonez`, fără diferență de majuscule/diacritice). **Step 4:** testele → PASS.
- [ ] **Step 5:** Construiește fluxul în probă: cele două webhook-uri → Code → Sheets *append* în `Nu trimite` (dacă nu e deja) → răspuns: pentru SMS, TwiML gol; pentru link, o pagină HTML scurtă „Gata, nu mai primești mesaje de la <firma_nume>.”. Test cu date fixate. **Rulare reală** a link-ului (din browser, cu e-mailul lui Andrei) → rândul apare în `Nu trimite`; apoi rândul se șterge. Ramura SMS se probează la Task 4, după Twilio.
- [ ] **Step 6:** README (cum se pune adresa webhook-ului SMS în Twilio: *Phone Numbers → Active numbers → numărul → Messaging → A message comes in*, verificat în interfața Twilio), export, `curata.mjs`, testul de sincronizare. **Commit** `automatizari: modelul dezabonare`.

---

### Task 4: Reamintiri de programare (`programari/`, partea 1)

**Files:**
- Create: `servicii/automatizari/modele/programari/flux-confirmare.json`, `flux-verificare.json`, `README.md`, `cod/confirmare.js`, `cod/verificare.js`
- Create: `continut/automatizari-demo/reamintiri-programare.md`
- Test: `servicii/automatizari/modele-cod.test.mjs`, `modele.test.mjs`

**Interfaces:**
- Consumes: `Setări firmă`, foile `Jurnal` și `Nu trimite`, link-ul de dezabonare (Task 3).
- Produces: în ambele fișiere, funcțiile interne `telefonRo(text) → string|null`, `citesteContact(descriere) → { telefon: string|null, email: string|null }`, `faraDiacritice(text) → string`, `oraRo(iso) → { zi: "joi, 27 noiembrie", ora: "14:30" }` (copiate identic; un test verifică că sunt identice între fișierele care le au). `verificare.js` produce tipurile `reamintire_1`, `reamintire_2`, `mutata` (aici) și `recenzie`, `recenzie_2` (Task 5).

- [ ] **Step 1: Testele care pică pentru `confirmare.js`** (input = evenimentul din declanșator; noduri: `Setări firmă`, `Jurnal`, `Nu trimite`; `acum` = `2026-11-25T10:00:00+02:00`):
  - eveniment `Tuns + barbă – Mihai Ionescu`, start `2026-11-27T12:30:00Z`, descriere `Telefon: 0722 123 456`, `canal: "sms"` → un item `trimite: true`, `tip: "confirmare"`, `contact: "+40722123456"`, textul conține `Mihai`, `joi, 27 noiembrie`, `14:30`, adresa, `link_programare`, și **nu** conține `ș`, `ț`, `ă`, `î`, `â`;
  - `canal: "ambele"`, descriere cu telefon și `Email: mihai@exemplu.ro` → două itemuri (sms + email); e-mailul are `subiect` și link-ul de dezabonare **nu** (confirmarea e despre programare);
  - descriere `tel: +40 722-123-456`, apoi `TELEFON:0040722123456` → contact `+40722123456` (Review Focus 4);
  - start `2027-03-29T07:00:00Z` → ora `10:00` (Review Focus 1, după schimbarea orei);
  - fără telefon și e-mail → un item `trimite: false`, `motiv: "fara contact"`;
  - contactul în `Nu trimite` → `trimite: false`, `motiv: "nu trimite"`;
  - start în trecut → `[]`; `Jurnal` are deja `confirmare` pentru același eveniment și aceeași oră → `[]`.
- [ ] **Step 2: Testele care pică pentru `verificare.js`** (input = evenimentele tuturor calendarelor, fiecare cu `om`; aceleași noduri; `reamintire_1_min: 1440`, `reamintire_2_min: 120`):
  - programare la `acum + 23h`, creată acum 3 zile, fără nimic în `Jurnal` → `reamintire_1`;
  - aceeași, cu `reamintire_1` deja în `Jurnal` → `[]`; la `acum + 90 min` → `reamintire_2`;
  - programare creată acum 1 oră pentru `acum + 20h` → nimic (prea târziu pentru reamintirea de 24 de ore); pentru `acum + 100 min`, creată acum 10 min → nimic;
  - `Jurnal` are `confirmare` cu `ora_programare` diferită de startul de acum → `mutata`, cu ziua și ora nouă în text; a doua rulare (cu `mutata` în `Jurnal`) → nimic;
  - eveniment de o zi întreagă (`start.date`, fără `dateTime`) → ignorat, fără eroare (Review Focus 2);
  - `reamintiri: "nu"` → niciun `reamintire_*` și niciun `mutata`.
- [ ] **Step 3:** testele → FAIL. **Step 4:** scrie `cod/confirmare.js` și `cod/verificare.js` (orele cu `Intl.DateTimeFormat("ro-RO", { timeZone: "Europe/Bucharest" })`; „acum” din `$now.toMillis()`). Textele mesajelor: scurte, în tonul din `CLAUDE.md`, scrise de tine. **Step 5:** testele → PASS.
- [ ] **Step 6: Textele, la Andrei.** Arată-i textele celor 4 mesaje (confirmare, mutată, reamintire 1, reamintire 2), SMS și e-mail. Ce schimbă el intră în `cod/*.js` și în teste.
- [ ] **Step 7: Construiește în probă** `flux-confirmare`: câte un declanșator Google Calendar „eveniment creat” pentru fiecare dintre cele două calendare → `Setări firmă` → citirea `Jurnal` și `Nu trimite` → Code `Pregătește confirmarea` → IF `trimite` → Switch pe `canal` → Gmail / Twilio → Sheets *append* în `Jurnal` (cu starea reală). `flux-verificare`: Schedule (cron din Global Constraints) → `Setări firmă` → pentru fiecare om, Google Calendar *getAll* (de acum până peste 2 zile, **cu evenimentele recurente desfăcute**, Review Focus 3; numele opțiunii luat cu `get_node_types`) → Code `Pregătește mesajele` → aceeași coadă de trimitere. *Error workflow* = `flux-erori`. `validate_workflow`, apoi `test_workflow` cu date fixate pentru: o programare obișnuită, una mutată, una fără contact.
- [ ] **Step 8: SMS-ul, cu Andrei.** Contul Twilio de probă (al lui, câte un pas pe mesaj), numărul lui verificat, credentialul în n8n. Verifică pe un SMS real dacă apare „Sent from your Twilio trial account”. Dacă da, Andrei alege pentru clipuri: (a) așa, (b) e-mail în loc de SMS, (c) Twilio plătit. Notează alegerea în `jurnal.md`. Probează aici și ramura SMS din `dezabonare` (Andrei trimite „STOP”, rândul apare în `Nu trimite`, apoi îl șterge).
- [ ] **Step 9: Rularea reală.** Setările demo cu întârzierile scurte (6 și 3 minute). Andrei pune o programare în calendarul lui Vlad, cu telefonul/e-mailul lui → confirmarea → o mută → anunțul de mutare → reamintirile. Fiecare mesaj e citit pe telefon de Andrei. Repară ce iese greșit (cu test întâi). Nu treci mai departe fără „e bine”.
- [ ] **Step 10:** Exportul celor două fluxuri → `curata.mjs` (o dată pe fișier, cu numele `programari`; redenumește ieșirea în `flux-confirmare.json` / `flux-verificare.json`) → întârzierile reale, `CONFIG_…`. Teste structurale în `modele.test.mjs`: niciun nod `langchain`/`anthropic` în `programari/`; câte un declanșator Calendar în `flux-confirmare`; nodurile *getAll* au desfacerea recurențelor; Code = `cod/*.js`; funcțiile comune (`telefonRo`, `citesteContact`, `faraDiacritice`, `oraRo`) au exact același text în toate fișierele `modele/*/cod/*.js` care le conțin (testul se aplică automat și fișierelor din Task 7 și 8).
- [ ] **Step 11:** `programari/README.md` (formatul celor existente: ce face, aplicații, de completat, date sensibile, de știut, **cum îl pui la client** pas cu pas, **câte rulări consumă**: ~840 pe lună fluxul programat + câte una la fiecare programare nouă; „un declanșator pe calendar: adaugi sau ștergi unul la client”; cum se vinde doar recenzia: `reamintiri: nu`, fără `flux-confirmare`). `continut/automatizari-demo/reamintiri-programare.md`: scenariul clipului (ce se vede pe laptop și pe telefon, în ce ordine, setările scurte dinainte, durata, ce se ascunde: e-mailuri, numere).
- [ ] **Step 12:** testele → PASS, fără sedilă. **Commit** `automatizari: reamintirile de programare (modelul programari, partea 1)`.

---

### Task 5: Cererea de recenzie (`programari/`, partea 2)

**Files:**
- Modify: `servicii/automatizari/modele/programari/cod/verificare.js`, `flux-verificare.json`, `README.md`
- Create: `continut/automatizari-demo/cerere-recenzie.md`
- Test: `servicii/automatizari/modele-cod.test.mjs`

**Interfaces:**
- Consumes: `verificare.js` din Task 4, `link_recenzie`, `link_dezabonare`, câmpurile `recenzie*` și `neprezentare_*`.

- [ ] **Step 1: Testele care pică** (`recenzie_dupa_min: 120`, `recenzie_pauza_zile: 90`, `recenzie_a_doua_zile: 0`):
  - programare terminată acum 150 min → `recenzie`, cu `link_recenzie`; e-mailul are link-ul de dezabonare, SMS-ul are „Raspunde STOP”;
  - terminată acum 60 min → nimic; terminată acum 26 de ore → nimic (prea veche);
  - `colorId: "11"` → nimic; titlul `NU A VENIT – Tuns – Mihai` → nimic; titlul `nu a venit tuns mihai` → nimic;
  - același contact a primit `recenzie` acum 30 de zile (în `Jurnal`) → nimic; acum 100 de zile → `recenzie`;
  - `recenzie` deja în `Jurnal` pentru eveniment → nimic;
  - `recenzie_a_doua_zile: 3`, `recenzie` trimisă acum 3 zile și o oră → `recenzie_2`; cu `0` → nimic;
  - `recenzie: "nu"` → nimic; contact în `Nu trimite` → `trimite: false`.
- [ ] **Step 2:** FAIL. **Step 3:** completează `verificare.js` (citirea din calendar se extinde la ultimele 2 zile). **Step 4:** PASS.
- [ ] **Step 5:** Textul cererii (SMS și e-mail), la Andrei, ca la Task 4.
- [ ] **Step 6:** `update_workflow` pe `flux-verificare` în probă, `validate_workflow`, test cu date fixate (o programare venită, una marcată cu roșu).
- [ ] **Step 7: Rularea reală** (`recenzie_dupa_min: 2`): Andrei pune o programare care se termină peste 3 minute, plus una marcată cu roșu → doar prima primește cererea. „E bine” de la Andrei.
- [ ] **Step 8:** Exportul, `curata.mjs`, README (secțiunea „Cererea de recenzie”: marcajul neprezentărilor, pasul pentru patron, regula Google fără filtre, legea 506/2004 de verificat cu `legal-advisor-ro` la prima propunere), scenariul clipului. Testele → PASS. **Commit** `automatizari: cererea de recenzie (modelul programari, partea 2)`.

---

### Task 6: Pagina de demonstrație „Conu' Leonida”

**Files:**
- Create: `prototip/demo-automatizari/index.html`, `prototip/demo-automatizari/foto/*`, `prototip/demo-automatizari/comun/*` (copiate din `site/public/concepte/frizerie/` și `_comun/`)

**Interfaces:**
- Produces: un formular „Programare pentru grup / eveniment” cu câmpurile `nume`, `telefon`, `email`, `cerere`, `mesaj`, `website` (capcana, ascuns), trimis cu `fetch` POST JSON la `WEBHOOK_CERERI`; un loc pentru chat (`<div id="chat">` + `WEBHOOK_CHAT`). Cele două adrese sunt constante în capul scriptului, completate la Task 7 și 8.

- [ ] **Step 1:** Copiază pagina și resursele; căile `/concepte/...` devin relative. Pagina live de pe buildwithac.ro **nu** se atinge (`git diff --stat site/` → nimic).
- [ ] **Step 2:** Adaugă secțiunea formularului (în aspectul conceptului) și mesajul de după trimitere („Ți-am trimis un mesaj. Verifică-ți telefonul.”). Fără mesajul „E un concept”. În `<head>`: `noindex`.
- [ ] **Step 3:** `python -m http.server 8765` din `prototip/` → Andrei o vede în browser (la 390px și pe desktop). „E bine” sau schimbările lui.
- [ ] **Step 4: Commit** `prototip: pagina de demonstrație Conu' Leonida`.

---

### Task 7: Răspuns în primul minut (`raspuns-primul-minut/`)

**Files:**
- Create: `servicii/automatizari/modele/raspuns-primul-minut/flux.json`, `README.md`, `cod/verifica-cererea.js`, `cod/mesaj-fix.js`
- Create: `continut/automatizari-demo/raspuns-primul-minut.md`
- Modify: `prototip/demo-automatizari/index.html` (`WEBHOOK_CERERI`)
- Test: `servicii/automatizari/modele-cod.test.mjs`, `modele.test.mjs`

**Interfaces:**
- Consumes: `Setări firmă`, foile `Cereri` și `Jurnal`, `telefonRo`/`faraDiacritice` (copiate identic din Task 4).
- Produces: contractul câmpurilor formularului (cel din Task 6), scris în README.

- [ ] **Step 1: Testele care pică pentru `verifica-cererea.js`** (input = corpul webhook-ului; noduri: `Setări firmă`, `Cereri`):
  - cerere completă → `ok: true`, `telefon: "+40722123456"`, `canale` după `canal`;
  - `website` completat → `ok: false`, `motiv: "capcana"`;
  - fără telefon și e-mail → `ok: false`, `motiv: "fara contact"`;
  - același telefon are o cerere azi (ora României) în `Cereri` → `ok: false`, `motiv: "limita"`; ieri → `ok: true`;
  - `mesaj` de 5.000 de caractere → 1.000; `cerere` de 500 → 200;
  - contactul în `Nu trimite` → tot `ok: true` (e răspunsul la cererea lui; scris în README).
- [ ] **Step 2: Testele care pică pentru `mesaj-fix.js`:** conține numele, cererea, `link_programare`, `firma_nume`; varianta SMS fără diacritice; sub 300 de caractere pentru SMS.
- [ ] **Step 3:** FAIL. **Step 4:** scrie cele două fișiere. **Step 5:** PASS.
- [ ] **Step 6: Instrucțiunile pentru Claude** (mesajul de sistem al nodului AI): scrie doar din cererea omului și din setări; nu promite prețuri, ore libere sau reduceri care nu sunt în setări; un mesaj, sub 600 de caractere (SMS: fără diacritice, sub 300); tonul din `ton`; semnat cu `firma_nume`. Arată-le lui Andrei, cu 3 mesaje-exemplu generate în probă. „E bine” sau schimbările lui.
- [ ] **Step 7: Construiește în probă:** Webhook POST (răspunde imediat 200) → `Setări firmă` → citirea `Cereri` → Code `Verifică cererea` → IF `ok` → nodul Anthropic (`model_ai_mesaj`, *Retry on fail* 2 încercări, *On error* → ieșirea de eroare) → în caz de eroare, Code `Mesaj fix` → trimiterea (Gmail/Twilio) → `Cereri` *append* (cu `varianta`) → `Jurnal` → rezumatul la patron (Gmail; Telegram dacă `telegram_chat_id`). Cheia Anthropic: Andrei o pune în n8n (*Credentials → Anthropic*). Teste cu date fixate: o cerere obișnuită, capcana, AI căzut.
- [ ] **Step 8: Rularea reală:** `WEBHOOK_CERERI` în pagina de demonstrație; Andrei completează formularul de pe telefon → mesajul în sub un minut + rezumatul. Apoi AI-ul „căzut” (cheie greșită pusă temporar) → pleacă mesajul fix. „E bine”.
- [ ] **Step 9:** Teste structurale: nodul AI are `retryOnFail: true` și `onError: "continueErrorOutput"`, iar ieșirea de eroare duce la `Mesaj fix`; Code = `cod/*.js`. Export, `curata.mjs`, README (contractul câmpurilor, cum trimite un formular spre webhook, *Header Auth* când formularul trimite de pe server, datele sensibile la clinici, rulările: una pe cerere), scenariul clipului. PASS. **Commit** `automatizari: răspuns în primul minut`.

---

### Task 8: Asistentul de pe site (`asistent-site/`)

**Files:**
- Create: `servicii/automatizari/modele/asistent-site/flux.json` (+ `flux-ore-libere.json`, `flux-programeaza.json` dacă uneltele sunt sub-fluxuri), `README.md`, `cod/ore-libere.js`, `cod/programeaza.js`
- Create: `continut/automatizari-demo/asistent-site.md`
- Modify: `prototip/demo-automatizari/index.html` (chatul)
- Test: `servicii/automatizari/modele-cod.test.mjs`, `modele.test.mjs`

**Interfaces:**
- Consumes: `Setări firmă`, `citesteContact` (Task 4) pentru testul de compatibilitate.
- Produces: unealta `ore_libere({ zi: "YYYY-MM-DD", om: string|"oricine", serviciu: string }) → { ore: [{ ora: "HH:MM", om: string }] }` (cel mult 6) și unealta `programeaza({ om, serviciu, start: ISO, nume, telefon?, email? }) → { ok: true, eveniment_id } | { eroare: "ocupat"|"lipsa contact"|"serviciu necunoscut" }`.

- [ ] **Step 1: Testele care pică pentru `ore-libere.js`** (`program` vineri `10:00–20:00`, `Tuns` 30 min, `acum` = joi 18:00):
  - Vlad are 10:00–11:00 ocupat vineri → prima oră liberă `11:00`; nicio oră nu se suprapune cu evenimente;
  - nicio oră care s-ar termina după 20:00 (ultima: `19:30`);
  - azi (joi), nicio oră mai devreme de `acum + 60 min`;
  - duminică (`program["0"] = null`) → `ore: []`;
  - `om: "oricine"` → orele ambilor, fiecare cu `om`; un om care nu face serviciul → exclus;
  - evenimentele de o zi întreagă ale unui om (concediu) → omul nu are ore în ziua aceea.
- [ ] **Step 2: Testele care pică pentru `programeaza.js`:**
  - date complete → evenimentul cu `summary: "Tuns – Mihai Ionescu"`, descrierea `Telefon: +40722123456\nEmail: mihai@exemplu.ro`, `end = start + 30 min`, `calendar_id` al lui Vlad;
  - **compatibilitatea:** `citesteContact` din `programari/cod/confirmare.js` citește descrierea produsă → același telefon și e-mail;
  - interval ocupat (evenimentele date ca nod) → `{ eroare: "ocupat" }`; fără telefon și e-mail → `{ eroare: "lipsa contact" }`; serviciu inexistent → `{ eroare: "serviciu necunoscut" }`.
- [ ] **Step 3:** FAIL. **Step 4:** scrie cele două fișiere. **Step 5:** PASS.
- [ ] **Step 6: Verifică în documentația n8n** (anunță dacă e lung): memoria simplă de conversație merge pe n8n Cloud (*Simple Memory*) sau trebuie altă memorie; cum se leagă uneltele (sub-flux ca unealtă vs. nod Calendar ca unealtă + Code Tool); *Allowed Origins* la declanșatorul de chat; cum se pune fereastra `@n8n/chat` pe o pagină. Alege și notează în `jurnal.md`.
- [ ] **Step 7: Instrucțiunile agentului:** se prezintă ca asistent virtual al `firma_nume` la primul mesaj; răspunde doar din `informatii_asistent`, `servicii`, `program`; nu inventează, transmite patronului; întreabă „la cine?” (acceptă „oricine”); cere numele și telefonul sau e-mailul și repetă ziua și ora înainte de `programeaza`; **data de azi, ziua săptămânii și ora, calculate cu `Europe/Bucharest`, sunt în instrucțiuni** (Review Focus 5). Arată-le lui Andrei.
- [ ] **Step 8: Construiește în probă:** declanșatorul de chat (public, *Embedded*, *Allowed Origins* = `http://localhost:8765` pentru demonstrație, `CONFIG_DOMENIU_SITE` în model) → `Setări firmă` → AI Agent (Anthropic `model_ai_asistent`, memoria aleasă, uneltele `ore_libere`, `programeaza`, `transmite_patronului`). Limitele: mesajul clientului tăiat la 1.000 de caractere; după 30 de mesaje într-o conversație, răspunsul fix „Te rog să ne suni la <firma_telefon>.” Teste cu date fixate pentru unelte.
- [ ] **Step 9: Rularea reală, cu Andrei:** chatul pe pagina de demonstrație. Conversațiile de probă: o întrebare de preț; o întrebare la care nu știe (→ transmite); „aveți loc sâmbătă la Vlad?” → programare → confirmarea din Task 4 ajunge pe telefonul lui Andrei; „mâine la oricine” (Review Focus 5). Dacă Haiku greșește (oră, zi, română), Andrei decide trecerea pe Sonnet 5.5. „E bine”.
- [ ] **Step 10:** Teste structurale: declanșatorul de chat are *Allowed Origins* setat (nu `*`); instrucțiunile conțin `Europe/Bucharest`; Code = `cod/*.js`. Export, `curata.mjs`, README (rulările: una pe mesaj; confidențialitatea site-ului clientului trebuie să pomenească chatul, de verificat cu `legal-advisor-ro` la primul client), scenariul clipului. PASS. **Commit** `automatizari: asistentul de pe site`.

---

### Task 9: Documentele, verificările, stadiul

**Files:**
- Modify: `servicii/automatizari/modele/README.md`, `servicii/automatizari/README.md`, `.claude/skills/automatizare-client/SKILL.md` (pasul 5), `docs/progres-brainstorming.md`, memoria

- [ ] **Step 1:** `modele/README.md`: rândurile noi în tabel (setari-firma, dezabonare, programari, raspuns-primul-minut, asistent-site) și o secțiune „Automatizările de vânzare”: cele 4, ce model le face, ce se pune la client pentru fiecare (inclusiv `setari-firma`, `dezabonare`, `flux-erori`, tabelul), rulările lunare însumate și când e nevoie de Pro. `servicii/automatizari/README.md`: o frază și trimiterea. Skill-ul `automatizare-client`, pasul 5: „pentru cele 4 automatizări de vânzare, pornești de la ele: completezi `setari-firma`, nu construiești”.
- [ ] **Step 2:** `node --test "servicii/automatizari/*.test.mjs"` → PASS; din `site/`: `npx vitest run`, `npm run verifica`, `npm run lint` → trec; `grep -rn "[şţŞŢ]" servicii/automatizari continut/automatizari-demo prototip/demo-automatizari` → nimic.
- [ ] **Step 3:** Contul de probă: fluxurile rămân acolo până expiră (Andrei le poate pune pe n8n-ul local, cum a zis). `node servicii/automatizari/client-activ.mjs --niciunul`. `clienti/demo-buildwithac/` rămâne (fișa, jurnalul), pentru clipurile refăcute.
- [ ] **Step 4:** Stadiul în `docs/progres-brainstorming.md` („DE AICI CONTINUĂM”: ce e gata, alegerea Twilio, ce e de verificat la primul client, următorul pas: clipurile, apoi recepționerul vocal / paginile de pe site / proiectul 3) și rândul din memorie.
- [ ] **Step 5:** Verificatorul final pe toată ramura (un subagent, anunțat lui Andrei cu costul). Repară ce e critic, cu test.
- [ ] **Step 6: Commit** `automatizari, stadiul: cele 4 automatizări de vânzare`. Unirea în `main` doar la „da”-ul lui Andrei.
