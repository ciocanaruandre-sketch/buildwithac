# Clinică WF3: rechemările

**Ce face:** zilnic la 10:00 caută pacienții activi, cu acord pentru SMS, la care a trecut perioada de control (`recall_months`) și cărora nu li s-a scris de curând (`recall_cooldown_days`). Fiecăruia îi trimite un SMS de rechemare, notează în tabel și trimite un sumar pe Telegram.

**Aplicații (toate pe contul clientului):** Google Sheets, Twilio (SMS), Telegram.

**De completat:** `CONFIG_SHEET_ID`, `CONFIG_TWILIO_NUMAR`, `CONFIG_TELEGRAM_CHAT_ID`. În foaia `Config`: `booking_link`, `recall_cooldown_days`.

**Date sensibile: da, și de aici vine schimbarea față de fluxul original.** Originalul trimitea la OpenAI numele pacientului și tratamentul anterior, ca să scrie un SMS personalizat. Tratamentul e o dată medicală (GDPR, art. 9). În model, nodul AI a fost înlocuit cu **Mesaj fix**: un text cu prenumele și linkul de programare, fără tratament. Varianta cu AI se face doar după verificarea cu `legal-advisor-ro` (temei, acordul pacientului, contractul cu OpenAI).

**Reparat la verificarea finală (2026-11-22):** după SMS, `patient_id` vine din „Mesaj fix” (înainte, `last_recall_sent` nu se scria și pacientul primea rechemarea în fiecare zi), jurnalul scrie starea reală, telefoanele `07…` devin `+407…`, scrierile nu mai ascund erorile. Modelul n-a fost rulat la probă: rulează-l cu date fixate înainte de primul client.
