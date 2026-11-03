# Formularul de contact de pe site: documentul de design

*2026-11-03. Sursa: deciziile din `docs/progres-brainstorming.md` („Contactul de pe site, decis pe 2026-11-01”), prototipul `prototip/contact.html` (varianta A) și codul din `site/`. Marcaje: **[Andrei]** = decizia lui; **[apelul meu]** = ales de Claude, nerespins; **[de verificat]** = se confirmă la construcție.*

## 1. Ce e și de ce

Un formular scurt în secțiunea Contact de pe homepage, prin care un om care vrea un serviciu își lasă numele și telefonul. Andrei îl sună înapoi.

- **Pentru cine:** firme mici (cafenele, saloane, clinici, imobiliare) și oameni care au văzut un clip și vor ajutor. Vin aproape toți de pe telefon.
- **De ce acum:** serviciile sunt pe homepage din 2026-11-03, dar pe carduri scrie „în curând”. Azi, singurele căi sunt Instagram și e-mailul. Mulți proprietari de firme mici nu scriu un e-mail, dar își lasă bucuroși numărul.
- **Drumul:** cardul unui serviciu → formularul → Andrei sună → se înțeleg la telefon → Andrei trimite formularul Tally potrivit (cel lung, deja publicat). Formularul de pe site **nu** înlocuiește Tally: doar deschide discuția.

### Succes
- Un om pe telefon trimite cererea în sub un minut, fără să caute nimic.
- Cererea ajunge în câteva secunde în căsuța `contact@buildwithac.ro`, cu tot ce trebuie ca Andrei să sune (nume, telefon apăsabil, serviciu, descriere).
- Roboții nu umplu căsuța.

### Ce nu e (non-goals)
- Nu salvează cererile pe site (fără bază de date, fără panou de administrare). **[Andrei]**
- Nu cere e-mail și nu trimite confirmare pe e-mail omului.
- Nu înscrie pe nimeni la newsletter și nu e folosit pentru reclame.
- Nu înlocuiește formularele Tally și nu cere detalii de proiect.
- Fără prețuri. **[Andrei]**

### Eșec chiar dacă „merge” (anti-goals)
- Arată ca un formular generic lipit pe site, nu ca restul secțiunii (întunecat, aurora, cuvântul în gradient).
- Pare o firmă cu echipă: textele sunt la persoana I singular („te contactez”, nu „te contactăm”). **[Andrei]**
- O cerere se pierde în tăcere: omul vede „Am primit”, dar e-mailul n-a plecat.
- Omul e încurcat de reguli de format la telefon, dacă e plecat în străinătate.

## 2. Constrângeri

- Next.js 16 (App Router), TypeScript, Tailwind și CSS-ul existent din `components/home/home.css`. **Înainte de cod: `site/AGENTS.md`.**
- Adresele de e-mail stau **doar** în `site/lib/config.ts`.
- Texte în română, cu ș/ț cu virgulă, în tonul din `CLAUDE.md`.
- Proiectat întâi pentru ~390px.
- Plan gratuit Resend: 3.000 de e-mailuri pe lună, 100 pe zi, 3 domenii (verificat pe 2026-11-01).
- Fără banner de cookie-uri, fără căsuță „accept” (vezi §7).

## 3. Locul și aspectul [Andrei: varianta A]

În secțiunea `#contact` (`components/home/Contact.tsx`), **un card lat sub cele două carduri existente** (Instagram, E-mail), care rămân neschimbate. Titlul secțiunii („Ai o întrebare? *Scrie-mi.*”), textul de sub el („Despre un ghid, o idee de clip sau AI-ul din firma ta. Răspund eu, nu un robot.”, neschimbat **[apelul meu]**) și nota scrisă de mână „răspund de obicei în 1–2 zile” rămân. Nota stă sub tot (sub noul card).

Aspectul se ia din `prototip/contact.html`, varianta A (se servește cu `python -m http.server 8765` din `prototip/`, comutatorul „A · sub carduri”, apoi „Telefon 390px”):
- pe calculator, câmpurile Nume și Telefon pe un rând, restul pe toată lățimea; pe telefon, totul pe o coloană;
- serviciile sunt pastile (butoane cu `aria-pressed`), nu un meniu derulant;
- jos, pe același rând pe calculator: fraza juridică în stânga, butonul „Trimite” în dreapta; pe telefon, unul sub altul.

## 4. Textele [Andrei]

| Loc | Text |
|---|---|
| Titlul cardului | „Vrei să *colaborăm?*” („colaborăm?” în Instrument Serif italic, cu gradientul logo-ului) |
| Sub titlu | „Lasă-mi numele și telefonul, iar eu revin în cel mai scurt timp posibil.” |
| Câmp | „Numele tău” (exemplu în câmp: „ex. Maria Popescu”) |
| Câmp | „Telefon” (exemplu: „07xx xxx xxx”) |
| Câmp | „Serviciu dorit”: pastilele **Site / Automatizări / Sesiune 1 la 1 sau ghid personalizat / Altceva** (a treia, ca numele serviciului: decizia lui Andrei, 2026-11-03; pe 390px poate trece pe un rând întreg, e în regulă) |
| Câmp | „Descriere (opțional)”; textul din câmp: „Ce firmă ai și ce ți-ar plăcea să rezolvi.”, iar la „Altceva”: „Spune-mi ce ai în minte.” |
| Lângă buton | „Folosesc numele și telefonul doar ca să te contactez despre cererea ta. Detalii în politica de confidențialitate.” (link spre `/confidentialitate`) |
| Buton | „Trimite”; cât se trimite: „Se trimite…” |
| După trimitere | „Am primit. *Mersi!*” + scris de mână „te contactez în 1–2 zile” (formularul e înlocuit de mesaj) |

**Mesajele de eroare [apelul meu]**, scurte, lângă câmpul greșit sau sub buton:
- nume lipsă: „Scrie-mi cum te cheamă.”
- telefon lipsă sau greșit: „Numărul nu pare complet. Verifică-l o dată.”
- serviciu neales: „Alege ce te interesează.”
- trimiterea n-a mers: „Acum nu merge trimiterea. Încearcă puțin mai târziu sau scrie-mi pe Instagram.” (cu link spre Instagram)
- prea multe încercări (429 de la Firewall): același mesaj ca mai sus.

## 5. Câmpurile și regulile

| Câmp | Obligatoriu | Regula |
|---|---|---|
| Nume | da [apelul meu] | 2–80 de caractere după `trim` |
| Telefon | da [Andrei] | orice țară [Andrei]; se acceptă doar cifre, `+` la început, spații, cratime, puncte, paranteze; **7–15 cifre** [apelul meu: 15 = maximul internațional]; fără prefix impus |
| Serviciu | da [apelul meu] | una din `site`, `automatizari`, `1la1`, `altceva` |
| Descriere | nu | max. 1.000 de caractere [apelul meu] |
| Capcana (`website`) | — | câmp ascuns, ca la abonare; dacă e completat, serverul răspunde „ok” și nu trimite nimic |

- Regulile se verifică **și în browser** (ca omul să vadă imediat ce lipsește) **și pe server** (singura verificare care contează). Aceeași funcție, în `lib/`, pentru amândouă. **[apelul meu]**
- `autocomplete="name"` și `autocomplete="tel"`, `inputMode="tel"`, ca telefonul să completeze singur.
- Butonul merge abia după hidratare (`useHidratat`), ca la abonare.

## 6. Trimiterea [Andrei: Resend, pe `contact@`]

### Fluxul
1. Browserul trimite `POST /api/contact` cu JSON `{ nume, telefon, serviciu, descriere, website }`.
2. Ruta verifică originea (aceeași funcție `dinSite` ca la `/api/abonare`, mutată într-un loc comun), capcana, apoi câmpurile.
3. Trimite un e-mail prin **API-ul Resend** cu `fetch` (fără bibliotecă nouă, ca la Kit) **[apelul meu]**, cu timp-limită de 8 s.
4. Răspunde `{ stare: "ok" | "invalid" | "indisponibil" }` cu 200 / 400 / 503, ca la abonare. La „invalid”, răspunsul spune și ce câmp e greșit (`camp`).
5. Formularul arată „Am primit. *Mersi!*” doar la `ok`. Orice altceva (inclusiv 429, 403, timp depășit) = mesajul „Acum nu merge trimiterea…”, **iar ce a scris omul rămâne în câmpuri**.

### E-mailul către Andrei [apelul meu]
- **De la:** `Site buildwithac <formular@buildwithac.ro>` (doar trimite, nu e nevoie de alias iCloud). **Către:** `SITE.emailContact`.
- **Subiect:** `Cerere nouă: Site · Maria Popescu` (serviciul cu numele de pe pastilă).
- **Corp:** text simplu + HTML simplu: numele, telefonul ca link `tel:` (Andrei sună direct din e-mail, de pe telefon), serviciul, descrierea (sau „fără descriere”), data și ora (ora Bucureștiului). Textul omului se **escapează** în HTML.
- Fără `reply_to`: omul nu lasă e-mail; Andrei îl sună.

### Contul Resend [Andrei]
- **Echipă nouă „buildwithac”** în contul Resend pe care Andrei îl are deja, ca cheile și limitele să fie separate de celălalt proiect. Domeniul celuilalt proiect nu se atinge.
- Domeniul `buildwithac.ro` adăugat în echipa nouă. Înregistrările DNS se pun în Cloudflare (**DNS only**). Resend folosește subdomeniul `send.buildwithac.ro` pentru MX/SPF și `resend._domainkey` pentru DKIM, deci **nu se ating** MX-ul și SPF-ul iCloud de pe domeniul principal, nici înregistrările Kit. **[de verificat]** numele exacte în ecranul Resend la construcție.
- Cheia API: doar „Sending access”, doar pe domeniul `buildwithac.ro`. În Vercel: `RESEND_API_KEY` (Sensitive), pe Production și pe Preview. Fără cheie, ruta răspunde „indisponibil” (ca la Kit fără `KIT_API_KEY`).
- Pașii pentru Andrei, **unul câte unul**, cu numele exacte ale butoanelor. Claude nu cere cheia în capturi.

### Protecția [apelul meu, nerespins]
- Capcana `website` (ca la abonare).
- Verificarea originii (`dinSite`).
- **Regulă în Vercel Firewall**, ca „Limita abonare”: Request Path equals `/api/contact` **AND** Method equals `POST` → Rate Limit, Fixed Window 60 s, **3 cereri**, cheie IP → 429. Atenție la capcana din UI: între condiții trebuie **AND**, nu OR. Se verifică cu `curl`, ca pe 2026-10-31.
- Limita de 100/zi a Resend e plasa de siguranță.

## 7. Juridic și confidențialitate [Andrei + `legal-advisor-ro`, 2026-11-01]

- **Temeiul:** art. 6 alin. (1) lit. b GDPR (pași precontractuali la cererea omului). De aceea **fără căsuță „accept”**: ajunge fraza de lângă buton, cu link spre confidențialitate.
- **Fără banner de cookie-uri:** formularul nu adaugă cookie-uri.
- **Păstrarea:** cererile care nu ajung la o colaborare se șterg după **90 de zile** [Andrei], de mână, lunar (odată cu neconfirmații din Kit și răspunsurile Tally). Follow-up doar despre cererea omului; ștergere imediată dacă zice „nu mai vreau”; fără promoții pe telefonul lui. Dacă se ajunge la colaborare, se aplică regula de la clienți (colaborarea + 1 an).
- **Pe `/confidentialitate` se adaugă** (în același stil ca intrarea Tally):
  - la „Ce date și de ce”: **Cererile din formularul de contact**: nume, telefon, serviciul ales, descrierea; folosite doar ca să te sun despre cerere; nu se salvează pe site, ajung pe e-mail;
  - la „Pe ce temei”: formularul de contact intră la art. 6(1)(b);
  - la „Cine mai vede datele”: **Resend** (SUA), prin care site-ul îmi trimite cererea pe e-mail; și **Apple (iCloud)**, unde e căsuța `contact@` (azi pagina pomenește doar Gmail-ul, pentru Tally) **[de verificat]** unde ajunge efectiv `contact@` (iCloud sau redirecționat spre Gmail) și se scrie ce e adevărat;
  - la „Cât timp le păstrez”: cele 90 de zile.
- **[de verificat] la construcție:** cât păstrează Resend copiile e-mailurilor (jurnalele din panou) și pe ce bază face transferul în SUA (DPF sau clauze standard). Dacă păstrarea se poate scurta din setări, se scurtează. Ce se află se scrie pe pagină.
- Textul paginii trece din nou prin `legal-advisor-ro` înainte de unire.

## 8. Legătura cu Servicii

Pe fiecare card din `components/home/Servicii.tsx`, eticheta „în curând” devine **un link spre formular** [Andrei], care:
- duce la `#contact` (derulare lină cu Lenis, ca restul ancorelor);
- **alege deja pastila potrivită** [apelul meu]: Site → „Site”, Automatizări → „Automatizări”, Sesiune 1 la 1 / ghid personalizat → „Sesiune 1 la 1 sau ghid personalizat”. Omul o poate schimba.
- **Textul linkului** nu e decis: Claude arată 2–3 variante în browser, Andrei alege.

## 9. Testele [apelul meu]

- **vitest:** verificarea câmpurilor (telefoane din RO și din străinătate, prea scurte, cu litere; nume gol; serviciu necunoscut; descriere prea lungă); construirea e-mailului (escaparea HTML, link-ul `tel:`, subiectul); trimiterea cu `fetch` fals (ok, 4xx/5xx de la Resend, timp depășit, cheie lipsă → „indisponibil”); capcana; originea.
- **Playwright** (desktop + telefon), cu `/api/contact` interceptat în browser (fără e-mailuri adevărate): erorile apar la câmpul potrivit; „Altceva” schimbă textul din descriere; trimiterea reușită arată „Am primit”; eșecul păstrează textul; linkul de pe cardul de servicii derulează la formular și alege pastila; navigarea doar cu tastatura (pastilele se aleg cu Space/Enter).
- **O singură probă adevărată**, pe previzualizarea Vercel: Andrei trimite o cerere de pe telefon și confirmă că a ajuns în `contact@`.
- Înainte de unirea în `main`: `npx vitest run`, `npm run verifica`, `npm run lint`, `npx tsc --noEmit -p .`, `npm run e2e:prod`.

## 10. Ordinea construcției

1. Ramura `contact-site`.
2. Codul + testele, cu ruta care răspunde „indisponibil” fără cheie (merge local fără Resend).
3. Variantele pentru textul linkului de pe Servicii; Andrei alege.
4. Pagina de confidențialitate + verificarea cu `legal-advisor-ro`.
5. Resend cu Andrei, pas cu pas: echipa nouă, domeniul, DNS în Cloudflare, cheia în Vercel.
6. `git push` → previzualizarea Vercel → proba de pe telefon.
7. Regula din Firewall se pune **înainte de unire** **[apelul meu]**: e o regulă pe cale (`/api/contact`), nu stric nimic dacă există înainte de rută. Așa formularul nu e niciodată public fără limită.
8. Unirea în `main` la „da”-ul lui Andrei, apoi imediat proba cu `curl` pe `buildwithac.ro` (3 răspunsuri, apoi 429).

## 11. Ce rămâne la constructor

- Numele fișierelor și al componentelor (propunere: `lib/contact.ts`, `components/home/FormularContact.tsx`, `app/api/contact/route.ts`, `lib/origine.ts` pentru `dinSite`).
- Cum trece pastila aleasă de pe cardul de servicii la formular (eveniment, parametru în adresă sau stare comună), cu condiția ca linkul să meargă și fără JavaScript (ajunge măcar la `#contact`).
- Animația la apariția cardului (GSAP, ca restul secțiunii), dacă se potrivește.
- Detaliile CSS, pornind de la prototip.
