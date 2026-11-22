# Clinică WF2: răspunsurile la SMS

**Ce face:** când pacientul răspunde la SMS (webhook Twilio), înțelege intenția: CONFIRM, ANULEZ sau STOP. Actualizează programarea în tabel. La confirmare și la anulare, recepția primește un mesaj pe Telegram („slot liber” la anulare). STOP îl scoate de pe lista de SMS-uri.

**Aplicații (toate pe contul clientului):** Twilio (webhook pe numărul de SMS), Google Sheets, Telegram.

**De completat:** `CONFIG_SHEET_ID`, `CONFIG_TELEGRAM_CHAT_ID` (chat-ul recepției). Adresa webhook-ului se pune în Twilio, la numărul clinicii, la „A message comes in”.

**Date sensibile:** da (clinică). Pe Telegram ajung doar numele, telefonul și ID-ul programării, fără tratament. Telegram e încă o „persoană împuternicită” a clinicii: se numește în propunere.
