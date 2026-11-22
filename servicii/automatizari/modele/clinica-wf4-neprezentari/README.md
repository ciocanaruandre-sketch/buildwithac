# Clinică WF4: neprezentările și raportul de seară

**Ce face:** zilnic la 21:00 găsește programările de azi la care pacientul n-a venit. Le marchează `NO_SHOW`, trimite un SMS de reprogramare și notează în jurnal. Apoi calculează cifrele zilei (programări, confirmări, anulări, neprezentări) și le trimite pe Telegram.

**Aplicații (toate pe contul clientului):** Google Sheets, Twilio (SMS), Telegram.

**De completat:** `CONFIG_SHEET_ID`, `CONFIG_TWILIO_NUMAR`, `CONFIG_TELEGRAM_CHAT_ID`. În foaia `Config`: `booking_link`.

**Date sensibile:** da (clinică). SMS-ul are doar prenumele și linkul. Raportul de pe Telegram are doar cifre.
