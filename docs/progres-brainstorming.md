# Site buildwithac: stadiul discuției de design

Ultima sesiune: 2026-10-22. Suntem încă în faza de **brainstorming**: nu s-a scris încă codul site-ului, doar prototipuri de explorare.

## Ce e site-ul
- Site-ul contului **@buildwithac.ai** (TikTok „Build with AC • AI în română”). Link-ul ajunge în bio la 1000 de urmăritori, dar site-ul se face de acum.
- **Public:**
  - oameni care învață și folosesc AI zilnic;
  - antreprenori care vor să pună AI în firmă.

  Vin de pe TikTok, deci **mai ales de pe telefon**.
- **Miezul site-ului** e o **bibliotecă de ghiduri gratuite**: versiunea completă a tutorialelor scurte de pe TikTok.
  - La click pe un ghid se deschide un panou cu o descriere scurtă, ce găsești în ghid, cuprinsul, durata și nivelul.
  - Ghidurile plătite și serviciile vin mai târziu și se gândesc separat.
- **Sistem de lucru în proiect:** un `CLAUDE.md` cu reguli, plus skill-uri pentru ghid nou, research/idei și reguli. **Nu facem skill pentru servicii**: le facem pe moment, împreună.

## Ce NU se folosește ca referință
- Ghidurile PDF vechi din `C:\Instagram Content Pipeline\ghiduri` și stilul „editorial crem” de acolo. Lui Andrei nu-i mai plac, nici vizual, nici ca structură sau conținut.
- Postările de TikTok tăiate cu roșu din `Exemple/`, adică template-ul vechi cu foc și fum.

## Decis până acum
- **Direcția vizuală:** „cinematic” (întunecat, fotografii de atmosferă, cuvinte-cheie în italic în gradientul logo-ului: auriu, portocaliu, roșu, vișiniu), plus accente de colaj (hârtie, bandă adezivă, scris de mână).
- **Hero:** efectul *Parallax Scrolling* (Osmo, de pe 21st.dev).
  - Titlul `buildwithac` stă **între** straturile imaginii și trece în spatele primului plan la scroll.
  - Tehnic: GSAP ScrollTrigger (yPercent 70 / 55 / 40 / 10) și Lenis.
- **Imaginea hero:** muntele din template, **editat**:
  - omul în picioare e scos;
  - în locul lui e un om pe un scaun de camping cu laptopul, mutat spre stânga;
  - pe ecranul laptopului e **cod** (editor cu rânduri portocalii).

  Montajul e în `prototip/l4-cod.png`.
- **Subtitlul** „AI pe înțelesul tău, în română.” stă **deasupra** titlului, ca să nu-l acopere omul.
- **Footer:** `buildwithac` mic, cu același font ca titlul din hero.
- **Animațiile și structura homepage-ului din prototip:** lui Andrei îi plac toate. Textele, conținutul și imaginile se vor schimba.
  1. Hero parallax.
  2. Cortină cu mesaj personal, în care cuvintele se aprind la scroll.
  3. Ghiduri: secțiune fixată, cu scroll orizontal și panou de detalii la click.
  4. Pentru cine: două drumuri, „Înveți AI” și „Ai o firmă”.
  5. Perete 3D cu clipurile de pe TikTok.
  6. Ghiduri pe e-mail, în stil colaj.
  7. Servicii: carduri care se stivuiesc, cu text de exemplu.
  8. **Contact** (nou, 2026-10-21), înainte de footer. Are două căi: mesaj privat pe Instagram sau e-mail.
  9. Footer.
- **Alegeri finale din comutator** (2026-10-21). Acum sunt implicite în prototip.
  - Titlul: **drept**, modern.
  - Hero: **munte + om pe scaun, cu cod portocaliu pe ecran**.
  - Fundalul secțiunilor: **Aurora (panglici de lumină)**.

  Variantele titlului pe forma muntelui au rămas în comutator, dar sunt respinse.
- **Bara de sus:** Ghiduri · Pentru cine · **Social media** · Servicii · Contact.
  - „Social media” deschide un meniu cu Instagram și TikTok.
  - Link-ul separat „TikTok” a dispărut.
- Textele de pe tot site-ul se schimbă la pasul de conținut.
- **Scopul site-ului** (2026-10-21): omul vine de pe TikTok („ghidul complet e pe site, link în bio”), citește un ghid gratuit și începe să-l urmărească pe Andrei. Încrederea câștigată acum crește șansele să cumpere mai târziu, când apar ghidurile plătite și serviciile.
- **Secțiune nouă: Portofoliu** (2026-10-21). Conținutul propus:
  - **ImobSearch**: un SaaS funcțional, făcut ca proiect. Andrei trimite capturi de ecran.
  - **2–3 automatizări n8n**: tot din capturi.
  - **Site-uri**: n-are încă site-uri pentru clienți. Vrea să plece de la modele de pe 21st.dev, modificate. Propunerea mea: site-uri-concept construite de el și etichetate „Concept”. Așa nu prezintă munca altora drept a lui, iar licența unor componente e oricum neclară. Fiecare concept poate deveni și clip + ghid.
  - Locul pe homepage, propunerea mea: înainte de Servicii.
  - Andrei a acceptat site-urile-concept. Clienții-țintă sunt firme mici: cafenele, saloane, clinici, imobiliare. Conceptele alese:
    - **clinică stomatologică**;
    - **salon**;
    - al treilea: **service auto** sau **salon de tatuaje**, nedecis încă.
  - Cele trei site-uri-concept sunt proiecte separate și le facem după site. Până atunci, portofoliul are carduri „în curând” sau capturi provizorii.

- **Pagina de ghid** (2026-10-21): prototipul e în `prototip/ghid.html`. Are 4 variante în comutatorul de jos; toate pornesc de la același conținut de exemplu, așa că diferă doar ca formă.
  - Elemente comune tuturor variantelor:
    - casete de prompt cu buton „Copiază”;
    - notițe „greșeala mea” în stil colaj;
    - capturi cu bandă adezivă;
    - un final comun: urmărește-mă, e-mail, ghidul următor.
  - Variantele:
    1. *articol cinematic*: cover foto, cuprins lateral sau buton „Cuprins” pe telefon, bară de progres;
    2. *pornește din clip*: clipul de TikTok în primul ecran, plus „Pe scurt” în 3 puncte;
    3. *pași de bifat*: cerc de progres și pași care se deschid pe rând; progresul rămâne salvat în browser;
    4. *ca un story*: carduri care se dau cu degetul, pe tot ecranul telefonului.
  - Andrei preferă **varianta 3, „pași de bifat”** (2026-10-21). Pe baza ei am adăugat 5 combinații:
    - *3a*: pași + clip;
    - *3b*: pași + cover cinematic + bară de progres lipită sus;
    - *3c*: pași pe o linie care se umple;
    - *3d*: un pas pe ecran;
    - *3e*: pași în caiet, cu foi de hârtie și bifă desenată de mână.

    Andrei a ales **3e, „pași în caiet”**, cu foi cu **colțuri rotunjite**. Caietul e acum varianta implicită în `ghid.html`.
  - **PDF-ul ghidului** (2026-10-21). Ghidurile vor fi mult mai lungi, așa că trebuie să le poți lua și în PDF. Andrei vrea să crească pe Instagram, unde n-are încă urmăritori; pe TikTok are. Ideea lui: omul îl urmărește pe Instagram, îi scrie un cuvânt-cheie în privat și primește PDF-ul. Comutatorul „PDF” din `ghid.html` are 4 moduri:
    - Instagram sau e-mail, la alegere;
    - doar prin Instagram (cu fereastra în 3 pași);
    - doar pe e-mail;
    - descărcare directă.

    **Decis (2026-10-21):** ghidul de pe site rămâne **complet și liber**; **PDF-ul se ia doar prin Instagram** (follow + cuvânt-cheie în privat, răspuns automat cu link-ul). E modul implicit în `ghid.html`.
  - **E-mailul = newsletter, fără ritm promis** (Andrei, 2026-10-21: nu promitem „săptămânal”). Două tipuri de e-mail:
    - **ghid nou**: un mesaj scurt la fiecare ghid publicat, cu link spre ghidul de pe site (nu PDF-ul; PDF-ul rămâne pe Instagram);
    - **noutăți AI**: din când în când, când apare ceva care chiar contează.
  - Textele din prototip (secțiunea 6 de pe homepage și cardul din finalul ghidului) spun „îți scriu când apare un ghid nou sau o noutate care contează”.
  - Propunerea mea (neconfirmată): e-mailul „ghid nou” se poate trimite automat la publicare (RSS → serviciul de newsletter); îl verificăm la tehnologie.
  - De verificat la tehnologie: unealta de răspuns automat pe Instagram (ManyChat sau alta) — dacă poate verifica follow-ul, cât costă, și că contul de Instagram trebuie să fie profesional (creator/business).
  - Butonul „Citește ghidul” din panoul de pe homepage duce acum la `ghid.html`.

- **Ghidurile de la lansare** (2026-10-22): **3 ghiduri**, pornite din cele mai bune carusele ale lui Andrei. Caruselul spune *ce*, ghidul de pe site spune *cum* (caruselele promit deja „urmează tutorialul” / „vrei să arăt cum le instalezi?”).
  1. **Animații video cu Claude**: Claude scrie cod GSAP, HyperFrames îl randează în MP4. Merge pe intro-uri, logo-uri, grafice; nu pe oameni reali. Realist: câteva ore de ajustări.
  2. **Site-uri care nu arată „făcute cu AI”**: skill-ul Motion (animații), UI UX Pro Max (culori și fonturi), 21st.dev (componente de pornire).
  3. **Claude conectat la TradingView prin MCP**: scriptul e pe Google Drive-ul lui Andrei, necitit încă. Probabil are nevoie de o notă „nu e sfat financiar”.

  **Ghidul vedetă = ghidul 2** (site-uri care nu arată „făcute cu AI”), confirmat de Andrei 2026-10-22: site-ul însuși e făcut cu uneltele din el.
- **Standardul unui ghid** (2026-10-22, Andrei: „să-l pună în practică și chiar să-l ajute, clar, fără nelămuriri, calitate bună chiar dacă e gratuit”). Detaliile sunt propunerile mele, acceptate de Andrei:
  - la început: de ce ai nevoie (conturi, abonamente cu preț, programe, durată);
  - pași de câte o acțiune, prompturi/comenzi cu „Copiază”;
  - „ce ar trebui să vezi”: captură după fiecare pas important;
  - „dacă nu merge”: erori frecvente (aici intră notițele „greșeala mea”);
  - testat cap-coadă, pe un calculator curat, înainte de publicare;
  - data testării și versiunile („testat pe …, cu Claude Opus 5.5”).

  Standardul intră în `CLAUDE.md` și în skill-ul „ghid nou”.

- **Drumul omului și pagina „toate ghidurile”** (2026-10-22):
  - **Fără link-uri în clipuri** (risc de ban pe TikTok). Singurul drum: clip → bio → site → ghid. De aceea există site-ul: ghidul dorit trebuie găsit ușor, iar apoi și celelalte.
  - Oamenii cer ghidul la o postare anume: **știu din start ce ghid vor**.
  - **Link-ul din bio duce pe homepage**, nu direct la ghiduri. Andrei: „dă un pic de scroll și gata, vreau să se vadă calitatea site-ului de cum intră”.
  - **Pagină separată doar cu ghidurile**: se ajunge la ea din „Ghiduri” (bara de sus) și din finalul fiecărui ghid.
  - **Lupă de căutare** (Andrei a propus-o; eu: de la început, vizibilă sus, caută după titlu, unelte, cuvânt-cheie).
  - **Aranjarea aleasă: B · Colaj** (foi crem cu bandă adezivă, ghidul vedetă lat, cu sticker „ghid nou!”). Andrei: „se potrivește și cu ghidul când apeși pe el” (caietul 3e). E implicită în `prototip/ghiduri.html`; A, C, D rămân în comutator, respinse.
  - În prototip, tot ce urmează e deja inclus și a trecut fără obiecții: lupa sus, scurtături cu cuvintele din clipuri, ghidul exact marcat „ăsta e ghidul din clip ✓”, căutare fără rezultat → „scrie-mi pe Instagram ce ghid cauți”.
  - Propunerile mele (neconfirmate explicit): cel mai nou ghid primul, mare, cu „Nou” (și pe homepage, și pe pagina de ghiduri); cardurile seamănă cu prima slide a caruselului (aceeași imagine și titlu); **cuvântul-cheie al ghidului** scris pe ultima slide („caută SITE pe site”) e același cu cel pentru PDF pe Instagram; fără filtre până la 15–20 de ghiduri.

- **Unelte pentru e-mail și Instagram** (2026-10-22):
  - **Newsletter: Kit**, planul gratuit (până la 10.000 de abonați, formulare, e-mailuri nelimitate). Pe gratuit nu are RSS/automatizări, deci e-mailul „ghid nou” îl trimite Andrei manual (fără ritm promis, deci e ok). Propunerea cu trimiterea automată la publicare cade până la un plan plătit.
  - **PDF pe Instagram: la început Andrei trimite singur link-ul în privat**, cât timp volumul e mic. **ManyChat probabil mai târziu** (din martie 2026: Free = doar 25 contacte active/lună; Essential ~14–17 $/lună pentru 250; Pro ~29–39 $ pentru 2.500; prețuri din recenzii, de verificat la înscriere).
  - Variantă gratuită intermediară, dacă e nevoie: răspunsuri automate la cuvânt-cheie din Meta Business Suite (max. 5 cuvinte, potrivire exactă, întârziere 15 min, fără verificare de follow).
  - Recomandarea mea: PDF-ul nu se condiționează strict de follow (verificarea din ManyChat e raportată ca nesigură în 2026); se cere follow, dar PDF-ul se dă oricum. Neconfirmat de Andrei.

- **Cum se face și se publică un ghid** (2026-10-22): **prin Claude, în proiect, fără panou de administrare.**
  - Corectura lui Andrei: **Claude face tot**: scriptul caruselului de TikTok/Instagram, conținutul ghidului, tot. Apoi Andrei și Claude **corectează, adaugă, modifică împreună**. „De aceea trebuie un skill/fișier `.md` bun.” Skill-ul „ghid nou” acoperă deci **și scriptul caruselului**, nu doar ghidul.
  - Fluxul propus (neconfirmat în detaliu): Claude scrie scriptul + ghidul ca fișier în proiect → lucrează împreună pe el → Claude publică o **previzualizare** (link separat, Vercel) → Andrei verifică pe telefon → „publică” → ghidul apare pe site → Andrei trimite e-mailul „ghid nou” din Kit.
- **Găzduire și conturi** (2026-10-22): Andrei **are conturi pe GitHub și Vercel**. **Domeniul nu e cumpărat încă** (îl va lua; `buildwithac.ai` e numele presupus, de confirmat). Tehnologia propusă rămâne: Next.js + Tailwind + GSAP, pe Vercel, ghidurile ca fișiere în proiect.

- **Puncte mici** (2026-10-22, sesiunea 2):
  - **Handle Instagram: `@buildwithac.ai`** (confirmat de Andrei).
  - **Domeniul:** Andrei se gândește între `buildwithac.ai` și `buildwithac.ro` și îl cumpără el; îmi spune când e luat. Recomandarea mea: `.ai` (identic cu handle-ul de pe Instagram și cu numele contului), eventual și `.ro` cu redirecționare.
  - **Imaginea cu muntele: rămâne montajul nostru** (decizia lui Andrei: e modificată de noi și folosită în România). Am semnalat o dată riscul: modificarea nu anulează drepturile de autor ale fotografiei originale; varianta de rezervă e același montaj pe o poză Unsplash, cu scriptul din `prototip/montaj/`.
  - **Calls ale mele, fără obiecții de la Andrei:** meniu ☰ pe telefon; „în română” pe crem; cel mai nou ghid primul, mare, cu „Nou”; același cuvânt-cheie pe ultima slide, în lupă și pentru PDF; PDF-ul se dă oricui îl cere, follow-ul doar rugat, nu verificat.

- **Skill-ul „ghid nou”: de unde pornește** (2026-10-22, sesiunea 2):
  - **Două situații.**
    1. **Ghid din postarea lui Andrei (acum):** ghidurile se fac doar pentru ce postează.
    2. **Ghiduri separate, mai complexe, gratuite și plătite (mai târziu):** pornesc doar de la idee, poate cu clipuri sau postări de referință. Se discută separat.
  - **Fiecare subiect e ori carusel, ori clip.** Andrei vrea să înceapă să facă clipuri și le testează pe amândouă.
  - **La clip:** scenariul și filmarea le face Andrei, în alt proiect. Aici doar încarcă clipul într-un dosar și îmi spune descrierea; eu fac ghidul după ce spune în video.
  - **La carusel:** eu scriu textul slide-urilor și ghidul. Asta e decizia anterioară, încă neschimbată.
  - **Testarea:** Andrei nu vrea testare cap-coadă la ghidurile gratuite, pentru că ar dura prea mult pentru un singur ghid. Astfel, regula „testat pe un calculator curat” **iese din standardul ghidurilor gratuite**.
    - Ce am hotărât eu, fără să-i cer timp lui Andrei: verific singur ce se poate verifica fără conturile lui (link-uri, prețuri, versiuni actuale, comenzi rulate într-un dosar gol). În ghid scrie „actualizat la [data]”.
    - Testarea riguroasă rămâne pentru produsele plătite.
  - **Tonul ghidurilor** (Andrei: „natural, friendly, dar și sigur, să se înțeleagă exact ce e prezentat”; regulile de mai jos sunt propunerea mea, aprobată):
    - „tu”, ca un prieten care a făcut-o înaintea ta;
    - fraze scurte, fără introduceri goale;
    - afirmații sigure (dacă ceva e nesigur, se spune de ce);
    - orice termen tehnic e explicat la prima apariție;
    - fără exagerări de reclamă: ce face, cât durează, cât costă;
    - butoanele și meniurile cu numele exact de pe ecran;
    - fără semnele de text făcut cu AI.
  - **Notițele „greșeala mea” nu se inventează**: se iau din clip sau îl întreb pe Andrei; altfel devin „Atenție” cu o capcană reală.
  - **Skill-ul „idei”** (aprobat de Andrei 2026-10-22; detaliile sunt propunerile mele):
    - **Când se folosește:** când Andrei nu știe ce să posteze (caut eu) sau când aduce clipuri de la alți creatori, puse în `continut/inspiratie/` (le transcriu și scot ideea).
    - **Unde caut:** noutăți și știri AI, ce postează alți creatori. TikTok și Instagram se pot căuta doar parțial.
    - **Ce primește Andrei:** 5–8 idei, fiecare cu:
      - cârligul;
      - „de ce acum”, cu sursa;
      - formatul (clip sau carusel);
      - ce ar intra în ghid;
      - efortul.
    - **Lista de idei:** ideile rămase stau într-un fișier din proiect; cele postate se marchează, ca să nu se repete.
    - **Ce a mers până acum** (Andrei): un amestec de design interesant (Canva, scris în culorile logo-ului) și informații bune. Bănuiala mea: au mers subiectele în care Claude face ceva concret, vizibil.
    - **Ce se poate copia:** subiectul și ideea, da; textul și designul altcuiva, cuvânt cu cuvânt, nu.
  - **Produse plătite, mai târziu** (le pomenește Andrei, se discută separat):
    - ghiduri pe capitole, mai complexe, care ating mai multe subiecte;
    - kit-uri de editat cu Claude;
    - pachete de prompturi;
    - kit-uri cu skill-uri.

## De decis data viitoare
**2026-10-23: documentul de design e scris** (`docs/superpowers/specs/2026-10-22-site-buildwithac-design.md`) și a trecut prin verificator. Am rezolvat singur 4 din cele 5 întrebări ale lui (marcate „[apelul meu]” în document: ghiduri de exemplu până la primul ghid real, depozit privat, variante de portofoliu înainte de cod, un singur loc mare = cel mai nou ghid). Andrei a răspuns (2026-10-23): **GDPR** = pagină de confidențialitate de la început, persoană fizică acum, PFA mai târziu (se modifică după); **Portofoliu intră în bara de sus**; **domeniul cumpărat: `buildwithac.ro`** (nu .ai: „nu e o platformă de AI”). **E-mail: iCloud+** (Andrei adaugă domeniul în iCloud; aliasuri `contact@buildwithac.ro` + unul pentru newsletter, propus `andrei@`; DNS pe Cloudflare, îl ghidez la implementare). Toate trecute în document. **Andrei a aprobat documentul (2026-10-23; domeniul e de la ROTLD).** Planul e împărțit în 3: **Plan 1 = site-ul**, scris în `docs/superpowers/plans/2026-10-23-plan-1-site.md` (14 taskuri, 0–13); Plan 2 = CLAUDE.md + skill-uri + PDF; Plan 3 = DNS/iCloud/Kit/domeniu + primul ghid + lansare. **Execuție Plan 1 (2026-10-23, direct în sesiune):** taskurile 0–8 și 10–12 sunt gata, plus pașii 1–3 din 13, pe ramura git `plan-1-site`. Registrul cu toate deciziile mele („Ruling”) e în `.superpowers/sdd/2026-10-23-plan-1-site/progress.md`. 82 de teste e2e și 32 unitare trec.
**Așteaptă de la Andrei:**
1. ~~Varianta de Portofoliu~~: **FĂCUTĂ (2026-10-23, commit 607a788)**: `site/components/home/Portofoliu.tsx`, varianta A · Colaj; pe desktop un rând pe tip (ImobSearch lat, 2 automatizări, 3 concepte). Pozele sunt provizorii (Unsplash, în `site/public/portofoliu/`) până trimite Andrei capturile. Task 9 închis; 87 de teste e2e trec.
2. ~~Repo GitHub~~: **FĂCUT (2026-10-23)**: `https://github.com/ciocanaruandre-sketch/buildwithac.git`; ramurile `main` (cu site-ul, după merge) și `previzualizare`.
3. ~~Fonturile~~: **rămân toate 6** (Andrei, 2026-10-23); Lighthouse mobil ~77.
**Verificarea finală (2026-10-23):** făcută de un subagent; 1 critic + 3 importante reparate (build de producție fără ghiduri, stilurile formularului pe paginile de ghid, protecția abonării, teste pe build-ul de producție: `npm run e2e:prod`). Lucrurile mici amânate sunt în registru (`Final: minor (deferred)`). Ramura `plan-1-site` e unită în `main`.
**Vercel (2026-10-23):** importat, verificat pe telefon de Andrei: arată bine, dar se mișcă puțin mai greu (mai ales peretele de clipuri la scroll rapid și încărcarea la scroll rapid în jos). Cloudflare nu ajută la asta.
**Fluiditate (2026-10-23):** ramura `fluiditate`, commit 908c923, urcată pe `fluiditate` și pe `previzualizare` (nu e încă în `main`). Ce s-a schimbat:
- Aurora se animă doar lângă ecran (IntersectionObserver în `Aurora.tsx`, `data-activ`);
- fără `mix-blend-mode` pe panglici;
- peretele de clipuri are 860px lățime pe telefon, iar `sizes` a fost ajustat;
- fără `will-change` pe coloane.

Memoria straturilor a scăzut de la ~1200 la ~650 MB. Teste: lint 0, tsc 0, vitest 38/38, e2e 92/92 (+ `tests/e2e/fluiditate.spec.ts`).
**2026-10-25:** Andrei a testat `previzualizare` pe telefon: „se mișcă mai bine” → `fluiditate` unită în `main` (fast-forward, 69c1ec2) și urcată. Previzualizările Vercel cer conectare (Deployment Protection, implicit); Andrei s-a conectat pe telefon, protecția rămâne. Domeniu: nameserverele Cloudflare sunt active la ROTLD; domeniul e adăugat în Vercel, dar „Invalid Configuration” până se pun în Cloudflare înregistrările A `@` + CNAME `www` (DNS only) cu valorile din Vercel. **Rezolvat (2026-10-25):** `https://buildwithac.ro` merge (HTTPS valid). `www` lăsat deoparte, decizia lui Andrei (Vercel a dat „a domain cannot redirect itself”; probabil s-a scris domeniul principal în loc de `www.buildwithac.ro`). iCloud: domeniul e adăugat, toate înregistrările (MX, apple-domain, SPF, DKIM) sunt în DNS, verificarea Apple e „pending”; DMARC (`_dmarc` TXT `v=DMARC1; p=none;`) recomandat, încă nepus.

**Mail (2026-10-25):** iCloud verificat; Andrei a făcut aliasurile `contact@buildwithac.ro` (contactul de pe site, deja în `site/lib/config.ts`) și **`ac@buildwithac.ro`** (expeditorul newsletterului, în loc de `andrei@`). iCloud a sincronizat singur mai multe înregistrări în Cloudflare. DMARC încă lipsește (opțional: `_dmarc` TXT `v=DMARC1; p=none;`). Plan 1 e închis (inclusiv Task 13 pasul 7, feedbackul de pe telefon).

**DE AICI CONTINUĂM.** **Banda și chatul de pe homepage (2026-11-08).** Andrei a dat ca inspirație `craftedbyvlad.com` (portofoliul altui român, în engleză, același public: firme mici). Analiza: luăm ideile, nu aspectul (fonturile lui tehnice, metalul, particulele și galeria 3D nu se potrivesc). Andrei a ales să le prototipăm pe două: **(1) o bandă care curge** și **(3) întrebările frecvente ca un chat**. Prototipul: `prototip/banda-chat.html` (comutator jos; serverul: `python -m http.server 8765` din `prototip/`). **Ales de Andrei:** banda **C3** (fâșie kraft sub fâșie crem, ruptă, scris de mână Caveat, în sensuri opuse; ca să nu semene cu panglicile lui Vlad), între cortină și ghiduri; chatul **C4** (telefon alb, ca un Instagram luminos, lipit cu bandă adezivă; întrebările sub telefon), între Servicii și Contact, cu titlul „Ce mă întreabă *toată lumea.*”. Banda se grăbește la scroll și își schimbă sensul după direcție. **Textele chatului sunt aprobate** (Andrei, 2026-11-08): întrebarea 2 = „Îmi trebuie cunoștințe tehnice?”; la 3 s-a adăugat consultația; 4 = varianta C (live pe ecran sau ghid doar pentru tine); 5 = varianta A (cu ghidurile premium care vor apărea); 1 și 6 („prețul îl știi înainte să încep”, „1–2 zile”) rămân. **Construit pe ramura `banda-chat`** (`components/home/Banda.tsx`, `Intrebari.tsx`, stilurile în `home.css`, teste în `home.spec.ts`). Față de prototip: banda nu mai stă pe o fâșie neagră, ci e lipită peste îmbinarea cortină/ghiduri și nu ocupă loc în pagină (înălțime 0; altfel scena fixată a ghidurilor se muta). Reparat pe drum: testul „sâmbăta nu oferă ore” de la concepte pica în fiecare weekend (are acum data fixată pe o miercuri). Teste: vitest 133/133, lint și tsc curate, e2e 227 + testul Aurora (pică și pe codul vechi). Testul „un click pe un card nu mută pagina” e instabil sub încărcare și pe codul vechi (trece cu `--workers=2`). **Urmează:** Andrei verifică previzualizarea Vercel pe telefon → la „da”, `e2e:prod` și unirea în `main`. Celelalte idei de la Vlad, neprototipate: „alege-ți afacerea” cu cele 3 concepte (cea mai valoroasă, dar mare), „Site-ul tău, conturile tale”, cei 4 pași ai colaborării, finalul mare pe vișiniu.

*Mai vechi:* **Site-urile-concept pentru portofoliu, în lucru (brainstorming, 2026-11-04).** Scopul lui Andrei: patronul să gândească „vreau și eu un site așa”. **Decis de Andrei:** 3 concepte (clinică stomatologică, frizerie, salon de tatuaje; salonul a ieșit); la apăsarea cardului se deschide o pagină adevărată, cu scroll și animații; se iau trăsături, fără copiere, din Crows Nest, Atelier Eva, Zen Dental și Neoclinique (de la Neoclinique, doar structura românească: pachete, tarife, cazuri, programare). **Propunerile mele, necontrazise:** adrese `buildwithac.ro/concepte/frizerie|clinica|tatuaje`, bandă „Concept” mereu vizibilă, firme inventate, fără recenzii inventate, programarea nu trimite nimic, fiecare concept cu stilul lui, poze Unsplash gratuite.
- **Frizeria e aprobată ca prototip** („facem așa”): `prototip/concept-frizerie-c.html` (poze în `prototip/concept-frizerie/`, comparația de culori în `prototip/concept-culori.html`; vechile A/B/C în `concept-frizerie.html` și `concept-telefon.html`). Firma: Conu' Leonida. Primul ecran C (intri pe hol la scroll), culorile 3 (verde cu piatră), fără secțiunea roșie. Prețurile lui Andrei: tuns 100, barbă 50, tuns și barbă 125, copii 60. Titlurile: am lăsat Bodoni, de confirmat. Nu e încă în `site/` și nu e comis nimic.
- **Clinica e aleasă ca prototip:** `prototip/concept-clinica.html` (poze în `prototip/concept-clinica/`, comparațiile în `concept-clinica-telefon.html` și `concept-clinica-culori.html`). Firma: Clinica Tei. Primul ecran C (arcada care se deschide la scroll), culorile 1 (albastru de noapte cu albastru prăfuit; maroul a ieșit la cererea lui Andrei). Fără cazuri înainte/după: ar fi rezultate medicale inventate. Prețurile sunt orientative.
- **Tatuajele sunt alese ca prototip:** `prototip/concept-tatuaje.html` (comparațiile în `concept-tatuaje-telefon.html` și `concept-tatuaje-rame.html`, poze în `prototip/concept-tatuaje/`). Firma: Casa de Cerneală, artiști inventați (doar prenume). Primul ecran C (pata de cerneală care se întinde la scroll); Lucrările = expoziție, sala 1 (galerie întunecată, rame negre, lumina se aprinde pe fiecare tablou). De făcut la construcție: logo-ul de pe mașina de tatuat din poza principală (l-am propus spre retușare, Andrei n-a răspuns), prețurile sunt exemple neverificate.
- **Documentul de design e aprobat de Andrei** (`docs/superpowers/specs/2026-11-04-site-uri-concept-design.md`), iar planul e scris (`docs/superpowers/plans/2026-11-04-plan-5-concepte.md`), de citit și ales modul de execuție. Cardurile din portofoliu arată poza completă, de după scroll (`prototip/concept-carduri.html`). Sursele pozelor: `continut/concepte/surse-poze.md`. Nimic nu e comis încă.
- **LIVE (2026-11-04, `main` 808542f):** Andrei a verificat pe telefon („e bine”), iar ramura `concepte` e unită. Pe `buildwithac.ro`: cele 3 pagini dau 200 cu `noindex`, `/concepte/altceva` dă 404, slash-ul final redirecționează, sitemap-ul nu le conține, cardurile duc la ele. **Urmează:** lansarea (Partea C). Ramura `concepte` n-a fost ștearsă, nici local, nici pe GitHub.
- **Codul e pe ramura `concepte` (2026-11-04, Plan 5):** paginile statice sunt în `site/public/concepte/<slug>/`, cu fonturile și GSAP în `_comun/`, iar cardurile din portofoliu duc la ele. **Urmează:** Andrei verifică pe telefon, pe previzualizarea Vercel, fluiditatea animațiilor; dacă pata sau arcada sacadează, se simplifică efectul. La „da”-ul lui, unirea în `main`. Lansarea (Partea C) rămâne după.
- **Verificarea finală a ramurii `concepte` (2026-11-04):** fără probleme critice; reparate: linkurile spre `/#portofoliu` și `/#formular` (`ramaiLaAncora` în `LenisProvider.tsx`), fâșia de sub scena clinicii (`100lvh`, de confirmat pe telefon), orele de sâmbătă, închiderea ferestrei la atingerea marginii, focusul la frizerie, poza întreagă la mișcare redusă. **Amânate (Andrei, 2026-11-04: le lăsăm momentan):** arcada clinicii la rotire, butonul de trimitere sub ecran pe telefoane mici, focusul în fereastra de programare, eticheta `h1` la frizerie, „Liberă din decembrie” (se învechește), GSAP în `head`, două teste lipsă. Antetul `noindex` pe Vercel se verifică după unire, cu `curl`.

**2026-11-04 (după-amiaza): ghidul TRADING e publicat în `main`, cu PDF.** Andrei a dat ghidul vechi (`PDF ghiduri/Ghid_Claude_Trading_TradingView.pdf`), fără script. Metoda veche (proiectul comunitar, portul 9222) poate încălca termenii TradingView, iar din 2026-09-16 există **MCP oficial**, deci Andrei a ales: ghid nou, pe MCP-ul oficial, cere plan Essential. Andrei n-are cont TradingView, deci conectorul n-a fost testat; ce n-am putut verifica e în `continut/ghiduri/claude-tradingview-mcp/note.md`. 15 pași, 4 capturi proprii, fără `<GresealaMea>`. Slug-ul și cuvântul TRADING vin de la exemplu, care a devenit ghidul adevărat. PDF: `https://buildwithac.ro/pdf/claude-tradingview-mcp-e39f4e1b2870.pdf`. Teste la unire: verifica 0 erori, vitest 133/133, lint și tsc curate, e2e 140 + testul Aurora (pică și pe codul vechi), `e2e:prod` 10/10. Fără e-mail în Kit (nu sunt abonați). Andrei nu vrea textul clipului; dacă face clipul, se adaugă `clip:` în ghid și, la cerere, intră pe peretele de clipuri. **Urmează:** lansarea (Partea C): clipurile adevărate pe peretele de clipuri, trecerea finală pe telefon.

*Stadiul la 2026-11-04 (prânz):* **ghidul ANIMATII e publicat în `main` (a89ec41), împreună cu regula „ceri lui Claude” la SITE și HARVEY.** Andrei a verificat pe telefon: „e bine, îmi place”. Teste la unire: verifica 0 erori, vitest 132/132, lint și tsc curate, e2e 140 trecute + testul Aurora (desktop), care pică și pe codul vechi, `e2e:prod` 10/10. Ramura ștearsă. Fără e-mail în Kit: **cât nu sunt abonați, pasul cu e-mailul se sare** (decizia lui Andrei, scrisă în `publicare.md`). Serverul vechi de pe portul 3000 nu mai merge. **Urmează:** ghidul TRADING cu `ghid-nou` (scriptul pe Google Drive-ul lui Andrei; `claude-tradingview-mcp` e acum doar exemplu de test), apoi lansarea (Partea C).

*Stadiul la 2026-11-03 (noaptea):* ghidul ANIMATII e pe ramura `ghid/animatii-video-cu-claude`, cu push și PDF, NEunit în `main`.** Din caruselul TikTok al lui Andrei (4 slide-uri: cârligul, Claude Opus 5.5, GSAP, HyperFrames; capturile în `continut/clipuri/`). Titlul: „Animații video din câteva cuvinte, cu Claude Opus 5.5” (propus de Claude, Andrei: „e bun”). 10 pași, fără capturi (decizia lui Andrei), fără „greșeala mea” (n-are una; 4 × `<Atentie>`). Coperta din poza primei slide (`continut/clipuri/dd825….jpg`, tăiată 1080×760). PDF: `https://buildwithac.ro/pdf/animatii-video-cu-claude-d72417c513cb.pdf`, `pdf: true`. Previzualizarea (ramura): `https://buildwithac-git-ghid-animatii-586bdd-andrei-ciocanarus-projects.vercel.app/ghiduri/animatii-video-cu-claude`. **Regula nouă a lui Andrei** (scrisă în `standard.md`): pașii sunt mesaje către Claude în cuvinte; comanda de terminal e doar variantă. Testele actualizate pentru noua ordine (ANIMATII primul). **Regula aplicată și la SITE și HARVEY** (Andrei: „da”, pe aceeași ramură, pentru că ANIMATII trimite la pașii din SITE): SITE are paragraful „Nu trebuie să ții minte comenzi” în introducere, pasul „Instalezi Node.js” a devenit pasul 5 „Îi ceri lui Claude să pregătească restul” (Node.js + Python, după conectare; numerotarea de la pasul 6 încolo neschimbată, capturile pas-13/pas-18 la locul lor), iar publicarea pe Vercel (pașii 18–19) se cere lui Claude, cu `npx vercel --yes` / `--prod` ca variantă; `npx motion-ai` și `npx vercel login` rămân comenzi (instalare interactivă, conectare la cont). HARVEY: paragraful în introducere; `harvey train/signals/discover` cerute în cuvinte (Atenția cu OpenStreetMap: „dacă nu spui «prin Scavio»”), panoul pornit de Claude în fundal, cu comanda ca variantă. ANIMATII trimite acum la „pașii 1–4” din SITE. `actualizat` 2026-11-03 la ambele; PDF-urile refăcute, cu aceleași link-uri. verifica 0 erori, vitest 132/132, lint curat. **Urmează (sesiunea următoare):** Andrei verifică previzualizarea pe telefon (ANIMATII + pașii schimbați din SITE și HARVEY) → „Publică” (`publicare.md` pas 7: verificarea completă + e2e, unirea în `main`, e-mailul din `email.md` doar pentru ANIMATII, ideea în „Postate”) → ghidul TRADING (scriptul pe Google Drive-ul lui Andrei). **De rezolvat:** pe portul 3000 rulează un server de dev vechi (din 2026-11-03, 14:49) care dă „Jest worker encountered 2 child process exceptions”; Playwright îl refolosește, deci testele e2e pică până îl oprește Andrei (mie mi s-a refuzat oprirea).

**2026-11-03 (seara): formularul de contact de pe site e LIVE** (Plan 4, `docs/superpowers/plans/2026-11-03-plan-4-contact.md`, spec `docs/superpowers/specs/2026-11-03-contact-site-design.md`; unit în `main` cb7f651, fast-forward). **Andrei l-a verificat pe telefon: merge.** Cardul „Vrei să *colaborăm?*” sub Instagram/E-mail în secțiunea Contact; pastilele Site / Automatizări / Sesiune 1 la 1 sau ghid personalizat / Altceva; cererile pleacă prin **Resend** pe `contact@buildwithac.ro` (iCloud), expeditor `formular@buildwithac.ro`. Pe cardurile de servicii, „în curând” a devenit link-ul **„Hai să vorbim →”** (varianta B, aleasă de Andrei), care duce la `#formular` și alege pastila. Nota „răspund de obicei în 1–2 zile” a fost scoasă (decizia lui Andrei); „te contactez în 1–2 zile” apare doar după trimitere. Confidențialitatea: Resend (SUA, DPF + SCC, copie 30 de zile), Apple iCloud, 90 de zile pentru cererile fără colaborare; rezumatul de sus pomenește și formularul.
- **Resend:** cont separat **buildwithacai** (Gmail `buildwithacai@gmail.com`, decizia lui Andrei, nu echipă nouă în contul vechi). Domeniul `buildwithac.ro` Verified (eu-west-1, Manual setup); în Cloudflare (DNS only): TXT `resend._domainkey`, CNAME `rsend` → `rsend-euw1.forge.rmta.net`, CNAME `send` → `send.forge.rmta.net`; fără înregistrarea de primire (MX-ul iCloud neatins). `RESEND_API_KEY` în Vercel (Sensitive, Production + Preview). Proba din previzualizare a ajuns în iCloud ✓.
- **Vercel Firewall:** pe Hobby se poate **o singură regulă Rate Limit pe proiect**, deci „Limita abonare” a devenit **„Limita formulare”**: Request Path **starts with `/api/`** AND Method equals POST → Fixed Window 60 s, **5 cereri**, IP → 429. Contorul e comun pentru abonare și contact (în spec erau 3/min doar la contact). Verificat cu curl: 5 × 404, apoi 2 × 429; abonarea 429 în același minut; paginile 200. Orice `/api/` nou intră automat sub limită.
- Teste la unire: vitest 131/131, verifica, lint, tsc curate; e2e 139 trecute + testul Aurora (desktop) care pică și pe codul vechi; `e2e:prod` 10/10. Reparat la revizuirea finală: `AbortSignal.timeout` lipsește pe Safari ≤ 15 (formularul și abonarea dădeau mereu eroare pe iPhone-uri vechi) → `lib/limita-timp.ts`.
- **Mici, amânate:** câmpul-capcană `website` poate fi completat de un manager de parole (cererea se pierde în tăcere); `\s` din regula telefonului acceptă tab și rând nou; `aria-invalid` stă pe `role="group"`, iar greșeala de la pastile n-are `aria-describedby`; codul de server (`lib/contact.ts`) ajunge și în pachetul din browser (fără secrete).
- **Urmează:** ghidurile ANIMATII și TRADING (cu `ghid-nou`, din postările lui Andrei), apoi lansarea (Partea C). Captura `Exemple/Screenshot 2026-11-02 114629.png` (referința copertei Tally) a fost ștearsă (2026-11-03, cu acordul lui Andrei).

**2026-11-03 (dimineața):** confidențialitatea cu formularele Tally e **live** (verificată cu `legal-advisor-ro`, unită în `main` 00e8308, ramura ștearsă). Notificările Tally rămân pe Gmail-ul personal (decizia lui Andrei; schimbarea destinatarului cere Tally Pro). Andrei trimite link-urile `tally.so/r/…` direct clienților; răspunsurile le vede în Tally → **Submissions** (și fișierele) și pe Gmail. **Serviciile de pe homepage sunt live** (2970ace): „Site făcut *de la zero*”, „Automatizări *pentru firma ta*”, „Sesiune 1 la 1 / *sau ghid personalizat*”, cu textele alese de Andrei (variantele în `prototip/servicii.html`); fără preț sau cost pe site (Andrei stabilește ajutorul și prețul cu fiecare client, la telefon). „În curând” rămâne până la formularul de contact. **Ghid Q17 rămâne cum e** (decizia lui Andrei, nu reveni). ~~Sesiunea următoare începe cu~~ (făcut seara, vezi mai sus): documentul de design pentru contactul de pe site (din deciziile de mai jos, „Contactul de pe site, decis pe 2026-11-01”; anunță-i lui Andrei că e pas greu: fișier lung + verificare cu subagent) → aprobarea lui → plan → cod (Resend, pașii unul câte unul). La construcție, „în curând” de pe cardurile de servicii devine legătura spre formular. Pe serverul de dev, testul cu ghid inexistent scrie în jurnal `InvariantError … /ghiduri/[slug] did not produce a static shell` (testele trec; de investigat separat).

Stadiul la 2026-11-01: **Plan 3 Partea A în `main`**, abonarea prin Kit merge, Firewall-ul și e-mailul de confirmare sunt gata. **Formularele: contactul de pe site e lămurit; cele 3 formulare Tally sunt publicate (2026-11-02)** (vezi „RELUĂM DE AICI”). Ghidurile ANIMATII și TRADING rămân la final, apoi lansarea (decizia lui Andrei).
- **Formularele: brainstorming în curs** (`superpowers:brainstorming`, început pe 2026-10-31; nimic construit, nicio specificație scrisă încă).
  - **RELUĂM DE AICI (2026-11-01):** formularele Tally pentru clienți. **2026-11-02:** Andrei a sărit peste întrebări (nu are încă niciun client; „clientul luat” era ipotetic). Claude a scris textele celor 3 formulare în `continut/formulare/tally.md`; **Andrei le-a aprobat** („întrebările sunt bune”). Previzualizarea: `prototip/formulare.html`. **Coperta: aurora fără text** (`continut/formulare/coperta-tally.png`, 2400×700, făcută din `coperta.html`), logoul mic pe marginea de jos a copertei, titlu + descriere de 3 paragrafe pe serviciu (referința: `Exemple/Screenshot 2026-11-02 114629.png`). **Construite în Tally pe 2026-11-02** (Claude prin Chrome, în contul lui Andrei; **publicate pe 2026-11-02** cu „da”-ul lui Andrei, pe planul gratuit; link-urile pentru clienți: `tally.so/r/Qo1xzg` (Site), `tally.so/r/M1X8qg` (Automatizări), `tally.so/r/jeZGX9` (Ghid); editare: Site `tally.so/forms/Qo1xzg`, Automatizări `tally.so/forms/M1X8qg`, Ghid `tally.so/forms/jeZGX9` (ultimele două duplicate din Site, deci același design: temă proprie cu culorile brandului, Inter, aurora, logoul). Corecturile lui Andrei aplicate: „fac”, nu „facem” (e singur); telefon obligatoriu; textele de ajutor și întrebările reformulate (vezi `tally.md`); fără „În 1–3 luni” la termen; la Automatizări „Cât timp îți ia aproximativ pe săptămână?” și „Anumite aplicații necesită abonament lunar, ești ok cu acest lucru?”, fără „Prefer doar unelte gratuite”. Ghidul: aprobat așa cum e. **Confidențialitatea, 2026-11-02:** pe ramura `confidentialitate-tally` (necomisă încă), formularele Tally sunt adăugate pe `/confidentialitate`: ce date, temeiul art. 6(1)(b), Tally (Belgia, date în UE), SendGrid (SUA, notificările pe e-mail), Google (Gmail). Păstrarea: cât durează colaborarea + 1 an după ultimul proiect; 90 de zile dacă nu se ajunge la colaborare; ștergere de mână, lunar (decis de Andrei). Notificarea pe e-mail e pornită în toate 3 formularele (ajunge pe Gmail-ul lui Andrei). Contactul de pe site (Resend) intră pe pagină odată cu codul formularului, nu înainte. **Urmează:** → variantele de la Ghid, întrebarea „Cum ai vrea să te ajut la început?”, aliniate cu pachetul → documentul de design pentru contactul de pe site → plan → cod. Cererile de contact se păstrează **90 de zile** (decis).
  - **Contactul de pe site, decis pe 2026-11-01** (prototipul: `prototip/contact.html`, varianta A, servit cu `python -m http.server 8765` din `prototip/`):
    - **Locul: varianta A**, un card lat sub cele două carduri (Instagram, E-mail), care rămân neschimbate.
    - **Textele (ale lui Andrei):** titlul „Vrei să *colaborăm?*” (cuvântul în serif cu gradient); sub el „Lasă-mi numele și telefonul, iar eu revin în cel mai scurt timp posibil.”; câmpurile „Numele tău”, „Telefon”, „Serviciu dorit” (pastile: Site / Automatizări / Ghid personalizat / Altceva), „Descriere (opțional)” (la „Altceva”, textul ajutător devine „Spune-mi ce ai în minte.”). Rămâne „1–2 zile” în nota scrisă de mână de sub secțiune și în mesajul de după trimitere („Am primit. Mersi!” + „te contactez în 1–2 zile”).
    - **Telefonul:** orice număr, inclusiv din străinătate (români plecați); verificare doar de format (cifre, `+`, spații, cratime, min. 7 cifre).
    - **Trimiterea: Resend**, într-o **echipă nouă „buildwithac”** în contul Resend pe care Andrei îl are deja (cheile și limitele separate de celălalt proiect, domeniul celuilalt proiect rămâne neatins). Plan gratuit: 3.000/lună, 100/zi, 3 domenii (verificat pe resend.com pe 2026-11-01). Pașii, unul câte unul, la construcție.
    - **Propuneri ale lui Claude, nerespinse:** obligatorii nume + telefon + serviciu; capcana anti-roboți + regulă în Firewall ca la `/api/abonare`; cererile nu se salvează pe site, ajung doar în e-mail.
    - **Juridic (skill-ul `legal-advisor-ro`, 2026-11-01):** fără căsuță „accept” (temeiul e art. 6(1)(b), pași precontractuali la cererea persoanei; ajunge fraza de informare lângă buton cu link spre confidențialitate). **Fără banner de cookie-uri**: Vercel Analytics e fără cookie-uri, bifele din localStorage sunt cerute de utilizator. Pe pagina de confidențialitate se adaugă: numele, telefonul, cererea, temeiul, termenul de păstrare, **Resend** la „Cine mai vede datele” (de verificat cât păstrează Resend copiile și baza transferului în SUA).
    - **Termenul de păstrare:** Andrei a zis întâi 30 de zile, apoi a întrebat dacă nu e prea scurt pentru follow-up. Recomandarea lui Claude: **90 de zile** pentru cererile care nu ajung la o colaborare; follow-up doar despre cererea omului, ștergere imediată dacă zice „nu mai vreau”, fără newsletter sau promoții pe telefonul lui. Ștergerea de mână, lunar, odată cu neconfirmații din Kit. **Confirmat de Andrei: 90 de zile.**
  - **Serviciile** (decizia lui Andrei): **Site**, **Automatizări**, **Ghiduri personalizate** (în loc de coaching: PDF personalizat + tutorialele necesare + îndrumare de la Andrei, după cum vrea clientul să folosească AI în firmă). Am spus riscul: trebuie scris clar ce primește clientul, să nu pară suport nelimitat.
  - **1. Contactul de pe site** (în site, în stilul lui; decis): nume, telefon, serviciul (Site / Automatizări / Ghiduri personalizate / **Altceva**), descriere opțională (la „Altceva” îndemnul „spune-mi ce ai în minte”). Cererile ajung pe **e-mail la `contact@buildwithac.ro`** (decizia lui Andrei). Propunerea lui Claude, neconfirmată: trimiterea prin **Resend** (gratuit, 3.000/lună; cont + DNS în Cloudflare, pas cu pas). Anti-spam: capcana ca la abonare + regulă în Firewall ca la `/api/abonare`. Confidențialitate: date noi (nume, telefon) pe pagina de confidențialitate; cât se păstrează, de hotărât.
  - **2. Formularele pentru client: 3 formulare în Tally**, unul pe serviciu; Andrei trimite link-ul potrivit după ce clientul a zis „da” (pentru orice client viitor, nu pentru unul anume). **Cu brandul lui**: logo + copertă sus, culorile lui (decizia lui Andrei). Verificat la tally.so: gratuit = logo, copertă, culori proprii, fonturi Google (Unbounded/Inter), logică condițională, fișiere de max. 10 MB, e-mail la fiecare răspuns, webhooks, date în Europa, româna e suportată (mesajele de sistem). Pro (20 €/lună) = fără „Made with Tally”, CSS propriu, domeniu propriu.
  - **Referința lui Andrei:** `https://tally.so/r/Ek2Jar` (Cherrish, chestionar de agenție social media, 6 secțiuni, prea lung). **Partea comună** propusă pentru toate 3, extrasă de acolo: afacerea cu cuvintele lui (de când, cum a început); ce vinde și ce contează cel mai mult; de ce îl aleg clienții; „peste 6 luni, ce 3 rezultate concrete?”; de unde vin clienții acum; cum NU vrea să arate/să se simtă; 3–5 site-uri/conturi care îi plac; ce nu vrea să apară; date/termene; cum preferă să vorbiți (WhatsApp / e-mail / telefon); cât de implicat vrea să fie (aprobă tot / direcția / mână liberă). Lăsat deoparte: partea de conținut social media, clasamentul cu 13 opțiuni, scalele 0–10.
  - **Întrebări specifice propuse (ghiciri ale lui Claude, necorectate de Andrei):** *Site*: are site/domeniu/logo, site-uri care îi plac / ce nu vrea, ce pagini, termen, încărcare logo și poze. *Automatizări*: ce treabă repetitivă îi ia cel mai mult timp, ce aplicații folosește, câte ore pe săptămână pierde. *Ghiduri personalizate*: unde e cu AI-ul (ce unelte, abonament plătit?); 2–3 treburi pe care vrea să le facă AI-ul, cu un exemplu concret (cea mai importantă); cine îl folosește și cât de pricepuți sunt; telefon sau calculator și ce aplicații are (WhatsApp Business, Google, Excel); date sensibile de clienți (pacienți, CNP-uri, contracte: ce să NU pună în AI); cum învață (citit / video / live); cât de des vrea îndrumare la început; încărcare de fișiere pentru exemple.
  - **Pașii rămași:** ~~locul contactului~~ (făcut) → formularele Tally → playback pentru ce a rămas → documentul de design în `docs/superpowers/specs/` + verificarea cu subagent → aprobarea lui Andrei → plan. Formularele Tally le face Andrei în contul lui (Claude dă textele și pașii) sau prin browser, de hotărât.
- **Făcut pe 2026-10-31:**
  - **Vercel Firewall**: regula „Limita abonare” publicată: Request Path equals `/api/abonare` **AND** Method equals `POST` → Rate Limit, Fixed Window 60 s, 5 cereri, cheie IP → 429. Verificat cu 7 × `curl -X POST …/api/abonare -d '{"email":"x"}'`: 5 × 400, apoi 2 × 429; `GET` = 405, nelimitat. Capcană în UI: între condiții Vercel pusese **OR** (limita prindea orice POST de pe site și trecea doar 2); trebuie schimbat în AND.
  - **E-mailul de confirmare mai lung în Kit**: pus de Andrei (textul din sesiunea 2026-10-30; „textul e bun”, fără captură, deci nevăzut de Claude). Rămâne de văzut dacă următoarele confirmări mai ajung în spam.
  - Formularul de abonare arată „Acum nu merge abonarea. Încearcă puțin mai târziu…” la 429 (răspunsul nu are `stare`), deci limita nu cere cod nou.
- **Kit (făcut pe 2026-10-30):** plan **gratuit** (până la 10.000 de abonați; la înscriere Kit pusese proba de 14 zile Creator, Andrei a trecut pe gratuit). Expeditor „Andrei de la buildwithac” `<ac@buildwithac.ro>`, confirmat. Domeniul `buildwithac.ro` verificat: CNAME `ckespa`, `cka._domainkey`, `cka2._domainkey` în Cloudflare (DNS only); DMARC `_dmarc` TXT `v=DMARC1; p=none;` (unul singur, pus de Andrei înainte). Adresa poștală din subsol = adresa lui Kit din Seattle (oferită de Kit; întrebare deschisă, care nu blochează nimic: dacă legea RO cere adresa lui, de verificat cu skill-ul juridic). Formular „Site buildwithac.ro”, **`KIT_FORM_ID` = 10119722**, dubla confirmare pornită, auto-confirm oprit, redirect după confirmare: `https://buildwithac.ro/?abonat=1#email`. În Vercel: `KIT_API_KEY` (Sensitive) și `KIT_FORM_ID`, pe Production și pe toate ramurile de Preview. Proba: abonare de pe telefon ✓, e-mail primit (în spam) ✓, felicitarea după confirmare ✓.
- **Promisiune pe site (confidențialitate):** adresele neconfirmate mai vechi de 30 de zile se șterg **o dată pe lună** (Kit nu le șterge singur). Andrei o face de mână: Kit → Subscribers → filtru neconfirmați. I-am spus să-și pună o amintire lunară.
- **Ce a intrat în `main` pe 2026-10-30** (Partea A + extra): butonul „Se trimite…” și limite de timp la Kit; focusul prins în ☰ și caseta PDF (`lib/capcana-focus.ts`); pista de ghiduri urmărește focusul de tastatură (doar `:focus-visible`); 404 de la prima cerere (`ensureStatic = "navigation"` în `app/ghiduri/[slug]/page.tsx`: cu `partialPrefetching`, slug-urile nelistate primeau învelișul cu 200); robots nu mai ascunde `/pdf/`; PDF-urile scoase din funcții (`outputFileTracingExcludes`); `prebuild` = `verifica --productie` (doar pe Vercel, în producție; „azi” după ora Bucureștiului); `npm run pdf` se oprește la imagini sau capturi lipsă; `~~~` ascuns; `numePdf` exact; testele iau cel mai nou ghid din conținut (8 teste picau după HARVEY); felicitarea „Felicitări, te-ai abonat!” în secțiunea de newsletter la `?abonat=1`; fraza despre cele 30 de zile pe pagina de confidențialitate. Ramurile vechi (`fluiditate`, `plan-1-site`, `previzualizare`, `plan-3*`) sunt șterse; există doar `main`.
- **Rămase mici (amânate din revizuirea finală):** `PanouGhid` încă are vechea capcană de focus (în Safari focusul poate ieși); limitele de timp server (8 s + 8 s) vs. buton (20 s) se pot încrucișa; mesajul pentru imagini eșuate arată `/_next/image?url=…`; paza n-are test cu un ghid stricat (și `shell: true` cu listă dă avertismentul DEP0190); comentariul de la `ensureStatic` ar trebui să spună că un `headers()`/`cookies()` viitor în layout sau în pagina de ghid strică build-ul de producție; link-urile din subsolul e-mailurilor Kit sunt în engleză (de tradus la primul newsletter).
- **Test roșu, nu de la Plan 3:** `tests/e2e/fluiditate.spec.ts` „Aurora se animă doar în secțiunile de lângă ecran” (desktop) pică și pe codul vechi din `main`; de investigat separat. Dacă serverul de dev dă „next/font/google queries have exactly one entry”: `rm -rf site/.next site/.next-demo`.
- **Capturile din `Exemple/`** făcute pe 2026-10-30 și 2026-10-31 (`Screenshot 2026-10-30 1304…1402.png`, ecranele Kit și Gmail; `Screenshot 2026-10-31 110754.png` și `112522.png`, regula din Firewall) nu sunt în git; de șters cu acordul lui Andrei.
- **După formulare:** ghidurile ANIMATII și TRADING (cu `ghid-nou`, din postările lui Andrei), apoi Partea C (lansarea): clipurile adevărate pe peretele de clipuri, primul newsletter din Kit, trecerea finală pe telefon.

*Stadiul la 2026-10-29:* **două ghiduri live** (SITE și HARVEY).
- **Al doilea ghid e PUBLICAT (2026-10-29):** `https://buildwithac.ro/ghiduri/harvey-agent-clienti` (cuvânt HARVEY, 18 pași, din clipul TikTok `7702113310866476310`). PDF (12 pagini): `https://buildwithac.ro/pdf/harvey-agent-clienti-ef000b11d20a.pdf`. Unit în `main` (dd48a15), ramura ștearsă. Decizia lui Andrei, după verificarea juridică (Legea 506/2004 art. 12: e-mailurile comerciale fără acord prealabil sunt interzise și către firme): ghidul acoperă **doar cercetarea** (lista de firme + telefon), trimiterea apare doar ca „Atenție”. Sursa de firme din ghid: Scavio Google Maps (50 de credite gratuite); OpenStreetMap, sursa implicită a lui Harvey, caută doar câteva meserii în engleză. Instalarea lui Harvey n-a fost rulată (permisiunile au blocat codul din afară); pașii sunt verificați din codul sursă. Coperta = cadrul de la 1,5 s din clip, cu marginile estompate. Sursele: `continut/ghiduri/harvey-agent-clienti/note.md`.
- **Peretele de clipuri** are primul clip adevărat (Harvey, primul în listă); celelalte 6 sunt tot cele provizorii din prototip, cu link spre profil.
- HARVEY e acum ghidul mare de pe homepage (cel mai nou).

*Stadiul la 2026-10-28 (după-amiaza):* **primul ghid e live**; **Plan 2 e în `main`** și urcat (fast-forward, d132865). Ramura `plan-2-ghiduri` și dosarele `.superpowers/sdd/` ale Planurilor 1 și 2 sunt șterse (cu acordul lui Andrei).
- Conține: `CLAUDE.md`; skill-urile `ghid-nou` și `idei`; `continut/idei.md`; `npm run verifica`; `npm run pdf`. Teste la unire: vitest 81/81, verifica, lint, tsc curate.
- Revizuirea lui Andrei (2026-10-28): designul PDF-ului îi place. Ghidurile adevărate vor fi **mai lungi** decât exemplul (trecut în `standard.md`). Fără probă pe uscat a skill-ului: îl ajustăm la primul ghid adevărat, dacă e cazul.
- **Primul ghid adevărat e PUBLICAT (2026-10-28):** `https://buildwithac.ro/ghiduri/site-uri-fara-aer-de-ai` (cuvânt SITE, 19 pași, coperta = partea fără text a slide-ului 1). PDF (12 pagini, aprobat de Andrei) pentru Instagram: `https://buildwithac.ro/pdf/site-uri-fara-aer-de-ai-1be406f2a743.pdf`. Andrei a încheiat sesiunea mulțumit de ghid și de PDF; data viitoare începem Plan 3. Unit în `main` (71ba3ff), ramura ștearsă. Verificat live pe telefon: homepage, `/ghiduri?q=SITE` („ăsta e ghidul din clip ✓”), pagina ghidului; exemplele nu apar în producție. Capturi doar la pașii 13 și 18 (decizia lui Andrei: fără capturi din VS Code/terminal, fără site de probă; regula e în `standard.md` și în memorie). Exemplul vechi a devenit `exemplu-test` (cuvânt TEST), pe care rulează testele. Sursele: `continut/ghiduri/site-uri-fara-aer-de-ai/note.md`.
- Lecții trecute în `standard.md`: ghidurile sunt mai lungi decât postarea; capturile 16:9, cu lucrul important în primele două treimi (legenda acoperă ultimul sfert); fără cacofonii („Verifici dacă Claude…”).
- E-mailul „ghid nou” către abonați: amânat până la Kit (Plan 3).
- **Urmează Plan 3** (de scris): Kit (expeditor `ac@buildwithac.ro`, înregistrările Kit în Cloudflare, DMARC), limită de cereri în Vercel Firewall pentru `/api/abonare`, ~~primul ghid adevărat~~ (făcut), următoarele ghiduri (animații video cu Claude; Claude–TradingView), lansarea. `www` rămâne nepus (decizia lui Andrei).
- **Lucruri mici pentru Plan 3** (amânate din Plan 1): 404 cu HTTP 200 la primul acces în producție; timeout la Kit + „Se trimite…” pe buton; focusul prins în caseta PDF și în meniul ☰ (aria-modal); focusul în pista orizontală fixată (de verificat de mână); pagina de confidențialitate să spună cât rămân abonările neconfirmate în Kit.
- **Lucruri mici amânate din Plan 2:** blocuri de cod cu `~~~` neascunse; `npm run pdf` poate aștepta la nesfârșit dacă o imagine a eșuat deja; `\.pdf` din `numePdf`; nimic din afara procesului nu oprește un ghid stricat pe `main` (opțional: `prebuild` cu `verifica` doar în producție); robots exclude `/pdf/`, deci crawlerele nu văd `noindex`; tot `public/**` intră în funcția `[slug]` (PDF-urile cresc pachetul); `npm run pdf --url` cu serverul de dev lasă indicatorul Next în PDF.
- Note tehnice: nu rula `next build` fără `NEXT_DIST_DIR` cât merge `npm run dev` (strică `.next`); dacă `npm run pdf` pică la build cu „next/font/google queries have exactly one entry”, șterge `site/.next-pdf`; transcrierea merge în doi pași (corectați în skill-ul `ghid-nou`) și folosește Parakeet, ~30 s pentru un clip de 30 s.

*Istoric:* Punctele mici și skill-urile sunt discutate (vezi mai sus).
- **Unde:** `docs/superpowers/specs/2026-10-22-site-buildwithac-design.md` (aprobat de Andrei).
- **Ce conține:** tot site-ul, tehnologia, `CLAUDE.md`, skill-urile „ghid nou” și „idei”. Nu există skill separat pentru „reguli”: regulile intră în `CLAUDE.md`.
- **Pașii:** scriu documentul din fișierul ăsta plus prototipuri; apoi îl dă un verificator (subagent); apoi o singură rundă de întrebări pentru Andrei; apoi aprobarea; apoi planul.

1. **Domeniul** (`.ai` sau `.ro`): Andrei îl cumpără și îmi spune. De el depind adresa de e-mail de contact (în prototip: `salut@buildwithac.ai`) și link-urile. Nu blochează documentul de design: domeniul rămâne un parametru.
2. ~~Handle Instagram, meniu telefon, licența muntelui, „în română”, confirmările scurte~~: rezolvate (vezi „Puncte mici” mai sus).
7. Scriptul ghidului de trading (TradingView + MCP) e pe Google Drive-ul lui Andrei: de citit când îl facem.
8. **Ce scrie în `CLAUDE.md` și în skill-uri** — mai ales „ghid nou” (script carusel + ghid complet după standard + flux de publicare). Fișierele se scriu după documentul de design.

După aceea: **documentul de design** → planul → abia apoi codul.

## Unde sunt lucrurile
| Ce | Unde |
|---|---|
| Prototipul homepage (cu comutator jos: imagine hero, titlu, după hero, fundal secțiuni) | `prototip/index.html`: se deschide direct în browser |
| Pagina „toate ghidurile” (comutator: 4 aranjări A–D, 3 sau 15 ghiduri; lupă funcțională) | `prototip/ghiduri.html` |
| Explorările anterioare (3 direcții, 4 animații de scroll, 8 exemple de pe 21st.dev) | `prototip/explorari/` |
| Montajul hero (script + surse) | `prototip/montaj/` |
| Capturile de pe TikTok | `Exemple/` |
| Logo-ul | `C:\Instagram Content Pipeline\buildwithacai\brand\logo-transparent.png` (are fundal crem, nu e transparent) |

### Cum refaci montajul hero
```bash
cd "C:\Portofoliu AC\prototip\montaj"
python -m venv rb
rb/Scripts/python -m pip install "rembg[cpu]" pillow numpy
# decuparea omului (prima rulare descarcă modelul isnet-general-use, ~180 MB):
rb/Scripts/python -I -c "from rembg import remove,new_session;from PIL import Image;im=Image.open('surse/om-scaun.jpg');im.thumbnail((1600,1600));remove(im,session=new_session('isnet-general-use')).save('surse/om-scaun-cut.png')"
# montajul: <dosar surse> <înălțime om px> <centru x> <fișier ieșire> <cald|rece|logo|cod>
rb/Scripts/python -I compose.py surse/ 290 740 ../l4-cod.png cod
```
Fotografia omului: Unsplash `photo-1617729421095-8672a6d645ed`, gratuită.
