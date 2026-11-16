# CRM buildwithac · pagina KPI (design)

**Data:** 2026-11-15 · **Ramura:** `crm-kpi` · **Macheta aprobată:** `prototip/crm-kpi.html`, varianta „B · Un ecran + oameni”

Marcaje: **[Andrei]** = hotărât de Andrei; **[apelul meu]** = ales de mine, se poate schimba.

## De ce

Bucata 4 din etapa 3 („dashboard și KPI”) a fost împărțită în două: pagina „Azi” (LIVE din 2026-11-15) și pagina asta **[Andrei]**. „Azi” spune ce ai de făcut acum, iar pagina KPI spune **cum merge**: pe perioadă și pe om.

Andrei nu știa exact ce vrea să afle și mi-a lăsat lista în grijă, pornind de la ce notează CRM-ul și de la ce are EasyGrow **[Andrei]**. Pagina e pentru toate rolurile. La început o folosește doar Andrei, dar tehnic trebuie să meargă deja pentru caller, closer și constructor **[Andrei]**.

## Ce intră (3 lucruri)

1. **Pagina `/kpi`** (numele din meniu: „KPI” **[Andrei]**).
2. **Lead-urile vechi rămân fără nume, nu se șterg**: datele personale stau 1 an, apoi se scot, iar istoricul rămâne pentru cifre **[Andrei]**.
3. **Butonul „N-a venit”** pe o discuție trecută, ca să se poată număra rata de prezentare **[Andrei]**.

## Ce nu intră

- Grafice pe zile, pe ore sau perioade alese din calendar. Perioadele sunt fixe (vezi mai jos).
- Exportul cifrelor (CSV, PDF).
- Ținte și obiective („vreau 10 clienți luna asta”).
- Notificări sau e-mailuri cu cifrele.
- Cifrele reclamelor (cost pe lead, cost pe client): stau deja pe `/reclame` și nu se dublează aici.
- Clasamente cu locuri („locul 1”). Oamenii apar unul lângă altul doar pentru Admin.

**Anti-scop:** pagina nu trebuie să arate cifre greșite sigure pe ele. Dacă o cifră nu se poate calcula corect (de exemplu împărțirea la zero sau o perioadă fără date), apare „—”, nu 0% sau 100%.

## Pagina, varianta B + oameni

Referința de aspect: `prototip/crm-kpi.html` (comutatorul „B · Un ecran + oameni”), cu tema „Grafit” a CRM-ului.

**Sus:** titlul „KPI”, sub el perioada: **Săptămâna asta · Luna asta · Ultimele 3 luni**. Implicit e „Luna asta” **[apelul meu]**. Fiecare cifră se compară cu perioada de dinainte de aceeași lungime: săptămâna trecută, luna trecută, cele 3 luni dinainte. Comparația apare ca săgeată cu procent sau cu puncte procentuale („pp”), verde când e mai bine și roșu când e mai rău. La cifrele unde mai puțin e mai bine (timpul până la primul apel, nesunate peste 24 h, încercări, livrări de refăcut, durata unui proiect, zilele până la client, tranșe întârziate), scăderea e verde. Săgeata are și semn, ca să nu depindă doar de culoare.

- „Săptămâna asta” = de luni 00:00 până acum, ora României. „Luna asta” = de pe 1 până acum. „Ultimele 3 luni” = luna curentă plus cele două dinainte. Perioada de comparație este **întreagă**: luna trecută întreagă, nu doar până în aceeași zi **[apelul meu]**. Așa e simplu de explicat, chiar dacă la începutul lunii comparația arată mai rău. Sub perioadă scrie „Săgețile: față de luna trecută.”

**Admin vede, în ordine:**

1. **Cinci cifre-cheie** (plăci mari): lead-uri noi, clienți noi (cu „x% din lead-uri”), timpul până la primul apel, rata de prezentare, încasat.
2. **Echipa · dă clic pe un om**: câte un card pentru fiecare om activ cu rol. Cardul arată cifrele rolului lui: apeluri, programate și primul apel la caller; au venit, clienți și vândut la closer (suma în lei o vede doar Adminul); livrate, de refăcut și la termen la constructor. Adminul are pe card tot ce a făcut el. Clic pe card deschide sub carduri panoul omului cu toate plăcile lui pe perioada aleasă. Al doilea clic îl închide. Pe un om fără nicio activitate în perioadă, cardul arată „Nimic în perioada asta.”
3. **De la lead la client** **[Andrei: numele]**: pâlnia Lead-uri noi → Sunate → Au răspuns → Discuție programată → Au venit la discuție → Ofertă trimisă → Clienți, cu „↓ x% merg mai departe” între trepte. Lângă ea: **Clienți noi pe lună**, ultimele 6 luni, ca bare.
4. **Apeluri**: plăcile (apeluri, discuții programate, rata de programare, timpul până la primul apel, nesunate peste 24 h, încercări până răspunde), plus tabelul pe oameni.
5. **Închideri**: plăcile (discuții avute, rata de prezentare, rata de închidere, vândut, zile de la discuție la client), plus tabelul pe oameni.
6. **Pierderi și surse**: „De ce pierzi” (motivele de la „Pierdut” și „Descalificat”, cele mai dese primele) și „De unde vin” (lead-uri pe sursă, cu clienții ieșiți din fiecare).
7. **Proiecte** **[Andrei: numele, nu „Livrare”]**: plăcile (proiecte livrate, durata unui proiect, livrări de refăcut, task-uri gata la termen), plus tabelul pe oameni.
8. **Bani** (doar Admin): încasat, mentenanța pe lună, valoarea medie a unui proiect, tranșe întârziate, plus barele „Încasat pe lună” pe ultimele 6 luni.

**Ceilalți văd doar cifrele lor** **[Andrei]**, fără bani, fără colegi și fără pâlnia firmei: sus cardul lor, apoi plăcile rolului. Caller: Apelurile mele. Closer: Discuțiile mele și De ce pierd (doar lead-urile lui). Constructor: Proiectele mele. Subtitlul spune „Cifrele tale. Le vezi doar tu și Adminul.”

**Telefon:** aceeași pagină într-o coloană, cu plăcile câte două pe rând și tabelele cu derulare orizontală. Fără lustruit în plus: CRM-ul se folosește mai ales pe laptop **[Andrei, 2026-11-14]**. „KPI” intră și în bara de jos. La Admin devine a 9-a intrare, iar Andrei verifică pe iPhone în previzualizare dacă încape. Dacă nu încape, KPI iese din bara de jos la Admin și rămâne doar în bara laterală, iar decizia se ia atunci **[apelul meu]**.

## Definițiile cifrelor

Toate se calculează pe ora României (`lib/timp.ts`, `FUS`). „Omul” unei cifre e cel care a făcut acțiunea (`evenimente.autor_id`), nu cel care deține lead-ul acum. Excepția sunt cifrele pe lead (pâlnia), unde omul e callerul sau closerul lead-ului.

**O intrare** = evenimentul `creat` **sau** `redeschis` din Parcurs. Un lead pierdut sau descalificat care trimite o cerere nouă (`primesteCerere` îl readuce în `nou`) **intră din nou**. Se numără iar la „Lead-uri noi”, iar timpul până la primul apel și „Nesunate peste 24 h” se măsoară de la noua intrare. Sursa intrării e sursa cererii care l-a adus (`cereri.sursa` cea mai apropiată de intrare) **[apelul meu]**. Așa „Clienți noi” nu poate trece de 100% din lead-uri.

**De la lead la client** = **intrările din perioadă** și cât de departe a ajuns fiecare până acum, numărând doar ce s-a întâmplat după intrarea ei **[apelul meu]**. Plăcile de activitate de mai jos numără ce s-a **întâmplat** în perioadă. Pâlnia urmărește o generație de lead-uri, ca procentele dintre trepte să aibă sens.
- Sunate = au cel puțin o încercare sau o schimbare de stare făcută de un om după `nou`.
- Au răspuns = au trecut vreodată prin `a_raspuns`, `callback` sau o stare de mai departe, chiar dacă prima schimbare a fost direct `programat`. Nu intră `fara_raspuns`, iar `descalificat` intră doar dacă înainte a fost atinsă o stare de răspuns.
- Discuție programată = are cel puțin o discuție (`discutii`) sau evenimentul `programat`.
- Au venit = are o discuție începută în trecut și nemarcată „N-a venit”.
- Ofertă trimisă = a trecut prin `oferta_trimisa` sau a ajuns `client`.
- Clienți = starea `client`.
- Pentru filtrele de sursă și serviciu ale pâlniei, vezi „Ce rămâne deschis”.

**Apeluri** = numărul de apeluri făcute în perioadă: fiecare eveniment `incercare` („Nu răspunde”), plus fiecare schimbare de stare care pornește din `nou`, `fara_raspuns` sau `callback` și e făcută de un om. Un apel cu răspuns urmat imediat de „Programează” se numără o singură dată: schimbările aceluiași om pe același lead la mai puțin de 10 minute una de alta se socotesc un apel **[apelul meu]**.
- **Discuții programate** = evenimentele `programat` din perioadă, pe omul care a programat. O reprogramare nu se numără a doua oară: se numără doar prima programare a unui lead într-o perioadă **[apelul meu]**.
- **Rata de programare** = lead-uri programate / lead-uri care au răspuns, ambele în perioadă, pe același om. **Nu e** formula din EasyGrow (programări / apeluri): lead-urile care n-au răspuns niciodată ar trage procentul în jos fără să spună ceva despre vânzare **[apelul meu, spus lui Andrei]**.
- **Timpul până la primul apel** = mediana (valoarea din mijloc, nu media, ca un lead uitat un weekend să nu strice tot) dintre `creat` și primul apel făcut de un om, pentru lead-urile intrate în perioadă și sunate. Pe om = lead-urile al căror prim apel l-a făcut el. Lead-urile intrate noaptea sau în weekend se numără cu ora reală, fără program de lucru **[apelul meu, simplu; de revăzut dacă deranjează]**.
- **Nesunate peste 24 h** = lead-urile intrate în perioadă al căror prim apel a venit după mai mult de 24 h sau n-a venit deloc (și au intrat de mai mult de 24 h).
- **Încercări până răspunde** = media numărului de „Nu răspunde” dinainte de primul răspuns, la lead-urile care au răspuns în perioadă.

**Închideri**
- **Discuții avute** = discuțiile cu `incepe_la` în perioadă, deja începute și nemarcate „N-a venit”. Pe om = `closer_id`.
- **Rata de prezentare** = discuții avute / discuții cu `incepe_la` în perioadă, deja începute.
- **Rata de închidere** = lead-uri devenite `client` în perioadă / discuții avute în perioadă (pe closer).
- **Vândut** = suma `pret_lei` a proiectelor create în perioadă, **inclusiv a doua vânzare** la un client vechi. Pe om = cine e trecut în `proiect_vanzari` (aceeași listă care dă comisioanele), ca pagina KPI și Finanțele să nu se contrazică **[apelul meu]**. Proiectele fără preț nu intră, iar sub cifră scrie câte sunt fără preț. „Valoarea medie a unui proiect” folosește aceleași proiecte.
- **De la discuție la client** = mediana zilelor dintre prima discuție avută și trecerea în `client`, pentru clienții din perioadă.

**De ce pierzi** = motivele din schimbările de stare spre `pierdut` și `descalificat` din perioadă, grupate (vezi „Ce rămâne deschis”: motivele sunt azi text liber).

**De unde vin** = lead-urile intrate în perioadă pe `sursa`, cu câți au ajuns `client` până acum.

**Proiecte** (pe constructor = oamenii din `proiect_oameni`; Adminul = proiectele lui sau toate, ca la restul)
- **Proiecte livrate** = proiecte trecute în `livrat` în perioadă (evenimentul `stadiu`, prima intrare, ca la „a doua vânzare” din „Azi”).
- **Durata unui proiect** = mediana zilelor de la crearea proiectului până la prima trecere în `livrat`, pentru proiectele livrate în perioadă.
- **Livrări de refăcut** = livrările trimise în perioadă care au primit vreodată `de_refacut` / toate livrările trimise în perioadă.
- **Task-uri gata la termen** = task-urile cu termen în perioadă, deja trecut, gata cel târziu în ziua termenului / toate task-urile cu termen în perioadă, deja trecut. Pe om = `om_id`. Cele fără om intră doar la total.

**Bani** (doar Admin, din tabelele Finanțelor)
- **Încasat** = suma `incasat_lei` cu `incasata_la` în perioadă, minus `returnat_lei` cu `returnata_la` în perioadă.
- **Mentenanța pe lună** = suma abonamentelor pornite și neoprite azi (o cifră „acum”, comparată cu valoarea de la sfârșitul perioadei de dinainte).
- **Valoarea medie a unui proiect** = media `pret_lei` a proiectelor create în perioadă, cu preț.
- **Tranșe întârziate** = câte și cât, acum (aceeași regulă ca pe `/finante`, `lib/alerte-finante.ts`).
- Barele „Încasat pe lună” și „Clienți noi pe lună” = ultimele 6 luni calendaristice, inclusiv cea curentă.

## Cum se calculează (abordarea)

Am cântărit trei variante și am ales-o pe a doua **[apelul meu; Andrei: „da”]**:
1. **Calculul în aplicație**, ca la „Azi”: citește rândurile și numără în TypeScript. **Respinsă.** PostgREST dă cel mult 1.000 de rânduri la o cerere. Cu istoricul păstrat pentru totdeauna, „Ultimele 3 luni” trece de 1.000 de evenimente în câteva luni, iar pagina ar încetini cu timpul.
2. **Numărătoarea în baza de date. Aleasă.** Câte o funcție SQL pe temă (de exemplu `kpi_apeluri(de, pana, om)`) întoarce cifrele gata numărate, pe perioada cerută și pe cea de dinainte. O singură citire, fără limita de rânduri. Funcțiile verifică rolul înăuntru: cine nu e Admin primește doar cifrele lui, oricare ar fi `om` cerut, iar Banii răspund doar Adminului. Se testează cu testele RLS pe baza de test, care există deja.
3. **O poză a cifrelor în fiecare noapte. Respinsă.** Cifrele ar întârzia o zi, o corectură din trecut nu s-ar mai vedea, iar jobul ar fi încă o piesă care se poate strica.

Partea de afișare (formatarea, săgețile, „—”, comparația, ce plăci vede fiecare rol) stă într-un fișier TypeScript pur, `lib/kpi.ts`, testat cu vitest, ca `lib/azi.ts`.

## Lead-urile vechi: 1 an, apoi fără nume

**[Andrei]:** datele personale ale lead-urilor care nu devin clienți stau **1 an** (nu 90 de zile), apoi lead-ul **rămâne fără nume** în loc să fie șters. Nu există încă lead-uri reale, deci schimbarea nu atinge pe nimeni care a citit vechea promisiune.

- Jobul de noapte (`stergeVechi` din `lib/retentie.ts`) nu mai șterge lead-ul. După 365 de zile de la `intrat_la`, scoate datele personale:
  - pe lead: `nume` devine „Lead șters” **[apelul meu]**, iar `telefon`, `telefon_norm`, `email`, `email_norm`, `motiv` și `callback_la` se golesc;
  - se șterg rândurile din `cereri` (răspunsurile din formular, UTM-urile) și din `notite`;
  - în Parcurs (`evenimente`), câmpul `motiv` din `detalii` se scoate (e text liber și poate conține date personale), dar evenimentul rămâne. Motivul ca **categorie** rămâne, dacă se face lista fixă (vezi „Ce rămâne deschis”).
  - Discuțiile rămân: au doar ore și closer.
  - Constrângerea „telefon sau e-mail obligatoriu” trebuie să accepte lead-urile fără nume (de exemplu o coloană `anonimizat_la`, cu verificarea doar pe cele neanonimizate).
- Un lead fără nume nu apare în liste, în căutare, în „Azi” sau în fișe. Apare doar în cifrele KPI. Nu poate fi „reînviat” de o cerere nouă: dacă omul revine, intră ca lead nou (telefonul și e-mailul lui nu mai sunt în baza de date ca să se potrivească).
- E-mailul de luni: lista „se șterg în următoarele 7 zile” devine „rămân fără nume în următoarele 7 zile”, cu aceeași regulă de 365 de zile. Copia de luni include și lead-urile fără nume (n-au date personale).
- Rândurile din `reclame_lead_uri` rămân legate de lead-ul fără nume, ca înainte. Nu mai e nevoie să devină anonime la ștergere, dar comportamentul vechi se păstrează pentru ștergerea manuală a unui lead (butonul Admin „Șterge lead-ul”), care rămâne ștergere de tot. Ștergerea manuală e pentru „vreau să-mi ștergi datele” și scoate omul și din cifre **[apelul meu]**.
- **Ordinea la publicare** **[apelul meu]**: anonimizarea se face pe aceeași ramură, dar în task-uri separate, primele din plan. Textul nou de pe site îl aprobă Andrei la punctul de control vizual și ajunge live pe `buildwithac.ro` înainte de unirea CRM-ului. Dacă textul nu e gata, se scoate migrația de anonimizare din unire, iar restul paginii KPI poate ieși fără ea: lead-urile se șterg atunci tot la 90 de zile.
- **Pagina `/confidentialitate` de pe site** (`site/app/confidentialitate/page.tsx`): „le șterg după 90 de zile” devine „după un an”, cu precizarea că după un an rămâne doar un istoric fără nume, telefon sau e-mail, pentru statistici. Textul exact îl aprobă Andrei. Data „actualizat la” se schimbă. **Se publică înaintea sau odată cu schimbarea din CRM, niciodată după.**
- `ZILE_PASTRARE` devine 365 și se redenumește după sens, iar textele care spun „90 de zile” în CRM se schimbă.
- **Clienții** nu se schimbă: Adminul îi șterge de mână după un an de la ultimul proiect (`sterge_client`). Proiectele și banii lor dispar atunci din cifre, dar doar din cifrele mai vechi de un an, deci nu din ce arată pagina KPI (cel mult 6 luni în urmă). Rămâne așa **[apelul meu]**.

## Butonul „N-a venit”

- Coloană nouă pe `discutii`: `neprezentat_la timestamptz` (gol = a avut loc sau încă n-a început). Se poate pune doar pe o discuție deja începută, de closerul ei sau de Admin. Se poate anula (o greșeală de clic), tot de ei. Fiecare schimbare scrie în Parcurs (`neprezentat` / `neprezentat_anulat`).
- **Unde apare:** pe fișa lead-ului, lângă discuția trecută, ca buton mic „N-a venit”. În „Azi”, pe rândul discuției care a început (cele 15 minute în care rândul mai stă pe pagină) **[apelul meu]**.
- **Ce se întâmplă cu lead-ul:** **rămâne la closer**, care îl sună și îl reprogramează **[Andrei: varianta B]**. Lead-ul trece în `callback` cu `callback_la` = acum și își păstrează `closer_id`. Apare în „De sunat” la closer (regula de azi din `lib/azi.ts` arată un callback și callerului lead-ului; rămâne așa, ca să-l vadă amândoi). Regulile de stări din `lib/stari.ts` și din trigger-ul `inainte_de_schimbare_lead` trebuie să permită trecerea pentru closer și Admin.
- O discuție marcată „N-a venit” nu se numără la „Discuții avute” și nici la „Au venit”.

## Cine vede ce

- Pagina `/kpi` se deschide pentru toate rolurile.
- Funcțiile SQL decid ce întorc. Admin: tot și orice om. Caller, closer, constructor: doar cifrele lor, iar cererea pentru alt om întoarce tot cifrele lor sau eroare, niciodată ale altcuiva. Banii, pâlnia firmei, „De unde vin” și cardurile echipei sunt doar pentru Admin.
- **Closerul nu vede bani** **[Andrei]**: pe cardul și plăcile lui apar discuțiile, rata de prezentare, rata de închidere, clienții și zilele până la client, dar nu „Vândut” în lei. Azi closerul nu vede prețurile proiectelor nicăieri, iar pagina KPI păstrează regula. Funcția de închideri nu întoarce `vandut_lei` decât Adminului.
- Constructorul care e și pe proiecte, dar n-a sunat niciodată, nu vede plăci de apeluri. Plăcile vin după rol, nu după activitate.

## Teste

- **vitest** (`lib/kpi.ts`): săgețile, cu sens invers la cifrele unde mai puțin e mai bine, „—” la împărțirea la zero, perioadele pe ora României (luni, prima zi a lunii, schimbarea orei din martie și octombrie), plăcile pe rol.
- **Teste pe baza de test** (ca testele RLS): fiecare funcție SQL pe un set mic de date făcut în test, cu cifrele așteptate calculate de mână. Callerul nu poate citi cifrele altcuiva și nici Banii. „N-a venit” doar pe o discuție începută, doar de closerul ei sau de Admin. Anonimizarea scoate tot ce e personal și păstrează evenimentele.
- **e2e** (Playwright): Admin vede cele 5 cifre, cardurile și panoul unui om la clic; callerul vede doar „Apelurile mele”; „N-a venit” pe fișă mută lead-ul în callback; schimbarea perioadei schimbă cifrele.
- `npm run demo` umple baza de test cu destule evenimente în ultimele 6 luni ca pagina să arate ca în machetă (apeluri, discuții, câteva „N-a venit”, proiecte livrate, încasări).

## Motivele de pierdere: butoane fixe

Azi motivul de la „Pierdut” și „Descalificat” e text liber (câmpul din `ButoaneActiuni`) și nu se poate număra. Se înlocuiește cu **butoane cu motive fixe, plus „Altceva” cu text** **[Andrei]**:
- **Pierdut:** Prea scump · A ales pe altcineva · Nu mai are nevoie · Nu mai răspunde · Altceva
- **Descalificat:** Nu are firmă · Număr greșit · Nu e interesat · Caută altceva (angajare, alt serviciu) · Altceva

Categoria se salvează separat de text (o coloană nouă pe `lead_uri` și în `detalii` la evenimentul `stare`). Textul liber rămâne doar la „Altceva”. La anonimizare, categoria rămâne și textul se scoate. Lead-urile vechi, cu motiv doar text, apar la „De ce pierzi” ca „Altceva”. „Altceva” e un singur rând în grafic, fără textele de sub el **[apelul meu]**.

## Ce rămâne deschis

- Filtrele de sursă și serviciu de pe pâlnie: în machetă nu sunt. Le adaug doar dacă Andrei le cere.

## Ce las constructorului

Numele exacte ale funcțiilor SQL și cum se împart, indexurile, aranjarea componentelor React, culorile exacte ale barelor (din tema „Grafit”, amber pentru mărime, fără paletă pe categorii), textele mărunte, ordinea migrațiilor.
