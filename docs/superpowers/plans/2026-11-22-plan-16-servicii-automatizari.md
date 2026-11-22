# Plan 16: lucrul pentru clienți, partea 2 (automatizările) — planul de construire

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Când vine un client de automatizări, Andrei deschide Claude în `Portofoliu AC` și pornește direct: fișa, propunerea, instrucțiunile de pornire, construirea în n8n-ul clientului, instrucțiunile de folosire și mentenanța sau predarea, toate știute de skill-uri.

**Architecture:** `servicii/automatizari/` ține regulile, modelele de fluxuri (curățate), generatorul local de PDF-uri și scriptul `client-activ.mjs`, care leagă `n8n-mcp` de n8n-ul unui singur client prin `.mcp.json` (ignorat de git). Clientul are `clienti/<slug>/automatizari/` cu sursele PDF-urilor în git; exporturile, PDF-urile și cheile nu intră în git. Skill-urile `automatizare-client` și `predare-automatizare`, plus ramura nouă din `client-nou`, duc pașii.

**Tech Stack:** Node 24 (ESM, `node --test`), `marked` (Markdown → HTML, cu tabele) și `playwright` 1.64.1 (aceeași versiune ca în `site/`, ca să refolosească Chromium-ul instalat), `n8n-mcp` comunitar prin `npx`, n8n Cloud.

**Spec:** `docs/superpowers/specs/2026-11-22-servicii-automatizari-design.md` (aprobat de Andrei 2026-11-22). Citește-l înainte de orice task.

## Global Constraints

- Tot textul (fișiere, mesaje de eroare, PDF-uri, commit-uri) în română, cu diacritice cu virgulă (ș, ț), niciodată sedilă. Tonul din `CLAUDE.md` („tu”, fraze scurte, numele exacte ale butoanelor, fără exagerări).
- Ramura: `servicii-automatizari` (există, cu designul comis). Nimic pe `main` fără „da”-ul lui Andrei.
- Commit-urile se termină cu `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- **PDF-urile clientului nu ajung niciodată în `site/`** (nici în `site/public/`, nici pe buildwithac.ro).
- **Cheile clienților și `.mcp.json` nu intră niciodată în git.** Nici în capturi, nici în mesaje de commit.
- **Fără serviciul găzduit `api.n8n-mcp.com` și fără pachetul `n8n-io/skills`.**
- **O singură instanță n8n țintă pe sesiune.** Nicio scriere într-un n8n fără ca numele serverului MCP (`n8n-<slug>`) să fie al clientului din lucru.
- **Testele de fluxuri nu trimit nimic clienților reali ai clientului**: date de probă sau date fixate.
- Pașii din conturi (n8n Cloud, contul de probă) îi face Andrei, câte unul pe mesaj, cu numele exacte ale butoanelor. Fără parole sau chei în capturi.
- Pașii grei (subagenți, instalări, generarea de PDF-uri) se anunță înainte, cu cât consumă (`CLAUDE.md`).
- Nu rula `git push` în acest plan.

## Review Focus

1. `client-activ.mjs` rulat pentru alt client cât unul e activ → în `.mcp.json` rămâne **doar** serverul noului client, celelalte servere (non-n8n) rămân neatinse (Task 1).
2. Fișierul de chei al clientului lipsește, are o cheie goală sau o adresă fără `https://` → refuză cu mesaj clar, `.mcp.json` rămâne cum era (Task 1).
3. Un flux-model care păstrează un ID de cont, un `instanceId`, un e-mail sau un telefon real după curățare → testul modelelor pică (Task 3).
4. Un document Markdown cu sedilă sau cu un bloc `schema` gol → generatorul refuză, nu face un PDF stricat (Task 2).
5. `git status` după o probă completă: din `clienti/<slug>/automatizari/` apar doar `propunere.md`, `pornire.md`, `folosire.md` (Task 1 regula, Task 6 verificarea).

---

### Task 1: Dosarele, regulile git și clientul activ pentru `n8n-mcp`

**Files:**
- Modify: `.gitignore`
- Create: `servicii/automatizari/client-activ.mjs`
- Test: `servicii/automatizari/client-activ.test.mjs`

**Interfaces:**
- Produces (exportate; rulat direct: `node servicii/automatizari/client-activ.mjs <slug>` sau `node servicii/automatizari/client-activ.mjs --niciunul`):
  - `citesteChei(text: string): { N8N_API_URL: string, N8N_API_KEY: string, N8N_MCP_ACCESS_TOKEN?: string }` — format `CHEIE=valoare` pe rând, `#` = comentariu. Aruncă dacă lipsește `N8N_API_URL` sau `N8N_API_KEY`, dacă una e goală, sau dacă adresa nu începe cu `https://`. Scoate `/` de la final.
  - `serverDocumentatie(): object` — intrarea `n8n-docs`: `{ command: "npx", args: ["-y", "n8n-mcp"], env: { MCP_MODE: "stdio", LOG_LEVEL: "error", DISABLE_CONSOLE_OUTPUT: "true" } }` (fără chei: doar documentația nodurilor și validarea).
  - `serverClient(chei): object` — aceeași comandă, cu `N8N_API_URL`, `N8N_API_KEY` și, dacă există, `N8N_MCP_ACCESS_TOKEN` în `env`.
  - `activeaza({ radacina, slug }): string` — citește `<radacina>/clienti/<slug>/automatizari/.chei.env`, scrie `<radacina>/.mcp.json` păstrând orice server care nu începe cu `n8n-`, cu un singur server n8n: `n8n-<slug>`. Întoarce numele serverului.
  - `dezactiveaza({ radacina }): void` — la fel, dar singurul server n8n devine `n8n-docs`.
- Fișierul de chei (`.chei.env`, ignorat) are trei rânduri: `N8N_API_URL=https://<firma>.app.n8n.cloud`, `N8N_API_KEY=…`, `N8N_MCP_ACCESS_TOKEN=…`. **[de verificat în Task 4]** numele exacte ale variabilelor pentru legarea la MCP-ul oficial, în `docs/OFFICIAL_MCP_SETUP.md` din `github.com/czlonkowski/n8n-mcp`; dacă diferă, schimbă-le aici și în teste.

- [ ] **Step 1: Regulile git.** Adaugă în `.gitignore`, lângă regulile `clienti/*/…` existente: `clienti/*/automatizari/fluxuri/`, `clienti/*/automatizari/pdf/`, `clienti/*/automatizari/.chei.env`, `/.mcp.json`, `servicii/automatizari/pdf/node_modules/`. Verifică: `git check-ignore -v clienti/x/automatizari/.chei.env .mcp.json clienti/x/automatizari/fluxuri/a.json` → toate trei ignorate.
- [ ] **Step 2: Scrie testele care pică** (`node:test`; fiecare test cu o rădăcină temporară):
```js
test("citește cheile", () => {
  const c = citesteChei("# n8n\nN8N_API_URL=https://cafe.app.n8n.cloud/\nN8N_API_KEY=abc\n");
  assert.deepEqual(c, { N8N_API_URL: "https://cafe.app.n8n.cloud", N8N_API_KEY: "abc" });
});
test("refuză cheie lipsă", () => assert.throws(() => citesteChei("N8N_API_URL=https://a.app.n8n.cloud"), /N8N_API_KEY/));
test("refuză cheie goală", () => assert.throws(() => citesteChei("N8N_API_URL=https://a.app.n8n.cloud\nN8N_API_KEY="), /N8N_API_KEY/));
test("refuză adresa fără https", () => assert.throws(() => citesteChei("N8N_API_URL=http://a.app.n8n.cloud\nN8N_API_KEY=x"), /https/));
test("activează un singur client și păstrează celelalte servere", () => {
  // .mcp.json inițial: { mcpServers: { altceva: {...}, "n8n-docs": {...} } }
  // activeaza(cafe) → chei: ["altceva", "n8n-cafe"]; env.N8N_API_KEY === "abc"
  // activeaza(salon) → chei: ["altceva", "n8n-salon"] (n8n-cafe a dispărut)
});
test("fără fișier de chei: eroare, .mcp.json neatins", () => {
  // activeaza(lipsa) aruncă /\.chei\.env/; conținutul .mcp.json e identic cu cel dinainte
});
test("dezactivează → doar n8n-docs, fără chei", () => {
  // după activeaza(cafe) + dezactiveaza: chei ["altceva", "n8n-docs"]; JSON-ul nu conține "abc"
});
test("fără .mcp.json: îl creează", () => /* dezactiveaza pe o rădăcină goală → { mcpServers: { "n8n-docs": … } } */);
```
- [ ] **Step 3:** `node --test servicii/automatizari/` → FAIL.
- [ ] **Step 4:** Scrie `client-activ.mjs` (doar module Node). Rulat direct: la succes scrie „Activ: n8n-<slug>. Repornește sesiunea Claude (sau /mcp → Reconnect) ca să se încarce.”; la eroare, mesajul și cod 1. Slug-ul se validează cu `valideazaSlug` din `servicii/site-uri/porneste.mjs`.
- [ ] **Step 5:** `node --test servicii/automatizari/` → PASS. Apoi `node servicii/automatizari/client-activ.mjs --niciunul` → `.mcp.json` cu `n8n-docs`; `git status` nu-l arată.
- [ ] **Step 6: Commit** `servicii/automatizari: clientul activ pentru n8n-mcp, regulile git`.

---

### Task 2: Generatorul local de PDF-uri pentru clienți

**Files:**
- Create: `servicii/automatizari/pdf/package.json`, `servicii/automatizari/pdf/document.mjs`, `servicii/automatizari/pdf/stil.css`, `servicii/automatizari/pdf/tipareste.mjs`, `servicii/automatizari/pdf/exemple/propunere.md`, `servicii/automatizari/pdf/exemple/pornire.md`, `servicii/automatizari/pdf/exemple/folosire.md`
- Test: `servicii/automatizari/pdf/document.test.mjs`

**Interfaces:**
- Produces:
  - `TIPURI = ["propunere", "pornire", "folosire"]`.
  - `documentInHtml(md: string, tip: string): string` (în `document.mjs`) — corpul HTML (fără `<html>`). Reguli:
    - primul `# ` = titlul (`<header class="cap">` cu titlul, apoi un rând mic „buildwithac · <tip în cuvinte>”: „Propunere” / „Instrucțiuni de pornire” / „Instrucțiuni de folosire”);
    - fiecare `## ` începe o foaie `<section class="foaie">`; la `pornire` și `folosire`, foile sunt numerotate („pasul 1”, „pasul 2”…), la `propunere` nu;
    - un bloc ```` ```schema ```` cu un pas pe rând → `<ol class="schema">` cu câte un `<li>` pe pas (săgețile le face CSS-ul); textul pașilor e escapat;
    - un citat care începe cu `**Atenție:**` → `<aside class="atentie">`;
    - cuvintele între `==` și `==` → `<em class="cheie">` (cuvântul-cheie în gradientul logo-ului, ca la ghiduri);
    - restul: Markdown cu tabele (`marked`).
    - Aruncă dacă `tip` nu e în `TIPURI`, dacă lipsește titlul, dacă textul conține sedilă (`[şţŞŢ]`), sau dacă un bloc `schema` e gol.
  - `tipareste.mjs`, rulat: `node servicii/automatizari/pdf/tipareste.mjs <slug> <tip>` → citește `clienti/<slug>/automatizari/<tip>.md`, scrie `clienti/<slug>/automatizari/pdf/<tip>.pdf`, afișează calea. `--exemplu <tip>` folosește `pdf/exemple/<tip>.md` și scrie în `pdf/exemple/<tip>.pdf` (ignorat: adaugă `servicii/automatizari/pdf/exemple/*.pdf` în `.gitignore`).

- [ ] **Step 1:** `package.json` (`"type": "module"`, `"private": true`, scripturile `test` = `node --test` și `pdf` = `node tipareste.mjs`) și `npm install marked playwright@1.64.1` în `servicii/automatizari/pdf/`. Verifică `git diff --stat` (terminațiile de rând).
- [ ] **Step 2: Scrie testele care pică:**
```js
test("titlul și tipul", () => {
  const h = documentInHtml("# Reamintiri pentru clinică\n\nText.", "propunere");
  assert.match(h, /<header class="cap">[\s\S]*Reamintiri pentru clinică[\s\S]*Propunere/);
});
test("foile numerotate doar la pornire și folosire", () => {
  const md = "# T\n\n## Primul\n\nA\n\n## Al doilea\n\nB";
  assert.equal((documentInHtml(md, "pornire").match(/class="foaie"/g) || []).length, 2);
  assert.match(documentInHtml(md, "pornire"), /pasul 2/);
  assert.doesNotMatch(documentInHtml(md, "propunere"), /pasul 1/);
});
test("schema pașilor, cu text escapat", () => {
  const h = documentInHtml("# T\n\n```schema\nVine un formular\nSe scrie în <Sheets>\n```", "propunere");
  assert.match(h, /<ol class="schema">\s*<li>Vine un formular<\/li>\s*<li>Se scrie în &lt;Sheets&gt;<\/li>/);
});
test("Atenție", () => assert.match(documentInHtml("# T\n\n> **Atenție:** nu șterge rândul.", "folosire"), /<aside class="atentie">/));
test("cuvântul-cheie", () => assert.match(documentInHtml("# T\n\nMerge ==singur==.", "propunere"), /<em class="cheie">singur<\/em>/));
test("tabele", () => assert.match(documentInHtml("# T\n\n| a | b |\n|---|---|\n| 1 | 2 |", "propunere"), /<table>/));
test("refuză sedila", () => assert.throws(() => documentInHtml("# Aplicaţie", "propunere"), /sedil/));
test("refuză schema goală", () => assert.throws(() => documentInHtml("# T\n\n```schema\n```", "propunere"), /schema/));
test("refuză tip necunoscut", () => assert.throws(() => documentInHtml("# T", "oferta"), /propunere, pornire, folosire/));
test("refuză fără titlu", () => assert.throws(() => documentInHtml("Text.", "propunere"), /titlu/));
```
- [ ] **Step 3:** `npm test` în `servicii/automatizari/pdf/` → FAIL.
- [ ] **Step 4:** Scrie `document.mjs`. Blocurile `schema` se scot înainte de `marked` și se pun înapoi după; `marked` cu `gfm: true`.
- [ ] **Step 5:** `npm test` → PASS.
- [ ] **Step 6:** `stil.css`: aspectul ghidurilor tipărite (`site/components/ghid/tipar.css` și `ghid.css`): A4, hârtie albă, foi crem `#f6efe3` cu colțuri rotunjite, titluri **Unbounded**, text **Inter**, cuvintele-cheie în **Instrument Serif** italic cu gradientul `linear-gradient(90deg, #ffb52e, #f26a21 45%, #e53222)` (`background-clip: text`), „pasul N” cu portocaliul închis `#c2410c`, `.atentie` ca `.k-list > .atentie` din tipar, tabelele cu linii subțiri `rgba(11,9,8,.2)`, `.schema` = casete crem pe un rând care se rupe, cu „→” între ele (`li + li::before`), `break-inside: avoid` pe foi mici, scheme, atenționări. Fonturile se încarcă din `site/public/fonts/*.woff2` cu `@font-face` și căi `file://` puse de `tipareste.mjs` (aceleași fișiere ca `site/app/fonturi.css`).
- [ ] **Step 7:** `tipareste.mjs`: pagina = `<!doctype html>` + `<style>` (stil.css, cu căile fonturilor) + corpul din `documentInHtml`; Chromium din `playwright`, `page.setContent`, `document.fonts.ready`, `page.pdf` cu formatul și marginile din `site/scripts/pdf/tipar.ts` și subsolul „buildwithac.ro · pagina X din Y”. Refuză dacă fișierul sursă lipsește (mesaj cu calea) sau dacă destinația ar fi sub `site/`.
- [ ] **Step 8: Exemplele.** Scrie cele trei `exemple/*.md` pentru o clinică inventată („Clinica Probă”, reamintiri de programare), fiecare cu toate elementele: titlu, foi, o schemă (la propunere), un tabel, o „Atenție”, un cuvânt-cheie. Anunță pasul, apoi `node servicii/automatizari/pdf/tipareste.mjs --exemplu propunere` (și pornire, folosire) → trei PDF-uri.
- [ ] **Step 9: Andrei judecă vizual.** Deschide PDF-urile pentru Andrei (sau capturi ale paginilor) și cere-i părerea. Repară ce cere; nu trece mai departe fără „e bine”.
- [ ] **Step 10:** `grep -rn "[şţŞŢ]" servicii/automatizari/pdf --include=*.md --include=*.mjs --include=*.css` → nimic. **Commit** `servicii/automatizari: generatorul local de PDF-uri pentru clienți`.

---

### Task 3: Modelele de fluxuri și fluxul de erori

**Files:**
- Create: `servicii/automatizari/curata.mjs`, `servicii/automatizari/modele/README.md`, `servicii/automatizari/modele/<model>/flux.json` + `servicii/automatizari/modele/<model>/README.md` pentru: `imobiliare-lead-uri`, `clinica-wf1-programari`, `clinica-wf2-raspunsuri`, `clinica-wf3-rechemari`, `clinica-wf4-neprezentari`, `carusele-instagram`, `flux-erori`
- Test: `servicii/automatizari/curata.test.mjs`, `servicii/automatizari/modele.test.mjs`

**Interfaces:**
- Consumes: fluxurile din `C:\n8n Agent Builder\` (`real-estate-lead-workflow.json`, `WF1-Intake-Reminder.json`, `WF2-Inbound-Reply-Handler.json`, `WF3-Recall-Engine.json`, `WF4-NoShow-Report.json`, `buildwithai-instagram-pipeline.json`). `workflow-b2b-lead-gen.json` **nu** intră (cercetare B2B; e-mailurile reci sunt ilegale în RO, vezi ghidul HARVEY).
- Produces:
  - `curataFlux(flux: object): object` (în `curata.mjs`) — copie fără: `id`, `versionId`, `meta`, `pinData`, `staticData`, `tags`, `shared`; `active: false`; la fiecare nod, `credentials` păstrează doar tipul, cu `{ id: "", name: "DE_CONECTAT" }`; `webhookId` scos.
  - `gasesteDateReale(flux: object): string[]` — caută în toate textele: e-mailuri (altele decât `@example.com`), telefoane (`/(\+40|0040|\b0)[\s.]?7\d{2}[\s.]?\d{3}[\s.]?\d{3}\b/`), ID-uri Google Sheets (`/[a-zA-Z0-9_-]{40,}/` în câmpuri `documentId`/`sheetId`), adrese ngrok. Întoarce lista găsită.
  - Rulat direct: `node servicii/automatizari/curata.mjs <sursă.json> <model>` → scrie `modele/<model>/flux.json` și afișează ce a găsit `gasesteDateReale` (de înlocuit de mână cu `CONFIG_…` sau `@example.com`).

- [ ] **Step 1: Scrie testele care pică** (`curata.test.mjs`):
```js
test("scoate ID-urile și conturile", () => {
  const c = curataFlux({ id: "x", versionId: "v", meta: { instanceId: "i" }, active: true, pinData: {},
    nodes: [{ name: "G", webhookId: "w", credentials: { googleSheetsOAuth2Api: { id: "7", name: "Gmail Andrei" } } }] });
  assert.equal(c.id, undefined); assert.equal(c.meta, undefined); assert.equal(c.active, false);
  assert.deepEqual(c.nodes[0].credentials, { googleSheetsOAuth2Api: { id: "", name: "DE_CONECTAT" } });
  assert.equal(c.nodes[0].webhookId, undefined);
});
test("găsește date reale", () => {
  const f = { nodes: [{ parameters: { to: "ion@gmail.com", text: "Sună la 0722 123 456", url: "https://abc.ngrok-free.dev/x" } }] };
  assert.equal(gasesteDateReale(f).length, 3);
});
test("example.com e permis", () => assert.deepEqual(gasesteDateReale({ nodes: [{ parameters: { to: "client@example.com" } }] }), []));
```
și `modele.test.mjs`: pentru fiecare `modele/*/flux.json`: JSON valid, `active === false`, fără `id`/`meta`/`pinData`, toate `credentials` cu `name === "DE_CONECTAT"`, `gasesteDateReale(...)` gol, și există `README.md` lângă.
- [ ] **Step 2:** `node --test servicii/automatizari/` → FAIL.
- [ ] **Step 3:** Scrie `curata.mjs`.
- [ ] **Step 4:** Rulează-l pe cele 6 surse. Înlocuiește de mână ce raportează (adrese → `@example.com`, ID-uri de tabele → `CONFIG_SHEET_ID` într-un nod de configurare, linkuri de programare → `CONFIG_BOOKING_LINK`).
- [ ] **Step 5: Datele sensibile în `clinica-wf3-rechemari`.** Nodul `@n8n/n8n-nodes-langchain.openAi` primește numele pacientului și tipul tratamentului (date medicale). Conform regulii din design, în model îl înlocuiești cu un nod **Set** care compune un mesaj fix (șablon cu prenumele și linkul de programare, fără tratament), și repari nodul Code de după, care citea răspunsul OpenAI. În `README.md`-ul modelului scrii de ce și că varianta cu AI cere verificarea cu `legal-advisor-ro`.
- [ ] **Step 6: `flux-erori`.** Construiește-l de mână: **Error Trigger** → **Gmail** (Send), către `CONFIG_EMAIL_ALERTE` (la mentenanță: `contact@buildwithac.ro`, din `site/lib/config.ts`; la „doar automatizarea”: e-mailul clientului). Subiect: „Automatizarea „{{ $json.workflow.name }}” a picat”. Corp: numele fluxului, nodul care a picat, mesajul erorii, ora, link-ul execuției (`{{ $json.execution.url }}`). **Nimic din datele procesate** (fără `$json.execution.error` complet dacă conține date de intrare: doar `message` și `node.name`). Se leagă la fiecare flux din *Workflow settings → Error workflow*.
- [ ] **Step 7: Validează** fiecare `flux.json` cu serverul `n8n-docs` (Task 1; dacă uneltele lui nu apar, Andrei repornește sesiunea și aprobă serverul din `.mcp.json`): `validate_workflow` (încarcă întâi `using-n8n-mcp-skills` și `n8n-validation-expert`). Repară erorile reale; avertismentele cunoscute ca false le notezi în `README.md`-ul modelului.
- [ ] **Step 8:** Câte un `README.md` pe model (5–10 rânduri): ce face, ce aplicații cere (și pe al cui cont: al clientului), ce `CONFIG_…` trebuie completate, date sensibile da/nu. `modele/README.md` = tabelul modelelor.
- [ ] **Step 9:** `node --test servicii/automatizari/` → PASS. **Commit** `servicii/automatizari: modelele de fluxuri și fluxul de erori`.

---

### Task 4: Regulile, pornirea (verificată pe contul de probă), predarea, clauza GDPR

**Files:**
- Create: `servicii/automatizari/README.md`, `servicii/automatizari/pornire.md`, `servicii/automatizari/predare.md`, `servicii/automatizari/gdpr.md`

- [ ] **Step 1: Verifică pe web** (surse oficiale; „Verificat la <data>” cu link-uri la finalul fiecărui fișier): n8n Cloud Starter și Pro (preț lunar/anual, rulări, ce se întâmplă la depășire), perioada de probă (câte zile, ce lipsește în probă, mai ales API-ul public), rolurile pe Starter (Owner/Member), cheia API a unui Member (se poate? ce vede?), MCP-ul oficial pe Cloud (cine îl pornește, tokenul), transferul fluxurilor la ștergerea unui utilizator; în `github.com/czlonkowski/n8n-mcp`, `docs/OFFICIAL_MCP_SETUP.md`: variabilele exacte pentru legarea la MCP-ul oficial (corectează Task 1 dacă diferă); Claude Pro (preț, conectori, sarcini programate) pentru varianta Claude; prețul WhatsApp Business API prin Meta și Twilio SMS în România (orientativ).
- [ ] **Step 2: Contul de probă, cu Andrei.** Anunță: „acum facem contul de probă n8n Cloud; ai nevoie de două e-mailuri ale tale”. Pas cu pas, câte unul pe mesaj, cu numele butoanelor pe care le vezi tu în capturile lui (`Exemple/`, necomise): (1) contul de probă cu e-mailul A (rolul „patron”); (2) invitarea e-mailului B ca **Member**; (3) din contul B: cheia API (*Settings → n8n API*), dacă există în probă; (4) din contul A: *Settings → Instance-level MCP* pornit, tokenul; (5) cheile trec în `clienti/proba-n8n/automatizari/.chei.env` (scrise de Andrei, nu în chat) → `node servicii/automatizari/client-activ.mjs proba-n8n` → repornirea sesiunii → `n8n_health_check` (sau echivalentul) merge din contul de Member. Ce nu merge în probă se notează pentru `pornire.md` „de confirmat la primul client”. După probă: `--niciunul`, ștergerea `clienti/proba-n8n/`, iar Andrei închide contul de probă sau îl lasă să expire.
- [ ] **Step 3:** `pornire.md`: lista pentru client (sursa PDF-ului de pornire, scrisă ca model cu `<Numele firmei>`): contul n8n Cloud și planul Starter, invitarea lui Andrei ca Member, pornirea MCP-ului, ce îi dă lui Andrei (cum, nu în chat: de exemplu, pe apel, Andrei își face singur cheia ca Member), conectarea conturilor lui (Gmail, Sheets, WhatsApp) cu Andrei de față, ce **nu** face (nu șterge fluxurile, nu schimbă rolul lui Andrei). Numele butoanelor din Step 2. Format: `## ` pe pas, „Atenție” unde e o capcană reală.
- [ ] **Step 4:** `README.md`: drumul clientului (pașii 1–9 din design, cu skill-ul fiecărui pas); regula n8n/Claude; mentenanță vs doar automatizarea (tabelul din design); costurile clientului (din Step 1); serviciile din flux pe contul clientului; regula datelor sensibile; uneltele (pachetul `czlonkowski` 1.38, `n8n-mcp` local, `client-activ.mjs`; fără `api.n8n-mcp.com`, fără `n8n-io/skills`); unde stau cheile; testarea fără mesaje reale; trimitere la `modele/README.md`.
- [ ] **Step 5:** `predare.md`: „doar automatizarea”: fluxul de erori trece pe e-mailul clientului; PDF-ul de folosire cu secțiunea „când ceva nu merge” lungă; patronul (Owner) șterge utilizatorul lui Andrei și primește fluxurile lui (pașii exacți din Step 1); Andrei își șterge cheia; `.chei.env` al clientului se șterge de pe laptop; `client-activ.mjs --niciunul`; nota în `jurnal.md`.
- [ ] **Step 6: `gdpr.md`** cu skill-ul `legal-advisor-ro`: textul clauzei de acces (Andrei ca persoană împuternicită, art. 28 GDPR: ce date vede, în ce scop, cât timp, că nu le copiază în afara contului clientului, cheile ținute doar pe laptopul lui, ce se întâmplă la predare și la încheierea mentenanței), plus o notă pentru datele sensibile (art. 9). Gata de pus într-un contract; contractul complet nu intră în plan.
- [ ] **Step 7:** `grep -rn "[şţŞŢ]" servicii/automatizari --include=*.md` → nimic. **Commit** `servicii/automatizari: regulile, pornirea, predarea, clauza GDPR`.

---

### Task 5: Skill-urile

**Files:**
- Create: `.claude/skills/automatizare-client/SKILL.md`, `.claude/skills/predare-automatizare/SKILL.md`
- Modify: `.claude/skills/client-nou/SKILL.md`, `.claude/skills/client-nou/fisa.md`

Format ca `.claude/skills/site-client/SKILL.md`: frontmatter `name` + `description` (cu frazele lui Andrei), „Pe scurt”, „Pașii”, „Nu uita”.

- [ ] **Step 1: `client-nou`.** La pasul 6 („Ce a cumpărat”): pentru automatizări întreabă mentenanță sau doar automatizarea. La pasul 8: **Automatizări** → `automatizare-client`; sesiunile rămân „proiectul 3”. În `fisa.md`, la „Ce a cumpărat”: „La automatizări: cu mentenanță sau doar automatizarea”, și o secțiune nouă „Ce trebuie automatizat” (din Tally 10–19: treaba pas cu pas, cât de des, aplicațiile, unde ține clienții, ce n-ar trebui să se întâmple niciodată, date sensibile da/nu, cine o folosește).
- [ ] **Step 2: `automatizare-client`.** Pornește la „fă automatizarea pentru …”, „clientul vrea o modificare la automatizare”, „a picat fluxul la …”. Citește întâi `servicii/automatizari/README.md`, fișa și `jurnal.md`. **Mod construire:** (1) alegerea n8n/Claude după regulă, confirmată de Andrei; (2) `propunere.md` în `clienti/<slug>/automatizari/` (ce face, schema, aplicațiile, abonamentele lui, ce rămâne la om, regula „ce n-ar trebui să se întâmple niciodată”; **fără prețul lui Andrei**) → PDF cu `tipareste.mjs` → Andrei → clientul aprobă; (3) `pornire.md` adaptat din `servicii/automatizari/pornire.md` → PDF → apelul cu clientul; (4) Andrei pune cheile în `.chei.env` → `client-activ.mjs <slug>` → repornirea sesiunii → **verifică că serverul activ e `n8n-<slug>`** înainte de orice scriere; (5) construirea (skill-urile `using-n8n-mcp-skills` și cele indicate de el), pornind de la `servicii/automatizari/modele/` unde se potrivesc; protecția pentru „ce n-ar trebui să se întâmple niciodată”; regula datelor sensibile; (6) testul cu date de probă / date fixate, fără mesaje către clienți reali; activarea doar după „da”-ul lui Andrei; (7) la mentenanță: `flux-erori` cu `contact@buildwithac.ro`, legat în setările fiecărui flux; (8) `folosire.md` → PDF; (9) exportul fluxurilor în `fluxuri/` (ignorat) și copia în Drive; `jurnal.md`; `client-activ.mjs --niciunul`. **Mod modificare / reparație:** activează clientul, citește execuțiile eșuate, repară, testează, actualizează `folosire.md` și PDF-ul dacă se schimbă ce face omul, `jurnal.md`. **Varianta Claude:** ramură scurtă (instrucțiunile proiectului, skill-urile, conectorii, pregătite în `clienti/<slug>/automatizari/claude/`, puse în contul clientului pe un apel cu ecranul partajat; ce poate Claude acum se verifică pe web la fiecare client); varianta completă se proiectează la primul client care o cere.
- [ ] **Step 3: `predare-automatizare`.** Pornește la „clientul vrea doar automatizarea”, „predau automatizarea”, „clientul pleacă”. Parcurge `servicii/automatizari/predare.md` cu Andrei, câte un pas pe mesaj; verifică la final că `flux-erori` trimite la client (o eroare provocată pe un flux de probă), notează în `jurnal.md`.
- [ ] **Step 4:** `grep -rn "[şţŞŢ]" .claude/skills/automatizare-client .claude/skills/predare-automatizare .claude/skills/client-nou` → nimic. **Commit** `skill-uri: automatizare-client, predare-automatizare; client-nou știe de automatizări`.

---

### Task 6: Documentele proiectului, proba cu un client inventat, stadiul

**Files:**
- Modify: `CLAUDE.md`, `servicii/README.md`, `clienti/README.md`, `docs/progres-brainstorming.md`

- [ ] **Step 1:** `servicii/README.md`: rândul „Automatizări” → „gata”, `automatizari/`. `clienti/README.md`: `automatizari/` în schema dosarului și ce nu intră în git (`fluxuri/`, `pdf/`, `.chei.env`). `CLAUDE.md`, „Lucrul pentru clienți”: automatizările gata, skill-urile `automatizare-client` / `predare-automatizare`, `.mcp.json` și cheile nu intră în git; „Unde sunt lucrurile”: `servicii/automatizari/` (modelele, generatorul de PDF-uri, `client-activ.mjs`).
- [ ] **Step 2: Proba (cu acordul lui Andrei în acel moment, pentru că atinge n8n-ul lui local).** Întreabă-l întâi. Firmă inventată „Clinica Probă” (`proba-clinica`), cu o fișă scurtă scrisă de tine, prin `client-nou` → `automatizare-client`: propunerea și PDF-ul ei, `pornire.md` și PDF-ul lui; cheile n8n-ului local al lui Andrei (adresa ngrok din `C:\n8n Agent Builder\.mcp.json`, scrise de el în `.chei.env`; dacă n8n-ul local nu e pornit sau e sub 2.12, sari construirea și notează) → `client-activ.mjs proba-clinica` → construirea modelului `clinica-wf4-neprezentari` cu date de probă → validarea → `folosire.md` și PDF-ul. Repară pe loc ce e neclar în skill-uri. La final: fluxul de probă șters din n8n-ul lui Andrei (cu „da”-ul lui), `client-activ.mjs --niciunul`.
- [ ] **Step 3:** `git status` din rădăcină: din `clienti/proba-clinica/` apar doar `fisa.md`, `jurnal.md`, `automatizari/propunere.md`, `automatizari/pornire.md`, `automatizari/folosire.md`; nimic din `fluxuri/`, `pdf/`, `.chei.env`, `materiale/`; `.mcp.json` nu apare. Apoi șterge `clienti/proba-clinica/` cu totul.
- [ ] **Step 4: Hook-ul pachetului n8n.** Verifică dacă la începutul sesiunii apare textul `using-n8n-mcp-skills` (hook-ul SessionStart al pachetului). Dacă apare și în sesiunile fără n8n, spune-i lui Andrei cât costă (~5.000 de tokeni pe sesiune) și, la „da”, oprește-l (de exemplu, scoate `SessionStart` din `~/.claude/skills/n8n-skills/hooks/hooks.json`, notând că un `git pull` viitor îl readuce).
- [ ] **Step 5:** Verificările cerute de `CLAUDE.md`, din `site/`: `npx vitest run`, `npm run verifica`, `npm run lint` → trec (site-ul nu e atins). Plus `node --test servicii/` → trec.
- [ ] **Step 6:** `docs/progres-brainstorming.md`: în „DE AICI CONTINUĂM”, noul stadiu (ramura, ce e gata, ce a rămas de confirmat la primul client, următorul proiect: 3, sesiunile și ghidurile personalizate). Memoria: rândul de stadiu.
- [ ] **Step 7: Commit** `CLAUDE.md, stadiul: lucrul pentru clienți, partea 2`. Unirea în `main` doar la „da”-ul lui Andrei.
