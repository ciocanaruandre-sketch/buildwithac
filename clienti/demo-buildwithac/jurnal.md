# Jurnal: Conu' Leonida (demonstrație)

Un rând pe lucru: ce s-a decis, livrat sau cerut. Cel mai nou sus.

2026-11-27 — **asistentul de pe site, rulat pe bune (Task 8 Step 9):** Andrei l-a încercat din pagina demo: prețul, o întrebare necunoscută (a ajuns pe e-mail), o programare la Vlad (în calendar, cu confirmarea pe e-mail), „mâine la oricine”; memoria ține minte între mesaje pe n8n Cloud. Rămâne Haiku 5.5. De urmărit: o dată a propus 6 ore, nu „cel mult patru”.

2026-11-27 — **asistentul de pe site, cum se leagă (Task 8 Step 6)**, verificat cu tipurile nodurilor din probă (n8n 2.48, prin MCP):
- **Declanșatorul:** *Chat Trigger* v1.5, `public: true`, modul **Embedded Chat** (`webhook`), *Allowed Origins* = `http://localhost:8765` în probă, `CONFIG_DOMENIU_SITE` în model. *Response Mode* = **lastNode** (nu streaming): o conversație prea lungă primește un răspuns fix dintr-un nod *Set* `{ output }`, fără agent; cu streaming, ramura fără agent n-ar avea ce trimite.
- **Memoria:** *Simple Memory* v1.4 (în n8n, fără cont), cheia = `sessionId` din declanșator (citit cu `$('…')`, nu cu `$json`). **De confirmat la rularea reală** că își amintește între mesaje pe n8n Cloud (documentația avertizează la *queue mode*); dacă uită, trecem pe altă memorie.
- **Uneltele:** `ore_libere` și `programeaza` = sub-fluxuri (*Call n8n Workflow Tool* v2.2 → *Execute Workflow Trigger* v1.3 „Ce cere asistentul”, cu intrări definite) → *Setări firmă* → oamenii → *Programările* (Calendar getAll) → Code (`cod/ore-libere.js`, `cod/programeaza.js`). Sub-fluxurile nu consumă rulări. `transmite_patronului` = nodul *Gmail Tool* direct, spre `email_patron`.
- **Limitele și data:** un nod Code înaintea agentului (`cod/pregateste-conversatia.js`) taie mesajul la 1.000 de caractere, numără mesajele conversației (în datele statice ale fluxului) și scrie instrucțiunile, cu data, ziua și ora în `Europe/Bucharest`.
- **Fereastra de chat:** pachetul `@n8n/chat` (CDN jsdelivr), colorat cu variabilele CSS ale pachetului în culorile paginii. Dacă lui Andrei nu-i place cum arată, facem o fereastră proprie care trimite la același webhook.

2026-11-26 — **SMS-ul: decizia lui Andrei = e-mail în clip.** Contul Twilio de probă (făcut azi, numărul de probă e comun, +49…) trimite doar șabloanele Twilio („Custom message bodies are not supported”, [docs/usage/trials](https://www.twilio.com/docs/usage/trials)); SMS-ul de test a ajuns pe telefonul lui Andrei de la „1718” (expeditorul rescris). În România ([ghidul Twilio](https://www.twilio.com/en-us/guidelines/ro/sms)): rețelele blochează SMS-urile cu link fără expeditor înregistrat (Alpha Sender ID, ~4 săptămâni, cu taxă) și link-uri aprobate; răspunsurile la SMS nu merg (deci „STOP” prin SMS nu se poate proba aici). Proba și clipul merg pe e-mail (setările demo erau deja pe `email`); ramura SMS rămâne în model, testată cu date fixate, iar README-ul spune ce cere SMS-ul în România.

2026-11-26 — textele reamintirilor aprobate de Andrei (confirmare, reamintire cu o zi și cu 2 ore înainte, mutare; SMS și e-mail). Decizia lui: **fără adresă în SMS-ul de confirmare și în prima reamintire**, ca fiecare să fie un singur SMS (adresa rămâne pe e-mail și în reamintirea de 2 ore). Un test păzește limita de 160 de caractere cu datele demo, în ambele tonuri.

2026-11-26 — conturile demo gata: două calendare („Conu' Leonida – Vlad”, „– Radu”) și tabelul „Conu' Leonida – demo” (foile Jurnal, Nu trimite, Cereri) pe contul Google buildwithac.ai@gmail.com (owner-ul probei). În n8n, owner-ul a făcut cele 3 conexiuni (Google Calendar, Google Sheets, Gmail) și le-a dat Member-ului din fereastra conexiunii → tab-ul **Sharing** → utilizatorul → **Save**. Member-ul le vede cu dreptul „connect” (le folosește, nu le citește). Pe probă merge; pe Starter rămâne de confirmat la primul client (proba poate avea funcții peste Starter).

2026-11-26 — contul de probă n8n Cloud mai are 11 zile (până pe ~2026-12-07): rămânem pe el.

2026-11-23 — documentația n8n, verificată înainte de construcție ([Understand executions](https://docs.n8n.io/build/understand-workflows/understand-executions.md)):
- **Sub-fluxurile nu consumă rulări:** „When a workflow calls another workflow with the Execute Sub-workflow node, only the parent (top-level) execution counts.” Deci `setari-firma` rămâne un sub-flux chemat din fiecare model.
- **Declanșatoarele care verifică periodic (polling) consumă o rulare doar când găsesc ceva nou:** „Polls that return no results don't count as an execution.” Exemplul din documentație e Google Drive Trigger; regula e pentru toate, deci și pentru Google Calendar Trigger.
- **Fluxul de erori nu consumă rulări:** „Error workflow executions: Runs of a workflow set as an error workflow.”
- **`$now` în nodul Code:** documentația îl arată doar în expresii; în nodul Code recomandă `DateTime.now()` (Luxon). Se confirmă la prima rulare de probă (Task 2); codul folosește doar `$now.toMillis()`, care merge la fel și cu `DateTime.now()`.

2026-11-23 — client de demonstrație: automatizările de vânzare (planul 17)
