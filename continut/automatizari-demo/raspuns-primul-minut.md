# Clipul: răspuns în primul minut (Conu' Leonida)

Ce arată: cineva completează formularul „Grupuri și evenimente” de pe site-ul frizeriei. Pe telefon îi vine un răspuns personal în câteva secunde, care arată că i s-a citit cererea. Patronul primește rezumatul. Totul pe e-mail, în tonul elegant.

Fără text de vorbit (îl scrie Andrei, dacă vrea).

## Înainte de filmare (cam 5 minute)

1. În proba n8n: `raspuns-primul-minut` publicat; `setari-firma` cu `canal: email`, `ton: elegant`.
2. Pagina demo, pe laptop: în `prototip/` rulezi `python -m http.server 8765`, apoi deschizi `http://localhost:8765/demo-automatizari/`. **Doar de aici merge formularul** (fluxul primește cereri doar de la `localhost:8765`).
3. Foaia `Cereri` fără rânduri cu e-mailul tău de azi. **Altfel cererea e oprită de limită** (o cerere pe zi de pe același e-mail) și nu vine nimic. La fiecare dublă, ștergi rândul din `Cereri`.
4. Pe telefon: notificările Gmail pornite, modul „Nu deranja” cu excepție pentru Gmail.
5. Pe laptop, trei taburi: pagina demo, tabelul „Conu' Leonida – demo” pe foaia `Cereri`, n8n cu `raspuns-primul-minut` deschis.

## Ce se vede, în ordine

| # | Unde | Ce se întâmplă | Cât durează în realitate |
|---|---|---|---|
| 1 | Laptop, pagina demo | Scroll până la „Grupuri și evenimente”. Alegi **Mire și cavaleri de onoare**. Numele, e-mailul tău și la detalii, de exemplu: „Ne căsătorim pe 14 iunie, suntem 5, tuns și barbă pentru toți, dimineața.” | 30 s |
| 2 | Laptop | *Trimite cererea* → „Am primit cererea”. | 1 s |
| 3 | Telefon | Notificarea, în 10–20 de secunde. O deschizi: „Bună ziua, Andrei,”, nunta, cei 5, prețul standard din listă, „revenim cu propunerea pentru grup”, link-ul de programare. | 10–20 s (le poți lăsa întregi: asta e ideea clipului) |
| 4 | Laptop, tabelul | Foaia `Cereri`: rândul nou, cu răspunsul trimis și starea `nou`. | 5 s |
| 5 | Telefon sau laptop (opțional) | Rezumatul pentru patron: „Cerere nouă de pe site: Andrei (Mire și cavaleri de onoare)”. Vine pe adresa patronului din setări (în demo, contul demo). | 5 s |
| 6 | Laptop, n8n (opțional) | Fluxul pe pânză: verifică cererea, Claude scrie, trimite, notează. | 5 s |

Toată filmarea durează cam 5 minute; clipul, 20–35 de secunde.

**Merită spus pe ecran:** „Dacă Claude nu răspunde, pleacă un mesaj fix. Omul primește un răspuns oricum.” Și: „Claude nu promite prețuri sau reduceri care nu sunt în lista firmei.”

**Răspunsul e scris de Claude de fiecare dată**, deci nu iese la fel la fiecare dublă. Citește-l înainte să-l arăți în clip.

## Ce se ascunde

- Adresa ta de e-mail: în formular, în antetul e-mailului de pe telefon, în foaia `Cereri` și în rezumat.
- Bara de adrese a browserului (`localhost:8765`): filmezi pe tot ecranul (F11) sau tai bara.
- Adresa contului n8n (`proba-buildwithac.app.n8n.cloud`), dacă apare n8n.

## După filmare

1. Ștergi rândurile de probă din `Cereri` și `Jurnal`.
2. Dacă nu mai filmezi: oprești `raspuns-primul-minut` (proba n8n are rulări limitate) și serverul de pe 8765 (Ctrl+C).
