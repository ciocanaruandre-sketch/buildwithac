---
name: predare-automatizare
description: Folosește când clientul a ales „doar automatizarea” sau renunță la mentenanță, când Andrei zice „predau automatizarea”, „clientul vrea doar automatizarea”, „clientul pleacă”, „ies din contul n8n al lui …”.
---

# Predarea unei automatizări

## Pe scurt
Alertele trec la client, clientul primește instrucțiunile lungi, fluxurile lui Andrei trec la patron, iar Andrei iese din contul n8n și își șterge cheile. Pașii exacți sunt în `servicii/automatizari/predare.md`.

Citește înainte: `servicii/automatizari/predare.md`, `clienti/<slug>/fisa.md`, `clienti/<slug>/jurnal.md`.

## Pașii
1. Parcurge `predare.md` cu Andrei, **câte un pas pe mesaj**, cu numele exacte ale butoanelor. Pașii din contul n8n îi face patronul, pe apel; Andrei îi spune ce să apese.
2. **Înainte de ștergerea lui Andrei din cont:**
   - activează clientul (`node servicii/automatizari/client-activ.mjs <slug>`, repornire, verifică `n8n-<slug>`);
   - `flux-erori` trimite la e-mailul clientului;
   - o eroare provocată pe un **flux de probă** (nu pe fluxul clientului): publicat, cu un Schedule Trigger (Error Trigger nu pornește la rulările de mână); clientul confirmă că a primit alerta; fluxul de probă se șterge;
   - în fiecare flux, toate conexiunile sunt ale clientului, nu ale lui Andrei;
   - `folosire.md` are secțiunea lungă „Când ceva nu merge” → PDF-ul nou ajunge la client;
   - exportul fluxurilor în `fluxuri/` și în Drive.
3. **Ștergerea:** patronul șterge utilizatorul lui Andrei și alege să preia fluxurile și conexiunile, nu ștergerea lor. Notează numele exacte ale opțiunilor și corectează `predare.md`, unde sunt marcate „de confirmat”.
4. **Pe laptop:** șterge `clienti/<slug>/automatizari/.chei.env`, apoi `node servicii/automatizari/client-activ.mjs --niciunul`.
5. `jurnal.md`: data predării, unde merg alertele, că Andrei a ieșit din cont, ce s-a exportat. În CRM, etapa potrivită.

## Nu uita
- Testul alertei nu trimite nimic clienților clientului.
- Exporturile rămân în afara git-ului.
- Commit: `clienti: <slug>, predarea automatizării`.
