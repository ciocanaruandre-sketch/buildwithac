# Tabelul firmei

Un Google Sheet în contul Google al firmei, cu trei foi. Numele foilor și ale coloanelor trebuie să fie **exact** acestea: fluxurile le caută după nume. ID-ul tabelului intră în `sheet_id`, în setări.

| Foaia | Coloanele, în ordine | Cine scrie acolo |
|---|---|---|
| `Jurnal` | `data`, `model`, `tip`, `eveniment_id`, `ora_programare`, `contact`, `canal`, `stare`, `detalii` | fluxurile: fiecare mesaj trimis sau sărit |
| `Nu trimite` | `contact`, `data`, `sursa` | fluxul `dezabonare` (`sms`, `email`) sau patronul, de mână (`manual`) |
| `Cereri` | `data`, `nume`, `telefon`, `email`, `cerere`, `mesaj`, `raspuns`, `varianta`, `stare` | răspunsul în primul minut: fiecare cerere din formular |

În `Jurnal`, `tip` e unul dintre `confirmare`, `mutata`, `reamintire_1`, `reamintire_2`, `recenzie`, `recenzie_2`, `sarit`. O trimitere e unică după `eveniment_id` + `ora_programare` + `tip` (+ `contact`): așa nu pleacă același mesaj de două ori. În `Cereri`, `varianta` e `ai` sau `fix` (mesajul fix, când AI-ul nu răspunde).

## Cum se face, la client

1. `sheets.google.com` → **Gol** (*Blank*) → numele, de exemplu `<Firma> – automatizări`.
2. Redenumește prima foaie în `Jurnal` (dublu clic jos), apoi **+** pentru `Nu trimite` și `Cereri`.
3. În **A1** din fiecare foaie, lipește formula ei și apasă Enter:
   - `Jurnal`: `=SPLIT("data,model,tip,eveniment_id,ora_programare,contact,canal,stare,detalii"; ",")`
   - `Nu trimite`: `=SPLIT("contact,data,sursa"; ",")`
   - `Cereri`: `=SPLIT("data,nume,telefon,email,cerere,mesaj,raspuns,varianta,stare"; ",")`

   Dacă formula dă eroare, schimbă `;` în `,` (depinde de limba tabelului).
4. Formula devine text: selectezi rândul 1 → **Ctrl+C** → **Ctrl+Shift+V**.
5. ID-ul tabelului (bucata din adresă dintre `/d/` și `/edit`) intră în `sheet_id`.

Metoda cu formula merge în orice limbă a interfeței. „Împarte textul în coloane” din meniul *Date* nu apare la toată lumea (la proba din 2026-11-26 nu a apărut).
