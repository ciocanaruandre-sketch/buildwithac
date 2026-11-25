# Homepage-ul pentru vânzări: design

Data: 2026-11-25. Ramura: `homepage-vanzari`. Stadiu: aprobat de Andrei (2026-11-25).

## De ce
Andrei vrea ca homepage-ul să aducă în primul rând **cereri de colaborare** (lead-uri). Ghidurile rămân pe site, pe plan secund. Omul vede întâi cine e Andrei și ce a făcut, apoi serviciile, apoi formularul. Pagina e prea încărcată, iar textele trebuie să sune mai uman.

Azi, la 390px: 22 de ecrane, portofoliul începe după ecranul 10, formularul e pe la 20.

## Scopuri
- Portofoliul începe imediat după descriere și bandă (pe la ecranul 2–3), iar formularul înainte de ecranul 10.
- Pagina are cel mult 17 ecrane la 390px.
- Cine vine din clip după un ghid îl găsește din prima parte a paginii.

## Ce nu facem
- Coperta (hero) nu se schimbă deloc.
- CRM-ul **nu** e serviciu acum (Andrei îl adaugă după ce îl stăpânește).
- **Nicio cifră, recenzie sau clienți inventați** („20+ clienți”, procente de conversie). În loc: calculatorul și promisiunile care se pot ține. Părerile reale intră lângă portofoliu când există.
- Fără prețuri pe site (decizie mai veche). Fără poze sau texte luate de la stoneflow.ro; de acolo vine doar ideea calculatorului.
- Nu se schimbă: `/ghiduri`, trimiterea formularului (API, Resend, CRM), abonarea Kit.

## Abordări
1. Prototip separat în `prototip/`, apoi codul: prototipul e în urma site-ului, munca s-ar face de două ori.
2. **Direct pe site, pe ramură, cu comutator de variante (aleasă de Andrei).** Comutatorul și variantele nealese se scot înainte de unirea în `main`.
3. Două publicări: mai repede ceva live, dar o vreme site-ul e pe jumătate nou.

## Ordinea (decisă de Andrei)
copertă → descriere → banda → portofoliu → servicii → calculator → formular → ghiduri gratuite/premium → peretele TikTok → newsletter → întrebări → contact (Instagram + e-mail)

Locul calculatorului (între servicii și formular) e propunerea mea.

## Secțiunile și textele
Textele marcate (A) sunt ale lui Andrei; restul sunt propuneri, se corectează pe previzualizare.

**Descrierea** (A): „Salut, sunt Andrei, am 24 de ani și am terminat Mecatronica la Politehnica din București. Știu că la început de drum le faci pe toate singur. Eu îți fac site-ul și automatizările, ca tu să ai timp pentru gestionarea afacerii.” (tot textul alb, schimbat de Andrei pe previzualizare) Dispare „tot gratuit ↓” (A). Sub text, **două butoane unul lângă altul** (A), de lățime egală, pe tot rândul, și la 390px: „Analiză gratuită” (plin, gradientul logo-ului, → `#formular`) și „Ghiduri gratuite” (contur, → `/ghiduri`). Textele sunt scurte ca să încapă pe un rând pe telefon.

**Banda** rămâne (A), fără „tot gratuit” (A). Fâșia mare: site-uri de la zero · automatizări · sesiuni 1 la 1 · ghiduri gratuite · AI pe înțeles. Fâșia mică: vorbești direct cu mine · analiză gratuită · știi prețul dinainte · construit pe nevoile tale.

**Portofoliul.** Titlu „Ce am construit *până acum.*”; intro „Proiecte făcute de mine și concepte pentru firme mici, ca să vezi cum ar putea arăta și al tău. Conceptele sunt marcate.”
- Primul e CRM-ul, etichetat „Proiect”: „CRM pentru echipe de vânzări. Cererile, apelurile, programările și reclamele Meta, într-un singur loc. L-am făcut pentru mine, apoi l-am dus până unde poate lucra o echipă întreagă.”
- Captura vine din modul demo (baza de test, date inventate), cu numele, telefoanele și sumele blurate (A); în colț scrie „date demo”. `npm run demo` golește și reumple **baza de test** a CRM-ului; producția nu e atinsă.
- ImobSearch, cele 3 automatizări și cele 3 concepte rămân. Poza de stoc de la ImobSearch se înlocuiește cu o captură de pe imobsearch.ro, făcută de Claude (A), iar cardul duce la https://www.imobsearch.ro.
- **3 variante:** (a) CRM mare, apoi rânduri care se trag cu degetul (automatizări, concepte); (b) teanc de foi; (c) CRM mare + listă scurtă cu miniaturi.

**Servicii**, aceleași 3 carduri. Titlu „Cu ce îți pot fi *de ajutor.*”, sub el „Alegi ce ți se potrivește, în funcție de nevoile tale.” (A, formulat de mine)
- Site: „Îl fac de la zero, după firma ta. Îmi povestești ce faci și cui vinzi, îți arăt câteva variante, iar tu alegi. Merge bine pe telefon, de unde intră cei mai mulți.”
- Automatizări: „Răspunsurile la clienți, programările, mesajele de revenire, tot ce faci la fel în fiecare zi. Le pun să meargă singure, în aplicațiile pe care le ai deja.”
- Sesiune sau ghid: „Vrei să înveți să le faci singur? Îți arăt live, pe ecran, cum folosești AI-ul în munca ta, sau îți scriu un ghid doar pentru tine.”

**Calculatorul.** (Schimbat de Andrei pe previzualizare, 2026-11-25: o singură socoteală, pe câștig, nu pe pierdere; suma cu verde.) Titlu „Cât poți câștiga dacă nu mai faci totul *manual?*” Patru cursoare, fără file. **Sumele sunt prudente** (Andrei: „mult mai mici, să pară realizabil”; dacă nu se ating, omul i le reproșează):
- „Cereri pe săptămână la care răspunzi târziu sau deloc” (0–10, la început 3), din care se câștigă **1 din 10**; „Programări pe săptămână la care nu vine nimeni” (0–10, la început 2), din care se salvează **1 din 4** (reamintirile scad absențele cu cam un sfert, BMJ Open 2016, studii medicale); „Cât aduce un client” (50–500 lei, la început 150); „Minute pe zi cu munca repetată” (0–120, la început 30), din care se câștigă **jumătate**. „1 din 10” și „jumătate” sunt alegeri prudente, nu studii.
- Bonul arată presupunerile: „1 din 10 cereri”, „1 din 4 programări”, „Jumătate din timp”. Sumele se rotunjesc în jos la 10 lei. La început: „Poți câștiga până la **+510 lei** pe lună, plus 7 zile pe an pentru tine”; maximul posibil e 7.570 lei. Sub el: „Estimare prudentă, nu o promisiune. Nu scade costul automatizării.” Ce e pe zero nu apare; cu toate pe zero: „Mută un cursor ca să vezi cât poți câștiga.”
- Butonul „Vreau analiza gratuită →” duce la formular, alege „Automatizări” și scrie cifrele în „Descriere”. Nu suprascrie niciodată ce a scris omul de mână.
- Merge cu tastatura și cititorul de ecran; nu se trimite nimic până la formular.

**Formularul** (`#formular` rămâne, ca să meargă linkurile din reclame). Titlu „Vrei să *colaborăm?*” Text: „Începem cu o analiză gratuită. Îmi povestești cum lucrezi, iar eu îți spun ce s-ar putea automatiza și ce aș îmbunătăți la site. Dacă n-ai încă site, îmi spui cum ți-l imaginezi și pornim de acolo.” (conținutul analizei: A). Sub el: „Știi prețul înainte să încep · Vorbești direct cu mine · Îți răspund în 1–2 zile”. Butonul: „Vreau analiza gratuită”. Câmpurile rămân aceleași.

**Ghidurile** (`#ghiduri`). Titlu „Vrei să înveți *singur?*” Dispar secțiunea animată (A) și `PanouGhid`.
- „Ghiduri gratuite”: „Pas cu pas, cu prompturile gata de copiat. Fără cont și fără card.” + numărul lor, calculat → `/ghiduri`.
- „Ghiduri premium”, cu lacăt și „În curând” (A): „Mai lungi, pentru un singur lucru dus până la capăt. Lasă-mi e-mailul și te anunț când apar.” → `#email`.
- **2 variante:** două foi lipite / un plic sigilat cu lacăt.

**Peretele TikTok** rămâne (A). **Newsletter**: „Îți scriu când apare un ghid nou, gratuit sau premium, ori când se lansează ceva în AI care chiar contează. Doar atunci.” (pagina de confidențialitate spune azi „ghidurile noi și noutăți din AI”; se completează cu „gratuite sau plătite”).

**Întrebările**, între newsletter și contact (A). Se adaugă „Ce primesc la analiza gratuită?”; la automatizări, „la o consultație” devine „la analiza gratuită”. „Scrie-mi direct” duce la `#contact`.

**Contact**: doar Instagram și e-mail.

**Meniul**: Portofoliu · Servicii · Ghiduri · Social media · Contact · Colaborare (→ `#formular`). „Pentru cine” iese.

**Finalul ghidurilor**: un card „Vrei să-l fac eu pentru tine?” → `/#formular`.

**Titlul din Google**: „buildwithac · site-uri și automatizări cu AI”; descrierea: „Site-uri de la zero și automatizări cu AI pentru firme mici, plus ghiduri gratuite în română.”

## Ce rămâne la constructor
Animațiile (GSAP, oprite la „mișcare redusă”), spațierea, numele fișierelor, forma comutatorului. Sistemul vizual e cel din `CLAUDE.md`. Se actualizează testele, `CLAUDE.md` (drumul omului) și `docs/progres-brainstorming.md`.

## Gata când
Andrei a ales variantele și a verificat previzualizarea pe iPhone; `npx vitest run`, `npx playwright test`, `npm run verifica`, `npm run lint`, `npm run e2e:prod` trec; comutatorul a ieșit; unirea în `main` doar la „da”.
