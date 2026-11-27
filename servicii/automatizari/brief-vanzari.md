# Brief-ul pentru automatizările de vânzare

Întrebările pentru un client care ia unul sau mai multe dintre modelele de vânzare: reamintirile, cererea de recenzie, răspunsul în primul minut, asistentul de pe site. Din răspunsuri ies setările firmei (`modele/setari-firma`), textul pentru asistent și deciziile din propunere.

**Cum se folosește:**
1. Skill-ul `automatizare-client` copiază fișierul în `clienti/<slug>/automatizari/brief.md`. Copia nu intră în git: are e-mailuri și ID-uri de calendar.
2. Andrei trece prin întrebări cu patronul, pe un apel, cam 45 de minute. Scrie răspunsurile sub fiecare întrebare, cu cuvintele patronului. Ce e deja în fișă (`fisa.md`) nu se mai întreabă.
3. Claude face din răspunsuri setările (câmpul e scris după `→` la fiecare întrebare). Ce lipsește intră la „Întrebări deschise” din fișă și se lămurește înainte de construcție. **Nu se completează nimic din presupuneri.**

Secțiunile marcate cu un model (de exemplu *doar asistentul*) se sar dacă firma nu ia modelul acela.

## 1. Ce ia firma

- Care dintre ele: reamintirile, cererea de recenzie, răspunsul în primul minut, asistentul de pe site? → ce modele se construiesc
- **Unde scrie acum programările?** Caiet, WhatsApp, Google Calendar, alt program (Booksy, Fresha, Treatwell, un soft de clinică)? → Modelele citesc și scriu în **Google Calendar**. Dacă firma lucrează într-un alt program, modelele nu se potrivesc așa cum sunt: verifici dacă programul are API sau legătură cu Google Calendar înainte de propunere.
- Cine pune programările în calendar: patronul, recepția, fiecare om pentru el?

## 2. Firma

- Numele, cum vrea să apară în mesaje → `firma_nume`
- Adresa, cum o spune clienților (cu reperul, dacă e greu de găsit) → `firma_adresa`
- Telefonul la care răspunde cineva → `firma_telefon`
- Programul, pe fiecare zi. Pauza de prânz? Zilele libere de sărbători? → `program`. Pauza și sărbătorile intră în calendar ca evenimente (o pauză care se repetă, o zi întreagă), nu în setări.
- Link-ul unde se programează sau se reprogramează clientul (site, pagina de programări, WhatsApp) → `link_programare`

## 3. Oamenii

Pentru fiecare om care primește programări:
- Numele, cum îl știu clienții (de obicei doar prenumele)
- Ce servicii face
- Are calendar Google separat? (Dacă nu, îl facem, cu patronul, pe apelul de pornire.) → `oameni` (`nume`, `servicii`, `calendar_id`)
- Clienții pot alege omul, sau îi repartizează firma?

## 4. Serviciile

Pentru fiecare serviciu care se programează:
- Numele, scurt, cum îl spun clienții → `servicii.nume`
- **Cât ține de fapt**, cu pregătirea și curățenia → `servicii.durata_min`
- Prețul: fix, „de la”, sau „la evaluare” → `servicii.pret`
- Servicii care **nu** se programează direct (au nevoie de o discuție înainte)? → în textul pentru asistent: „pentru X, sunați”

## 5. Mesajele către clienți

- „Tu” sau „dumneavoastră”? Cum le scrie acum clienților? → `ton` (`prietenos` / `elegant`)
- E-mail, SMS sau amândouă? Clienții lasă de obicei e-mail? → `canal`. Spune-i ce cere SMS-ul în România (expeditorul înregistrat, ~4 săptămâni, cost lunar Twilio: `modele/programari/README.md`).
- Clienții existenți au dat acordul pentru mesaje? Unde (formular, la recepție)? → Legea 506/2004: de verificat cu `legal-advisor-ro` înainte de propunere.

## 6. Reamintirile *(doar reamintirile)*

- Când să plece: cu o zi înainte? cu două ore înainte? → `reamintire_1_min`, `reamintire_2_min`
- Ce se întâmplă acum cu clienții care nu vin? Câți pe săptămână, cam? → motivul din propunere (fără cifre inventate: doar ce spune patronul)
- Ce vrea să afle clientul în reamintire, în afară de zi, oră și adresă (parcarea, să vină cu 5 minute mai devreme)?

## 7. Cererea de recenzie *(doar recenzia)*

- Link-ul de recenzie Google al firmei: îl ia patronul din profilul firmei pe Google (Google Business Profile), cu Andrei pe apel. → `link_recenzie`
- La cât timp după programare? (de obicei 2 ore) → `recenzie_dupa_min`
- O a doua cerere, dacă nu lasă? După câte zile, sau deloc? → `recenzie_a_doua_zile`
- Cât timp nu mai cere aceluiași client? (de obicei 90 de zile) → `recenzie_pauza_zile`
- Cum marchează în calendar pe cine n-a venit: culoarea roșie sau „NU A VENIT” în titlu? Cine o face, în aceeași zi? → `neprezentare_culoare`, `neprezentare_titlu`
- Spune-i regula Google: cererea pleacă la toți, nu doar la cei mulțumiți (`modele/programari/README.md`).

## 8. Formularul de pe site *(doar răspunsul în primul minut)*

- Ce formular are acum (pe site, Tally, Google Forms, nimic)? Cine îl face sau îl leagă?
- Ce cer de obicei oamenii prin formular? Două–trei exemple reale de cereri.
- Cine răspunde acum și în cât timp?
- Ce propunere face de obicei, după cerere (sună, trimite o ofertă, îi programează)? → ce promite mesajul („revenim cu …”)
- Ce **nu** are voie să promită mesajul (prețuri de grup, disponibilitate, reduceri)?
- Domeniul site-ului (cu și fără `www`) → `CONFIG_DOMENIU_SITE`

## 9. Asistentul de pe site *(doar asistentul)*

- **Cele mai dese 10 întrebări** pe care le primește la telefon sau pe WhatsApp, **cu răspunsul lui exact**. De exemplu: parcarea, plata cu cardul, întârzierile, anularea, copiii, cadourile și voucherele, produsele, accesul cu scaun cu rotile, limbile vorbite. → `informatii_asistent`
- Politica de anulare și de întârziere, cu cuvintele lui → `informatii_asistent`
- Ce n-are voie asistentul să spună niciodată (un preț vechi, o promoție terminată, un sfat medical)? → regulă în `informatii_asistent`
- Cât de devreme se poate programa cineva (azi, cu o oră înainte; doar de mâine)? Cât de departe în viitor? → de verificat cu limitele din `cod/ore-libere.js` (azi: peste o oră; lista: 14 zile)
- Întrebările la care asistentul nu știe răspunsul ajung pe e-mail la patron. E bine așa, sau le vrea pe Telegram?

## 10. Patronul

- E-mailul pe care citește zilnic: rezumatele cererilor, întrebările de la asistent → `email_patron`
- Vrea și pe Telegram? → `telegram_chat_id`
- Cine se uită în tabel (foile `Cereri`, `Jurnal`) și cât de des?

## 11. Ce n-ar trebui să se întâmple niciodată

- Ce l-ar supăra cel mai tare (un mesaj trimis de două ori, o programare peste alta, un client care primește mesaje după ce a cerut să nu mai primească)? → regulă scrisă în propunere și protecție în flux (vezi `automatizare-client`, pasul 2)

## 12. Date sensibile și confidențialitate

- E clinică sau cabinet? Ce scriu clienții în formular sau în chat (simptome, tratamente)? → la clinici, răspunsul în primul minut **fără Claude**, iar asistentul de pe site doar după `legal-advisor-ro` (`gdpr.md`, „Nota pentru datele sensibile”)
- Site-ul are politică de confidențialitate? Trebuie să pomenească formularul, chatul și furnizorii (n8n, Anthropic, Google, Twilio). Cine o actualizează?

## 13. Conturile

- Ce cont Google folosește firma (Gmail sau Google Workspace)? Pe el stau calendarele, tabelul și e-mailurile trimise.
- Card pentru n8n Cloud (Starter), Anthropic (răspunsul în primul minut, asistentul) și Twilio (doar la SMS). Conturile sunt ale firmei, pe numele ei.

## Întrebări deschise

Ce n-a știut patronul pe apel, cu cine și până când se lămurește.
