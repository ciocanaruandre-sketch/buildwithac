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
1. ~~Varianta de Portofoliu~~: **ALEASĂ A · Colaj (2026-10-23)**: foi crem cu bandă adezivă, ImobSearch mare sus (CSS-ul e în `prototip/index.html`, blocul `/* A · colaj */`, se vede cu `?port=a`). **Următorul pas în sesiunea nouă:** fac `site/components/home/Portofoliu.tsx` (restul Task 9, BASE 22c8225), apoi verificarea finală.
2. Un repo GitHub privat gol, `buildwithac` (Task 13, pasul 4), apoi importul în Vercel cu Root Directory = `site`.
3. Decizia la viteză: Lighthouse mobil ~77/100 (ținta 85), din cauza celor 6 fonturi. Varianta: renunțăm la un font (ex. Anton).
**După asta:** verificarea finală a întregului cod (un subagent), apoi unim ramura în `main` și Andrei verifică totul pe telefon.

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
