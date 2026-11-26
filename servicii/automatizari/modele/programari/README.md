# Programările (`programari`): reamintirile

**Ce face:** clientul unei firme cu programări (frizerie, salon, clinică) primește mesaje la momentele potrivite, fără ca patronul să scrie ceva:
- **confirmarea**, pe loc, când apare o programare nouă în calendarul unui om;
- **anunțul de mutare**, când patronul mută programarea (ziua și ora nouă);
- **două reamintiri**: cu o zi înainte (`reamintire_1_min`, de obicei 1440) și cu două ore înainte (`reamintire_2_min`, de obicei 120).

Fiecare mesaj pleacă pe e-mail, pe SMS sau pe amândouă (`canal` din setări). Fiecare mesaj trimis, eșuat sau sărit intră în foaia `Jurnal`; un mesaj din `Jurnal` nu mai pleacă a doua oară. Cine e în `Nu trimite` nu primește nimic. Programările de o zi întreagă (concediu, „închis”) și cele fără telefon sau e-mail nu primesc mesaje; cele fără contact apar o singură dată în `Jurnal`, ca `sarit`, ca să vadă patronul.

Cererea de recenzie (partea 2 a modelului) se adaugă tot în `flux-verificare`.

**Cum arată:** două fluxuri.
- `flux-confirmare`: câte un declanșator *Google Calendar Trigger* („Event Created”) pe calendarul fiecărui om → *Programare nouă* → *Setări firmă* → *Jurnal* și *Nu trimite* (citiri din tabel) → *Confirmare* (Code) → *De trimis?* → *Pe ce canal?* → *Trimite SMS-ul* (Twilio) / *Trimite e-mailul* (Gmail) → *Notează în Jurnal*.
- `flux-verificare`: *La fiecare jumătate de oră* (8–21) → *Setări firmă* → *Jurnal* și *Nu trimite* → *Oamenii* → *Câte un om* → *Programările omului* (Google Calendar, următoarele 2 zile, cu programările care se repetă desfăcute în apariții separate) → *Verificare* (Code) → aceeași coadă de trimitere.

Codul din nodurile *Confirmare* și *Verificare* e identic cu `cod/confirmare.js` și `cod/verificare.js`, testate în `modele-cod.test.mjs`. **Nu-l edita în n8n:** schimbi fișierul, rulezi testele, apoi îl copiezi în nod.

**Aplicații:** Google Calendar și Google Sheets (contul firmei), Gmail (contul firmei, de pe care pleacă e-mailurile), Twilio (doar pentru SMS).

**Programarea, cum o scrie patronul în calendar:**
- titlul: `<Serviciul> – <Numele clientului>`, de exemplu `Tuns – Mihai Ionescu` (merge și cu `-` simplu);
- în descriere, pe rânduri separate: `Telefon: 0722 123 456` și/sau `Email: mihai@exemplu.ro`. Telefonul poate fi scris oricum (`0722…`, `+40 722-…`, `0040…`, `tel:`).
- omul = calendarul în care e pusă programarea.

**De completat:**
- `setari-firma`: `oameni` (cu `calendar_id`), `canal`, `reamintiri: da`, `reamintire_1_min`, `reamintire_2_min`, `link_programare`, `sheet_id`, `ton`.
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

## De știut

- **Mutarea se vede din `Jurnal`:** dacă ora din calendar diferă de ora din ultimul mesaj trimis despre programare, pleacă anunțul de mutare. O programare mutată mai departe de 2 zile primește anunțul când intră în fereastra de 2 zile.
- **O reamintire nu pleacă** dacă programarea a fost făcută cu mai puțin timp înainte decât reamintirea (clientul tocmai a primit confirmarea).
- **Reamintirile pleacă doar între 8 și 21** (cât rulează `flux-verificare`): la prima rulare în care a rămas mai puțin decât `reamintire_…_min`. Pentru o programare la 9:00, reamintirea de 2 ore pleacă la 8:00, nu la 7:00.
- **Telefoanele se scriu ca text** în `Jurnal` (*Cell Format: RAW*), altfel Google pierde plusul din `+407…`.
- **`Jurnal` crește** cu câteva rânduri pe programare. Fluxurile îl citesc tot, la fiecare rulare; la câteva mii de rânduri, rândurile mai vechi de un an se pot muta într-o altă foaie.
- **Patronul nu primește nimic** de la acest model; vede totul în `Jurnal`. Un flux căzut îi trimite e-mail prin `flux-erori`.
