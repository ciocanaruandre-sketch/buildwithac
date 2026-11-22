# Predarea unei automatizări („doar automatizarea”)

Când clientul a ales „doar automatizarea” sau renunță la mentenanță. Skill-ul `predare-automatizare` parcurge lista cu Andrei, câte un pas pe mesaj. Pașii din contul n8n îi face patronul (Owner), pe un apel, cu Andrei de față.

## Înainte de apel

1. **`flux-erori` trece pe e-mailul clientului.** În n8n-ul clientului, în nodul Gmail al fluxului de erori, `CONFIG_EMAIL_ALERTE` devine e-mailul lui (nu mai e `contact@buildwithac.ro`). Fluxul rămâne publicat.
2. **Probă:** un flux de probă care pică intenționat (nu unul care trimite ceva clienților) → clientul confirmă că a primit alerta. Apoi fluxul de probă se șterge.
3. **PDF-ul de folosire, varianta lungă.** În `clienti/<slug>/automatizari/folosire.md`, secțiunea „Când ceva nu merge” se scrie pentru client, nu pentru Andrei: ce înseamnă alerta, unde vede execuția care a picat, cele mai dese cauze (conectarea la Google a expirat, o coloană redenumită, abonamentul depășit) și ce face la fiecare. Apoi PDF-ul: `node servicii/automatizari/pdf/tipareste.mjs <slug> folosire`.
4. **Exportul fluxurilor**, în `clienti/<slug>/automatizari/fluxuri/` (ignorat de git) și în Drive: copia de rezervă a lui Andrei pentru o eventuală reparație plătită.

## Pe apel, cu patronul

5. **Fluxurile lui Andrei trec la patron.** Patronul: **Settings → Users** → meniul cu trei puncte de lângă Andrei → **Delete user**. n8n întreabă ce se întâmplă cu fluxurile și conexiunile lui: patronul alege **să le preia** (transfer), **nu** ștergerea.
6. **Verificare:** patronul deschide lista de fluxuri și vede toate automatizările, pornite.
7. **MCP-ul:** dacă patronul nu folosește alt asistent AI, îl oprește din **Settings → Instance-level MCP → MCP status**. Tokenul lui Andrei dispare oricum odată cu utilizatorul lui.

<!-- de confirmat la primul client: numele exacte ale opțiunilor de transfer la „Delete user” (documentația vorbește de copierea fluxurilor și conexiunilor la alt utilizator); proba n-a putut verifica asta. Cheia API a lui Andrei dispare odată cu utilizatorul? De confirmat. -->

## După apel, pe laptop

8. Ștergi cheile: `clienti/<slug>/automatizari/.chei.env`.
9. `node servicii/automatizari/client-activ.mjs --niciunul`, ca să nu mai rămână serverul clientului în `.mcp.json`.
10. În `clienti/<slug>/jurnal.md`: data predării, că alertele merg la client, că Andrei a ieșit din cont și ce s-a exportat unde.
11. În CRM, clientul trece la etapa potrivită.

> **Atenție:** Un flux care stă pe conexiunile lui Andrei (nu pe ale clientului) se strică după ștergerea lui. Înainte de pasul 5, verifică în fiecare flux că toate conexiunile sunt ale clientului.
