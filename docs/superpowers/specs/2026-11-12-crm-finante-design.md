# CRM: Finanțe (încasări, rate, comisioane)

*2026-11-12 · etapa 3, bucata 2 · aprobată de Andrei (2026-11-12)*

## De ce

Acum, pe fiecare proiect, CRM-ul ține doar două cifre: **preț** și **încasat**, iar încasatul îl scrie Andrei de mână. Nu știe când au venit banii, în câte tranșe, ce urmează și ce întârzie. Comisionul fiecărui om se calculează din încasat × procent, dar nimeni nu știe ce i s-a dat deja.

Andrei vrea să deschidă CRM-ul dimineața și să vadă **stadiul banilor dintr-o privire**: ce plăți urmează să intre, care sunt cele mai apropiate, ce întârzie, ce s-a încasat. Pentru echipa de mai târziu (constructori, closeri, calleri) vrea ca **împărțeala să fie stabilită de pe acum**: fiecare tranșă încasată naște comisioanele oamenilor, iar Andrei bifează când i-a plătit pe fiecare.

Deocamdată Andrei lucrează singur. Regulile sunt făcute pentru echipă, dar trebuie să meargă și cu un singur om.

Bucata face parte din etapa 3 a CRM-ului (ordinea aleasă de Andrei: tema și demo, **încasări și comisioane**, lead-urile din reclame, dashboard și KPI, calendarul extern). Designul de bază al CRM-ului: `docs/superpowers/specs/2026-11-09-crm-design.md`.

## Scopuri

1. **Planul de plată** al fiecărui proiect: tot odată, avans + rest sau rate, cu **scadențe stabilite la semnare**. *(Andrei)*
2. **Alertă la întârziere.** *(Andrei)*
3. **Comision pe fiecare tranșă încasată**, pentru fiecare om de pe proiect (constructor, closer, caller), cu procentul lui. *(Andrei)*
4. Andrei **bifează când i-a plătit** comisionul unui om; omul vede „de primit” sau „primit”. *(Andrei)*
5. **Procente de bază** pe serviciu și pe rol, puse singure pe proiectele noi și **modificabile pe proiect**. *(Andrei)*
6. **Mentenanța lunară**: o sumă pe lună, cu comision pentru cine se ocupă de ea (de obicei constructorul, 50–60%, de stabilit), pe care Andrei o poate adăuga și schimba. *(Andrei)*
7. **Returnările**: comisionul plătit deja dintr-o tranșă returnată se scade din următoarele comisioane ale omului. *(Andrei a ales; vezi „Regulile banilor”.)*
8. Pagina **„Finanțe”** din meniu, cu privirea de ansamblu. *(Andrei: „Finanțe”, nu „Bani”.)*

## Ce NU face

- **Fără facturi și chitanțe.** Rămân în afara CRM-ului (de exemplu SmartBill); în CRM doar se bifează că banii au intrat. *(Andrei)*
- Fără legătură cu banca, fără plăți online, fără mutat bani. CRM-ul doar ține evidența.
- Fără grafice și KPI: sunt bucata 4 (dashboard).
- Fără export: nu e cerut aici.
- Doar lei, sume întregi (cum e deja `pret_lei`).

**Ar fi un eșec, chiar dacă merge tehnic:**
- un om din echipă vede banii altui om sau stadiul plăților clienților;
- un comision deja calculat se schimbă singur când Andrei schimbă un procent;
- Andrei primește același e-mail de întârziere în fiecare zi;
- în modul filmare se citește clar numele unui client pe ecranele noi.

## Ce se vede

Referința de aspect sunt cele două machete din `prototip/`, servite cu `python -m http.server 8765`. Tema e cea a CRM-ului („Grafit”, tema A).

### 1. Tab-ul „Finanțe” de pe fișa clientului

Macheta: `prototip/crm-incasari.html`, **varianta A · Cronologie** (aleasă de Andrei). În machetă tab-ul se numește încă „Bani”; în aplicație se numește **„Finanțe”**.

- Tab nou printre cele existente (Task-uri, Materiale, Conturi, Livrat, **Finanțe**, Notițe, Parcurs). **Doar Admin îl vede.** *(Alegerea mea: constructorul își vede comisionul pe pagina Finanțe, cum vede azi prețul și comisionul lui pe proiect.)*
- Sus sunt trei cifre: **Preț**, **Încasat** (verde), **De încasat**.
- Dedesubt, **fiecare tranșă e un card**, în ordinea scadenței, cu suma, data și starea:
  - **Încasată**: chip verde și data încasării. Sub ea stă câte un rând pe om: inițiale, nume, procent, suma comisionului și bulina **„De plătit”** (aurie). Când o apeși devine **„Plătit <data>”** (verde). Bulina se poate apăsa din nou, ca să anulezi o bifă greșită.
  - **Întârziată**: chenar și chip roșu („Întârzie 11 zile”) plus butonul auriu **„Am încasat-o”**. Sub card scrie ce comisioane vor apărea când e încasată.
  - **Urmează**: estompată, cu butonul „Am încasat” disponibil.
- La final stă cardul **Mentenanță** („300 lei pe lună, în fiecare 5 a lunii · pornește după predare”, cu „Schimbă”).
- Butoanele de jos: **„+ Tranșă”**, **„Schimbă planul de plată”**, **„Marchează o returnare”**.
- Pe coloana din stânga a fișei:
  - cardul **„Rată întârziată”** (roșu) când o tranșă întârzie;
  - în cardul „Proiectul”, rândul **„Plată”** (de exemplu „4 rate lunare”);
  - un card **„Oameni și procente”**.
- În capul fișei apare chipul roșu **„Rată întârziată”** cât timp o tranșă întârzie.
- **Încasatul nu se mai scrie de mână** în „Schimbă” de pe proiect: e suma tranșelor încasate, minus returnările. Prețul și termenul rămân în „Schimbă”.

### 2. Pagina „Finanțe” din meniu, la Admin

Macheta: `prototip/crm-bani.html`, **varianta B · Coloane** (aleasă de Andrei), cu „Andrei (Admin)”.

- Intrare nouă în meniu, **„Finanțe”** (`/finante`), pentru **toate rolurile** (fiecare vede altceva, vezi mai jos).
- Titlu „Finanțe”, iar dedesubt data de azi.
- **Trei tab-uri:** „Încasări”, „De plătit echipei” (cu un număr: câți oameni au ceva de primit), „Procente de bază”.

**Încasări:**
- Trei cifre sus:
  - **Încasat în <luna curentă>** (verde), cu o bară „din X lei programați luna asta”;
  - **Urmează în <luna curentă>**;
  - **Întârziate** (roșu).
- **Trei coloane:**
  - **Întârzie**: toate tranșele neîncasate cu scadența trecută; totalul în capul coloanei; pe fiecare „N zile” cu roșu.
  - **Urmează · 30 de zile**: tranșele cu scadența în următoarele 30 de zile, în ordinea datei.
  - **Încasate · <luna curentă>**: încasările din luna curentă, cele mai noi sus.
- Fiecare card arată clientul, ce tranșă e („Rata 3 din 4”, „Avans”, „Restul”, „Mentenanță noiembrie”), suma și data.
- În coloanele Întârzie și Urmează, fiecare card are butonul **„✓ Am încasat”**: auriu la cele întârziate, gri la celelalte. Face exact ce face „Am încasat-o” de pe fișă. *(Andrei a cerut butonul și aici.)*
- Apăsarea pe card, în afara butonului, deschide fișa clientului. *(Alegerea mea.)*
- Pe telefon (390px) coloanele vin una sub alta, în aceeași ordine.

**De plătit echipei:**
- Câte un bloc pe om, cu ceva de primit: nume, rol, totalul de plătit (auriu), numărul de comisioane.
- Dedesubt, lista lor: „Atelier Ceramică · avans (30%) — 600 lei”.
- Butonul **„Am plătit tot”** bifează toate comisioanele omului cu data de azi. Fiecare rând se poate bifa și separat. *(Alegerea mea: în machetă e doar „Am plătit tot”.)*
- Minusurile din returnări (vezi „Regulile banilor”) apar în lista omului ca rânduri negative și scad din total.

**Procente de bază:**
- Un tabel cu **serviciile** (Site, Automatizări, 1 la 1, Altceva) și rândul **Mentenanță (lunar)** pe linii, și cu **rolurile** Constructor, Closer, Caller pe coloane.
- Fiecare celulă e un procent pe care îl poți schimba (0–100, cel mult două zecimale, ca la `citesteProcent`), sau **gol = nestabilit**.
- Textul de sub titlu: „Se pun singure pe fiecare proiect nou. Pe un proiect anume le schimbi din fișa clientului.”
- Cifrele de start: **toate goale**. Cele din machetă sunt doar exemple; Andrei le stabilește mai târziu.

### 3. Pagina „Finanțe” la ceilalți (constructor, closer, caller)

Macheta: `prototip/crm-bani.html`, comutatorul „Radu (constructor)”.

- Fără tab-uri. Titlul e „Finanțe”, cu subtitlul „Comisioanele tale, din banii încasați de la clienți.” *(Alegerea mea: în machetă titlul era „Banii mei”; intrarea din meniu e „Finanțe” la toți.)*
- Trei cifre sus: **De primit** (auriu), **Primit în <luna curentă>** (verde), **Urmează, dacă plătesc clienții**.
- Trei liste:
  - **De primit**: comisioane din bani încasați, încă neplătite omului;
  - **Urmează**: comisioanele estimate din tranșele neîncasate, în ordinea scadenței;
  - **Primite**.
- Fiecare rând arată clientul, tranșa, procentul și suma din care e calculat comisionul („Avans · 30% din 2.000 lei”), plus suma comisionului.
- Omul **nu vede** dacă un client întârzie, nu vede banii altor oameni și nu vede comisioanele pe proiectele la care nu e pus.

### 4. Ce vede constructorul pe fișă, de acum

Azi cardul „Proiectul” îi arată constructorului Preț, Încasat și „Comisionul tău” (încasat × procent). De acum *(alegerea mea)*:
- **Preț** rămâne.
- **Încasat dispare** pentru constructor (stadiul plăților clientului e doar al lui Admin).
- **„Comisionul tău”** devine suma comisioanelor lui pe acel proiect, cu „X lei primiți · Y lei de primit”, citită din comisioanele lui (pe care RLS-ul i le arată oricum), nu din încasări.

Testele existente care cer „Încasat” la constructor se schimbă.

### 5. Lista „Clienți”

Pe rândul proiectului apare pastila roșie **„Rată întârziată · N zile”** cât timp proiectul are o tranșă întârziată. Doar Admin o vede.

## Regulile banilor

**Planul de plată.** Admin îl face din tab-ul Finanțe al proiectului și alege:
- **Tot odată**: o tranșă, cu o dată.
- **Avans + rest**: avansul (sumă sau procent din preț) cu data lui, apoi restul cu data lui.
- **Rate**: numărul de rate și data primei rate. CRM-ul împarte prețul în tranșe egale (diferența de rotunjire merge pe ultima), cu scadențe lunare, în aceeași zi a lunii.

Orice tranșă neîncasată se poate schimba după aceea (suma, data) sau șterge, și se pot adăuga tranșe noi.

Dacă suma tranșelor nu e egală cu prețul, tab-ul arată un avertisment („Tranșele fac 5.500 din 6.000 lei”), dar nu blochează nimic. *(Alegerea mea.)*

Aspectul formularului planului nu e în machete: se arată lui Andrei în browser la primul punct de control al construcției.

**Încasarea.**
- „Am încasat” deschide un mic formular cu **suma**, completată cu suma tranșei, și **data**, completată cu ziua de azi. Amândouă se pot schimba. *(Alegerea mea: Andrei poate bifa și cu o zi mai târziu.)*
- **Plată parțială.** Dacă suma e mai mică decât tranșa, se încasează doar cât a venit. Restul rămâne o tranșă neîncasată cu **aceeași scadență**, deci dacă scadența a trecut, întârzie mai departe. *(Alegerea mea, aprobată în rezumat.)*
- **Plată mai mare.** Dacă suma e mai mare decât tranșa, se cere confirmare. Surplusul nu se mută singur pe alte tranșe. *(Alegerea constructorului e cum o arată.)*
- O încasare bifată greșit se poate anula doar cât niciun comision din ea nu e plătit. După aceea se folosește returnarea.

**Comisioanele.**
- La fiecare încasare, CRM-ul face câte un comision pentru fiecare om cu procent pe proiect: **suma încasată × procentul omului**, rotunjit la leu (ca `comision()` din `crm/lib/proiecte.ts`). *(Andrei: pe fiecare tranșă, la momentul în care intră banii.)*
- **Procentul și suma se îngheață** în comision în momentul încasării. Dacă Admin schimbă mai târziu procentul pe proiect, se schimbă doar comisioanele încasărilor de după. *(Alegerea mea, aprobată în rezumat.)*
- **Procent nestabilit.** Dacă procentul omului e gol la încasare, comisionul apare cu „procent nestabilit” în „De plătit echipei”, fără sumă. Când Admin pune procentul, se calculează.
- **Contul Admin nu primește comisioane.** Banii sunt oricum ai lui Andrei, iar la „ești doar tu pe toate rolurile” s-ar umple listele cu comisioane către el însuși. *(Alegerea mea.)*
- Un cont are un singur rol (cum e azi), deci un om nu poate fi în două roluri pe același proiect. Cazul nu se construiește.
- Comisioanele cu procent 0 nu se fac deloc.

**Cine are procent pe proiect.**
- **Constructorii** puși pe proiect (cum e azi, în `proiect_oameni`).
- **Callerul și closerul**: la proiectul nou se completează singuri din client (`clienti.caller_id`, `closer_id`, veniți de pe lead), cu procentul de bază al rolului lor. Admin îi poate schimba, scoate sau adăuga pe proiect.
- **Lista celor cu procent pe proiect e separată de cine se ocupă acum de client.** Când Admin schimbă callerul sau closerul clientului, sau când „Mută tot la…” mută clienții unui om care pleacă, lista de comisioane a proiectelor **nu se schimbă singură**. *(Andrei: dacă un om plecat mai primește comision din ratele de după plecare „se stabilește atunci în contract”.)* De aceea Admin hotărăște de mână, pe fiecare proiect, cine primește din încasările viitoare. Un cont oprit rămâne cu comisioanele lui (generate și viitoare) cât timp Admin nu-l scoate de pe proiect. Când „Mută tot la…” atinge clienți cu proiecte care au comisioane, ecranul o spune: „Comisioanele de pe proiectele lor nu se mută singure.” *(Alegerea mea.)*
- **Constrângere:** procentul callerului și al closerului pe proiect **nu are voie să schimbe ce văd ei** în CRM. Azi, a fi în `proiect_oameni` dă acces la fișa proiectului (`lucreaza_la`). Felul în care se ține procentul lor e alegerea constructorului, cu condiția asta.
- **Procentele de bază se aplică** când se face un proiect nou și când un om e adăugat pe proiect. Proiectele existente nu se schimbă când Admin schimbă tabelul de bază.

**Plata către om.**
- Fiecare comision e **de plătit** sau **plătit**, cu data plății.
- Doar Admin bifează și debifează.
- Nimic nu pleacă pe e-mail către om.
- **Minusurile se compensează singure** *(alegerea mea)*: totalul „de plătit” al unui om = comisioanele lui neplătite minus minusurile lui nestinse.
  - Dacă totalul e pozitiv, „Am plătit tot” bifează toate comisioanele neplătite și stinge toate minusurile, cu data de azi. Omul primește doar diferența.
  - Dacă totalul e zero sau negativ, „Am plătit tot” nu se poate apăsa, iar blocul arată „îți datorează X lei”. Minusul se stinge la o plată ulterioară, după ce omul strânge destule comisioane.
  - Bifa unui singur rând (fără „Am plătit tot”) nu atinge minusurile.

**Returnarea** *(Andrei: „ori se scad din următorul comision, ori avansul nu se returnează”)*:
- „Marchează o returnare” alege o încasare și suma returnată (toată sau o parte).
- Încasatul proiectului scade. Tranșa rămâne marcată „returnată” și **nu redevine de încasat**: dacă clientul plătește din nou, Admin adaugă o tranșă. *(Alegerea mea.)*
- **Comisioanele din partea returnată:**
  - dacă erau încă de plătit, se anulează (sau scad proporțional la o returnare parțială);
  - dacă erau deja plătite, omul primește un **minus** („–600 lei · returnare Atelier Ceramică”), care stă în „De plătit echipei” și se scade din următoarele lui comisioane. Totalul unui om poate ieși negativ („îți datorează 600 lei”).
- Clauza din contract („avansul nu se returnează după ce începe lucrul”) e treaba contractului, nu a CRM-ului; se verifică separat, cu skill-ul de legal.

**Mentenanța.**
- Pe un proiect, Admin poate porni un **abonament lunar**: suma, ziua din lună (1–28) și data de pornire (de obicei după predare). Abonamentul se poate schimba și opri oricând.
- CRM-ul face singur tranșa fiecărei luni („Mentenanță noiembrie”), cu scadență. Tranșa intră în Întârzie, Urmează și Încasate exact ca o rată. Tranșa lunii următoare trebuie să apară în „Urmează · 30 de zile” la timp. Felul în care se generează e alegerea constructorului.
- La **oprire**, tranșele viitoare neîncasate dispar. Cele întârziate rămân.
- Comisionul de mentenanță *(alegerea mea)*:
  - Fiecare abonament are **lista lui de oameni cu procent**, separată de lista proiectului.
  - La pornire, lista se completează din rândul **Mentenanță** al procentelor de bază: **un singur constructor**, „omul care se ocupă”, ales de Admin când pornește abonamentul (implicit primul constructor de pe proiect), plus callerul și closerul proiectului, dar doar dacă rândul Mentenanță le dă un procent mai mare ca 0.
  - Admin poate schimba oamenii și procentele abonamentului oricând; schimbarea contează de la următoarea încasare.
- **Totalurile proiectului nu includ mentenanța** *(alegerea mea)*. Preț, Încasat și De încasat din tab-ul Finanțe și avertismentul „Tranșele fac X din Y lei” se referă doar la planul de plată. Cardul Mentenanță arată separat cât s-a încasat din mentenanță și dacă luna curentă e încasată. Pe pagina Finanțe (coloanele și cele trei cifre de sus) intră toate încasările, inclusiv mentenanța.

**Întârzierea.** O tranșă e întârziată din ziua de după scadență, cât timp nu e încasată în întregime. Zilele de întârziere = azi − scadența, în ora României.

## Alertele

- **Un e-mail către Andrei** (`CRM.emailAdmin`) **o singură dată pentru fiecare tranșă**, în ziua de după scadență: clientul, tranșa, suma, câte zile și link-ul spre fișă. Se trimite din jobul zilnic existent (`/api/cron/zilnic`), care trebuie să țină minte ce a trimis, ca să nu repete. Dacă într-o zi întârzie mai multe tranșe, vine un singur e-mail cu toate. *(Alegerea mea.)*
- **E-mailul de luni** (copia existentă din `crm/lib/retentie.ts`) primește lista tuturor tranșelor întârziate.
- Pe ecran: pastila de pe „Clienți”, chipul și cardul roșu de pe fișă, coloana „Întârzie” de pe Finanțe.
- Oamenii din echipă nu primesc niciun e-mail despre bani.

## Cine ce vede și ce face

| | Admin | Constructor / Closer / Caller |
|---|---|---|
| Tab-ul Finanțe de pe fișă | vede tot, face tot | nu îl vede |
| Pagina Finanțe | Încasări, De plătit echipei, Procente de bază | doar comisioanele lui |
| Planul de plată, încasarea, returnarea | da | nu |
| Bifa „plătit” pe comision | da | nu (doar vede starea) |
| Procentele (de bază și pe proiect) | da | își vede doar procentul lui |

Totul se apără în baza de date (RLS), nu doar în ecran. Ca la etapele 1 și 2, regulile se acoperă cu teste de permisiuni (`crm/tests/rls/`): un om citește doar comisioanele lui; nimeni în afară de Admin nu citește tranșele, încasările, abonamentele sau tabelul de bază, și nu scrie nimic în ele.

## Ce mai trebuie atins

- **Modul filmare:** pe ecranele noi (fișă, pagina Finanțe la toate rolurile, e-mailurile nu contează), numele clienților și ale firmelor se blurează ca peste tot (`Ascuns`). Sumele **nu** se blurează: sunt inventate. *(Alegerea mea.)*
- **`npm run demo`** umple și finanțele, ca Andrei să poată filma:
  - proiecte cu fiecare tip de plan (tot odată, avans + rest, rate);
  - cel puțin două tranșe întârziate, una plătită parțial, o returnare;
  - un abonament de mentenanță pornit;
  - comisioane plătite și de plătit pe mai mulți oameni;
  - procente de bază completate;
  - date relative la ziua rulării, ca „Întârzie” și „Urmează” să fie mereu pline.

  `--singur` rămâne „totul al lui Andrei”, deci fără comisioane.
- **Meniul de pe telefon:** la Admin ajunge la 6 intrări (Lead-uri, Clienți, Task-uri, Program, Finanțe, Echipa). Toate trebuie să încapă la 390px, fără scroll orizontal. Cum (etichete scurte, iconițe) e alegerea constructorului, arătată lui Andrei la punctul de control. Finanțe are nevoie de o iconiță nouă în `Iconite.tsx`.
- **Datele existente:**
  - `proiecte.incasat_lei` se înlocuiește cu tranșele.
  - Unde `incasat_lei > 0`, migrația face o tranșă încasată cu data migrării și suma respectivă.
  - Comisioanele acestei tranșe se fac **ca plătite** (banii de dinainte se consideră împărțiți), cu nota „dinainte de Finanțe”. *(Alegerea mea: pe producție lucrează doar Andrei, deci probabil nu apare niciun comision.)*
  - Coloana veche se poate scoate după ce nimic nu o mai citește.
- **Ștergerea unui client** (sau a unui proiect) *(alegerea mea)*:
  - Ștergerea e **blocată** cât proiectele lui au comisioane de plătit sau minusuri nestinse. Mesajul: „Mai ai de plătit comisioane din proiectele lui. Plătește-le întâi.”
  - Altfel, tranșele și încasările se șterg odată cu clientul, dar **comisioanele plătite rămân** în istoricul omului, fără numele clientului („client șters”), ca totalurile primite de om să nu se schimbe.
  - Asta se potrivește cu ștergerea după un an de la încheierea colaborării, când comisioanele sunt de mult plătite.
- **Pagina de confidențialitate:** dacă `/confidentialitate` enumeră ce date ține CRM-ul despre clienți, se adaugă plățile (sume și date). Textul se arată întâi lui Andrei.
- **Producția:** bucata cere migrații, deci tokenul de producție din `crm/.env.productie.local` e încă necesar. Migrațiile pe producție se aplică doar cu „da”-ul lui Andrei, ca la etapa 2.

## Rămâne la constructor

- Tabelele și numele lor, felul în care se ține procentul callerului și al closerului (cu constrângerea de mai sus), generarea tranșelor de mentenanță, memoria jobului zilnic pentru e-mailurile trimise.
- Aspectul formularelor (planul de plată, „Am încasat”, returnarea, abonamentul), în tema existentă. Formularul planului se arată lui Andrei la primul punct de control.
- Ordinea lucrului, cu un punct de control vizual cu Andrei (fișa cu tab-ul Finanțe și pagina Finanțe), înainte de rest. E aceeași regulă ca la tema CRM-ului.
- Fluxul obișnuit: ramură nouă din `main`, testele (vitest, permisiuni, e2e, `tsc`, lint) verzi, previzualizarea verificată de Andrei pe laptop și pe iPhone, apoi unirea.
