---
name: client-nou
description: Folosește când Andrei are un client nou pentru orice serviciu (site, automatizări, sesiune), când zice „am un client nou”, „a semnat …”, „a zis da”, „a completat formularul Tally”, „fă fișa pentru …”. Face dosarul clientului și fișa, apoi trimite la skill-ul serviciului.
---

# Client nou

## Pe scurt
Fiecare client primește un dosar `clienti/<slug>/`, cu `fisa.md` (cine e, ce a cumpărat, ce vrea) și `jurnal.md` (ce s-a decis și livrat, cu data). E primul pas la **orice** serviciu. După fișă, mergi la skill-ul serviciului cumpărat.

Citește înainte: `clienti/README.md` (ce intră în git, linia la datele personale) și `servicii/README.md` (ce servicii sunt gata).

## Pașii
1. **Numele firmei.** Întreabă-l pe Andrei numele exact al firmei, cum apare pe firmă sau pe Google.
2. **Slug-ul.** Propune-l cu `propuneSlug` din `servicii/site-uri/porneste.mjs` (litere mici, fără diacritice, cratime: „Cafeneaua Colț” → `cafeneaua-colt`):
   `node -e "import('./servicii/site-uri/porneste.mjs').then(m => console.log(m.propuneSlug('Cafeneaua Colț')))"`
   Andrei îl confirmă sau îl scurtează. Dacă `clienti/<slug>/` există deja, oprește-te: e un client vechi, nu-l suprascrie.
3. **Dosarul.** Creează `clienti/<slug>/` cu `fisa.md` și `jurnal.md` copiate din `fisa.md` și `jurnal.md` din dosarul skill-ului, plus dosarul gol `materiale/`.
4. **Materialele.** Cere-i lui Andrei exportul din Tally (sau răspunsurile copiate) și notițele de la telefon. Pune-le în `materiale/` (nu intră în git).
5. **Fișa.** Complet-o din materiale. **Fără datele care nu se publică**: numele persoanei de contact, e-mailul ei, alte numere, ce a spus la telefon despre sine. Acelea rămân în CRM și în `materiale/`. În fișă intră doar ce va fi public (telefonul firmei, WhatsApp, adresa, programul). Ce lipsește scrii la „Întrebări deschise”, nu inventezi.
6. **Ce a cumpărat.** Întreabă: site, automatizări sau sesiune / ghid personalizat? La site, și: cu mentenanță sau doar site-ul; simplu sau cu panou. La automatizări, și: cu mentenanță (preferată) sau doar automatizarea; apoi completează „Ce trebuie automatizat” din răspunsurile Tally 10–19. Notează în fișă și pune primul rând în `jurnal.md`.
7. **Copia din Drive.** Amintește-i lui Andrei să pună o copie a lui `materiale/` în Drive, în `buildwithac.ai/clienti/<slug>/`.
8. **Mai departe:**
   - **Site** → skill-ul `site-client`.
   - **Automatizări** → skill-ul `automatizare-client`.
   - **Sesiuni, ghiduri personalizate** → „încă nu sunt gata: se fac în proiectul 3”. Fișa rămâne, iar serviciul se lucrează de mână până atunci.

## Nu uita
- Tally **nu** intră în CRM, iar CRM-ul nu se atinge din skill-ul ăsta. Legătura fișă ↔ CRM e prin numele firmei.
- Nimic din `materiale/` în git (verifică cu `git status`: din `clienti/<slug>/` apar doar `fisa.md` și `jurnal.md`; la automatizări, mai târziu, și `automatizari/propunere.md`, `pornire.md`, `folosire.md`).
- Exemplul trimis la Tally 19 (captură, tabel) merge în `materiale/`: poate avea date reale ale clienților clientului.
- Fără recenzii, cifre sau rezultate inventate în fișă: doar ce a spus clientul.
- Commit: `clienti: <slug>, fișa` (pe ramura de lucru, nu direct pe `main` fără „da”-ul lui Andrei).
