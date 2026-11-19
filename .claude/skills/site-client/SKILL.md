---
name: site-client
description: Folosește când Andrei vrea să facă sau să schimbe site-ul unui client, când zice „fă site-ul pentru …”, „pornește site-ul lui …”, „clientul vrea o modificare la site”, „schimbă prețurile / programul pe site-ul lui …”. Pentru un client fără dosar, întâi `client-nou`.
---

# Site pentru un client

## Pe scurt
Din fișa clientului: variante de aspect cu comutator → alegerea → site-ul în depozitul lui separat → previzualizarea → lansarea. Sau, la un site existent, o modificare. Codul stă în `clienti/<slug>/site/cod/`, cu git-ul lui; niciodată în depozitul buildwithac.

Citește înainte: `servicii/site-uri/README.md` (drumul, regulile de aspect, costurile), fișa `clienti/<slug>/fisa.md` și, în `cod/`, `CLAUDE.md` și `AGENTS.md` ale site-ului.

Nu există `clienti/<slug>/fisa.md`? Oprește-te și pornește `client-nou`.

## Mod construire
1. **Pornește depozitul:**
   `node servicii/site-uri/porneste.mjs <slug> "<Numele firmei>" [domeniu]`
   (domeniul implicit e `<slug>.ro`). Apoi, în `clienti/<slug>/site/cod/`: `npm install`. Dacă Playwright cere browsere, `npx playwright install chromium`.
2. **Datele firmei.** Completează `lib/config.ts` din fișă (telefon, WhatsApp, adresă, hartă, rețele; `analytics: true` doar la mentenanță) și secțiunea „Ce e site-ul” din `CLAUDE.md`-ul site-ului. Commit în `cod/`.
3. **Variantele.** Pe ramura `variante` a depozitului: 2–3 direcții vizuale **diferite**, cu comutator (`?v=1`, `?v=2`, `?v=3`), după regulile de aspect. Uneltele: `ui-ux-pro-max`, `frontend-design`. **Anunță pasul greu** (consumă mult) înainte. Le arăți lui Andrei local, pe `http://localhost:3300` (`npm run dev`), întâi la 390px.
4. Andrei alege ce îi arată clientului (poate cere „încă câteva în stilul X”).
5. **Depozitul și proiectul Vercel**, după `servicii/site-uri/lansare.md`, părțile A–C: pașii lui Andrei, unul câte unul, cu numele exacte ale butoanelor. Vercel trebuie să fie pe **Pro**.
6. **Shareable Link** pentru client (lansare, partea C). Clientul alege varianta.
7. Varianta aleasă intră în `main`; ramura `variante` se șterge (local și pe GitHub).
8. **Construirea.** Tot conținutul (texte, prețuri, program, poze) **doar** în `lib/continut.ts`. Pozele: ale clientului sau Unsplash, cu sursa în `clienti/<slug>/jurnal.md`. Înlocuiește și cele două imagini provizorii din șablon: `public/og.jpg` (1200×630, ce apare când cineva trimite link-ul pe WhatsApp sau Facebook) și `app/icon.png` (iconița din fila browserului), din logo-ul și pozele firmei.
9. `npm run verifica` trece în `cod/`.
10. Push → previzualizarea → link-ul pentru client → corecturile (înapoi la 8).
11. **Lansarea**, după `lansare.md`, părțile D–F.
12. `jurnal.md`: ce s-a livrat, cu data. Pentru „doar site-ul”, mai departe `predare-site`.

## Mod modificare
1. Citește `jurnal.md`, ca să știi ce s-a făcut înainte.
2. Fă schimbarea în `cod/` (conținutul în `lib/continut.ts`, datele firmei în `lib/config.ts`).
3. `npm run verifica` trece.
4. Push pe o ramură → Andrei verifică previzualizarea pe telefon → la „e bine”, în `main`.
5. Un rând în `jurnal.md`.

## Nu uita
- **Clientul cere panou?** Oprește-te. Panoul nu există încă: se proiectează separat, cu brainstorming, la primul client care îl cere.
- **Clientul cere formular?** La fel: modulul se proiectează atunci (cine primește e-mailul, prin ce cont), iar confidențialitatea se verifică cu skill-ul `legal-advisor-ro`.
- Fără recenzii, cifre sau rezultate inventate.
- Fonturile din fișiere locale, niciodată `next/font/google` (pașii în `app/fonturi.css`).
- Fără `git push`, depozite GitHub sau proiecte Vercel fără pașii lui Andrei din `lansare.md`.
- Variantele și previzualizările stau doar în depozitul clientului: clientul nu vede nimic din buildwithac.
