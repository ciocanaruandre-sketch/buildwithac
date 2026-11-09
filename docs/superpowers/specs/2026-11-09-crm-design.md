# CRM-ul buildwithac: documentul de design

*2026-11-09. Sursa: discuția cu Andrei din 2026-11-09, clipul „CRM EasyGrow explicat” (transcris și analizat), ghidul `logiaweb.net/hub/library/guides/custom-crm-guide`, prototipul `prototip/crm-clienti.html` (varianta A, aleasă) și codul din `site/`. Marcaje: **[Andrei]** = decizia lui; **[apelul meu]** = ales de Claude, nerespins; **[de verificat]** = se confirmă la construcție.*

## 1. Ce e și de ce

Un CRM făcut de la zero pentru buildwithac: locul în care intră lead-urile, în care Andrei (și, mai târziu, oamenii lui) îi sună, îi transformă în clienți și urmărește proiectele până la livrare.

- **Pentru cine:** Andrei acum, singur. Mai târziu, o echipă mică: calleri, closeri, oameni care construiesc site-uri și automatizări cu el. **[Andrei]**
- **De ce acum:** Andrei vrea să lanseze serviciile (site-uri, automatizări, sesiuni 1 la 1, ghiduri personalizate) și să facă reclame care duc direct la formular. Fără un loc comun, lead-urile se pierd între e-mailul de la `contact@`, notificările Tally de pe Gmail și DM-uri.
- **Al doilea motiv:** CRM-urile personalizate vor deveni un serviciu vândut clienților. CRM-ul propriu e primul exemplu și apare în portofoliu și în clipuri, **doar în poze** (capturi), niciodată ca demo public. **[Andrei]**
- **Contextul mai larg:** în proiectul `Portofoliu AC` vor sta, în timp, toate serviciile pentru clienți: site-urile, automatizările, organizarea sesiunilor 1 la 1, fiecare cu proiectul și skill-urile lui. CRM-ul e primul pas. Celelalte se gândesc separat, după. **[Andrei]**

### Drumul unui lead
1. Omul completează un formular: cel de pe site sau, mai târziu, un formular de tip Typeform dintr-o reclamă Meta sau TikTok. Sau Andrei îl adaugă de mână, după un cold call. **[Andrei]** Cele 3 formulare Tally **nu aduc lead-uri**: le primește clientul după ce semnează (schimbat 2026-11-09, după verificarea etapei 1). **[Andrei]**
2. Lead-ul apare în CRM cu toate detaliile și răspunsurile din formular. Andrei primește un e-mail. **[Andrei]**
3. Un caller își ia lead-ul, îl sună sau îi scrie, notează ce s-a întâmplat.
4. Lead-ul devine **client** (sau **pierdut**, cu motiv).
5. Clientul are fișa lui: proiectul, task-urile, materialele, conturile folosite, ce i s-a livrat, notițele, banii. **[Andrei]**

### Succes
- Un lead completat pe site apare în CRM în câteva secunde, fără nicio mișcare din partea lui Andrei, și Andrei primește e-mailul.
- Andrei știe în orice moment pe cine are de sunat azi și în ce stadiu e fiecare proiect, chiar și cu 2-3 proiecte în paralel. **[Andrei]**
- Un caller nou primește o invitație, intră cu contul lui și vede exact ce trebuie, nimic mai mult.

### Ce nu e (non-goals)
- Nu e un demo public și nu are înscriere liberă. Conturile le face doar Andrei.
- Nu ține parole. La conturile clienților se notează doar ce cont e, al cui e și unde e parola. **[apelul meu, Andrei n-a obiectat]**
- Nu e produs vândut altora (multi-firmă). Pentru clienți se va face câte o copie separată, mai târziu.
- Nu trimite mesaje automate lead-urilor (SMS, WhatsApp, e-mail). Andrei sună sau scrie el.
- Nu e gândit pentru telefon. Se folosește pe laptop/PC. **[Andrei]** Pe telefon trebuie doar să se deschidă și să se citească.

### Eșec chiar dacă „merge” (anti-goals)
- Un lead se pierde în tăcere: formularul spune „Am primit”, dar în CRM nu apare și nimeni nu află.
- Un caller vede sau schimbă ce nu-i aparține: ia lead-ul altuia, vede banii altcuiva. Permisiunile verificate doar în pagină (butoane ascunse), nu și în baza de date.
- Arată „făcut cu AI”: șablon generic de dashboard, gradient mov, carduri identice.
- Datele stau mai mult decât promite pagina de confidențialitate.
- O greșeală în CRM strică site-ul public.

## 2. Constrângeri

- **Confidențialitatea promisă pe site** (`site/app/confidentialitate/page.tsx`): cererile din formulare se păstrează 90 de zile dacă nu se ajunge la colaborare; dacă da, cât durează colaborarea plus un an după ultimul proiect. Cererile de contact sunt folosite doar pentru cererea omului, nu pentru reclame. CRM-ul trebuie să respecte asta (vezi §9). Pagina trebuie actualizată ca să menționeze Supabase și CRM-ul, înainte ca primul lead real să intre în CRM.
- Texte în română, ș/ț cu virgulă, tonul din `CLAUDE.md`, persoana I singular în textele care ajung la clienți.
- Adresele de e-mail și domeniul stau într-un singur fișier de configurare al CRM-ului (ca `site/lib/config.ts` la site).
- Limita de folosire Claude a lui Andrei: lucrul se împarte în etape care se pot folosi fiecare singură.
- Vercel Hobby e, după reguli, pentru folosire necomercială; Pro costă 20 $/lună. Andrei decide mai târziu. **[Andrei: „mai vedem”]**

## 3. Cum se construiește

- **Locul:** în același repo, într-un dosar nou `crm/` lângă `site/`, ca aplicație separată. Proiect Vercel separat, adresa `crm.buildwithac.ro`. **[apelul meu, Andrei n-a obiectat]** O eroare în CRM nu atinge site-ul.
- **Tehnologia:** Next.js 16 (App Router), TypeScript, Tailwind, ca site-ul. **Înainte de cod, `site/AGENTS.md`** (versiunea are API-uri noi). Fără GSAP/Lenis: e o aplicație de lucru, nu o pagină de prezentare. **[apelul meu]**
- **Datele, conturile și permisiunile:** Supabase. **[apelul meu, Andrei a acceptat]** Permisiunile se verifică în baza de date (Row Level Security), nu doar în interfață.
- **Contul Supabase:** cont nou, pe o adresă a firmei, nu pe contul personal al lui Andrei. **[Andrei]** Adresa exactă (`ac@`, `contact@` sau un alias nou ca `admin@`) o alege Andrei la creare. Regiunea: UE (Frankfurt). **[apelul meu]** Limitele planului gratuit (pauza după inactivitate, copiile de siguranță) **[de verificat]** la creare.
- **Costurile:** se pornește pe planurile gratuite (Vercel Hobby, Supabase Free). Ca Supabase să nu intre în pauză din lipsă de folosire, CRM-ul îl atinge zilnic (job programat în Vercel, care rulează tot zilnic și ștergerea din §9). O dată pe săptămână se face o copie a datelor pe care Andrei o poate păstra. Trecerea pe plătit (Supabase Pro ~25 $/lună, Vercel Pro 20 $/lună) o decide Andrei când are clienți reali. **[apelul meu]**
- **E-mailurile** (notificarea de lead nou, invitațiile): prin Resend, contul `buildwithacai` existent, domeniul deja verificat. **[apelul meu]** Plan gratuit: 3.000/lună, 100/zi.
- **Lucrul:** pe o ramură separată (de exemplu `crm`). În `main` ajunge doar o etapă terminată și verificată de Andrei. **[apelul meu, după regula ghidurilor]**
- Conturile Vercel/Supabase le creează Andrei, cu pașii dați unul câte unul, cu numele exacte ale butoanelor. Nu i se cer niciodată chei în capturi.

## 4. Rolurile și permisiunile

| Rol | Ce poate |
|---|---|
| **Admin** (Andrei) | Tot: vede și schimbă orice, mută lead-uri și clienți între oameni, invită și dezactivează conturi, setează procentele de comision, șterge. |
| **Caller** | Vede **toate** lead-urile care intră. Își ia singur lead-urile libere. Pe lead-urile lui: sună, scrie, notează, setează callback, programează discuția. **Nu** poate lua un lead care e deja al altcuiva și nu poate muta lead-uri la alții. Nu șterge. **[Andrei]** |
| **Closer** | Tot ce poate callerul, plus: marchează lead-ul „Client” sau „Pierdut”. **[Andrei]** |
| **Constructor** (numele rolului e provizoriu) | Vede doar clienții și proiectele la care l-a pus Andrei. Vede prețul proiectului și comisionul lui. Lucrează pe task-uri, materiale, livrări, notițe. Nu vede lead-urile. **[Andrei]** |

- **De la caller la closer:** lead-ul ține **două nume**, callerul și closerul, ca fiecare să-și primească mai târziu comisionul corect. **[apelul meu, Andrei a acceptat]** La „Programează discuția”, callerul alege closerul, apoi se deschide calendarul cu orele libere ale acelui closer. **[Andrei]** Atribuirea automată la closerul liber la ora aleasă (ca la EasyGrow) vine mai târziu, când sunt mai mulți closeri. **[Andrei]**
- Callerul poate marca singur un lead „Descalificat” (număr greșit, nu e interesat). „Client” și „Pierdut după discuție” rămân la closer. **[apelul meu, Andrei a acceptat]**
- Fiecare om are contul lui, creat prin invitație pe e-mail de Andrei. Nu există înscriere liberă.
- Când Andrei dezactivează un cont, lead-urile și task-urile omului respectiv se pot muta toate odată la altcineva („callerii vin și pleacă, lead-urile rămân”, idee de pe easygrow.ro). **[apelul meu]**
- Orice schimbare importantă (stare, atribuire, mutare la alt om) intră în **Parcurs**, cu cine și când. Mutarea unui lead la alt om rămâne vizibilă în istoric, ca la EasyGrow.
- Cine vede ce bani: fiecare își vede încasările și comisioanele lui; Andrei le vede pe toate. **[Andrei]**

## 5. Etapele

Fiecare etapă se folosește singură înainte de următoarea. **[apelul meu, Andrei a ales ca prioritate intrarea lead-urilor]**

### Etapa 1: lead-urile (prima versiune)
1. **Conturi și roluri:** conectare, invitații pe e-mail, cele 4 roluri din §4, dezactivarea unui cont.
2. **Intrarea lead-urilor, automat:**
   - din **formularul de contact de pe site** (`site/app/api/contact`, câmpuri: nume, telefon, serviciu, descriere). Formularul continuă să trimită și e-mailul la `contact@`, ca acum. Dacă CRM-ul nu răspunde, omul tot vede „Am primit” și e-mailul tot pleacă: **lead-ul nu se pierde niciodată din cauza CRM-ului**;
   - ~~din cele 3 formulare Tally~~: scos pe 2026-11-09. Tally e pentru clienți, după semnare (unde ajung răspunsurile lor se decide la etapa 2). Până intră singure, lead-urile din reclame se adaugă de mână, cu sursa „Reclamă Meta” sau „Reclamă TikTok”. **[Andrei]**
   - **de unde vine exact:** formularul de pe site păstrează de la început parametrii din link (`utm_source`, `utm_campaign`, `utm_content` etc.; la formularele din reclame, la fel, când le legăm), ca atunci când pornesc reclamele să se vadă din ce reclamă a venit fiecare lead și, mai târziu, câți bani a adus fiecare reclamă. Urmărirea începe doar de când e pusă, de aceea intră din etapa 1. **[apelul meu, ideea „Money Trail” de pe easygrow.ro]**
   - **un om care revine** (același telefon sau e-mail) nu se dublează. Dacă lead-ul e încă deschis, cererea nouă se leagă de el și apare în Parcurs. Dacă e deja client, cererea intră în fișa clientului (posibil proiect nou) și Andrei e anunțat. Dacă era pierdut, lead-ul se redeschide cu istoricul vechi, iar cele 90 de zile se numără de la cererea nouă. Dacă fusese deja șters, e lead nou. **[apelul meu]**
   - **dacă CRM-ul nu răspunde:** e-mailul la `contact@` pleacă oricum și spune clar că lead-ul n-a intrat în CRM, ca Andrei să-l adauge de mână. Nu se construiește o coadă cu reîncercări. **[apelul meu]** Pentru Tally, verifică dacă reîncearcă singur webhook-urile eșuate **[de verificat]**.
   - **fără import:** cererile vechi (de pe `contact@`) nu se aduc automat; Andrei le adaugă de mână dacă e nevoie. **[Andrei]**
3. **Lead adăugat de mână**, cu sursa aleasă (Cold calling, Recomandare, DM Instagram, DM TikTok, Altceva). **[Andrei]**
4. **Notificarea pe e-mail** la fiecare lead nou, către Andrei, cu nume, telefon, serviciu, sursă și link direct la fișă. **[Andrei]**
5. **Lista lead-urilor** (pagina de lucru principală, după modelul paginii Calling din EasyGrow):
   - numărătoarea sus (noi, fără răspuns, callback, programate etc.);
   - căutare după nume, telefon, e-mail; filtre după perioadă (azi, ieri, 7 zile, luna asta, tot), stare, sursă, serviciu, om;
   - scurtături: „callback azi”, „callback întârziat”, „nesunate”, „ale mele”;
   - pe fiecare rând: WhatsApp și telefon dintr-un click, copierea numărului, „îmi iau lead-ul”.
6. **Fișa lead-ului** (după modelul EasyGrow):
   - cardul „Acum / Urmează” (ce e de făcut);
   - butoanele mari: Nu răspunde, A răspuns, Callback (scurtături + zi și oră alese), Programează discuția (se poate doar după „A răspuns”: alegi closerul, apoi una din orele lui libere), Ofertă trimisă, Client, Pierdut (cu motiv), Descalificat. Butoanele mută singure lead-ul în starea potrivită;
   - **orele libere ale closerilor:** fiecare closer își setează în CRM programul săptămânal (zilele, intervalul orar, durata unei discuții); calendarul arată sloturile din program minus discuțiile deja programate. Fără legătură cu Google Calendar sau Calendly în etapa 1. **[apelul meu]**
   - tab-uri: Parcurs, Răspunsuri (din formular), Notițe (text + link de notă vocală), Detalii;
   - de unde a venit (formularul, sursa).
7. **Lead → Client:** când lead-ul devine client, se creează clientul cu contactul, sursa și tot Parcursul. Fișa clientului completă vine în etapa 2; în etapa 1 clientul apare doar într-o listă simplă.
8. **Date de test:** câte un cont de test pentru fiecare rol și lead-uri de test pentru fiecare serviciu și fiecare sursă. **[Andrei]** Datele de test nu se amestecă cu cele reale și se pot folosi pentru capturile publice.

### Etapa 2: clienții și proiectele
- **Fișa clientului = varianta A** din `prototip/crm-clienti.html`. **[Andrei]** În stânga: cardul „Urmează” (următorul task, progresul), contactul, datele proiectului (serviciu, preț, încasat, termen de predare, cine lucrează, de unde a venit). În dreapta, tab-uri: Task-uri, Materiale, Conturi, Livrat, Notițe, Parcurs.
- Un client poate avea **mai multe proiecte** în timp (site acum, automatizare peste trei luni), fiecare cu stadiile și task-urile lui. **[apelul meu]**
- **Stadiile unui proiect:** Discuție → Schiță → Construcție → Revizii → Livrat → Mentenanță. **[apelul meu, din prototip; Andrei nu le-a corectat]**
- **Pagina Clienți:** un tabel cu toți clienții, stadiul și progresul fiecărui proiect; click → fișa. **[apelul meu, Andrei a zis „e bine”]**
- **Task-uri:** titlu, om, termen, gata/negata; întârziatele se văd. Pagina „Task-urile mele” arată fiecăruia task-urile lui, de la toți clienții. **[Andrei]**
- **Materiale:** fișiere încărcate sau link-uri (Drive, Figma, răspunsurile din formular), cu cine le-a adăugat și când.
- **Conturi:** ce serviciu, ce cont, al cui (al clientului / al lui Andrei), unde e parola. Fără parole. Un avertisment vizibil spune asta.
- **Livrat:** ce i s-a trimis clientului, cu starea (trimis, aprobat, de refăcut).

### Etapa 3: restul
- **Încasări și comisioane pentru fiecare cont:** încasările pe proiect (avans, rest), comisionul fiecărui om. Procentele se setează de Admin pe serviciu și pe rol (exemplul lui Andrei: 30% la site, 40% la automatizare), stabilite mai târziu. **[Andrei]** Comisionul se calculează din banii încasați efectiv, nu din prețul promis. **[apelul meu]** Comisioanele pentru calleri/closeri: **[apelul meu, ghicit, de confirmat cu Andrei în etapa 3]**.
- **Dashboard și KPI:** pâlnia (noi → răspuns → programate → clienți), „Următoarele de sunat”, timpul până la primul apel („speed to lead”), pe perioadă și pe om.
- **Programări legate de calendarul extern** (Google Calendar sau Calendly, se alege atunci) și atribuirea automată la closerul liber.
- **Lead-uri din reclamele Meta și TikTok** (formulare de tip Typeform), intrate singure. Sursele „Reclamă Meta” / „Reclamă TikTok” există deja din etapa 1. Poate veni mai devreme, când pornesc reclamele.
- **Idei de pe easygrow.ro, de cântărit atunci** **[apelul meu, propuneri]**:
  - **reveniri automate:** lead-urile care au refuzat sau n-au venit la discuție reapar singure în lista de sunat după intervale fixe (EasyGrow: 7, 14, 21, 28, 60 de zile), în limita celor 90 de zile;
  - **plăți în rate** cu scadențe și alertă la întârziere; comisionul scade dacă banii se returnează;
  - **a doua vânzare:** lista clienților al căror proiect s-a terminat (de exemplu, după site, o automatizare sau întreținerea);
  - **banii pe reclamă:** cheltuiala din Meta lângă încasările aduse de fiecare reclamă;
  - **exportul datelor** din Setări.
- **Tema finală** (vezi §6) și spațiul demo pentru capturi.

**Lăsate deoparte** (EasyGrow le are, dar chiar autorul lor nu le folosește): Lista Lost separată (e un filtru pe „Pierdut”), Suport, Resurse video, Leaderboard. Se pot adăuga mai târziu.

## 6. Aspectul

- **Baza: stilul `craftedbyvlad.com`**, simplu, nu cinematic ca site-ul: fundal grafit (`#141417`, `#1c1c20`, `#26262b`), text `#f1f1f3` / `#b4b4bb` / `#8a8a92`, linii fine, etichete tehnice cu majuscule (Chakra Petch), cifre în JetBrains Mono, text în Inter. **[Andrei]**
- **Accentul:** auriul și gradientul logo-ului (`#ffb52e → #f26a21 → #e53222`), folosite rar: elementul activ, butonul principal, progresul. **[Andrei: „culoarea aceeași, ca să păstrăm nuanța”]**
- **Direcția de reglat la final:** mai „iPhone”, premium, cu colțuri rotunjite. Tema exactă se alege în browser, cu variante comparabile, după ce funcționează etapa 1. **[Andrei: „astea vedem după”]** Până atunci se pornește de la `prototip/crm-clienti.html`, cu valorile de culoare și font ținute în variabile, ca tema să se schimbe dintr-un singur loc.
- Gândit pentru laptop (~1440px): tabele late, bara laterală. Tema deschisă: opțională, de decis odată cu tema finală.
- Fără colaj, fără fotografii, fără animații de scroll.

## 7. Ce rămâne la constructor

- Structura tabelelor, numele câmpurilor, cum se fac migrațiile Supabase.
- Cum se leagă formularul de pe site de CRM (endpoint în CRM cu un secret, sau scriere directă), cu condiția din §5.1.2: lead-ul nu se pierde dacă CRM-ul cade.
- ~~Verificarea semnăturii webhook-ului Tally.~~ (Tally scos din intrare)
- Cum arată exact numărătoarea, filtrele și scurtăturile din lista de lead-uri, păstrând ideile din §5.
- Testele (unitare + în browser), după obiceiul din `site/`.

## 8. Pentru serviciul de CRM-uri vândute (mai târziu)

Notat din analiza `easygrow.ro` (2026-11-09), pentru când Andrei face pagina serviciului: EasyGrow nu se vinde ca „CRM personalizat”, ci ca sistem gata făcut, instalat într-o zi, cu un apel. Promisiunea lui e una singură, pe bani: „ce reclamă aduce încasări”. Prețul e ascuns până la apel; înainte de apel e un chestionar de 8 întrebări. Pagina spune clar pentru cine e și pentru cine nu, arată capturi cu date demo și povestea unui lead. Datele stau în UE (Frankfurt), separate pe fiecare cont, cu export. Se copiază ideile, nu textul și nici designul (regula din `CLAUDE.md`).

## 9. Datele și confidențialitatea

- Lead-urile care nu ajung clienți: șterse (sau anonimizate) după **90 de zile** de la intrare. Clienții: păstrați pe durata colaborării plus **un an** după ultimul proiect. Ștergerea e automată sau cel puțin semnalată lui Andrei; mecanismul e la constructor. **[apelul meu, din promisiunea de pe site]**
- Pe pagina de confidențialitate se adaugă Supabase (unde stau datele, regiunea UE) înainte de primul lead real. Textul se scrie cu Andrei.
- **Cold calling-ul** (lead-urile adăugate de mână): oamenii ăștia n-au completat niciun formular, deci regulile sunt altele (de unde e numărul, informarea omului, opoziția). **[de verificat]** cu skill-ul `legal-advisor-ro` înainte ca Andrei să folosească sursa „Cold calling” pe date reale.
- Fără parole în CRM. Cheile (Supabase, Resend, secretul webhook-ului) stau doar în variabilele de mediu din Vercel și în `.env.local`, care nu intră în git.
