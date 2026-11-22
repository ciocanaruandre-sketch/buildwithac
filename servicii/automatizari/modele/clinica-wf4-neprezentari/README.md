# Clinică WF4: neprezentările și raportul de seară

**Ce face:** zilnic la 21:00 (ora României) citește programările de azi. Neprezentare = programare de azi care a trecut și a rămas `SCHEDULED` sau `CONFIRMED`. Pentru fiecare: `NO_SHOW` în tabel, SMS de reprogramare, rând în `Message_Log`. Apoi trimite medicului pe Telegram cifrele zilei.

**Protecția:** peste 10 neprezentări într-o seară (tabel necompletat) → niciun SMS, nimic schimbat în tabel; raportul de pe Telegram cere verificarea tabelului. Limita e `LIMITA` în nodul „Analiza zilei”; nodul IF „Sub limita de 10?” o face vizibilă pe pânză.

**Aplicații (toate pe contul clientului):** Google Sheets, Twilio (SMS), Telegram.

**De completat:** `CONFIG_SHEET_ID` (sau alegi tabelul din listă), `CONFIG_TWILIO_NUMAR` (cu +40), `CONFIG_TELEGRAM_CHAT_ID`. În foaia `Config`: `clinic_name`, `booking_link`.

**Tabelul:** foile `Config` (`key`, `value`), `Appointments` (`appointment_id`, `patient_id`, `name`, `phone`, `appointment_datetime`, `status`, `review_sent`), `Message_Log` (`timestamp`, `appointment_id`, `patient_id`, `phone`, `channel`, `message_type`, `status`, `provider_id`, `error`). Coloana `status` din `Appointments`: listă derulantă (*Data → Data validation*), ca recepția să nu scrie greșit. Data programării poate fi `22.11.2026 10:00` sau `2026-11-22 10:00`; telefoanele `07…` devin `+407…`.

**Date sensibile:** da (clinică). SMS-ul are doar prenumele și linkul, fără diacritice (cu ele, SMS-ul costă dublu). Raportul de pe Telegram are doar cifre.

**Erorile:** citirile și scrierile din Sheets opresc fluxul (ajunge la fluxul de erori); doar SMS-ul merge mai departe la eroare, iar rândul din jurnal primește `error`.

**Verificat la proba din 2026-11-22** (cont de probă n8n Cloud, date fixate): o seară obișnuită (2 neprezentări, una dintre ele `CONFIRMED`) și 11 neprezentări (ramura cu SMS nu pornește). Nu s-au verificat la probă textele SMS-ului și ale raportului: nodurile fixate nu-și calculează parametrii.
