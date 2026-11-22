# Automatizările pentru clienți

Cum se face serviciul „Automatizări pentru firma ta”, de la primul telefon la mentenanță sau predare. Designul: `docs/superpowers/specs/2026-11-22-servicii-automatizari-design.md`.

Pe scurt: automatizarea rulează în **contul n8n Cloud al clientului**, plătit de el. Andrei intră invitat, ca **Member**, și construiește cu Claude prin `n8n-mcp`. Clientul primește trei PDF-uri: propunerea, pornirea și folosirea.

## Drumul clientului

| Pas | Ce se întâmplă | Cine / ce skill |
|---|---|---|
| 1 | Lead-ul din formularul de pe site intră în CRM. | singur |
| 2 | Telefonul; omul zice „da”. | Andrei |
| 3 | Formularul Tally „Automatizări” (`tally.so/r/M1X8qg`, întrebările 10–19 în `continut/formulare/tally.md`). | Andrei |
| 4 | Fișa clientului, cu „mentenanță sau doar automatizarea”. | `client-nou` |
| 5 | Propunerea → PDF → Andrei o confirmă → clientul o aprobă. | `automatizare-client` |
| 6 | Contul n8n Cloud, invitația, MCP-ul, conectarea conturilor: pe apel, după PDF-ul de pornire (`pornire.md`). | client + Andrei |
| 7 | Construirea în contul clientului, de la `modele/` unde se potrivesc; validare, test cu date de probă. | `automatizare-client` |
| 8 | PDF-ul de folosire. | `automatizare-client` |
| 9a | Mentenanța: `flux-erori` îi scrie lui Andrei; modificările se notează în `jurnal.md`. | `automatizare-client` (modificare / reparație) |
| 9b | Predarea: Andrei iese din cont, alertele merg la client (`predare.md`). | `predare-automatizare` |

## n8n sau Claude

**n8n e drumul principal.** Claude, în contul clientului, e varianta a doua, nu un serviciu separat.

- **Trebuie să meargă singur**, nesupravegheat, la un eveniment (vine un formular, un mesaj, o programare) → **n8n**.
- **Trebuie să gândească, iar omul e oricum în fața ecranului** (un răspuns la un e-mail, o ofertă din model, un rezumat) → **Claude**: un proiect cu instrucțiuni, conectori și skill-uri, în contul clientului (cel puțin Pro).
- **Amândouă**: n8n prinde cererea, Claude scrie răspunsul.

Skill-ul propune alegerea din fișă; **Andrei o confirmă** înainte de construire. Ce poate face Claude exact (conectori, sarcini programate, planul necesar) se verifică pe web la fiecare client: se schimbă des.

## După livrare

| | **Cu mentenanță (preferată)** | **Doar automatizarea** |
|---|---|---|
| Accesul lui Andrei | rămâne Member în contul clientului | iese din cont la predare |
| Când se strică ceva | `flux-erori` îi scrie lui Andrei; el repară | alerta ajunge la client; reparația se plătește separat |
| Ce primește clientul | instrucțiunile de folosire | instrucțiunile + o secțiune „când ceva nu merge” mai lungă |

Automatizările se strică singure: conectarea la Google expiră, Meta schimbă regulile la WhatsApp, cineva redenumește o coloană. De aceea mentenanța e cea preferată.

## Ce plătește clientul

Prețuri orientative, verificate la 2026-11-22. Se reverifică la fiecare propunere.

| Ce | Cât | Note |
|---|---|---|
| n8n Cloud **Starter** | 20 € pe lună la plata anuală, 24 € la plata lunară | 2.500 de rulări pe lună, 5 rulări în paralel, utilizatori nelimitați. Ce se întâmplă la depășire: de confirmat la primul client. |
| n8n Cloud Pro | 50 € pe lună la plata anuală | 10.000 de rulări, roluri Admin. Doar dacă Starter nu ajunge. |
| Claude Pro (doar la varianta Claude) | 20 $ pe lună, 17 $ pe lună la plata anuală | prețul de pe claude.com/pricing; se verifică la client |
| SMS prin Twilio, în România | în jur de 0,07 $ pe SMS | surse externe, diferă între rețele; se verifică pe twilio.com/sms/pricing/ro |
| WhatsApp Business (Meta) | pe mesaj livrat, după tipul mesajului | tarifele pentru România s-au schimbat la 1 iulie 2026; se verifică pe pagina de prețuri Meta |

**Serviciile din flux** (OpenAI, Twilio, WhatsApp Business etc.) sunt **pe conturile clientului** și le plătește el, ca n8n-ul. Fiecare e încă o „persoană împuternicită” GDPR a clientului: propunerea le numește.

## Datele sensibile

Dacă la Tally clientul răspunde „Da” la „Lucrezi cu date sensibile?” (clinici: date medicale; CNP-uri, date bancare), datele acelea **nu trec printr-un nod AI** fără verificarea cu skill-ul `legal-advisor-ro`. Exemplul: `modele/clinica-wf3-rechemari` trimite un mesaj fix, nu unul scris de AI din tratamentul pacientului. Regula se aplică și lui Claude: la clinici, Andrei nu deschide prin Claude execuții cu date reale de pacienți (le vede în interfața n8n), iar Claude lucrează cu date de probă.

Când Andrei lucrează în contul clientului, devine „persoana împuternicită” a lui (GDPR, art. 28). Textul pentru contract e în `gdpr.md`.

## Uneltele

- **Skill-urile n8n:** pachetul `czlonkowski/n8n-skills` 1.38.0, în `~/.claude/skills/n8n-skills` (14 skill-uri + `using-n8n-mcp-skills`, cel care alege). Se actualizează cu `git pull` acolo.
- **`n8n-mcp` comunitar, rulat local** (`npx -y n8n-mcp`), cu cheile unui singur client. Leagă și MCP-ul oficial al clientului, prin tokenul lui Andrei (`N8N_MCP_ACCESS_TOKEN`).
- **Fără** serviciul găzduit `api.n8n-mcp.com` (datele clienților ar trece printr-o firmă în plus) și **fără** pachetul oficial `n8n-io/skills` (ar dubla skill-urile).
- **Clientul activ:** `node servicii/automatizari/client-activ.mjs <slug>` scrie `.mcp.json` (ignorat de git) cu un singur server n8n, `n8n-<slug>`. `--niciunul` lasă doar `n8n-docs` (documentația nodurilor, fără chei). După schimbare: repornești sesiunea Claude sau `/mcp` → Reconnect.
- **O singură instanță țintă pe sesiune.** Înainte de orice scriere, verifici că serverul încărcat se numește `n8n-<slug>` al clientului din lucru.
- **Plan B, verificat pe contul de probă:** dacă un Member nu poate face cheie API pe Starter, Claude poate lucra în contul clientului și doar prin MCP-ul oficial (`https://<cont>.app.n8n.cloud/mcp-server/http`, tokenul Member-ului): tokenul a mers și a dat 70 de unelte, între care crearea, validarea, testarea și publicarea fluxurilor.

## Unde stau cheile

`clienti/<slug>/automatizari/.chei.env`, ignorat de git, scris de Andrei (niciodată în chat, niciodată în capturi):

```
N8N_API_URL=https://<cont>.app.n8n.cloud
N8N_API_KEY=<cheia API a lui Andrei, din contul lui de Member>
N8N_MCP_ACCESS_TOKEN=<tokenul MCP al lui Andrei>
```

Exporturile fluxurilor (`fluxuri/`) și PDF-urile (`pdf/`) nu intră nici ele în git. Copia de rezervă e chiar n8n-ul clientului, plus Drive.

## Testarea

Cu date de probă sau date fixate, **niciodată** cu mesaje către clienții reali ai clientului. Fluxul se activează doar după testul trecut și „da”-ul lui Andrei. Fiecare flux se leagă de `flux-erori` (*Settings → Error workflow*), iar `flux-erori` trebuie publicat.

## Modelele și PDF-urile

- `modele/README.md`: fluxurile-model, curățate, plus `flux-erori`. Un model nou se face cu `curata.mjs`.
- `pdf/`: generatorul local. `node servicii/automatizari/pdf/tipareste.mjs <slug> <propunere|pornire|folosire>` face PDF-ul în `clienti/<slug>/automatizari/pdf/`. Exemplele, pentru „Clinica Probă”, sunt în `pdf/exemple/`. PDF-urile clienților nu ajung niciodată pe buildwithac.ro.

<!--
Verificat la 2026-11-22:
- https://n8n.io/pricing/ ; https://docs.n8n.io/manage-cloud/cloud-free-trial/ ; 24 €/lună lunar: surse externe (n8n arată doar prețul anual)
- https://docs.n8n.io/administer/manage-users-and-access/understand-instance-roles.md
- https://docs.n8n.io/connect/connect-to-n8n-mcp-server.md ; https://github.com/czlonkowski/n8n-mcp/blob/main/docs/OFFICIAL_MCP_SETUP.md
- https://claude.com/pricing
- https://www.twilio.com/sms/pricing/ro ; https://developers.facebook.com/docs/whatsapp/pricing
- Contul de probă n8n Cloud (n8n 2.48.7): invitarea Member-ului, MCP-ul oficial cu tokenul Member-ului.
-->
