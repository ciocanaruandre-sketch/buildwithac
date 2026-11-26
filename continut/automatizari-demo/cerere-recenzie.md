# Clipul: cererea de recenzie (Conu' Leonida)

Ce arată: clientul iese de la frizer și, după câteva minute, primește singur mulțumirea și link-ul de recenzie. Clientul care n-a venit (marcat cu roșu în calendar) nu primește nimic. Totul pe e-mail, în tonul elegant.

Fără text de vorbit (îl scrie Andrei, dacă vrea).

## Înainte de filmare (cam 5 minute)

1. În `setari-firma` (proba n8n): `recenzie: da`, `recenzie_dupa_min: 2`, `canal: email`, `ton: elegant`. Republici `setari-firma`.
2. În `flux-verificare`: declanșatorul *La fiecare jumătate de oră* pe `* 8-21 * * *` (în fiecare minut). Republici.
3. Foaia `Jurnal` goală (rămâne doar rândul cu numele coloanelor).
4. Programările de probă mai vechi din calendar: șterse sau roșii (altfel primesc și ele cererea).
5. Pe telefon: notificările Gmail pornite, modul „Nu deranja” cu excepție pentru Gmail.
6. Pe laptop, trei taburi: Google Calendar (contul demo, calendarele lui Vlad și Radu bifate), tabelul „Conu' Leonida – demo” pe foaia `Jurnal`, n8n cu `flux-verificare` deschis.

## Ce se vede, în ordine

| # | Unde | Ce se întâmplă | Cât durează în realitate |
|---|---|---|---|
| 1 | Laptop, Calendar | În calendarul *Conu' Leonida – Vlad*, două programări de azi care se termină **peste 1–2 minute**: `Tuns – Andrei` și `Barbă – Mihai`, amândouă cu `Email: ` + adresa ta în descriere. | 40 s |
| 2 | Laptop, Calendar | Pe `Barbă – Mihai`: clic → creionul → culoarea **Tomato** → *Save*. „Mihai n-a venit.” | 10 s |
| 3 | Telefon | La ~2 minute după sfârșit: notificarea „Vă mulțumim pentru vizită”. O deschizi: „Bună ziua, Andrei, …”, link-ul de recenzie, dezabonarea jos. | 3–4 min (tai așteptarea) |
| 4 | Telefon | Nimic pentru Mihai. | — |
| 5 | Laptop, tabelul | Foaia `Jurnal`: un rând `recenzie`, „trimis”. | 5 s |
| 6 | Laptop, n8n (opțional) | Fluxul pe pânză, cu cele trei grupuri. | 5 s |

Toată filmarea durează cam 10 minute; clipul, 25–40 de secunde.

**În clip, cererea vine la 2 minute.** Merită spus (text pe ecran) că la o firmă adevărată pleacă la vreo 2 ore după programare.

Fiecare programare primește o confirmare pe e-mail când o pui în calendar (fluxul de confirmare). Dacă nu vrei să apară în clip, oprește `flux-confirmare` pe durata filmării.

## Ce se ascunde

- Adresa ta de e-mail: în descrierea programării, în coloana `contact` din `Jurnal`, în antetul e-mailului de pe telefon și în link-ul de dezabonare (are adresa codată în el).
- Adresa contului n8n din bara browserului (`proba-buildwithac.app.n8n.cloud`), inclusiv din link-ul de dezabonare.
- Link-ul de recenzie duce, în demo, la pagina-concept a frizeriei (nu e o firmă reală pe Google).

## După filmare

1. Declanșatorul din `flux-verificare` înapoi pe `0,30 8-21 * * *`; republici.
2. Ștergi programările din calendar și rândurile de probă din `Jurnal`.
3. Dacă nu mai filmezi nimic cu ele: oprești `flux-confirmare` și `flux-verificare` (proba n8n are rulări limitate).
