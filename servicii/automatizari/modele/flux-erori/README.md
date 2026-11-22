# Fluxul de erori

**Ce face:** când alt flux al clientului pică, trimite un e-mail cu numele fluxului, nodul care a picat, mesajul erorii, ora și link-ul execuției. **Nimic din datele procesate**: fără datele de intrare și fără detaliile tehnice lungi (`stack`), care pot conține date ale clienților.

**Aplicații:** Gmail, pe contul clientului.

**De completat:** `CONFIG_EMAIL_ALERTE`:
- cu mentenanță: `contact@buildwithac.ro` (din `site/lib/config.ts`);
- „doar automatizarea”: e-mailul clientului.

**Cum se leagă:** în fiecare flux al clientului, *Workflow settings → Error workflow* → acest flux. Fluxul de erori nu trebuie pornit (Active): îl pornește n8n singur.

**Date sensibile:** nu trec prin el.
