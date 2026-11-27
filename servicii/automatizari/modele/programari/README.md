# Programările (`programari`): reamintirile și cererea de recenzie

**Ce face:** clientul unei firme cu programări (frizerie, salon, clinică) primește mesaje la momentele potrivite, fără ca patronul să scrie ceva:
- **confirmarea**, pe loc, când apare o programare nouă în calendarul unui om;
- **anunțul de mutare**, când patronul mută programarea (ziua și ora nouă);
- **două reamintiri**: cu o zi înainte (`reamintire_1_min`, de obicei 1440) și cu două ore înainte (`reamintire_2_min`, de obicei 120);
- **cererea de recenzie**, după programare (`recenzie_dupa_min`, de obicei 120): mulțumirea și link-ul de recenzie Google al firmei.

Fiecare mesaj pleacă pe e-mail, pe SMS sau pe amândouă (`canal` din setări). Fiecare mesaj trimis, eșuat sau sărit intră în foaia `Jurnal`; un mesaj din `Jurnal` nu mai pleacă a doua oară. Cine e în `Nu trimite` nu primește nimic. Programările de o zi întreagă (concediu, „închis”) și cele fără telefon sau e-mail nu primesc mesaje; cele fără contact apar o singură dată în `Jurnal`, ca `sarit`, ca să vadă patronul.

Detaliile cererii de recenzie sunt în secțiunea „Cererea de recenzie”, mai jos.

**Cum arată:** două fluxuri.
- `flux-confirmare`: câte un declanșator *Google Calendar Trigger* („Event Created”) pe calendarul fiecărui om → *Programare nouă* → *Setări firmă* → *Jurnal* și *Nu trimite* (citiri din tabel) → *Confirmare* (Code) → *De trimis?* → *Pe ce canal?* → *Trimite SMS-ul* (Twilio) / *Trimite e-mailul* (Gmail) → *Notează în Jurnal* → *A picat ceva?* → *Alertă: n-a plecat* (Stop and Error, doar dacă un mesaj n-a plecat).
- `flux-verificare`: *La fiecare jumătate de oră* (8–21) → *Setări firmă* → *Jurnal* și *Nu trimite* → *Oamenii* → *Câte un om* → *Programările omului* (Google Calendar, de la cele terminate de curând până peste 2 zile, cu programările care se repetă desfăcute în apariții separate) → *Al cui e* (pune pe fiecare programare numele omului din calendarul citit: organizatorul poate fi clientul care a trimis invitația) → *Verificare* (Code) → aceeași coadă de trimitere.

Codul din nodurile *Confirmare* și *Verificare* e identic cu `cod/confirmare.js` și `cod/verificare.js`, testate în `modele-cod.test.mjs`. **Nu-l edita în n8n:** schimbi fișierul, rulezi testele, apoi îl copiezi în nod.

**Aplicații:** Google Calendar și Google Sheets (contul firmei), Gmail (contul firmei, de pe care pleacă e-mailurile), Twilio (doar pentru SMS).

**Programarea, cum o scrie patronul în calendar:**
- titlul: `<Serviciul> – <Numele clientului>`, de exemplu `Tuns – Mihai Ionescu` (merge și cu `-` simplu);
- în descriere, pe rânduri separate: `Telefon: 0722 123 456` și/sau `Email: mihai@exemplu.ro`. Telefonul poate fi scris oricum (`0722…`, `+40 722-…`, `0040…`, `tel:`).
- omul = calendarul în care e pusă programarea.

**De completat:**
- `setari-firma`: `oameni` (cu `calendar_id`), `canal`, `reamintiri: da`, `reamintire_1_min`, `reamintire_2_min`, `link_programare`, `sheet_id`, `ton`.
- Pentru recenzie: `recenzie: da`, `recenzie_dupa_min`, `recenzie_a_doua_zile`, `recenzie_pauza_zile`, `link_recenzie`, `link_dezabonare`, `neprezentare_culoare`, `neprezentare_titlu`.
- În *Setări firmă* (în ambele fluxuri): fluxul `setari-firma` (`CONFIG_ID_SETARI_FIRMA`).
- În `flux-confirmare`: câte un declanșator pe calendar, cu ID-ul calendarului (`CONFIG_CALENDAR_…`). **Un om nou = un declanșator nou** (copiezi unul, schimbi calendarul și numele); un om plecat = ștergi declanșatorul lui. Declanșatorul nu poate citi lista din setări.
- La *Trimite SMS-ul*: numărul Twilio al firmei (`CONFIG_TWILIO_NUMAR`) și conexiunea Twilio. Dacă firma folosește doar e-mail, dezactivezi nodul (clic dreapta → *Deactivate*): n8n nu publică un flux cu un nod fără conexiune.
- Conexiunile Google Calendar, Google Sheets și Gmail la nodurile lor.

**Rulări (n8n Cloud Starter: 2.500 pe lună):**
- `flux-verificare`: o rulare la fiecare jumătate de oră între 8 și 21, adică ~840 pe lună, oricât de puține programări are firma. Ora se potrivește la programul firmei (cron `0,30 8-21 * * *`, fus `Europe/Bucharest`).
- `flux-confirmare`: câte o rulare pentru fiecare programare nouă. Declanșatorul verifică calendarul în fiecare minut, dar o verificare fără programări noi nu se numără.

**Date sensibile:** numele, telefonul și e-mailul clienților firmei, în calendar și în `Jurnal`. La clinici: în titlu doar serviciul general (`Consultație`), niciun diagnostic.

## SMS-ul în România

- **Twilio de probă nu merge pentru mesajele noastre:** trimite doar șabloanele lor („Custom message bodies are not supported”, [Twilio, Trials](https://www.twilio.com/docs/usage/trials)).
- **Rețelele blochează SMS-urile cu link-uri** dacă link-ul nu e aprobat la Twilio. Toate SMS-urile modelului au `link_programare`. Firma are nevoie de un **expeditor înregistrat** (Alpha Sender ID, cu numele firmei; cu taxă, cam 4 săptămâni) și de link-urile trecute în înregistrare ([Twilio, Romania](https://www.twilio.com/en-us/guidelines/ro/sms)). Până atunci: doar e-mail.
- **Răspunsurile la SMS nu ajung** (Twilio: „Two-way SMS supported: No” pentru România). Ramura SMS din `dezabonare` nu primește nimic aici; dezabonarea merge prin link-ul din e-mail sau la telefonul firmei.
- Fără expeditor înregistrat, Vodafone și Orange rescriu expeditorul (la proba din 2026-11-26 SMS-ul a venit de la „1718”).
- Textele SMS sunt fără diacritice și încap într-un singur SMS cu datele demo (test în `modele-cod.test.mjs`).

## La client

1. `setari-firma` completat și **publicat** (n8n nu publică un flux care cheamă un sub-flux nepublicat; după orice schimbare în setări, îl republici).
2. Foile `Jurnal` și `Nu trimite` în tabelul firmei, cu coloanele din `setari-firma/tabel.md`.
3. Importă `flux-confirmare.json` și `flux-verificare.json`. În fiecare: *Setări firmă* → `setari-firma`, conexiunile, apoi *Settings* → *Error workflow* → `flux-erori`, fusul `Europe/Bucharest`.
4. În `flux-confirmare`, câte un declanșator pe calendarul fiecărui om (vezi mai sus).
5. Publică `flux-confirmare`, apoi `flux-verificare`.
6. Probă cu patronul: o programare în calendarul unui om, cu e-mailul tău în descriere → confirmarea în 1–2 minute. O muți → anunțul de mutare la următoarea rulare. Pentru reamintiri, setezi temporar `reamintire_1_min: 6`, `reamintire_2_min: 3` și cron-ul la fiecare minut (`* 8-21 * * *`), apoi le pui înapoi și republici. Ștergi apoi rândurile de probă din `Jurnal`.

**Doar recenzia, fără reamintiri:** `reamintiri: nu` și nu imporți `flux-confirmare`. `flux-verificare` rămâne (în el stă și cererea de recenzie).

## Cererea de recenzie

**Când pleacă:** la prima rulare de după `recenzie_dupa_min` de la sfârșitul programării (între 8 și 21, ca restul). Dacă trece mai mult de o zi (sau `recenzie_dupa_min` + 12 ore, dacă e mai mare), nu mai pleacă: e prea târziu. O singură cerere pe programare; a doua, doar dacă `recenzie_a_doua_zile` e mai mare ca 0, după atâtea zile. Același client nu mai primește o cerere timp de `recenzie_pauza_zile` (de obicei 90), oricâte programări mai are.

**Cine n-a venit nu primește cererea.** Patronul marchează în calendar clientul care n-a venit, într-unul din două feluri:
- culoarea programării: **Tomato** (roșu; `neprezentare_culoare: 11`): clic pe programare → creionul → culoarea → *Save*;
- sau titlul începe cu `NU A VENIT` (`neprezentare_titlu`), de exemplu `NU A VENIT Tuns – Mihai Ionescu`.

Marcajul trebuie pus înainte să plece cererea, adică în `recenzie_dupa_min` de la sfârșitul programării. **Pasul pentru patron** (îl spui la predare): „Cine n-a venit, îl faci roșu în calendar în aceeași zi. Altfel primește mulțumirea pentru vizită.”

**Mesajul:** mulțumirea, link-ul de recenzie (`link_recenzie`), numele și telefonul firmei; pe e-mail și link-ul de dezabonare (`link_dezabonare` + adresa clientului codată). SMS-ul se termină cu „(STOP=dezabonare)”; în România răspunsul nu ajunge (vezi „SMS-ul în România”), deci firma trebuie să treacă de mână în `Nu trimite` pe cine sună sau scrie că nu mai vrea mesaje.

**Regula Google: fără filtre.** Cererea pleacă la toți clienții care au venit, nu doar la cei mulțumiți. Google interzice cererea selectivă de recenzii pozitive și recenziile cu recompensă ([politica recenziilor Google](https://support.google.com/contributionpolicy/answer/7400114)). Nu adăuga o întrebare „Cum a fost?” care trimite doar notele mari spre Google.

**Legea 506/2004 (art. 12):** e-mailurile și SMS-urile comerciale cer acordul clientului; excepția e clientul existent, cu dezabonare simplă în fiecare mesaj. Cererea de recenzie către un client care tocmai a fost la firmă pare să intre în excepție, dar **verifică cu skill-ul `legal-advisor-ro` la prima propunere pentru un client**, înainte de a o porni.

**Probă la client:** setezi temporar `recenzie_dupa_min: 2` și cron-ul la fiecare minut (`* 8-21 * * *`); pui două programări care s-au terminat acum un minut, cu e-mailul tău, una marcată cu roșu → doar cealaltă primește cererea. Apoi pui setările înapoi, republici și ștergi rândurile de probă din `Jurnal`.

## De știut

- **Mutarea se vede din `Jurnal`:** dacă ora din calendar diferă de ora din ultimul mesaj trimis despre programare, pleacă anunțul de mutare. O programare mutată mai departe de 2 zile primește anunțul când intră în fereastra de 2 zile.
- **O reamintire nu pleacă** dacă programarea a fost făcută cu mai puțin timp înainte decât reamintirea (clientul tocmai a primit confirmarea).
- **Reamintirile pleacă doar între 8 și 21** (cât rulează `flux-verificare`): la prima rulare în care a rămas mai puțin decât `reamintire_…_min`. Pentru o programare la 9:00, reamintirea de 2 ore pleacă la 8:00, nu la 7:00.
- **Telefoanele se scriu ca text** în `Jurnal` (*Cell Format: RAW*), altfel Google pierde plusul din `+407…`.
- **`Jurnal` crește** cu câteva rânduri pe programare. Fluxurile îl citesc tot, la fiecare rulare; la câteva mii de rânduri, rândurile mai vechi de un an se pot muta într-o altă foaie.
- **Patronul nu primește mesajele obișnuite**; le vede în `Jurnal`. Primește alertă prin `flux-erori` când un flux cade **și când un mesaj n-a plecat** (Twilio sau Gmail au dat eroare): trimiterea merge mai departe ca să intre în `Jurnal` cu `stare: eroare`, apoi *Alertă: n-a plecat* oprește rularea cu eroare. Celelalte mesaje din aceeași rulare au plecat deja.

**Verificat la proba din 2026-11-26** (cont de probă n8n Cloud, Conu' Leonida, canalul e-mail): cu date fixate, confirmarea (cu telefon și e-mail; fără contact → `sarit`; în `Nu trimite` → `sarit`) și verificarea (mutare, reamintire, fără contact, zi întreagă ignorată). **Rulare reală** cu Andrei: programare în calendarul lui Vlad → confirmarea pe e-mail în ~1 minut; mutată pe azi → anunțul de mutare; reamintirile la 6 și 3 minute (setările scurte, cron-ul pe fiecare minut). Fiecare mesaj a ajuns o singură dată, cu rândul lui în `Jurnal`. Ramura SMS e verificată doar cu date fixate (vezi „SMS-ul în România”).

**Cererea de recenzie, verificată la proba din 2026-11-26** (tonul elegant): cu date fixate, din 8 programări a primit cererea doar cine a venit și s-a terminat de cel puțin 2 minute; programarea roșie, cea cu „NU A VENIT”, cea de acum 30 de ore, cea deja cerută în `Jurnal` și clientul cu o cerere de acum 10 zile au fost sărite. **Rulare reală** cu Andrei: două programări terminate în calendarul lui Vlad, una roșie → un singur e-mail „Vă mulțumim pentru vizită”, cu link-ul de dezabonare.
