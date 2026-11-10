# CRM-ul, etapa 3, bucata 1: tema finală și spațiul demo

Data: 2026-11-10. Completează `2026-11-09-crm-design.md` (§5 „Etapa 3”, §6 „Aspectul”). Marcajele: **[Andrei]** = hotărât de el; **[apelul meu]** = hotărât de mine, Andrei poate corecta.

## 1. Ce e și de ce

Etapa 3 are cinci bucăți independente, făcute pe rând: (1) tema finală + spațiul demo, (2) încasări și comisioane, (3) lead-urile din reclame, (4) dashboard și KPI, (5) calendarul extern. **[Andrei: „le facem pe toate, ca CRM-ul să fie complet”; ordinea propusă de mine, aprobată]** Documentul ăsta acoperă doar bucata 1.

Tema e prima ca tot ce se construiește după (încasări, dashboard) să iasă direct în stilul final, fără refaceri.

Spațiul demo există pentru că Andrei arată CRM-ul lumii: **poze, clipuri, un clip tutorial, pe site, la pagina viitoare a serviciului de CRM-uri și la discuțiile cu clienții**. **[Andrei]** CRM-ul trebuie să arate ca al unei firme care merge, nu ca o bază aproape goală.

## 2. Tema: varianta A, „Grafit”

Referința vizuală: **`prototip/crm-tema.html#A`** (aleasă de Andrei din 4 variante, 2026-11-10). Direcția: „mai premium, colțuri mai rotunjite, liquid glass, ca la iPhone, MacBook”. **[Andrei]**

Ce intră (toate din prototip):
- **Culorile rămân** cele de acum (grafit `#141417` / `#1c1c20`, textul `#f1f1f3` / `#b4b4bb` / `#8a8a92`, auriul și gradientul logo-ului, folosite rar). **[Andrei]**
- **Fundalul:** pete moi, foarte estompate, în auriu, roșu și vișiniu (opacitate ~10%), fixe, sub tot. Fără fotografii.
- **Sticla doar pe ce plutește:** bara laterală (desprinsă de margine, cu colțuri mari), bara de sus a paginii (lipită sus la derulare, în formă de pastilă), ferestrele și meniurile care se deschid peste pagină, dacă există. Tabelele, listele și textul stau pe panouri pline, ca să se citească. **[apelul meu, aprobat de Andrei]**
- **Colțuri:** panouri ~16px, elemente mici ~10px, bara laterală ~22px; butoanele și etichetele de stare devin pastile.
- **Fonturi:** Inter peste tot, scris normal (fără majuscule, fără litere rărite); **Chakra Petch iese** din CRM (și fișierele lui din `public/fonts/`). JetBrains Mono rămâne doar pentru lucruri tehnice (numele conturilor, link-uri); cifrele din text folosesc Inter cu cifre de lățime egală (`tabular-nums`). **[apelul meu, aprobat de Andrei]**
- **Tab-urile fișelor** devin comutatorul rotunjit, ca pe iPhone (control segmentat).
- **Bifele task-urilor** devin rotunde (ca în Mementouri).
- **Bara laterală** primește iconițe simple, cu linie (stil Lucide), câte una pe legătură; cea activă are fundal deschis și iconița aurie.
- **Etichetele de stare** colorate: fundal din aceeași culoare, transparent (~15%), fără chenar.
- **Câmpurile de formular**, butoanele și panourile urmează aceleași reguli; butonul principal rămâne auriu plin.

Ce nu intră acum: tema deschisă (varianta D) și „Negru Pro” (C), respinse **[Andrei]**; animații de derulare (§6 din designul mare: fără animații de scroll).

**Un punct de control la mijloc:** prototipul arată doar fișa clientului, pe laptop. Întâi se fac baza temei (`tema.css`, bara laterală, bara de sus, tab-urile) și două ecrane, **fișa clientului și lista de lead-uri, plus felul în care arată pe telefon**; Andrei le vede în browser și abia apoi tema se întinde pe restul. **[apelul meu: Andrei judecă vizual, așa se evită refacerea totului]**

Tot CRM-ul primește tema: lead-uri, fișa de lead, programarea, Program, Clienți, fișa clientului, Task-urile mele, Echipa, pagina de intrare și cea de parolă nouă. Pe telefon (aplicația are deja o aranjare pe ecran îngust) totul trebuie să rămână folosibil; bara laterală de sticlă e gândită pentru laptop.

## 3. Spațiul demo

- **Doar pentru Andrei.** Fără login public, fără link pentru clienți: el face pozele, clipurile și arată de pe laptopul lui. **[Andrei]**
- **Stă în baza de test** (`buildwithac-crm-test`), se vede pe previzualizare și pe `npm run dev`. **Producția nu se atinge niciodată.** **[apelul meu]**
- **Pornire și resetare cu o comandă** (ex. `npm run demo`, din `crm/`): umple CRM-ul cu setul demo; rulată din nou, aduce totul la aceeași stare de pornire, ca tutorialul să se poată filma de mai multe ori de la zero. Refuză să ruleze pe altceva decât testul (ca `npm run seed`). **[apelul meu, aprobat]**
- **Conținutul:** o firmă care pare să meargă de ~3 luni. **[apelul meu, aprobat]**
  - ~40–60 de lead-uri din toate sursele (formular site, reclamă Meta, reclamă TikTok, recomandare, adăugate de mână) și în toate stadiile, cu notițe și Parcurs credibil;
  - ~6–8 clienți, cu proiecte pe toate serviciile și în toate stadiile (Discuție → Mentenanță), unul cu două proiecte, unul cu colaborarea încheiată;
  - task-uri (unele întârziate, unele pentru azi), materiale (link-uri; fișiere doar dacă e simplu), conturi, livrări cu stări, notițe;
  - programul closerului cu discuții în zilele următoare;
  - echipa: vezi mai jos.
- **Echipa și perspectivele:** Andrei vrea „ambele variante, să se vadă din toate perspectivele”. **[Andrei]** De aici:
  - **Conturi demo pe fiecare rol** (2 calleri, 1 closer, 1–2 constructori), cu nume românești inventate și adrese credibile, separate de conturile `…@test.buildwithac.ro` folosite de testele automate (acestea rămân neschimbate). Andrei intră în oricare dintre ele, cu parola de test, ca să filmeze ce vede fiecare rol. Adresele: `prenume@buildwithac.ro` (ex. `mara@buildwithac.ro`), ca să nu apară „test” sau „demo” în poze. **[apelul meu]**
  - **Două moduri ale comenzii:** cu echipă (implicit: lead-urile, programările și proiectele împărțite între oameni) și „singur” (ex. `npm run demo -- --singur`: totul e al lui Andrei, echipa nu apare în atribuiri), pentru clipurile în care CRM-ul e arătat ca unealta unui om care lucrează singur. **[apelul meu, din „ambele variante”]**
  - **Niciun e-mail nu pleacă spre adresele demo** (n-au căsuță; un e-mail întors ar strica reputația domeniului, care și așa intră în Spam la Andrei). Constructorul verifică ce trimite CRM-ul pe mediul de test și oprește trimiterea către conturile demo. **[apelul meu]**
- **Nume românești inventate**, credibile; nicio persoană sau firmă reală, niciun număr de telefon real (numere evident de probă), niciun domeniu real al altcuiva (ex. `.ro` inventate sau `exemplu.ro`).
- **Datele se calculează față de ziua rulării**, ca „azi”, „mâine”, „întârziat” și „acum 2 zile” să arate corect oricând se filmează. **[apelul meu, aprobat]**
- **Crește cu etapa 3:** fiecare bucată următoare (încasări, dashboard, reclame, calendar) adaugă în setul demo datele ei. **[apelul meu, aprobat]**
- **Datele de test de acum** (Laura Ene, Florăria Iris și lead-urile pe care se bazează testele automate) nu se strică. Au nume credibile, deci **pot face parte din firma demo** și pot apărea în filmări; ce lasă în urmă testele e2e (lead-uri create la rulare) dispare la `npm run demo`. Testele care citesc prima pagină a listei (ex. `lista.spec.ts`) nu trebuie să pice din cauza lead-urilor demo: fie datele demo se ordonează astfel încât să nu le împingă, fie testul caută în loc să citească pagina 1. **[apelul meu]**

## 4. Constrângeri

- Codul în `crm/` (Next.js 16, App Router; înainte de cod, `crm/AGENTS.md` / `site/AGENTS.md` după caz), Tailwind v4, tema dintr-un singur loc: `crm/app/tema.css`.
- Totul în română, cu ș/ț cu virgulă.
- Testele existente (vitest, permisiuni/RLS, Playwright e2e, `tsc`, lint) trebuie să treacă după schimbare; testele e2e care caută după text cu majuscule sau după clase vechi se ajustează, nu se șterg.
- Lucrul pe o ramură nouă; în `main` doar după ce Andrei vede previzualizarea.
- Nicio migrație de bază de date nu e de așteptat pentru bucata asta; dacă totuși apare, se aplică întâi pe test.

## 5. Ce rămâne la constructor

- Cum se transpune prototipul în clasele din `tema.css` și în componente (`Navigare`, `Taburi`, layout-ul aplicației și al paginilor de cont); ce clase Tailwind locale se înlocuiesc.
- Setul exact de iconițe (desenate inline sau o bibliotecă mică; fără dependențe grele).
- Cum conviețuiesc setul demo și datele de test: același proiect de test, cu o resetare care le aduce pe amândouă la starea lor, sau alt mecanism, cu condiția ca testele automate să meargă după `npm run seed` ca acum.
- Structura scriptului demo și cum se generează datele (fix, scrise de mână, cu date relative).
- Dacă rularea testelor e2e lasă urme în setul demo, cum se curăță (de ex. `npm run demo` din nou).

## 6. Succes

- Andrei deschide previzualizarea și zice că arată ca varianta A, pe toate ecranele.
- După `npm run demo`, fiecare ecran pe care îl filmează arată plin și credibil, fără nimic „de test” vizibil (fără „Test lead e2e”, fără `@test.` în locurile care apar în poze, dacă se poate evita).
- Testele trec ca înainte.
