# Fluxul de erori

**Ce face:** când alt flux al clientului pică, trimite o alertă pe două canale, ca să ajungă și când pică tocmai Google-ul clientului. E-mailul are numele fluxului, nodul care a picat, mesajul erorii, ora și link-ul execuției. **Nimic din datele procesate**: fără datele de intrare și fără detaliile tehnice lungi (`stack`), care pot conține date ale clienților. Telegram are doar numele firmei, al fluxului, nodul, ora și link-ul: fără mesajul erorii, care poate conține un telefon.

**Aplicații:** Gmail, pe contul clientului; Telegram, cu botul de alerte al lui Andrei (la „doar automatizarea”, nodul Telegram se șterge la predare). Fiecare canal continuă la eroare, ca celălalt să plece oricum.

**De completat:** `CONFIG_TELEGRAM_CHAT_ID_ALERTE` (chat-ul lui Andrei), `CONFIG_NUMELE_FIRMEI`, `CONFIG_EMAIL_ALERTE`:
- cu mentenanță: `contact@buildwithac.ro` (din `site/lib/config.ts`);
- „doar automatizarea”: e-mailul clientului.

**Cum se leagă:** fluxul de erori trebuie **publicat**, altfel nu pornește. Apoi, în fiecare flux al clientului: meniul fluxului (`...`) → **Settings** → **Error workflow** → acest flux → **Save**. Pornește doar la execuțiile automate care pică, nu la cele de probă pornite de mână.

**Când pică chiar declanșatorul** (de exemplu, conectarea la Gmail a expirat), n8n nu dă link de execuție: e-mailul spune „a picat declanșatorul” și mesajul erorii.

**Date sensibile:** nu trec prin el.
