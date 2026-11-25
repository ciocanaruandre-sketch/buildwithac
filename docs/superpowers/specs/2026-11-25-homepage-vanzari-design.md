# Homepage-ul pentru vânzări: design

Data: 2026-11-25. Ramura: `homepage-vanzari`. Stadiu: așteaptă aprobarea lui Andrei.

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

**Descrierea** (A): „Salut, sunt Andrei, am 24 de ani și am terminat Mecatronica la Politehnica din București. Știu că la început de drum le faci pe toate singur. Eu îți fac site-ul și automatizările, ca tu să ai timp *de clienții tăi.*” Dispare „tot gratuit ↓” (A). Sub text: butonul „Hai să colaborăm” (→ `#formular`) și linkul mic „Ai venit după un ghid? E aici →” (→ `/ghiduri`).

**Banda** rămâne (A), fără „tot gratuit” (A). Fâșia mare: site-uri de la zero · automatizări · sesiuni 1 la 1 · ghiduri gratuite · AI pe înțeles. Fâșia mică: vorbești direct cu mine · analiză gratuită · știi prețul dinainte · făcut pe măsura ta.

**Portofoliul.** Titlu „Ce am construit *până acum.*”; intro „Proiecte făcute de mine și concepte pentru firme mici, ca să vezi cum ar putea arăta și al tău. Conceptele sunt marcate.”
- Primul e CRM-ul, etichetat „Proiect”: „CRM pentru echipe de vânzări. Cererile, apelurile, programările și reclamele Meta, într-un singur loc. L-am făcut pentru mine, apoi l-am dus până unde poate lucra o echipă întreagă.”
- Captura vine din modul demo (baza de test, date inventate), cu numele, telefoanele și sumele blurate (A); în colț scrie „date demo”. `npm run demo` golește și reumple **baza de test** a CRM-ului; producția nu e atinsă.
- ImobSearch, cele 3 automatizări și cele 3 concepte rămân. Poza de stoc de la ImobSearch se înlocuiește dacă Andrei trimite o captură.
- **3 variante:** (a) CRM mare, apoi rânduri care se trag cu degetul (automatizări, concepte); (b) teanc de foi; (c) CRM mare + listă scurtă cu miniaturi.

**Servicii**, aceleași 3 carduri. Titlu „Cu ce te *pot ajuta.*”
- Site: „Îl fac de la zero, după firma ta. Îmi povestești ce faci și cui vinzi, îți arăt câteva variante, iar tu alegi. Merge bine pe telefon, de unde intră cei mai mulți.”
- Automatizări: „Răspunsurile la clienți, programările, mesajele de revenire, tot ce faci la fel în fiecare zi. Le pun să meargă singure, în aplicațiile pe care le ai deja.”
- Sesiune sau ghid: „Vrei să înveți să le faci singur? Îți arăt live, pe ecran, cum folosești AI-ul în munca ta, sau îți scriu un ghid doar pentru tine.”

**Calculatorul.** Titlu „Cât te costă să faci totul *de mână?*” Două file:
- „Timpul meu”: minute pe zi cu munca repetată (10–240, la început 45) × 250 de zile lucrătoare × cât valorează o oră (20–300 lei, la început 50). La început arată 187 de ore și 9.375 lei pe an.
- „Clienții pierduți”: cereri pe săptămână care rămân fără răspuns și nu se mai întorc (1–30, la început 5) × 52/12 × câte din 10 cumpără (1–10, la început 3) × cât aduce un client (50–5.000 lei, la început 500). La început arată 3.250 lei pe lună.
- Sub rezultat: formula cu cifrele omului și „Estimare pe cifrele tale, nu o promisiune.” Butonul „Vreau analiza gratuită →” duce la formular, alege „Automatizări” și scrie cifrele în „Descriere”. Nu suprascrie niciodată ce a scris omul de mână.
- Merge cu tastatura și cititorul de ecran; nu se trimite nimic până la formular.
- **2 variante:** bon de casă / foaie de caiet.

**Formularul** (`#formular` rămâne, ca să meargă linkurile din reclame). Titlu „Vrei să *colaborăm?*” Text: „Începem cu o analiză gratuită. Îmi povestești cum lucrezi, iar eu îți spun ce s-ar putea automatiza și ce aș îmbunătăți la site. Dacă n-ai încă site, îmi spui cum ți-l imaginezi și pornim de acolo.” (conținutul analizei: A). Sub el: „Știi prețul înainte să încep · Vorbești direct cu mine · Îți răspund în 1–2 zile”. Butonul: „Vreau analiza gratuită”. Câmpurile rămân aceleași.

**Ghidurile** (`#ghiduri`). Titlu „Vrei să înveți *singur?*” Dispar secțiunea animată (A) și `PanouGhid`.
- „Ghiduri gratuite”: „Pas cu pas, cu prompturile gata de copiat. Fără cont și fără card.” + numărul lor, calculat → `/ghiduri`.
- „Ghiduri premium”, cu lacăt și „În curând” (A): „Mai lungi, pentru un singur lucru dus până la capăt. Lasă-mi e-mailul și te anunț când apar.” → `#email`.
- **2 variante:** două foi lipite / un plic sigilat cu lacăt.

**Peretele TikTok** rămâne (A). **Newsletter**: „Îți scriu când apare un ghid nou, gratuit sau premium, ori când se lansează ceva în AI care chiar contează. Doar atunci.” (verificat cu pagina de confidențialitate).

**Întrebările**, între newsletter și contact (A). Se adaugă „Ce primesc la analiza gratuită?”; la automatizări, „la o consultație” devine „la analiza gratuită”. „Scrie-mi direct” duce la `#contact`.

**Contact**: doar Instagram și e-mail.

**Meniul**: Portofoliu · Servicii · Ghiduri · Social media · Contact · Colaborare (→ `#formular`). „Pentru cine” iese.

**Finalul ghidurilor**: un card „Vrei să-l fac eu pentru tine?” → `/#formular`.

**Titlul din Google**: „buildwithac · site-uri și automatizări cu AI”; descrierea: „Site-uri de la zero și automatizări cu AI pentru firme mici, plus ghiduri gratuite în română.”

## Ce rămâne la constructor
Animațiile (GSAP, oprite la „mișcare redusă”), spațierea, numele fișierelor, forma comutatorului. Sistemul vizual e cel din `CLAUDE.md`. Se actualizează testele, `CLAUDE.md` (drumul omului) și `docs/progres-brainstorming.md`.

## Gata când
Andrei a ales variantele și a verificat previzualizarea pe iPhone; `npx vitest run`, `npx playwright test`, `npm run verifica`, `npm run lint`, `npm run e2e:prod` trec; comutatorul a ieșit; unirea în `main` doar la „da”.
