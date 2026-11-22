# Imobiliare: lead-uri calificate cu AI

**Ce face:** un formular de pe site trimite cererea (webhook). OpenAI o califică după buget, intenție, datele de contact și urgență. Lead-ul calificat ajunge pe Telegram la agent și primește un e-mail; cel necalificat primește alt e-mail. Amândouă se notează în Google Sheets.

**Aplicații (toate pe contul clientului):** OpenAI, Telegram (botul agenției), Gmail, Google Sheets.

**De completat:** `CONFIG_SHEET_ID` (tabelul cu lead-uri), `CONFIG_TELEGRAM_CHAT_ID` (chat-ul agentului). Conturile se conectează la fiecare nod (nodurile nu au conturi în model). Adresa webhook-ului se pune în formularul de pe site.

**Date sensibile:** nu. OpenAI primește însă tot formularul, cu numele, e-mailul și telefonul omului: date personale, deci OpenAI se numește în propunere ca „persoană împuternicită” a clientului.
