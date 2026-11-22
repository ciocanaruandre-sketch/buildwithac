---
name: automatizare-client
description: Folosește când Andrei vrea să facă sau să schimbe automatizarea unui client, când zice „fă automatizarea pentru …”, „pornește automatizarea lui …”, „clientul vrea o modificare la automatizare”, „a picat fluxul la …”, „a venit alerta de la …”. Pentru un client fără dosar, întâi `client-nou`.
---

# Automatizare pentru un client

## Pe scurt
Din fișa clientului: alegerea n8n sau Claude → propunerea (PDF) → pornirea contului n8n Cloud al clientului (PDF, pe apel) → construirea în contul lui, prin `n8n-mcp` → testul cu date de probă → instrucțiunile de folosire (PDF) → fluxul de erori. Sau, la o automatizare existentă, o modificare ori o reparație.

Citește înainte: `servicii/automatizari/README.md` (drumul, regula n8n/Claude, costurile, uneltele, cheile), fișa `clienti/<slug>/fisa.md` și `clienti/<slug>/jurnal.md`.

Nu există `clienti/<slug>/fisa.md`? Oprește-te și pornește `client-nou`.

Documentele clientului stau în `clienti/<slug>/automatizari/`: `propunere.md`, `pornire.md` și `folosire.md` intră în git; `fluxuri/`, `pdf/` și `.chei.env` nu. PDF-ul: `node servicii/automatizari/pdf/tipareste.mjs <slug> <propunere|pornire|folosire>`. Formatul documentelor e în `servicii/automatizari/pdf/exemple/` (titlu cu `# `, foi cu `## `, schema pașilor în blocul `schema`, „> **Atenție:**”, cuvântul-cheie între `==`).

## Mod construire
1. **n8n sau Claude.** Din „Ce trebuie automatizat” din fișă, propune după regula din README: merge singur la un eveniment → n8n; gândește cu omul de față → Claude; amândouă → n8n prinde, Claude scrie. **Andrei confirmă** înainte de orice altceva. La Claude, vezi „Varianta Claude” mai jos.
2. **Propunerea.** Scrie `propunere.md`: ce face automatizarea, schema pașilor, aplicațiile legate (și pe al cui cont: al clientului), abonamentele lui lunare (prețurile reverificate pe web, ca în README), ce rămâne la om, n8n sau Claude și de ce. Răspunsul „Ce n-ar trebui să se întâmple niciodată” devine o regulă scrisă („> **Atenție:**”) și, la pasul 5, o protecție în flux. Date sensibile: spune clar ce date atinge. **Fără prețul lui Andrei**: el îl spune pe apel. PDF → Andrei citește → clientul aprobă. Rând în `jurnal.md`.
3. **Pornirea.** Copiază `servicii/automatizari/pornire.md` în `clienti/<slug>/automatizari/pornire.md`; înlocuiește `<Numele firmei>`, `<adresa-contului>`, `<e-mailul lui Andrei>`; lasă doar conturile de conectat ale clientului; ce scrie „de confirmat la primul client” în comentarii verifici pe apel și corectezi și în modelul din `servicii/`. PDF → apelul cu clientul.
4. **Cheile și clientul activ.** Pe apel, după ce clientul a pornit MCP-ul: Andrei, din contul lui de Member, își ia tokenul (*Settings → Instance-level MCP → Connect*, tab-ul **API key**) și cheia API (*Settings → n8n API*). Le scrie **el** în `clienti/<slug>/automatizari/.chei.env` (formatul e în README; niciodată în chat). Apoi:
   `node servicii/automatizari/client-activ.mjs <slug>`
   → Andrei repornește sesiunea (sau `/mcp` → Reconnect) și aprobă serverul. **Verifică că serverul încărcat se numește `n8n-<slug>`** și că `n8n_health_check` răspunde de la adresa clientului, înainte de orice scriere. Dacă cheia API nu merge pentru un Member pe Starter: planul B din README (`N8N_API_KEY=` gol, doar tokenul; serverul devine MCP-ul oficial, verifici cu `get_instance_context` sau `search_workflows` că răspunde contul clientului) și notezi în `jurnal.md`.
5. **Construirea.** Încarcă `using-n8n-mcp-skills`; el spune ce alte skill-uri n8n trebuie. Pornește de la `servicii/automatizari/modele/` unde se potrivește (citește `README.md`-ul modelului: ce `CONFIG_…` are). Adaugă protecția pentru „ce n-ar trebui să se întâmple niciodată” (o verificare înainte de trimitere, o limită, o oprire). **Date sensibile:** nimic sensibil printr-un nod AI fără `legal-advisor-ro`; la clinici, nu deschide prin Claude execuții cu date reale de pacienți. Conturile (Gmail, WhatsApp etc.) le conectează **clientul**, cu Andrei de față.
   **Pe planul B** (MCP-ul oficial, fără `n8n-mcp`), drumul e altul, văzut la proba din 2026-11-22: `get_user_preferences` → `get_workflow_sdk_reference` (~50 KB, o dată pe sesiune) → `get_workflow_best_practices` pe tehnică → `get_node_types` → codul SDK → `validate_workflow` → `create_workflow_from_code` → fusul orar cu `update_workflow` (`setWorkflowSettings`, `Europe/Bucharest`). Fluxul ajunge în proiectul personal al lui Andrei din contul clientului: patronul îl vede, iar la predare trece la el (`predare.md`). Citirile din Sheets **nu** primesc „continuă la eroare”: o conectare expirată trebuie să ajungă la fluxul de erori.
6. **Testul.** `validate_workflow` fără erori, apoi rulare cu **date de probă sau date fixate**. Pe planul B: `test_workflow` cu date fixate pentru declanșator și pentru fiecare nod cu cont (Sheets, Twilio, Telegram), apoi `get_workflow_execution` cu `includeData` pe nodurile de logică. Un test pe caz: o zi obișnuită și cazul protecției. Nodurile fixate nu-și calculează parametrii, deci textele mesajelor le vezi abia la prima rulare cu destinatarii de test. **Niciodată** mesaje către clienții reali ai clientului: destinatarii de test sunt adresele și numerele lui Andrei sau ale clientului. Activarea (publicarea) doar după testul trecut și „da”-ul lui Andrei.
7. **Fluxul de erori.** Importă `modele/flux-erori`, cu `CONFIG_EMAIL_ALERTE` = `contact@buildwithac.ro` la mentenanță, e-mailul clientului la „doar automatizarea”. Publică-l și leagă-l în fiecare flux: meniul fluxului (`...`) → **Settings** → **Error workflow**. Verifică o alertă cu un flux de probă care pică, nu cu fluxul clientului. Error Trigger pornește doar la execuțiile automate: fluxul de probă e publicat, cu un Schedule Trigger peste un minut și un nod care aruncă o eroare; după alertă, îl ștergi.
8. **Folosirea.** Scrie `folosire.md`: ce face, ce are omul de făcut, cum vede ce s-a întâmplat, ce face când ceva nu merge (scurt la mentenanță, lung la „doar automatizarea”). PDF → Andrei → clientul.
9. **La final:** exportul fluxurilor în `clienti/<slug>/automatizari/fluxuri/` (ignorat de git) și o copie în Drive (`buildwithac.ai/clienti/<slug>/`); rândurile în `jurnal.md`; `node servicii/automatizari/client-activ.mjs --niciunul`. La „doar automatizarea”, mai departe `predare-automatizare`.

## Mod modificare / reparație
1. Citește `jurnal.md`: ce s-a construit și ce s-a schimbat înainte.
2. Andrei verifică `.chei.env` (cheile pot fi expirate) → `client-activ.mjs <slug>` → repornire → **verifică `n8n-<slug>`**.
3. La reparație: citește execuțiile care au picat (`n8n_executions`, modul `error`; pe planul B, `search_workflow_executions` și `get_workflow_execution` fără `includeData`). Găsește nodul și cauza (cele dese: conectarea la Google expirată, o coloană redenumită, limita de rulări atinsă). La clinici, datele execuției le vezi în interfața n8n, nu prin Claude.
4. Repară sau modifică, `validate_workflow`, test cu date de probă, „da”-ul lui Andrei.
5. Dacă s-a schimbat ce face omul: actualizează `folosire.md` și PDF-ul.
6. `jurnal.md` (ce s-a stricat sau ce s-a cerut, ce s-a făcut, data) → `client-activ.mjs --niciunul`.

## Varianta Claude
Doar când Andrei a confirmat-o la pasul 1. La „amândouă” (n8n prinde, Claude scrie), n8n are în *Settings → Instance-level MCP → Connect* un **Add to Claude.ai** dintr-un clic, care leagă contul Claude al clientului de n8n-ul lui (văzut pe contul de probă; de verificat la client ce poate face Claude cu el). Verifică întâi pe web ce poate Claude acum (conectori, sarcini programate, proiecte, planul necesar): se schimbă des. Pregătește în `clienti/<slug>/automatizari/claude/` textul instrucțiunilor proiectului, skill-urile și lista conectorilor. Se pun în contul Claude al clientului pe un apel, cu ecranul lui partajat: contul Pro nu are invitații ca n8n. Propunerea, testul și `folosire.md` rămân ca mai sus. Varianta completă (PDF-ul ei de pornire, un model) se proiectează la primul client care o cere: spune-i asta lui Andrei.

## Nu uita
- **O singură instanță pe sesiune.** Nicio scriere în n8n dacă serverul încărcat nu e `n8n-<slug>` al clientului din lucru.
- Cheile și exporturile nu intră în git. Verifică cu `git status` la final: din `clienti/<slug>/automatizari/` apar doar cele trei `.md`.
- Pașii din conturi (n8n, Google) le face Andrei sau clientul, câte unul pe mesaj, cu numele exacte ale butoanelor. Fără parole sau chei în capturi.
- Pașii grei (construirea unui flux mare, multe validări) se anunță înainte, cu cât consumă.
- Commit: `clienti: <slug>, automatizarea (<ce>)`, pe ramura de lucru.
