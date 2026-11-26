# Note: raspuns-in-primul-minut

Postarea: carusel (scriptul lui Andrei, 2026-11-23). Automatizarea din design: `docs/superpowers/specs/2026-11-23-automatizari-modele-design.md`, modelul 3. **La 2026-11-23 modelul lui Andrei nu e încă construit** (planul 17, Task 1 pe jumătate). Ghidul îl învață pe cititor să-și facă singur o variantă mai simplă (Tally în loc de formularul din șablon, fără `setari-firma`).

## Deciziile lui Andrei (2026-11-23)
- Construcția: **Claude Code construiește fluxul prin MCP-ul oficial n8n** (nu nod cu nod, nu JSON de importat: modelul complet e ce vinde Andrei).
- Canalele: **e-mail și SMS**. SMS-ul e partea opțională, la final, din cauza regulilor din România (vezi mai jos).
- Fără „greșeala mea”: doar `<Atentie>`.

## Verificat (2026-11-23)
- **n8n MCP:** https://docs.n8n.io/connect/connect-to-n8n-mcp-server.md și `.../mcp-client-examples.md`. **Settings → Instance-level MCP → Enable MCP access**; **Connect** → „Connect a client”, filele **OAuth (recommended)** și **API key** (tokenul apare o singură dată). Claude Code: `claude mcp add --transport http n8n https://<domeniu>/mcp-server/http`, apoi `/mcp` → n8n → autorizare. Cu cheie: `--header "Authorization: Bearer <token>"`. Eroarea la MCP oprit: „You do not have sufficient permissions to authorize this request”. Unelte: `create_workflow_from_code`, `update_workflow`, `validate_workflow`, `test_workflow` (cu date fixate), `publish_workflow`. Fluxurile făcute prin MCP primesc singure „Available in MCP”. Documentația nu spune nimic despre plan; MCP-ul a mers pe contul de probă al lui Andrei (2026-11-22, `servicii/automatizari/README.md`).
- **n8n Cloud:** proba 14 zile, fără card; Starter 20 €/lună anual, 2.500 de rulări; 24 €/lună lunar din surse externe (verificat la 2026-11-22, `servicii/automatizari/pornire.md`).
- **Tally:** https://tally.so/help/webhooks și /pricing. Webhook-urile sunt gratuite pentru toți. Fila **Integrations** → **Connect** la Webhooks; **Add HTTP headers**. Jurnalul cu pictograma ceasului. Câmpurile cu variante trimit ID-ul opțiunii (textul e în `options`). Fără honeypot în Tally.
- **Claude API:** https://platform.claude.com/docs/en/about-claude/pricing: Haiku 5.5, 0,10 $ / 0,50 $ pe milion de tokeni (sub 100.000 de tokeni în prompt). Conturile noi primesc credite gratuite (suma nu e publicată). Cheia: platform.claude.com/settings/keys → **Create key**. Minimul de încărcare: negăsit.
- **Twilio România:** https://www.twilio.com/en-us/sms/pricing/ro: 0,0781 $ pe segment (noiembrie 2026). https://www.twilio.com/en-us/guidelines/ro/sms: număr local nesuportat; număr internațional suportat, dar expeditorul e rescris; recomandat **Registered Alpha Sender ID**, obligatoriu pentru Telekom, cu taxă, 4 săptămâni; fără răspuns la SMS (nu e two-way); **rețelele blochează SMS-urile cu link-uri** (doar cu link aprobat la Twilio); pe fix: eroarea 21614. Proba: https://www.twilio.com/docs/usage/trials: 100 de SMS-uri, 30 de zile, doar numere verificate (max. 5), **doar mesaje-șablon**.
- **Claude Pro:** 20 $/lună, 17 $ anual (ca la ghidurile anterioare).

## Neverificat (fără contul lui Andrei / fără interfață)
- Etichetele din editorul n8n: **Credential to connect with**, **Create new credential**, **Sign in with Google**, câmpurile Header Auth **Name**/**Value**. Sunt cele cunoscute din n8n, dar nu văzute azi în contul de probă.
- Dacă autorizarea OAuth din Claude Code merge pe contul de probă (are varianta cu cheie în `<DacaNuMerge>`).
- Butonul exact din Tally pentru webhook (documentația spune doar „Click Connect to Webhooks”).
- Butonul **Upgrade your account** din Twilio (din documentație).
- Promptul mare de la pasul 8 nu e rulat: îl probez la construirea modelului 3 sau cu Andrei, înainte de publicare.

## Juridic (fără `legal-advisor-ro`, de confirmat dacă Andrei vrea)
- Răspunsul la cererea omului nu e comunicare comercială nesolicitată: omul a scris primul. Lista de reclame cere acord separat (Legea 506/2004).
- Informarea sub formular (GDPR art. 13): ce date, de ce, AI-ul (Anthropic), cât timp. Fără bifă de acord: temeiul e răspunsul la cererea lui.
- Clinici: fără date despre sănătate la AI.

## Decizia lui Andrei, a doua (2026-11-23, după previzualizare)
Andrei a cântărit construcția nod cu nod, de mână, apoi s-a întors la structura ciornei: **promptul pentru Claude care creează automatizarea, apoi instrucțiunile de conectare și setare.** Ciorna rămâne pe structura asta.
- Promptul de la pasul 8 nu e rulat încă. Cel mai sigur: îl rulez o dată în contul de probă n8n (când e tokenul MCP, planul 17, Task 1) și corectez ce iese greșit, înainte de „Publică”.
- CRM-ul nu se mai construiește în Vercel pe ramurile `ghid/*` (setarea „Ignored Build Step” a proiectului `buildwithac-crm`, pusă prin API la 2026-11-23).

## Promptul mare, refăcut (2026-11-24, fără rulare, la cererea lui Andrei)
Verificat, ca promptul să fie bun fără probă:
- **`test_workflow` simulează** nodurile cu conturi (Gmail, Sheets, Anthropic), declanșatorul și HTTP Request; rulează doar logica (Set, If, Code). Sursa: descrierea uneltei din MCP-ul oficial (proba din 2026-11-22) și https://docs.n8n.io/connect/connect-to-n8n-mcp-server/mcp-server-tools-reference.md. Deci testul vechi de la pasul 14 n-ar fi trimis nimic. Acum: Claude testează singur logica, în 4 cazuri, cu date simulate (pasul 8); testul adevărat e cu **`execute_workflow`, modul `manual`** (rulează ciorna nepublicată; la webhook, `inputs: {type: "webhook", webhookData: {body, headers}}`).
- **Tally** (https://tally.so/help/webhooks): răspuns 2XX în cel mult **10 secunde**, altfel retrimite (5 min, 30 min, 1 h, 6 h, 1 zi). De aceea Webhook-ul răspunde imediat, iar `data.responseId` intră în coloana nouă **ID** (retrimiterile se opresc). `value` la variante = listă de ID-uri, textul în `options`. Câmpul necompletat: nedocumentat (null, gol sau lipsă), promptul le tratează la fel.
- Foaia goală: citirea din Sheets nu întoarce nimic → **Always Output Data** pe citire; fără „continuă la eroare” (lecția din planul 16). Data citită poate fi text „dd.MM.yyyy HH:mm” sau alt format (lecția din WF4).
- Gmail: **Append n8n Attribution** oprit (altfel apare „sent automatically with n8n”), text simplu.
- Plasa de siguranță deterministă: mesajul fix pleacă și la text gol / sub 20 / peste 1.200 de caractere / fără link / cu o sumă (lei, RON, euro, €, $).
- Testele repetate cu același e-mail ar fi fost oprite de regula „24 de ore”: pașii 15 și 18 cer acum ștergerea rândurilor de test.
- Formularul de pe site: fluxul citește și JSON simplu (`nume`, `telefon`, `email`, `interes`, `mesaj`, `website`), nu doar formatul Tally.

**Neverificat:** dacă `execute_workflow` în modul manual trece de Header Auth al Webhook-ului (are `<DacaNuMerge>`: testul se face din formular, la pasul 18); dacă `create_workflow_from_code` leagă singur conexiunile existente (în cont nou nu există, deci nu contează); numele exact al operației din nodul Anthropic (promptul îi cere lui Claude să-l verifice cu `get_node_types`).

## Publicat (2026-11-24)
- Fără capturi (decizia lui Andrei: automatizarea lui nu e încă gata). Coperta: poza lui Andrei (`Exemple/IMG_8673.jpg`), tăiată la 1080×760.
- PDF (18 pagini): https://buildwithac.ro/pdf/raspuns-in-primul-minut-3a9a97624179.pdf ; copia pentru Andrei în `PDF ghiduri/raspuns-in-primul-minut.pdf`.
- Promptul lung se arată pliat pe site („Vezi tot promptul”); `next-mdx-remote` are acum `blockJS: false` (altfel șirul JS din `<Prompt>` dispărea).
- De făcut când e gata modelul 3 din planul 17: rulez promptul o dată în contul de probă și corectez ghidul unde iese altfel (plus capturile, dacă le vrea Andrei).
