# Clauza de acces și prelucrare (GDPR, art. 28)

Când Andrei lucrează în contul n8n al clientului, vede datele pe care le prelucrează automatizările (clienții clientului: nume, telefon, e-mail; la clinici, programări). Clientul e **operatorul** datelor, iar Andrei devine **persoana împuternicită** a lui. Art. 28 din GDPR cere pentru asta un contract scris, cu anumite clauze obligatorii. Mai jos e textul, gata de pus într-un contract. Contractul complet (prețul, plata, răspunderea) nu e aici.

Scris cu skill-ul `legal-advisor-ro`, la 2026-11-22. E consultanță informativă, nu avocat. Înainte de primul contract cu o **clinică** (date medicale), merită o citire de la un avocat pe protecția datelor: acolo greșelile costă cel mai mult.

## Ce trebuie să știi înainte

- **n8n, OpenAI, Twilio, WhatsApp** sunt pe conturile clientului: clientul are contract direct cu ele. Nu sunt ale lui Andrei și nu intră în lista de mai jos.
- **Claude (Anthropic)** e unealta lui Andrei. Când Claude citește o execuție sau un flux din contul clientului, datele trec prin Anthropic. Deci Anthropic e **sub-împuternicitul lui Andrei** (art. 28 alin. 2 și 4) și trebuie numit în contract, cu acordul clientului. Anthropic e în SUA: transferul se face pe clauzele contractuale standard din condițiile comerciale Anthropic. Contul Claude al lui Andrei trebuie să fie unul care nu folosește conversațiile la antrenare (de verificat setarea la fiecare client).
- **Regula practică, care face clauza ușor de respectat:** Andrei construiește și testează cu **date de probă**. Datele reale le citește doar când repară ceva și doar cât trebuie pentru reparație.

## Textul clauzei

> Completează ce e între `< >`. Numerotarea se potrivește contractului în care intră.

**Art. X. Prelucrarea datelor cu caracter personal**

**X.1. Rolurile.** În executarea prezentului contract, <Numele clientului> („Beneficiarul”) are calitatea de operator, iar <Numele prestatorului> („Prestatorul”) are calitatea de persoană împuternicită, în sensul art. 4 pct. 7 și 8 și al art. 28 din Regulamentul (UE) 2016/679 („GDPR”).

**X.2. Obiectul, natura și scopul.** Prestatorul accesează contul n8n Cloud al Beneficiarului, ca utilizator invitat cu rolul „Member”, exclusiv pentru a construi, testa, modifica și repara automatizările descrise în propunerea acceptată de Beneficiar (anexa <n>). Prestatorul nu prelucrează datele în alt scop.

**X.3. Datele și persoanele vizate.** Datele sunt cele prelucrate de automatizări: <de exemplu: nume, prenume, telefon, e-mail, data și ora programării>, ale <de exemplu: clienților și pacienților Beneficiarului>. <Dacă e cazul: Automatizările prelucrează și date privind sănătatea, în sensul art. 9 GDPR, limitate la: <…>.>

**X.4. Durata.** Prelucrarea durează cât durează contractul: până la predarea automatizării sau, dacă s-a ales mentenanța, până la încetarea ei.

**X.5. Instrucțiunile.** Prestatorul prelucrează datele numai pe baza instrucțiunilor scrise ale Beneficiarului. Propunerea acceptată și cererile de modificare trimise pe e-mail sunt instrucțiuni scrise. Dacă o instrucțiune pare să încalce GDPR, Prestatorul îl anunță imediat pe Beneficiar.

**X.6. Confidențialitatea.** Prestatorul păstrează confidențialitatea datelor, inclusiv după încetarea contractului. Nu copiază datele în afara contului n8n al Beneficiarului, cu excepția exporturilor de fluxuri păstrate pentru reparații (fără datele procesate) și a celor strict necesare unei reparații, care se șterg după aceea.

**X.7. Securitatea.** Prestatorul:
a) construiește și testează automatizările cu date de probă, nu cu datele reale ale persoanelor vizate;
b) păstrează cheile de acces la contul Beneficiarului (cheia API și tokenul MCP) doar pe dispozitivul lui de lucru, protejat prin parolă și criptare, și nu le transmite nimănui;
c) nu cere și nu primește parolele Beneficiarului; conturile aplicațiilor legate (de exemplu, Google) le conectează Beneficiarul.

**X.8. Sub-împuterniciții.** Beneficiarul autorizează folosirea de către Prestator a următorului sub-împuternicit: **Anthropic** (asistentul AI Claude), folosit pentru construirea și repararea automatizărilor, în condițiile comerciale Anthropic, care includ clauzele contractuale standard pentru transferul în afara Spațiului Economic European. Prestatorul anunță în scris orice schimbare a acestei liste, cu cel puțin 15 zile înainte; Beneficiarul se poate opune în acest termen. Furnizorii aleși și contractați direct de Beneficiar (n8n și aplicațiile legate de automatizări) nu sunt sub-împuterniciți ai Prestatorului.

**X.9. Asistența.** Prestatorul ajută Beneficiarul, în măsura în care poate din contul n8n, să răspundă cererilor persoanelor vizate (acces, ștergere, opoziție) și să-și îndeplinească obligațiile din art. 32–36 GDPR.

**X.10. Încălcarea securității.** Prestatorul anunță Beneficiarul fără întârziere și în cel mult 24 de ore de la aflarea unei încălcări a securității datelor (de exemplu, pierderea dispozitivului cu cheile), ca Beneficiarul să poată notifica ANSPDCP în 72 de ore, dacă e cazul.

**X.11. La încetare.** La predare sau la încetarea mentenanței: fluxurile create de Prestator trec la Beneficiar, utilizatorul Prestatorului și cheile lui de acces se șterg din contul Beneficiarului, iar Prestatorul șterge de pe dispozitivele lui cheile și orice date ale persoanelor vizate. Exporturile fluxurilor, fără datele procesate, le poate păstra pentru o eventuală reparație cerută de Beneficiar.

**X.12. Verificarea.** Prestatorul pune la dispoziția Beneficiarului informațiile necesare pentru a demonstra respectarea acestui articol și permite verificări rezonabile, anunțate cu cel puțin 10 zile înainte.

## Nota pentru datele sensibile (art. 9)

Se aplică dacă la Tally clientul a răspuns „Da” la date sensibile: clinici (date despre sănătate), CNP-uri, date bancare.

- **Temeiul îl are clientul, nu Andrei.** Clinica trebuie să aibă un temei pentru datele medicale: de obicei art. 9 alin. (2) lit. h (asistență medicală), pentru programări și reamintiri. Pentru mesaje de marketing (rechemări la control, oferte), temeiul sigur e acordul pacientului, iar pentru SMS-uri de marketing e nevoie și de acordul din Legea 506/2004. Modelul `clinica-wf3-rechemari` trimite doar pacienților cu `consent_sms = DA`.
- **Cât mai puține date în flux.** Mesajele nu spun tratamentul, ci doar prenumele, ziua, ora și linkul. Coloana de tratament nu se citește dacă fluxul nu are nevoie de ea.
- **Fără AI pe datele medicale** fără o verificare separată (temeiul, acordul pacientului, contractul cu furnizorul AI). Asta privește atât nodurile AI din flux (de exemplu, OpenAI), cât și pe Claude, unealta lui Andrei: la clinici, Andrei nu deschide prin Claude execuții cu date reale de pacienți. Când repară, se uită la execuția cu date în interfața n8n, nu prin Claude, iar Claude lucrează cu datele de probă.
- **Evaluarea de impact (art. 35)** e treaba clientului. Pentru un cabinet mic, de obicei nu e obligatorie (nu e prelucrare „pe scară largă”). Pentru o clinică mare, cu mai multe locații, se discută cu ea înainte de propunere.
- În propunerea pentru o clinică, scrie clar ce date medicale atinge automatizarea. Dacă răspunsul e „niciuna, doar ziua și ora”, cu atât mai bine.

<!--
Baza legală: Regulamentul (UE) 2016/679, art. 4, 9, 28, 32–36; Legea 190/2018; Legea 506/2004, art. 12.
Identitatea Prestatorului: <Numele prestatorului> se completează după forma juridică de la data contractului.
-->
