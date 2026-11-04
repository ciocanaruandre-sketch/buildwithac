# Site-urile-concept din portofoliu: documentul de design

Data: 2026-11-04. Stare: de aprobat de Andrei.
Marcaje: **[Andrei]** = decizia lui; **[Claude]** = apelul meu, pe care Andrei îl poate schimba.

## De ce

Portofoliul arată azi trei carduri „Concept” cu „în curând”. Andrei nu are încă clienți plătitori cu site-uri de arătat. Conceptele țin locul lor: un patron de firmă mică deschide pagina de pe telefon și, în primele zece secunde, gândește **„vreau și eu un site așa”** [Andrei]. Tot restul decurge de aici.

## Ce construim

Trei pagini-concept pe `buildwithac.ro` și actualizarea cardurilor din secțiunea Portofoliu. Prototipurile aprobate de Andrei sunt referința de aspect, text și animație; pagina finală trebuie să arate și să se miște ca ele.

| Concept | Firma (inventată) | Adresa [Claude] | Prototipul | Poze |
|---|---|---|---|---|
| Clinică stomatologică | Clinica Tei | `/concepte/clinica` | `prototip/concept-clinica.html` | `prototip/concept-clinica/` |
| Frizerie | Conu' Leonida | `/concepte/frizerie` | `prototip/concept-frizerie-c.html` | `prototip/concept-frizerie/` |
| Salon de tatuaje | Casa de Cerneală | `/concepte/tatuaje` | `prototip/concept-tatuaje.html` | `prototip/concept-tatuaje/` |

Salonul de înfrumusețare și service-ul auto ies din plan [Andrei].

### Ce s-a ales, pe fiecare pagină [Andrei]

- **Clinica:** primul ecran C (cabinetul stă într-o arcadă care se deschide la scroll, până la „Prima vizită e doar o discuție.”). Culorile 1: albastru de noapte cu albastru prăfuit, fără maro. Fără bloc de „cazuri” înainte/după [Claude]: ar fi rezultate medicale inventate.
- **Frizeria:** primul ecran C (intri pe hol la scroll, până la „Scaunul tău, la ora ta.”). Culorile 3: verde cu piatră. Fără secțiunea roșie. Prețuri: tuns 100, barbă 50, tuns și barbă 125, tuns copii 60 de lei. Galeria se cheamă „Cum lucrăm”. Titlurile în Bodoni Moda [Claude; Andrei n-a contrazis].
- **Tatuajele:** primul ecran C (o pată de cerneală se întinde la scroll și descoperă poza). Lucrările sunt o expoziție: sala 1, galerie întunecată, rame negre, paspartu, etichete de muzeu, iar lumina se aprinde pe fiecare tablou când ajungi la el.

Adresele URL de mai sus ale prototipurilor sunt fără parametri: valorile implicite din fișiere sunt deja cele alese. Variantele neutilizate din cod (A, B, celelalte culori și săli, parametrii `?v`, `?c`, `?r`, `?t`) se scot.

### Comun tuturor celor trei [Claude, necontrazis de Andrei]

- Bandă „Concept” mereu vizibilă sus, cu un link înapoi la `/#portofoliu`. Pe telefon trebuie să încapă pe un rând la 360px.
- Subsol cu „Site-concept. … sunt inventate. Pozele sunt de pe Unsplash.” și link spre formularul de contact (`/#formular`).
- Programarea, respectiv trimiterea ideii, funcționează în pagină, dar nu trimite și nu salvează nimic; mesajul final spune asta. „Sună” și „Vezi pe hartă” afișează doar un mesaj, ca în prototip.
- Fără recenzii inventate. Fără nume de familie și fără portrete de echipă. Pozele de atmosferă cu oameni la lucru rămân, cum e `explica.jpg` la clinică și `maini.jpg` la tatuaje [Claude].
- La tatuaje, etichetele din expoziție au doar titlul și stilul, fără numele unui artist: pozele arată tatuajele unor oameni reali, nu lucrările artiștilor inventați [Claude]. Secțiunea Artiști rămâne.
- Numele firmelor n-au apărut la căutări pe web; ONRC nu e verificat. Pe pagină scrie clar că firmele sunt inventate.

## Cardurile din portofoliu [Andrei]

Pe card apare **imaginea completă**, de după scroll: fără arcadă, fără pată, fără text peste ea. Referința: `prototip/concept-carduri.html`.

- Ordinea: clinică, frizerie, tatuaje.
- Dispar „în curând” și filtrul gri; cardurile-concept devin link-uri spre pagini.
- Textele de sub poze [Claude]: cele din `concept-carduri.html`.
- Se schimbă `site/content/portofoliu.ts` și `site/components/home/Portofoliu.tsx`. `Salon` și `Service auto / Salon de tatuaje` ies, iar imaginile lor din `public/portofoliu/` se înlocuiesc.
- Cardurile proiectelor și automatizărilor rămân neschimbate (fără link).

## Cum se construiește [Claude]

**Pagini statice în `site/public/concepte/<slug>/`,** nu rute React. Motivele:
- layoutul rădăcină aduce `Nav`, `Footer`, Lenis și cele 6 fonturi ale site-ului, iar conceptele trebuie să arate ca site-urile altor firme;
- prototipurile sunt deja HTML, deci nu rescriem ceva aprobat;
- site-ul public rămâne neatins, cu risc mic pentru `main`.

`next.config.ts` face rewrite de la `/concepte/:slug` la `/concepte/:slug/index.html`. Dacă rewrite-ul nu merge curat cu versiunea de Next.js din proiect, constructorul alege altă soluție care păstrează adresele și izolarea de layout (citește `site/AGENTS.md`).

Condiții obligatorii:
- **Fără cereri spre terți.** Fonturile și GSAP se servesc din `public/concepte/`, nu de pe Google Fonts sau CDN: site-ul nu trimite azi IP-ul vizitatorului către Google, iar pagina de confidențialitate nu pomenește asta. Fără Analytics pe concepte.
- **`noindex`** pe cele trei pagini (antet în `next.config.ts` sau meta) și absente din `sitemap.ts`: firmele sunt inventate și nu trebuie să apară în căutări.
- **Link-uri relative** spre site, ca domeniul să rămână doar în `site/lib/config.ts`.
- **Pozele** convertite în WebP, dimensionate pentru telefon și desktop; Unsplash cu licență gratuită. Sursele fiecărei poze sunt în `continut/concepte/surse-poze.md`.
- Sistemul vizual și regula celor 6 fonturi din `CLAUDE.md` țin de site-ul buildwithac, nu de concepte: fiecare concept are fonturile lui. Banda „Concept” folosește culorile buildwithac.
- Româna cu diacritice cu virgulă (ș, ț); fonturile alese le au, verificat în browser.

**Retușuri de făcut:** logo-ul de pe mașina de tatuat din `maini.jpg` se șterge sau se decupează [Claude]. Pe calculator, la clinică, subtitlul stă prea aproape de arcadă: se reglează.

## Calitate

- Se proiectează la ~390px; pe desktop trebuie să arate îngrijit, dar telefonul e prioritar.
- Animațiile de scroll trebuie să fie fluide pe un telefon obișnuit. Andrei verifică pe telefon, pe previzualizarea Vercel. Dacă pata de cerneală sau `clip-path` sacadează, se simplifică efectul, păstrând ideea.
- `prefers-reduced-motion`: fără fixare la scroll; poza și mesajul final se văd direct.
- Tastatură: focus vizibil; fereastra de programare se închide cu Esc.
- Prima încărcare: poza primului ecran e prioritară; restul se încarcă leneș.

## Verificare

- Testele: paginile răspund 200 la adresele de mai sus, au `noindex`, arată banda „Concept”, nu fac cereri spre alte domenii; cardurile duc la pagini; sitemap-ul nu le conține. Testele existente care caută „în curând” se actualizează.
- Înainte de unire, din `site/`: `npx vitest run`, `npm run verifica`, `npm run lint`, `npx tsc --noEmit -p .`, `npx playwright test`, `npm run e2e:prod`.
- Ramură separată, `git push`, previzualizare Vercel, verificare pe telefon de Andrei, apoi unire la „da”-ul lui.

## Ce nu facem

- Nu copiem design sau text de la Crows Nest, Atelier Eva, Zen Dental sau Neoclinique; luăm trăsături.
- Fără programări adevărate, CMS, pagini suplimentare per firmă, versiuni în engleză.
- Nu schimbăm designul homepage-ului în afară de cardurile-concept.

## Ce ar fi un eșec

- Pagina arată ca o demonstrație de design, nu ca site-ul unei firme.
- Cineva crede că firma există sau că a cerut o programare adevărată.
- Pe telefon animația sacadează sau textul se suprapune.
- Paginile seamănă între ele sau cu un șablon generic.

## Lăsat constructorului

Structura fișierelor din `public/concepte/`, împărțirea CSS și JS, dimensiunile WebP, cum se testează „fără cereri spre terți”.
