# CRM: modul filmare (descrierea)

*2026-11-12 · aprobată de Andrei: în așteptare*

## De ce

Andrei filmează CRM-ul demo (baza de test, umplută cu `npm run demo`) pentru două feluri de clipuri:

1. **Tutorialul**, pentru cine vrea un CRM făcut de el: arată pas cu pas cum se lucrează, într-un ritm calm.
2. **Clipurile de reclamă**: trec repede prin toate ecranele, cu tranziții și efecte (puse la montaj, nu în CRM).

Omul care se uită trebuie să rămână cu trei lucruri: **ce poate face CRM-ul, cât de simplu se lucrează în el și cum arată**.

Problema: datele demo sunt inventate, dar un număr de telefon întreg și clar poate fi al unui om real, iar o firmă inventată poate avea numele unei firme reale. Numerele de acum (`0700 100 0xx`) sunt sigure, dar se vede că sunt false. Soluția aleasă de Andrei: **un mod filmare care blurează fin datele personale**. Numerele demo devin variate și credibile, dar nu se văd niciodată clar.

## Ce se construiește

### 1. Comutatorul „Mod filmare”

- Există **doar pe baza de test**: `eBazaDeTest(process.env.NEXT_PUBLIC_SUPABASE_URL)` din `crm/lib/echipa-test.ts`. Pe producție nu se randează nimic din el și nu se blurează nimic. *(Andrei: „doar pe demo”.)*
- **Comutatorul** îl vede doar rolul `admin` (Andrei). **Blurul** ține însă de browser, nu de cont: cât e pornit în acel browser, blurează pe orice cont din demo (Mara, Vlad, Ioana, Radu), ca Andrei să poată filma și ecranele celorlalte roluri. Pentru a-l opri, intră din nou ca `andrei@buildwithac.ro`. *(Andrei: „rămâne pornit pe orice cont”.)*
- **Unde stă:** pe laptop, în cardul contului din josul barei laterale (`app/(app)/layout.tsx`, lângă butonul „Ieși”); pe telefon, în antetul de sus, lângă „Ieși”. *(Am propus eu, iar Andrei a fost de acord.)*
- **Arată la fel pornit și oprit** *(alegerea mea)*: o iconiță discretă, fără culoare de „activ”, ca să nu trădeze nimic în cadru. Starea se vede doar în `title`/`aria-label` („Mod filmare: pornit”), adică la hover și pentru cititoarele de ecran.
- **Rămâne pornit** pe acel browser până îl oprește Andrei, inclusiv după reîncărcare și după ce iese din cont și intră din nou.
- **Nicio clipire la încărcare:** pagina trebuie să vină de pe server deja blurată (de exemplu, starea ținută într-un cookie citit pe server). Un cadru în care datele apar clare o fracțiune de secundă strică filmarea. *(Felul exact în care se face e alegerea constructorului; cerința e „nicio clipire”.)*
- Cât e pornit, **nu apare niciun alt semn pe ecran** (fără banner, fără bulină).
- Fără migrații în bază: preferința nu se salvează în Supabase.

### 2. Ce se blurează

**Aspectul** (ales de Andrei, varianta A din `prototip/crm-blur.html`): **blur fin, 4px, doar pe text**. Se vede forma (un nume, un număr), dar nu se citește nimic. Fără bandă, fără estompare în plus, fără înlocuirea textului. Bucata blurată e `inline-block`, iar spațiile din jurul ei rămân (în prototip, spațiul dispărea când stătea în interiorul bucății).

**Se blurează**, pe toate ecranele, oriunde apar:
- numele lead-ului sau clientului, **împreună cu numele firmei** (în bază e un singur câmp, „Laura Ene · Atelier Ceramică”; Andrei vrea blurate și firmele);
- numerele de telefon;
- adresele de e-mail ale lead-urilor și clienților;
- **inițialele** din avatarul lead-ului sau clientului (de exemplu „AC” din pătratul mare al fișei), fiindcă din ele se ghicește firma *(alegerea mea)*;
- numele din firimituri („Clienți › …”) și din rezultatele căutării din bara de sus.

Ecranele de verificat, toate: Lead-uri (listă și fișă), Clienți (listă și fișă, cu toate tab-urile), Task-urile mele, Program, Echipa, căutarea. Unde un ecran arată numele unui lead sau client (de exemplu, un task cu clientul lui, o programare în Program), numele se blurează și acolo.

**Conturile și link-urile clientului** (tab-urile Conturi, Livrat, Materiale): numele de cont, domeniile și adresele care conțin numele firmei (de exemplu `dulcecolt.ro`, `@dulcecolt`, `dulce-colt.exemplu.ro`) se blurează ca firmele *(alegerea mea)*. Numele serviciului (Vercel, GitHub, Google Business) și titlurile rămân clare.

**Link-urile de telefon, e-mail și WhatsApp** (`tel:`, `mailto:`, `wa.me`): în modul filmare nu mai au adresă, ca să nu apară numărul întreg în bara de jos a browserului la hover sau într-o aplicație deschisă la click. Arată la fel, dar nu fac nimic *(alegerea mea)*.

**Textele scrise de aplicație** (Parcurs, notificări) conțin doar numele echipei, stări, date și titluri de proiect sau livrare, nu numele lead-ului sau clientului (verificat în `crm/lib/parcurs.ts`). Titlurile proiectelor și livrărilor din datele demo nu conțin numele firmei.

**Titlul tab-ului din browser** nu se poate blura: în modul filmare devine generic („Lead”, „Client”) în loc de nume *(alegerea mea; se vede când se filmează cu bara browserului)*.

**Rămân clare:** etichetele, butoanele, meniurile, stările (pastilele colorate), prețurile, sumele, datele, orele, progresul, stadiile, sursa („Formular site”, „Reclamă Meta”), numele și inițialele **echipei** (Andrei, Mara, Vlad, Ioana, Radu: sunt echipa demo, nu clienți).

**Nu se blurează (hotărât de Andrei):**
- **căsuțele formularelor** în timp ce tastezi (de exemplu „+ Lead de mână”). În tutorial, Andrei pune numele lui sau blurează la montaj;
- **textul liber** (titlurile task-urilor, notițele, materialele): nu se caută nume în fraze. În schimb, scriptul demo nu mai pune acolo nume și telefoane (vezi mai jos).

### 3. Datele demo (`npm run demo`)

- **Telefoanele devin variate:** prefixe reale de mobil din România (de exemplu 0721, 0722, 0723, 0724, 0726, 0730, 0731, 0740, 0742, 0744, 0745, 0746, 0747, 0748, 0749, 0751, 0752, 0753, 0754, 0755, 0756, 0757, 0758, 0760, 0761, 0762, 0763, 0764, 0765, 0766, 0767, 0768, 0769), urmate de 6 cifre. Se generează **la fel la fiecare rulare** (nu aleator de la o rulare la alta), ca pozele și clipurile să poată fi refăcute. Forma normalizată (`40…`) se potrivește cu cea afișată, ca să meargă căutarea după telefon. Locul: `crm/scripts/date/demo-date.ts` (`telefonDemo`, `telefonNormDemo`).
- **Fără nume și telefoane în textul liber:** în task-uri, notițe, materiale, titlurile proiectelor și livrărilor și parcurs, scriptul demo nu scrie numele sau numărul unui lead ori client și nici numele firmei („Sunat-o pe Laura…” devine „Sunat clienta…”). Numele echipei pot rămâne.
- Datele de test ale testelor automate (`scripts/date/baza.mts`, `0700 000 0xx`) rămân cum sunt.

## Ce NU face

- Nu există pe producție și nu se poate porni acolo.
- Nu blurează căsuțele în care tastezi și nu caută nume în textul liber.
- Nu adaugă efecte, tranziții sau funcții de înregistrare: acelea țin de montaj.
- Nu schimbă tema și nu mută nimic pe ecrane.

## Ce ar însemna că a ieșit prost (chiar dacă „merge”)

- Blurul ascunde lucruri care arată funcțiile (stări, sume, butoane, etichete): tutorialul nu se mai înțelege și designul nu se mai vede.
- Datele apar clare o clipă la încărcarea unei pagini sau la trecerea între ecrane.
- Comutatorul sau un semn al modului filmare se vede și se recunoaște în clip.
- Un număr întreg, clar și credibil apare undeva pe ecran.
- Ceva din modul filmare ajunge să afecteze producția.

## Constrângeri

- Codul e în `crm/` (Next.js 16): înainte de cod citește `crm/AGENTS.md`.
- Ramura `crm-filmare`, făcută din `main`. Fără migrații.
- Tema A „Grafit” rămâne cum e; textele în română, cu diacritice cu virgulă.
- Testele existente trec în continuare (vitest, permisiuni, e2e, tsc, lint). Teste noi, cel puțin: comutatorul nu apare pe producție și nici pentru alte roluri; pornit de admin, blurul rămâne și după ce intri cu alt cont din demo; cu modul pornit, numele, telefoanele, e-mailurile și firmele sunt blurate pe ecranele principale, iar stările și sumele nu; pagina vine blurată de pe server (fără clipire); telefoanele demo sunt variate, stabile de la o rulare la alta și se găsesc la căutare.

## Lăsat constructorului

- Cum se ține starea fără clipire (cookie sau altceva) și cum se ajunge la componente.
- Componenta de blur (de exemplu un `<Ascuns>` care primește textul) și unde se aplică exact pe fiecare ecran.
- Iconița comutatorului, cu condiția să arate la fel pornit și oprit.
- Cum se aleg cifrele telefoanelor demo, dacă rămân stabile, credibile și unice.

## Referința vizuală

`prototip/crm-blur.html`, varianta **A · Blur fin**, „Cât de tare” = 4, cu „și numele firmelor” bifat (`http://localhost:8765/crm-blur.html#A-client`).
