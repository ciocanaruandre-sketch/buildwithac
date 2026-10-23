# Site buildwithac: documentul de design

Data: 2026-10-23 (numele fișierului păstrează data aprobată, 2026-10-22).
Sursă: discuțiile din 2026-10-20 → 2026-10-22 (`docs/progres-brainstorming.md`) și prototipurile din `prototip/`.

Notație: **[Andrei]** = decis de Andrei. **[Claude]** = propunerea mea, acceptată de Andrei sau trecută fără obiecții. **[apelul meu]** = decizie luată de mine în document, nediscutată; Andrei o poate schimba.

---

## 1. Ce e și de ce

Site-ul contului **@buildwithac.ai** (TikTok „Build with AC • AI în română”, Instagram `@buildwithac.ai`). Totul e în **română**, cu diacritice.

**Drumul omului [Andrei]:** vede un clip sau un carusel pe TikTok/Instagram → „ghidul complet e pe site, link în bio” → intră pe homepage → găsește ghidul pe care îl voia → îl citește și îl aplică → începe să-l urmărească pe Andrei (Instagram, newsletter). Încrederea câștigată acum crește șansele să cumpere mai târziu, când apar ghidurile plătite și serviciile.

**De ce e nevoie de site:** în clipuri nu se pun link-uri (risc de ban pe TikTok). Singurul drum e clip → bio → site → ghid. Deci ghidul dorit trebuie găsit ușor, iar apoi și celelalte.

**Public:**
- oameni care învață și folosesc AI zilnic;
- antreprenori care vor să pună AI în firmă (firme mici: cafenele, saloane, clinici, imobiliare).

Vin de pe TikTok, deci **mai ales de pe telefon**. Totul se proiectează întâi pentru telefon (ecran de ~390px), apoi pentru desktop.

**Miezul:** o **bibliotecă de ghiduri gratuite**, versiunea completă a tutorialelor scurte de pe TikTok. Caruselul spune *ce*, ghidul spune *cum*.

### Succes
- Omul venit dintr-un clip ajunge la ghidul din clip în câteva secunde, de pe telefon.
- Ghidul chiar îl ajută: îl poate pune în practică fără nelămuriri [Andrei: „calitate bună chiar dacă e gratuit”].
- Site-ul arată de la primul ecran că e făcut cu grijă [Andrei: „vreau să se vadă calitatea site-ului de cum intră”]. Ghidul vedetă de la lansare chiar vorbește despre asta.
- Andrei poate publica un ghid nou doar vorbind cu Claude, fără panou de administrare.

### Ce nu e (non-goals, pentru acum)
- Ghiduri plătite, kit-uri, pachete de prompturi, skill-uri de vânzare: mai târziu, se discută separat.
- Plăți, conturi de utilizator, autentificare.
- Panou de administrare / CMS.
- Filtre pe categorii (doar căutare) până la 15–20 de ghiduri [Claude].
- Cele trei site-uri-concept din portofoliu: proiecte separate, după site.
- Altă limbă decât româna.

### Ce ar însemna eșec chiar dacă „merge” (anti-goals)
- Site-ul arată „făcut cu AI”: șablon generic, gradient mov, carduri identice, texte cu semnele scrisului AI.
- Pe telefon e greu, lent sau animațiile se blochează.
- Ghidul dintr-un clip e greu de găsit.
- Ghiduri superficiale, cu pași lipsă, prețuri sau meniuri greșite.
- Portofoliul prezintă munca altora drept a lui Andrei.
- Stilul vechi: „editorial crem” din ghidurile PDF din `C:\Instagram Content Pipeline`, sau template-ul cu foc și fum din postările tăiate cu roșu din `Exemple/`. **Nu se folosesc ca referință.**

---

## 2. Constrângeri

- **Conturi:** Andrei are GitHub și Vercel. **Domeniul: `buildwithac.ro`**, cumpărat [Andrei, 2026-10-23: „nu e o platformă de AI, chiar dacă așa am handle-ul”]. Handle-urile rămân `@buildwithac.ai`. **E-mailul prin iCloud+** [Andrei, 2026-10-23]: Andrei are abonament iCloud și deja un alt domeniu legat acolo. Adaugă `buildwithac.ro` ca domeniu personalizat în iCloud și face aliasurile:
  - `contact@buildwithac.ro`: adresa de contact de pe site [Andrei];
  - un alias pentru expeditorul newsletterului din Kit [Andrei: „fac aici și pentru newsletter aliasurile”]. Numele propus: `andrei@buildwithac.ro`, ca e-mailurile să sune personal, iar răspunsurile să ajungă tot în iCloud [apelul meu].

  **DNS** [apelul meu]: toate înregistrările stau într-un singur loc, de preferat **Cloudflare (gratuit)**, ca la primul domeniu al lui Andrei:
  - Vercel (site);
  - iCloud (MX, SPF, DKIM, verificare);
  - Kit (autentificarea domeniului, ca e-mailurile să nu ajungă în spam);
  - un singur DMARC.

  Domeniul e cumpărat de la **ROTLD** [Andrei]: în contul ROTLD se schimbă serverele de nume (nameservers) cu cele date de Cloudflare; restul setărilor se fac în Cloudflare.

  Atenție la SPF: trebuie să existe **un singur** rând SPF. Kit folosește propriile înregistrări CNAME, deci SPF-ul rămâne cel de la iCloud. Pașii îi fac împreună cu Andrei la implementare. În cod, domeniul și adresa de e-mail sunt **parametri într-un singur loc** (config), nu scrise de mână prin pagini.
- **Cost:** doar planuri gratuite la lansare (Vercel Hobby, Kit Free). ManyChat abia mai târziu.
- **Fără Higgsfield** (nu mai are abonament). Imagini: Unsplash gratuite + montaj local (`prototip/montaj/`).
- **Imaginea hero:** rămâne montajul nostru pe muntele din template-ul Osmo [Andrei]. Riscul de drepturi a fost spus o dată; nu se mai repetă. Rezerva: același montaj pe o poză Unsplash, cu `prototip/montaj/compose.py`.
- **Andrei judecă vizual**, nu după cod: orice schimbare de aspect se arată în browser (previzualizare), nu se descrie.
- **Limita de folosire Claude:** pașii grei se anunță înainte.

---

## 3. Tehnologia

[Claude, acceptat] **Next.js (App Router) + TypeScript + Tailwind CSS + GSAP (ScrollTrigger) + Lenis**, găzduit pe **Vercel**, cod pe **GitHub**. Ghidurile sunt **fișiere MDX în proiect**.

[apelul meu] Detalii:
- Paginile se generează static la build (fără server, fără bază de date).
- Fonturile se încarcă prin `next/font` (Google), nu prin link CDN.
- Imaginile prin `next/image`.
- MDX cu componente proprii pentru elementele ghidului (vezi §6).
- Căutarea rulează în browser, pe un index mic generat la build (vezi §7).
- `prefers-reduced-motion`: animațiile de scroll se opresc sau devin simple fade-uri; Lenis se dezactivează.
- Analiză de trafic: **Vercel Web Analytics** (are plan gratuit, fără cookie-uri, deci fără banner). Andrei poate renunța.

### Structura proiectului [apelul meu]
```
C:\Portofoliu AC\            ← un singur repo git
  site\                      ← aplicația Next.js (Root Directory pe Vercel)
    app\                     ← pagini
    components\
    content\ghiduri\<slug>\  ← index.mdx + imaginile ghidului
    public\
  continut\                  ← material de lucru, nu ajunge pe site
    ghiduri\<slug>\          ← carusel.md (textul slide-urilor), note, transcriere
    clipuri\                 ← clipurile încărcate de Andrei (ignorat în git: fișiere mari)
    inspiratie\              ← clipuri de la alți creatori (ignorat în git)
    idei.md                  ← lista de idei (skill-ul „idei”)
  docs\                      ← progres, specificații, planuri
  prototip\                  ← prototipurile; referință vizuală, nu se publică
  Exemple\                   ← capturi vechi; nu sunt referință
  .claude\skills\ghid-nou\   ← skill
  .claude\skills\idei\       ← skill
  CLAUDE.md
```

**Depozitul de pe GitHub e privat** [apelul meu]: în el stau lista de idei, transcrierile și PDF-urile. Vercel Hobby merge și cu depozite private.

### Pagini
| Adresa | Ce e |
|---|---|
| `/` | homepage |
| `/ghiduri` | toate ghidurile, cu căutare |
| `/ghiduri/<slug>` | un ghid |
| `/confidentialitate` | politica de confidențialitate (vezi §8) |
| 404 | pagină proprie, cu căutarea și link spre `/ghiduri` [apelul meu] |

---

## 4. Sistemul vizual

**Direcția [Andrei]:** „cinematic”: întunecat, fotografii de atmosferă, cuvinte-cheie în italic în gradientul logo-ului, plus accente de colaj (hârtie, bandă adezivă, scris de mână). Îi plac animațiile la scroll (GSAP).

Valorile din prototip (`prototip/index.html`) sunt cele de pornire:

| Rol | Valoare |
|---|---|
| fundal (`ink`) | `#0b0908` |
| text / hârtie (`cream`) | `#f6efe3` |
| text secundar (`muted`) | `#a99d92` |
| auriu | `#ffb52e` |
| portocaliu | `#f26a21` |
| roșu | `#e53222` |
| vișiniu | `#7a0e0e` |
| gradient logo | `linear-gradient(90deg, #ffb52e, #f26a21 45%, #e53222)` |

| Font | Unde |
|---|---|
| **Unbounded** 600/800 | titluri, titlul din hero, footer |
| **Inter** 400–700 | textul de bază |
| **Instrument Serif** italic | cuvintele-cheie în gradient |
| **Caveat** 600/700 | scris de mână (notițe, colaj) |
| **Anton** | secțiunea de e-mail în stil colaj |
| **JetBrains Mono** | prompturi, cod, comenzi |

Shrikhand (titlul „retro”) **nu** se folosește: varianta e respinsă.

Logo-ul: `C:\Instagram Content Pipeline\buildwithacai\brand\logo-transparent.png`. Are fundal crem, nu e transparent: trebuie decupat la implementare.

---

## 5. Homepage (`/`)

Prototipul `prototip/index.html` este referința de aspect și de animații; valorile implicite din comutatorul lui sunt cele alese. **Comutatorul nu ajunge în site.** Textele și imaginile din prototip sunt provizorii și se rescriu la pasul de conținut [Andrei].

**Bara de sus [Andrei]:** Ghiduri · Pentru cine · Social media · Portofoliu · Servicii · Contact. (Portofoliu adăugat de Andrei pe 2026-10-23; locul din bară, înainte de Servicii, ca pe pagină, e apelul meu.)
- „Ghiduri” duce la `/ghiduri`.
- „Social media” deschide un meniu mic cu Instagram și TikTok.
- Pe telefon: meniu ☰ [Claude].
- Restul sunt ancore pe homepage.

**Secțiunile, în ordine** (Andrei: „îmi plac toate”):

1. **Hero parallax** (efectul *Parallax Scrolling* de la Osmo, 21st.dev).
   - Straturi: `osmo-l1` (cer), `osmo-l2` (munți), titlul, `l4-cod.png` (primul plan cu omul pe scaun de camping și laptopul cu cod portocaliu). Toate în `prototip/montaj/surse/` și `prototip/`.
   - La scroll, straturile urcă cu yPercent 70 / 55 / 40 / 10; titlul `buildwithac` stă **între** straturi și trece în spatele primului plan.
   - Titlul: **drept**, Unbounded 800 [Andrei].
   - Subtitlul „AI pe înțelesul tău, în română.” stă **deasupra** titlului, ca să nu-l acopere omul [Andrei]. „în română” pe crem [Claude].
   - Pe telefon (ecran mai înalt decât lat), imaginea se centrează pe 38% orizontal, ca omul să rămână în cadru.
2. **Cortină cu mesaj personal**: cuvintele se aprind pe rând la scroll.
3. **Ghiduri**: secțiune fixată, cu scroll orizontal prin carduri. Click pe un card → **panou de detalii**: descriere scurtă, ce găsești în ghid, cuprinsul, durata, nivelul, buton „Citește ghidul”. Cel mai nou ghid e primul, mai mare, cu „Nou” [Claude]. Ultimul card duce la `/ghiduri`.
4. **Pentru cine**: două drumuri, „Înveți AI” și „Ai o firmă”.
5. **Perete 3D cu clipurile de pe TikTok.** [apelul meu] Fiecare clip e o imagine de copertă (fișier local) cu link spre clipul de pe TikTok; nu se încarcă playere TikTok încorporate (sunt grele pe telefon). Lista de clipuri e un fișier de date simplu.
6. **Ghiduri pe e-mail**, în stil colaj (hârtie, Anton, sticker). Formular Kit (vezi §8). Text: „îți scriu când apare un ghid nou sau o noutate care contează”. **Fără ritm promis** [Andrei].
7. **Portofoliu** (nou; locul: înainte de Servicii [Claude]). Vezi mai jos.
8. **Servicii**: carduri care se stivuiesc la scroll. Text de exemplu deocamdată; serviciile se gândesc separat, împreună, pe moment.
9. **Contact**: două căi, mesaj privat pe Instagram sau e-mail.
10. **Footer**: `buildwithac` mic, cu fontul titlului din hero.

**Fundalul secțiunilor: Aurora (panglici de lumină)** [Andrei].

### Portofoliu [Andrei + Claude]
- **ImobSearch**: SaaS funcțional; capturi trimise de Andrei.
- **2–3 automatizări n8n**: din capturi.
- **Site-uri-concept**, etichetate clar **„Concept”**: clinică stomatologică, salon, iar al treilea **service auto sau salon de tatuaje (nedecis)**. Se construiesc după site, ca proiecte separate.
- Până atunci: carduri „în curând” sau capturi provizorii. La lansare, secțiunea poate avea doar ImobSearch și automatizările, dacă Andrei trimite capturile.
- **Portofoliul n-are încă prototip** [apelul meu]: înainte de cod, fac 2–3 variante în `prototip/index.html`, în comutator, ca Andrei să aleagă din browser, ca la celelalte secțiuni.
- **E în bara de sus** [Andrei].

---

## 6. Pagina de ghid (`/ghiduri/<slug>`)

Referința: `prototip/ghid.html`, varianta implicită **3e „pași în caiet”** [Andrei]: pașii sunt foi de hârtie cu **colțuri rotunjite**, bifa e desenată de mână, iar un cerc arată progresul. Progresul (ce pași ai bifat) se **salvează în browser** și rămâne la revenire.

### Structura unui ghid [Andrei: standardul; Claude: detaliile, acceptate]
1. Titlu, descriere scurtă, durată, nivel, „actualizat la [data]”.
2. **De ce ai nevoie**: conturi, abonamente (cu preț), programe, timp.
3. **Pașii**, fiecare cu o singură acțiune. În pași:
   - **casete de prompt / comandă** cu buton „Copiază”;
   - **„Ce ar trebui să vezi”**: captură după fiecare pas important, prezentată ca poză lipită cu bandă adezivă;
   - **„Dacă nu merge”**: erorile frecvente.
4. **Notițe „greșeala mea”** în stil colaj (Caveat). **Nu se inventează**: vin din clip sau de la Andrei. Altfel devin notițe „Atenție” cu o capcană reală.
5. **Final comun**: urmărește-mă, e-mail, ghidul următor, link spre `/ghiduri`.
6. **Caseta PDF**: „Vrei ghidul în PDF?” → fereastra în 3 pași: urmărește `@buildwithac.ai` pe Instagram → scrie-mi în privat cuvântul **[CUVÂNT]** → primești link-ul. Modul „doar prin Instagram” din comutatorul PDF al prototipului [Andrei].

Ghidul de pe site e **complet și liber** [Andrei]: nu se ascunde nimic în spatele PDF-ului sau al e-mailului.

### Componentele MDX [apelul meu]
`<Pas>`, `<Prompt>` (cu Copiază), `<CeVezi>` (captură), `<DacaNuMerge>`, `<GresealaMea>`, `<Atentie>`, `<DeCeAiNevoie>`. Numele finale le alege implementarea; important e ca un ghid să se scrie doar din ele, fără HTML de mână.

### Datele unui ghid (frontmatter) [apelul meu]
```yaml
titlu: "Site-uri care nu arată făcute cu AI"
slug: site-uri-fara-aer-de-ai
cuvant: SITE              # cuvântul-cheie: ultima slide, lupa și PDF-ul pe Instagram
descriere: "..."
ceGasesti: ["...", "..."]
durata: "45 min"
nivel: "începător"        # începător | mediu | avansat
unelte: ["Claude Code", "21st.dev", "UI UX Pro Max"]
actualizat: 2026-10-23
publicat: 2026-10-23
imagine: cover.jpg        # aceeași imagine ca prima slide a caruselului [Claude]
clip: https://www.tiktok.com/...   # opțional
pdf: false                # dacă există PDF
```
Cuprinsul se generează din pași.

### PDF-ul ghidului [apelul meu]
Se generează din pagina ghidului (stil de tipărire separat, fără animații, foi crem), la publicare, cu o comandă din proiect. Fișierul se pune pe site la o adresă greu de ghicit (nu e listată nicăieri), iar Andrei trimite manual link-ul în privat pe Instagram. Nu e o protecție reală, doar ca link-ul să nu circule ca „pagină de descărcare”; ghidul oricum e liber pe site.

---

## 7. Toate ghidurile (`/ghiduri`)

Referința: `prototip/ghiduri.html`, aranjarea **B · Colaj** [Andrei]: foi crem cu bandă adezivă, ghidul vedetă lat, cu sticker „ghid nou!”. Andrei: „se potrivește și cu ghidul când apeși pe el”. A, C, D sunt respinse.

- **Lupa de căutare, vizibilă sus, de la început** [Andrei a propus-o].
  - Caută după titlu, unelte, cuvânt-cheie și descriere; fără diacritice obligatorii („animatii” găsește „animații”) [apelul meu].
  - **Scurtături** sub lupă, cu cuvintele din clipuri.
  - Dacă cineva caută exact cuvântul unui ghid, cardul acela e marcat **„ăsta e ghidul din clip ✓”**.
  - Căutare fără rezultat → „scrie-mi pe Instagram ce ghid cauți”.
- Cel mai nou ghid e primul, mare, cu „Nou” [Claude]. **Un singur loc mare**, pe homepage și pe `/ghiduri`: „ghidul vedetă” din prototip și „cel mai nou ghid” sunt același loc [apelul meu]. Nu există un câmp separat `vedeta`. La lansare, ghidul vedetă se publică ultimul, ca să ocupe locul mare.
- Cardurile seamănă cu prima slide a caruselului: aceeași imagine, același titlu [Claude].
- Pagina trebuie să arate bine și cu 3 ghiduri, și cu 15 (prototipul are comutator pentru ambele).
- [apelul meu] Adresa `/ghiduri?q=SITE` deschide pagina cu căutarea completată. Poate fi folosită mai târziu în răspunsuri pe Instagram.

---

## 8. E-mail și Instagram

- **Newsletter: Kit, planul gratuit** [Andrei] (până la 10.000 de abonați, formulare, e-mailuri nelimitate). Formularul Kit apare în secțiunea 6 de pe homepage și în finalul fiecărui ghid. [apelul meu] Se folosește formularul Kit prin API-ul de formulare/încorporare, cu aspectul nostru (nu cel standard Kit).
- Două tipuri de e-mail: **ghid nou** (mesaj scurt cu link spre ghidul de pe site, nu spre PDF) și **noutăți AI**, din când în când. Pe planul gratuit nu există automatizări, deci **Andrei le trimite manual din Kit**.
- **PDF prin Instagram:** la început, **Andrei trimite singur link-ul** în privat. **ManyChat mai târziu**, când volumul crește (prețuri de verificat la înscriere). Variantă gratuită intermediară: răspunsuri automate la cuvânt-cheie din Meta Business Suite.
- **Follow-ul se cere, nu se verifică**: PDF-ul se dă oricui îl cere [Claude].
- **GDPR** [Andrei, 2026-10-23: „ulterior ca PFA, le facem și le modificăm după”]:
  - De la lansare există o **pagină de confidențialitate** (`/confidentialitate`), cu link din footer și de lângă fiecare formular de e-mail.
  - Lângă formular: un rând scurt de acord (ce primești, că te poți dezabona oricând, link spre pagină). [apelul meu] Kit cu **dublă confirmare** (e-mail de confirmare la abonare).
  - Operatorul de date e la început **Andrei, persoană fizică**; când face PFA-ul, pagina se actualizează. Datele operatorului stau tot în fișierul de configurare.
  - Textul paginii se scrie cu skill-ul `legal-advisor-ro`, la implementare. Se pomenesc Kit (abonații), Vercel (găzduire, statistici fără cookie-uri) și Google Fonts, dacă fonturile nu sunt servite local (cu `next/font` sunt locale).
- **Fără link-uri în clipuri** [Andrei]. **Link-ul din bio duce pe homepage** [Andrei].

---

## 9. Ghidurile de la lansare

Trei ghiduri, pornite din cele mai bune carusele ale lui Andrei [Andrei]:

1. **Site-uri care nu arată „făcute cu AI”** — **ghidul vedetă** [Andrei]. Skill-ul Motion (animații), UI UX Pro Max (culori și fonturi), 21st.dev (componente de pornire). Site-ul însuși e exemplul.
2. **Animații video cu Claude**: Claude scrie cod GSAP, HyperFrames îl randează în MP4. Merge pe intro-uri, logo-uri, grafice; nu pe oameni reali. Realist: câteva ore de ajustări.
3. **Claude conectat la TradingView prin MCP**: scriptul e pe Google Drive-ul lui Andrei, de citit când facem ghidul. Cu notă „nu e sfat financiar” [Claude].

Ghidurile se scriu prin skill-ul „ghid nou”, după ce site-ul există.

**Până atunci** [apelul meu]:
- Site-ul se construiește cu **ghiduri de exemplu**: conținutul din prototip, plus destule cópii ca să se vadă și varianta cu 15 ghiduri. Ele apar doar local și în previzualizări, **niciodată pe site-ul public**.
- **Primul ghid adevărat (ghidul vedetă) e primul test al skill-ului „ghid nou”**: se face imediat după ce site-ul e gata, ca etapă separată a planului.
- Site-ul public pornește abia când există cel puțin ghidul vedetă. Până atunci, adresa Vercel poate exista, dar nu e anunțată nicăieri. Site-ul se poate lansa și cu mai puține, dacă e nevoie; dar link-ul ajunge în bio abia la 1000 de urmăritori pe TikTok, deci nu e grabă.

---

## 10. Cum se face și se publică un ghid

**Prin Claude, în proiect, fără panou de administrare** [Andrei]. **Claude face tot conținutul**: textul caruselului și ghidul. Apoi Andrei și Claude corectează, adaugă și modifică împreună [Andrei].

**Fluxul** [Claude; detaliile tehnice: apelul meu]:
1. Andrei pornește skill-ul „ghid nou” (din postarea lui: clip sau carusel).
2. Claude scrie în `continut/ghiduri/<slug>/carusel.md` (dacă e carusel) și `site/content/ghiduri/<slug>/index.mdx`, pe o ramură git `ghid/<slug>`.
3. Lucrează împreună pe text.
4. Claude face `push`; Vercel creează automat o **previzualizare** (link separat).
5. Andrei o verifică pe telefon.
6. „Publică” → Claude unește ramura în `main` → ghidul apare pe site.
7. Claude generează PDF-ul (dacă e cazul) și îi amintește lui Andrei să trimită e-mailul „ghid nou” din Kit, cu un text gata scris.

Pe `main` nu există niciodată ghiduri neterminate: ciornele trăiesc doar pe ramuri.

---

## 11. `CLAUDE.md` (regulile proiectului)

Nu există un skill separat pentru „reguli”: regulile stau în `CLAUDE.md`. Conține:

- **Ce e proiectul și pentru cine**: rezumatul §1, în câteva rânduri.
- **Limba:** totul în română, cu diacritice (ș, ț cu virgulă).
- **Lucrul cu Andrei:** judecă vizual; schimbările de aspect se arată în previzualizare sau browser, nu se descriu. Pașii grei (fișiere mari, subagenți) se anunță înainte, din cauza limitei de folosire. La final de sesiune se salvează stadiul.
- **Ce nu e referință:** stilul „editorial crem” și ghidurile PDF vechi; postările tăiate cu roșu din `Exemple/`.
- **Sistemul vizual** (§4) și unde e fiecare prototip.
- **Standardul unui ghid** (§6) și **tonul**:
  - „tu”, ca un prieten care a făcut-o înaintea ta;
  - fraze scurte, fără introduceri goale;
  - afirmații sigure; dacă ceva e nesigur, se spune de ce;
  - orice termen tehnic explicat la prima apariție;
  - fără exagerări de reclamă: ce face, cât durează, cât costă;
  - butoanele și meniurile cu numele exact de pe ecran;
  - fără semnele de text făcut cu AI.
- **Verificarea ghidurilor gratuite** [Andrei: fără testare cap-coadă]: Claude verifică singur ce se poate fără conturile lui Andrei (link-uri, prețuri, versiuni actuale, comenzi rulate într-un dosar gol). În ghid scrie „actualizat la [data]”. Testarea riguroasă rămâne pentru produsele plătite.
- **Fluxul de publicare** (§10).
- **Ce se poate copia de la alții:** subiectul și ideea, da; textul și designul, cuvânt cu cuvânt, nu.
- **Portofoliul:** doar munca lui Andrei; conceptele marcate „Concept”.
- **Domeniul și e-mailul de contact** stau într-un singur fișier de configurare.

---

## 12. Skill-ul „ghid nou”

**Când:** Andrei a postat (sau urmează să posteze) ceva și vrea ghidul de pe site.

**Două situații** [Andrei]:
1. **Ghid din postarea lui (acum).** Ghidurile se fac doar pentru ce postează. Fiecare subiect e ori **carusel**, ori **clip**.
2. **Ghiduri separate, mai complexe, gratuite și plătite (mai târziu):** pornesc de la idee. Nu intră în skill acum; se discută separat.

**La clip:** scenariul și filmarea le face Andrei, în alt proiect. Aici pune clipul în `continut/clipuri/` și spune descrierea. Claude transcrie clipul și face ghidul după ce spune în video.

**La carusel:** Claude scrie textul slide-urilor **și** ghidul. Ultima slide conține cuvântul-cheie („caută SITE pe site”), același cu cel din lupă și pentru PDF [Claude].

**Pașii skill-ului** [apelul meu, pe baza deciziilor]:
1. Află subiectul, formatul (clip/carusel) și sursa (clip, descriere, idee din `idei.md`).
2. Caută ce trebuie verificat: prețuri, versiuni, numele exacte ale butoanelor, link-uri.
3. Întreabă-l pe Andrei de greșelile lui reale (pentru notițele „greșeala mea”), dacă nu sunt în clip.
4. Scrie caruselul (dacă e cazul) și ghidul, după standard și ton.
5. Alege cuvântul-cheie; verifică să nu existe deja.
6. Verificarea din §11.
7. Fluxul de publicare din §10.
8. Marchează ideea ca postată în `idei.md`.

**Lista de verificare înainte de previzualizare:** „de ce ai nevoie” complet, cu prețuri; fiecare pas o singură acțiune; fiecare prompt are „Copiază”; captură după fiecare pas important (sau loc marcat pentru captura lui Andrei); „dacă nu merge” la pașii care pot da erori; nicio notiță „greșeala mea” inventată; data „actualizat la”.

---

## 13. Skill-ul „idei”

[Andrei: aprobat; detaliile: Claude]
- **Când:** Andrei nu știe ce să posteze (caută Claude), sau aduce clipuri de la alți creatori în `continut/inspiratie/` (Claude le transcrie și scoate ideea).
- **Unde caută:** noutăți și știri AI; ce postează alți creatori (TikTok și Instagram se pot căuta doar parțial).
- **Ce primește Andrei:** 5–8 idei, fiecare cu: cârligul; „de ce acum”, cu sursa; formatul (clip sau carusel); ce ar intra în ghid; efortul.
- **Lista de idei:** cele rămase stau în `continut/idei.md`; cele postate se marchează, ca să nu se repete.
- **Ce a mers până acum** (Andrei): un amestec de design interesant (Canva, scris în culorile logo-ului) și informații bune. Bănuiala mea: subiectele în care Claude face ceva concret, vizibil.
- **Ce se poate copia:** subiectul și ideea, da; textul și designul altcuiva, nu.

---

## 14. Ce rămâne deschis

1. ~~Domeniul~~: `buildwithac.ro`, cumpărat.
2. **Al treilea site-concept:** service auto sau salon de tatuaje. Nu blochează: conceptele vin după site.
3. **Scriptul ghidului de trading:** pe Google Drive, de citit când facem ghidul.
4. **Capturile pentru portofoliu** (ImobSearch, n8n): le trimite Andrei.
5. **Textele finale** ale homepage-ului: se scriu la pasul de conținut, după ce structura e construită.
6. **Serviciile:** text de exemplu până le gândim împreună.
7. **Trecerea la PFA:** când există, se actualizează pagina de confidențialitate (vezi §8).

## 15. Ce lasă documentul în seama implementării
- Cum se împart componentele și fișierele în Next.js.
- Biblioteca exactă pentru MDX și pentru căutare.
- Cum se adaptează exact animațiile din prototip la React (cu condiția să arate și să se simtă la fel ca în prototip, inclusiv pe telefon).
- Optimizarea imaginilor hero (dimensiuni, formate) cât timp arată la fel.
- Detaliile stilului de tipărire pentru PDF.
