# Coperta nouă și serviciul CRM: design

**Data:** 2026-11-27 · **Ramura:** `coperta` · **Prototipul:** `prototip/coperta.html` (servește site-ul local) și previzualizarea Vercel a ramurii.

## De ce
În ultimele 7 zile: 252 de vizitatori, aproape toți de pe Facebook (o postare a lui Andrei), 70% pe telefon, 75% bounce. Coperta arăta doar poza, „buildwithac” și „AI pe înțelesul tău, în română”: omul nu afla ce primește. Primul buton („Analiză gratuită”) venea după ~3 ecrane, la finalul Cortinei. Ținta: din primul ecran, omul știe ce face Andrei și are butonul la îndemână (ca pe stoneflow.ro, fără cifrele lor inventate).

## Ce se face
**Coperta (varianta C, aleasă de Andrei în browser):**
- Rămân poza în straturi, parallax-ul și intrarea animată a numelui. Tot blocul (numele și textul de deasupra) coboară cu ~6svh față de coperta veche, ca eticheta să nu intre în soarele din poză; între rândul despre claritate și nume, ~20px.
- Pe cer, deasupra numelui, de sus în jos:
  - eticheta aurie, Inter 800, majuscule: „SITE-URI · AUTOMATIZĂRI · CRM” (fără „AI”, mai mare decât în primul prototip);
  - fraza (Unbounded): „Programări uitate, mesaje fără răspuns, clienți de care nu mai știi nimic? *Le rezolv eu.*” (partea în italic: Instrument Serif, auriu);
  - un rând auriu, același font ca eticheta, puțin mai mic: „Împreună construim claritate în afacerea ta”.
- Jos, peste o umbră care întunecă doar partea de jos: butoanele „Analiză gratuită” (gradient, la `#formular`) și „Ghiduri gratuite” (la `/ghiduri`), apoi „Îți răspund în 1–2 zile · Vorbești direct cu mine” (din secțiunea Colaborare, deci adevărat).
- Dispar „AI pe înțelesul tău, în română” și indicatorul „scroll”.

**Cortina:** fără vârstă („Salut, sunt Andrei, am terminat Mecatronica la Politehnica din București.”) și fără cele două butoane (s-au mutat pe copertă).

**Servicii (textele lui Andrei, finale):**
- cardul nou „CRM *pentru echipe de vânzări*”, primul din listă: „Fiecare lead intră automat. Callerii preiau lead-urile, closerii închid procesul de vânzare, iar tu analizezi toate datele și performanța echipei. De asemenea, ai integrare Meta pentru a urmări corect lead-urile provenite din reclame, dar și pentru o analiză completă a acestora.” Restul se renumerotează (01 CRM, 02 Site, 03 Automatizări, 04 Sesiune 1 la 1).
- „Site făcut de la zero”: ultima frază devine „Optimizat pentru a funcționa eficient pe telefon.”
- „Automatizări”: „Răspunsurile pentru clienți, programările, mesajele de follow-up și orice muncă repetitivă de zi cu zi. Le integrez astfel încât să funcționeze automat, fără intervenția ta.”

**Formularul:** pastila nouă „CRM” (cheia `crm`); „Hai să vorbim” de pe cardul CRM o alege. Linkurile din reclame pot aduce `?serviciu=crm`.

## Puntea până se schimbă CRM-ul (de făcut într-o sesiune viitoare)
CRM-ul (`crm/`) acceptă la `/api/intrare/site` doar `site | automatizari | 1la1 | altceva` (enum în baza de date, `crm/lib/tipuri.ts`, `crm/lib/azi.ts`, categoriile din `finante/actiuni.ts`). Până atunci, `site/lib/crm.ts` trimite o cerere `crm` ca `altceva`, cu descrierea începând cu „[CRM] ”. E-mailul către Andrei spune „CRM”. **De făcut mai târziu:** `crm` în CRM (migrare + `db push` rulat de Andrei), apoi scoasă puntea din `site/lib/crm.ts`. Se notează în `docs/progres-brainstorming.md`.

## Abordări luate în calcul
- **A · Text jos** (fraza și butoanele peste om, ca Flowstone): respinsă de Andrei.
- **B · Bilet lipit** (hârtie crem cu bandă): acoperea omul; respinsă.
- **C · Totul pe cer**: aleasă; omul și numele rămân curate, mesajul se citește înainte de nume.
- Pentru CRM: pastila „CRM” cu punte spre `altceva` (aleasă: Andrei vrea serviciul acum, CRM-ul mai târziu) vs. card care alege „Altceva” (omul ar vedea altă pastilă decât a apăsat) vs. schimbarea CRM-ului acum (amânată de Andrei).

## Reguli și decizii actualizate
- `CLAUDE.md`: „CRM-ul e în portofoliu, dar nu e încă serviciu” devine: CRM-ul e serviciu (cardul de la Servicii); regulile lui în `servicii/` vin mai târziu.
- Tonul: fraza e la persoana I singular („Le rezolv eu”); „Împreună construim” înseamnă Andrei și clientul, nu o echipă.

## Nu intră aici
Clarity și banner-ul de cookie-uri (lucrarea următoare), varianta în engleză, tăierea fonturilor, logo-ul la 104px, alt-urile din portofoliu, pastila din meniu pe telefon.

## Lăsat constructorului
- Se scoate comutatorul de prototip și `?fraza=`; textul rămâne fix. CSS-ul variantelor intră curat în `home.css`.
- Pe desktop: fraza pe cer trebuie să încapă deasupra numelui fără să atingă luna; verificat la 1440px.
- `prefers-reduced-motion`: blocul de jos fără animație de intrare.
- Testele e2e din `tests/e2e/home.spec.ts` (manifestul, `.cortina-but`) se actualizează: butoanele se testează pe copertă; testele unitare pentru `crm` în formular și pentru punte.
