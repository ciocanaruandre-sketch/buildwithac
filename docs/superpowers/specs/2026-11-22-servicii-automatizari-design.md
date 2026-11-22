# Lucrul pentru clienți, partea 2: automatizările

Data: 2026-11-22. Stare: de aprobat de Andrei.
Marcaje: **[Andrei]** = decizia lui; **[Claude]** = apelul meu, pe care Andrei îl poate schimba; **[de verificat]** = se verifică la construire sau la primul client.

## De ce

La fel ca la site-uri (partea 1, `docs/superpowers/specs/2026-11-19-servicii-site-uri-design.md`): toate serviciile pentru clienți se lucrează din `C:\Portofoliu AC`. Când vine un client de automatizări, Andrei vrea **să se apuce direct de treabă**: regulile scrise, pașii știuți de skill-uri, uneltele n8n la zi [Andrei]. Acum nu are niciun client concret.

Scheletul comun e deja hotărât la partea 1 și nu se rediscută: `servicii/<serviciu>/` pentru cum se face serviciul, `clienti/<slug>/` pentru ce e al unui client, `client-nou` mereu primul.

## Ce e deja făcut (în sesiunea din 2026-11-22)

- **Pachetul de skill-uri `czlonkowski/n8n-skills` actualizat** de la 1.4.0 (aprilie) la **1.38.0** (`git pull` în `~/.claude/skills/n8n-skills`): 14 skill-uri + `using-n8n-mcp-skills`, cel care alege. Noi: agenți AI, tratarea erorilor, sub-fluxuri, mai multe instanțe, fișiere, Code Tool, găzduire proprie [Andrei: „da”].
- Pachetul nou are **hook-uri**: la începutul fiecărei sesiuni injectează `using-n8n-mcp-skills` (~18 KB, cam 5.000 de tokeni), iar înaintea uneltelor n8n amintește skill-ul potrivit. Nu e sigur că pornesc, pentru că pachetul stă în dosarul de skill-uri, nu e instalat ca plugin. **[de verificat la începutul sesiunii următoare]**; dacă pornesc în toate sesiunile, se opresc în afara lucrului cu n8n.
- Pachetul aduce și `mcp.json` spre `api.n8n-mcp.com` (serviciul găzduit al autorului). **Nu se folosește** (vezi mai jos).

## Deciziile

### Unde rulează automatizarea [Andrei]

**n8n Cloud, în contul clientului.** Clientul își face abonamentul și îl plătește; Andrei lucrează în contul lui, cu conturile lui (Gmail, Sheets, WhatsApp etc.).

- Planul de pornire: **Starter**, 20 € pe lună la plata anuală, 24 € la plata lunară, 2.500 de rulări pe lună (o rulare = o pornire completă a fluxului). [de verificat la primul client: prețul, ce se întâmplă la depășirea limitei.]
- Andrei intră prin **invitație** (*Settings → Users → Invite*), cu rolul **Member**: utilizatori nelimitați pe Starter, fără parola clientului. Rolul Admin există doar de la Pro.
- Respinse: n8n-ul de pe laptopul lui Andrei (se oprește când se închide laptopul), un server al lui Andrei cu toți clienții (licența n8n e neclară pentru asta, datele tuturor la un loc), câte un server pe numele fiecărui client (mai multă întreținere) [Andrei a ales Cloud].

### n8n sau Claude [Andrei]

**n8n e drumul principal.** Claude, în contul clientului, e varianta a doua: doar când treaba ar fi complicată în n8n și clientul folosește deja Claude sau l-ar folosi oricum. Nu e un serviciu separat [Andrei].

Regula de alegere, scrisă în `servicii/automatizari/README.md` [Claude]:
- **trebuie să meargă singur**, nesupravegheat, la un eveniment (vine un formular, un mesaj, o programare) → **n8n**;
- **trebuie să gândească, iar omul e oricum în fața ecranului** (un răspuns la un e-mail, o ofertă din model, un rezumat, un raport) → **Claude**: un proiect cu instrucțiuni, conectori și skill-uri, în contul clientului (cel puțin Pro);
- **amândouă**: n8n prinde cererea, Claude scrie răspunsul.

Skill-ul propune alegerea pe fișa clientului; **Andrei o confirmă** înainte de construire.

**Cât din varianta Claude se construiește acum [Claude, Andrei: „e bine”]:** doar regula de mai sus și o ramură scurtă în `automatizare-client` (ce se pregătește: textul instrucțiunilor proiectului, skill-urile, lista conectorilor; se pun în contul clientului împreună cu el, pe un apel cu ecranul partajat, pentru că un cont Claude Pro nu are invitații ca n8n). Varianta completă (dosarul ei la client, PDF-ul ei, testarea) se proiectează la primul client care o cere, ca panoul de la site-uri. Ce poate face Claude exact (sarcini programate, conectori, planul necesar) **[de verificat pe web la fiecare client]**: se schimbă des.

### După livrare [Andrei: amândouă, mentenanța preferată]

| | **Cu mentenanță (preferată)** | **Doar automatizarea** |
|---|---|---|
| Accesul lui Andrei | rămâne Member în contul clientului | iese din cont la predare |
| Când se strică ceva | **un flux de erori îi scrie lui Andrei**; el repară | alerta ajunge la client; reparația se plătește separat |
| Ce primește clientul | instrucțiunile de folosire | instrucțiunile + o secțiune „când ceva nu merge” mai lungă |

Andrei se așteaptă ca cei mai mulți clienți să aleagă mentenanța [Andrei]. Motivul pentru care contează: automatizările se strică singure (conectarea la Google expiră, Meta schimbă regulile la WhatsApp, cineva redenumește o coloană).

### Ce primește clientul în scris [Andrei: PDF]

Trei documente, toate **PDF în aspectul ghidurilor buildwithac** [Andrei pentru instrucțiuni; Claude pentru propunere, ca tot ce primește clientul să arate la fel]:
0. **Propunerea** (pasul 5): ce face automatizarea, schema pașilor, aplicațiile legate, abonamentele lui lunare, ce rămâne la om, n8n sau Claude. **Fără prețul lui Andrei**: prețul îl spune Andrei pe apel [Andrei]. Generatorul are nevoie și de o componentă pentru schema pașilor [Claude].
1. **Instrucțiunile de pornire** (pasul 6 de mai jos): contul n8n Cloud, invitația lui Andrei, pornirea MCP-ului, cheia API, conectarea conturilor. **Complete**, cu numele exacte ale butoanelor: Andrei îl ajută pe apel, dar le urmăresc amândoi din același document [Andrei].
2. **Instrucțiunile de folosire**: ce face automatizarea, ce are clientul de făcut, ce face când ceva nu merge.

PDF-urile clientului **nu ajung niciodată pe buildwithac.ro**. Generatorul ghidurilor (`site/scripts/pdf.ts`) tipărește pagini publice ale site-ului, deci nu se refolosește ca atare: e nevoie de un generator local, separat, care ia doar aspectul (fonturile, culorile, componentele de pas) [Claude]. Sursa fiecărui document stă la client, în git (e text fără date personale); PDF-ul rezultat nu intră în git [Claude].

### Uneltele lui Claude [Andrei: „da”, după verificarea recomandării]

- **`n8n-mcp` comunitar, rulat local** (`npx n8n-mcp`), cu **cheia API a fiecărui client**. Autorul lui spune azi (README, noiembrie 2026) că MCP-ul oficial n8n e de ajuns pentru **un singur** n8n; `n8n-mcp` adaugă ce trebuie aici: **mai multe instanțe** (câte una pe client), repararea automată, analiza erorilor din rulări, peste 2.000 de modele și un control de securitate.
- **Plus MCP-ul oficial**, prin `n8n-mcp`: cu tokenul de acces al instanței (`N8N_MCP_ACCESS_TOKEN`), `n8n-mcp` trimite spre serverul oficial ce nu poate face prin API-ul public (rulări de probă cu date fixate, istoricul versiunilor, agenții n8n). Pentru asta, clientul pornește o dată *Settings → Instance-level MCP* [Claude; de verificat la primul client că rolul Member poate folosi tokenul și cheia API, și că API-ul public e pe Starter].
- **Nu** serviciul găzduit `api.n8n-mcp.com`: datele clienților ar trece printr-o firmă în plus (încă o „persoană împuternicită” GDPR) [Claude, Andrei de acord].
- **Nu** pachetul oficial `n8n-io/skills`: ar dubla skill-urile și hook-urile [Claude, Andrei de acord].
- **Cheia API e a lui Andrei** [Claude]: o face el din contul lui de Member, nu patronul. Claude are doar drepturile de Member; fluxurile pe care le face Andrei sunt ale lui în instanța clientului (patronul le vede pe toate). La predare: fluxurile se transferă patronului (n8n cere asta la ștergerea unui utilizator), iar cheia și utilizatorul lui Andrei se șterg [de verificat în contul de probă: că un Member își poate face cheie API și poate folosi tokenul MCP pe Starter].
- **Cheile clienților** (cheia API, tokenul MCP) stau doar pe laptop, ignorate de git, ca materialele. **O singură instanță țintă pe sesiune**, verificată înainte de orice scriere (skill-ul `n8n-multi-instance` din pachet) [Claude]. Cum anume se alege clientul activ (un `.env` pe client, o comandă care schimbă configurarea MCP) e lăsat constructorului.
- Proiectul vechi `C:\n8n Agent Builder` rămâne cum e.

## Drumul unui client de automatizări

| Pas | Ce se întâmplă | Cine |
|---|---|---|
| 1 | Lead-ul din formularul de pe site intră în CRM. | singur |
| 2 | Telefonul; omul zice „da”. | Andrei |
| 3 | Formularul Tally „Automatizări” (`tally.so/r/M1X8qg`, întrebările 10–19 în `continut/formulare/tally.md`). Tally nu intră în CRM. | Andrei |
| 4 | Fișa clientului. | `client-nou` (primește ramura „automatizări”) |
| 5 | **Propunerea**, o pagină pentru client: ce face automatizarea, schema pașilor, ce aplicații leagă, abonamentele lui lunare (fără prețul lui Andrei), ce rămâne la om, n8n sau Claude. Andrei o confirmă, clientul o aprobă [Claude, Andrei: „e bine”]. Răspunsul Tally „Ce n-ar trebui să se întâmple niciodată” devine o regulă scrisă în propunere și o protecție în flux. | skill nou |
| 6 | Clientul își face contul n8n Cloud, îl invită pe Andrei, pornește MCP-ul, dă cheia API, după **PDF-ul de pornire**, pe apel cu Andrei. | client + Andrei |
| 7 | Construirea în contul clientului, pornind de la **modelele** din `servicii/automatizari/` unde se potrivesc; validare, test. Conturile lui (Gmail, WhatsApp) le conectează **clientul**, cu Andrei de față. | skill nou |
| 8 | **PDF-ul de folosire.** | skill nou |
| 9a | **Mentenanța:** fluxul de erori spre Andrei; modificările cerute se fac și se notează în `jurnal.md`. | skill nou (modul „modificare”) |
| 9b | **Predarea:** Andrei iese din cont, alertele merg la client. | skill de predare |

**Testarea [Claude]:** cu date de probă sau date fixate, **niciodată** cu mesaje către clienții reali ai clientului. Fluxul se activează doar după testul trecut și „da”-ul lui Andrei.

## Ce construim

### 1. `servicii/automatizari/`

```
servicii/automatizari/
  README.md        ← drumul clientului, regula n8n/Claude, costurile clientului, uneltele
  pornire.md       ← lista pentru pasul 6 (sursa PDF-ului de pornire)
  predare.md       ← lista pentru 9b
  modele/          ← fluxurile-model, curățate
  pdf/             ← generatorul local de PDF-uri pentru clienți
```

- **Modelele [Claude]:** cele 3 fluxuri reale din portofoliu (imobiliare, clinica: WF1–WF4, carusele), din `C:\n8n Agent Builder\*.json`, curățate de ID-uri de conturi și de orice dată reală, fiecare cu un rând despre ce face și ce are nevoie. Plus **fluxul de erori** (Error Trigger → mesaj către Andrei), refolosit la fiecare client cu mentenanță.
- **Costurile clientului**, ca la site-uri: n8n Starter; Claude Pro, dacă se alege Claude; abonamentele aplicațiilor legate (de ex. WhatsApp Business API) [de verificat prețurile la construire].
- **Serviciile din flux** (OpenAI, Twilio, WhatsApp Business API etc., folosite de modele) sunt **pe conturile clientului** și le plătește el, ca n8n-ul [Claude, Andrei: „e bine”]. Fiecare e încă o „persoană împuternicită” GDPR a clientului; propunerea le numește.
- **Datele sensibile [Claude, Andrei: „e bine”]:** dacă la Tally clientul răspunde „Da” la „Lucrezi cu date sensibile?” (clinici: date medicale; CNP-uri, date bancare), datele acelea **nu trec printr-un nod AI** fără verificarea cu `legal-advisor-ro`. Modelele clinicii se curăță în consecință (nodul OpenAI din WF3 primește doar ce e permis sau iese) [de verificat la curățare].
- **Clauza de acces GDPR [Claude, Andrei: „e bine”]:** când Andrei lucrează în contul clientului, devine „persoana împuternicită” a lui (GDPR, art. 28): trebuie un text de contract. Se scrie cu skill-ul `legal-advisor-ro`, ca text de pus în contract. La datele sensibile (clinici: date medicale) e și mai important.

### 2. Skill-urile

| Skill | Când | Ce face |
|---|---|---|
| `client-nou` (existent) | ca acum | la „automatizări”: întreabă mentenanță / doar automatizarea; trimite la `automatizare-client` |
| `automatizare-client` | „fă automatizarea pentru …”, „clientul vrea o modificare”, „a picat fluxul la …” | propunerea → PDF-ul de pornire → construirea în contul clientului → testul → PDF-ul de folosire → fluxul de erori (la mentenanță). Modurile „modificare” și „reparație” |
| `predare-automatizare` | „clientul vrea doar automatizarea”, „predau automatizarea” | parcurge `predare.md` cu Andrei, pas cu pas |

Skill-urile urmează felul de lucru al lui Andrei din `CLAUDE.md`: pașii din conturi unul câte unul, cu numele exacte ale butoanelor; pașii grei anunțați; fără parole în capturi.

### 3. Dosarul clientului

```
clienti/<slug>/automatizari/
  propunere.md         ← în git: sursa PDF-ului de propunere
  pornire.md           ← în git: lista de pornire adaptată clientului
  folosire.md          ← în git: sursa PDF-ului de folosire
  fluxuri/             ← exporturile JSON; NU în git
  pdf/                 ← PDF-urile generate; NU în git
```

Cheile clientului stau în afara git-ului (locul exact îl alege constructorul). `fluxuri/` nu intră în git [Claude]: un export poate conține adrese de e-mail sau ID-uri de tabele ale clientului; copia de rezervă e chiar n8n-ul clientului, plus Drive, ca materialele. `.gitignore` primește regulile noi.

### 4. `servicii/README.md`, `clienti/README.md`, `CLAUDE.md`

Rândul „Automatizări” devine „gata”; în `CLAUDE.md`, skill-urile noi la „Lucrul pentru clienți” și rândurile în „Unde sunt lucrurile”.

## Ce NU facem acum

- Sesiunile și ghidurile personalizate (proiectul 3).
- Găzduirea n8n proprie sau pe serverul clientului.
- Automatizările pentru buildwithac însuși.
- Contractul complet și facturarea (doar clauza de acces GDPR).
- Vreo schimbare în CRM sau în formularul Tally.

## Ce ar face proiectul un eșec

- O automatizare care trimite ceva greșit clienților clientului (un preț, un mesaj, o programare ștearsă), mai ales în timpul testelor.
- O scriere în n8n-ul altui client decât cel vizat.
- Cheile sau datele clienților în git.
- Un client care rămâne cu o automatizare stricată fără să afle nimeni.
- Instrucțiuni pe care clientul nu le poate urma singur.

## Contul de probă n8n Cloud [Andrei: „da”]

În timpul construirii, Andrei face un **cont de probă n8n Cloud** pe un e-mail al lui, ghidat pas cu pas, ca `pornire.md` să iasă **complet și verificat**, nu ciornă: numele exacte ale butoanelor, invitarea unui Member, cheia API a unui Member, pornirea MCP-ului, tokenul. Contul se face **abia când planul ajunge la pasul acela**, pentru că proba are zile numărate [de verificat câte]. Ce nu se poate verifica în probă (de exemplu, dacă API-ul public lipsește în perioada de probă) rămâne marcat în `pornire.md` „de confirmat la primul client”. Pentru a juca rolul de Member trebuie un al doilea e-mail al lui Andrei.

## Lăsat constructorului

- Cum se alege clientul activ pentru `n8n-mcp` și unde stau exact cheile.
- Generatorul de PDF: tehnologia (de preferat Playwright, deja în `site/node_modules`), cât din aspectul ghidurilor se refolosește.
- Cum anume îi scrie fluxul de erori lui Andrei (e-mail, Telegram etc.), în limitele contului clientului.
- Textul exact al fișierelor README, `pornire.md`, `predare.md`, în tonul din `CLAUDE.md`.
- **Proba finală [Claude]:** un client inventat, trecut prin `client-nou` și `automatizare-client` până la propunere, PDF-uri și un flux-model construit pe **n8n-ul local al lui Andrei** (prin ngrok), apoi șters. Doar cu acordul lui Andrei în acel moment, pentru că atinge n8n-ul lui. [de verificat: versiunea n8n locală, ≥ 2.12 pentru uneltele oficiale.]
