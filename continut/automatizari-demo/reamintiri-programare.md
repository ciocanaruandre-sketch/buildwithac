# Clipul: reamintirile de programare (Conu' Leonida)

Ce arată: patronul pune o programare în calendar și nu mai face nimic. Clientul primește singur confirmarea, anunțul când programarea se mută și două reamintiri. Totul ajunge pe e-mail (SMS-ul în România cere un expeditor înregistrat, vezi `servicii/automatizari/modele/programari/README.md`).

Fără text de vorbit (îl scrie Andrei, dacă vrea).

## Înainte de filmare (cam 5 minute)

1. În `setari-firma` (proba n8n): `reamintire_1_min: 6`, `reamintire_2_min: 3`, `canal: email`, `ton: elegant` (ales de Andrei pentru demo). Republici `setari-firma`.
2. În `flux-verificare`: declanșatorul *La fiecare jumătate de oră* pe `* 8-21 * * *` (în fiecare minut). Republici.
3. `flux-confirmare` și `flux-verificare` publicate (comutatorul din dreapta sus).
4. Foaia `Jurnal` goală (rămâne doar rândul cu numele coloanelor).
5. Pe telefon: notificările Gmail pornite, ecranul fără alte notificări (modul „Nu deranja” cu excepție pentru Gmail).
6. Pe laptop, trei taburi: Google Calendar (contul demo, doar calendarele lui Vlad și Radu bifate), tabelul „Conu' Leonida – demo” pe foaia `Jurnal`, n8n cu `flux-verificare` deschis.

## Ce se vede, în ordine

| # | Unde | Ce se întâmplă | Cât durează în realitate |
|---|---|---|---|
| 1 | Laptop, Calendar | Un clic pe o oră de azi, **cam 12 minute de acum**, în calendarul *Conu' Leonida – Vlad*. Titlul `Tuns – Andrei`, în descriere `Email: ` + adresa ta. Salvezi. | 20 s |
| 2 | Telefon | Notificarea: „Programarea la Conu' Leonida: …”. O deschizi: ziua, ora, „cu Vlad”, adresa, link-ul. | 1–2 min (tai așteptarea) |
| 3 | Laptop, Calendar | Tragi programarea cu **5 minute mai târziu**. | 5 s |
| 4 | Telefon | „Programarea s-a mutat: …”, cu ora nouă. | până la 1 min |
| 5 | Telefon | Cu 6 minute înainte: „Vă reamintim: …” (reamintirea de o zi, în clip). | așteptare tăiată |
| 6 | Telefon | Cu 3 minute înainte: „Vă așteptăm azi la …”. | 3 min, tăiat |
| 7 | Laptop, tabelul | Foaia `Jurnal`: patru rânduri (`confirmare`, `mutata`, `reamintire_1`, `reamintire_2`), toate „trimis”. | 5 s |
| 8 | Laptop, n8n (opțional) | Fluxul pe pânză, cu cele trei grupuri: citește, verifică, trimite. | 5 s |

Toată filmarea durează cam 15 minute; clipul, 30–45 de secunde.

**În clip, reamintirea de o zi vine la 6 minute.** Merită spus (text pe ecran) că la o firmă adevărată vine cu o zi înainte și a doua cu două ore înainte.

## Ce se ascunde

- Adresa ta de e-mail: în descrierea programării, în coloana `contact` din `Jurnal`, în antetul e-mailului de pe telefon (expeditorul e afișat „Conu' Leonida”, dar adresa de sub el e `buildwithac.ai@gmail.com`).
- Adresa contului n8n din bara browserului (`proba-buildwithac.app.n8n.cloud`).
- ID-urile calendarelor, dacă deschizi setările.

## După filmare

1. Declanșatorul din `flux-verificare` înapoi pe `0,30 8-21 * * *`; republici.
2. Ștergi programarea din calendar și rândurile de probă din `Jurnal`.
3. Dacă nu mai filmezi nimic cu ele: oprești `flux-confirmare` și `flux-verificare` (proba n8n are rulări limitate).
