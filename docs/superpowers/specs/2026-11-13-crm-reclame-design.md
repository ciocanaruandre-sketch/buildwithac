# CRM, bucata 3: lead-urile din reclame și pagina „Reclame”

*2026-11-13. Sursa: discuția cu Andrei din 2026-11-13, codul din `crm/` și `site/`, macheta `prototip/crm-reclame.html` (varianta **B · Carduri cu pâlnie**, aleasă). Marcaje: **[Andrei]** = decizia lui; **[apelul meu]** = ales de Claude, nerespins de Andrei; **[de verificat]** = se confirmă la construcție.*

## 1. De ce

Andrei nu rulează încă reclame, dar urmează să le pornească pentru servicii (site-uri, automatizări, 1 la 1). Vrea să știe, fără să socotească de mână, **ce reclamă îi aduce clienți și bani**. Cine completează formularul după ce a apăsat pe o reclamă trebuie să intre singur în CRM, etichetat cu reclama din care a venit, iar banii încasați de la clienții aduși de reclama aceea trebuie să apară lângă banii cheltuiți pe ea.

**Reușita:** după câteva săptămâni de reclame, Andrei deschide pagina „Reclame” și vede pe loc care reclamă merită ținută și care trebuie oprită.

## 2. Ce e deja

- Formularul de pe homepage (`site/components/home/FormularContact.tsx`) trimite lead-ul la `crm/app/api/intrare/site/route.ts`, care îl salvează cu `primesteCerere` (`crm/lib/intrare.ts`), cu sursa fixă `formular_site`.
- Site-ul ține minte UTM-urile din link (`PastreazaUtm`, `sessionStorage`, primul link câștigă) și le trimite cu formularul; CRM-ul le salvează în `cereri.utm` și le arată pe fișa lead-ului la „Reclamă” (`crm/app/(app)/lead-uri/[id]/page.tsx`).
- Sursele `reclama_meta` și `reclama_tiktok` există (migrația `20261110000005`), dar azi se pun doar de mână.
- Clientul e legat de lead (`clienti.lead_id`); banii sunt în `transe` (Finanțe, `incasat_lei − returnat_lei`), pe `proiecte` → `clienti`.
- Pagina de confidențialitate spune deja că se salvează din ce reclamă sau postare a venit omul și că site-ul nu folosește cookie-uri de reclamă sau de urmărire. Rămâne adevărat după bucata asta.
- Lead-urile care nu devin clienți se șterg singure după 90 de zile de la ultima cerere (cron-ul zilnic), cum promite `/confidentialitate`.

## 3. Ce intră

### 3.1 Drumul unui lead din reclamă

1. Omul apasă pe o reclamă obișnuită cu link (Meta: Facebook/Instagram; TikTok). Site-ul se deschide în browserul aplicației. **[Andrei]** (nu formularele care se deschid în aplicație)
2. Linkul duce direct la formular, cu serviciul deja ales: `https://buildwithac.ro/?serviciu=site#formular` (valorile `serviciu` = cheile din `SERVICII`). **[apelul meu]** Un `serviciu` necunoscut se ignoră.
3. Omul completează formularul; lead-ul intră în CRM ca acum.
4. O cerere e **din reclamă** doar dacă are `utm_medium=reclama` **și** `utm_campaign` sau `utm_content` nevid; atunci CRM-ul pune sursa după `utm_source`: `fb`, `ig`, `facebook`, `instagram`, `msg`, `an`, `meta` → **Reclamă Meta**; `tiktok` → **Reclamă TikTok**. Orice altceva (inclusiv link-uri din bio sau din postări cu UTM, fără `utm_medium=reclama`) → `formular_site`, ca acum, cu UTM-urile păstrate pe cerere. **[apelul meu]** Se compară fără majuscule. Așa, un link organic cu `utm_source=instagram` nu devine niciodată „reclamă”.
5. Fișa lead-ului arată platforma, campania și numele reclamei, în cuvinte, nu în forma brută `utm_…` de azi. **[apelul meu]**

Sursa unui lead rămâne cea de la prima lui cerere (cum e azi în `primesteCerere`). **[apelul meu]**

### 3.2 Textul pentru platforme

Andrei lipește o singură dată un text la parametrii URL ai reclamei; platforma pune singură numele campaniei și al reclamei. Documentul de ajutor (în `docs/` sau pe pagina „Reclame”, alegerea constructorului) dă textul exact:

`utm_medium=reclama` e semnul după care CRM-ul recunoaște o reclamă (§3.1); link-urile din bio și din postări nu-l folosesc.

- **Meta** (Ads Manager → reclama → „Parametri URL”): `utm_source={{site_source_name}}&utm_medium=reclama&utm_campaign={{campaign.name}}&utm_content={{ad.name}}` **[de verificat]** numele exact al câmpului din Ads Manager în română și valorile lui `{{site_source_name}}`.
- **TikTok** (Ads Manager → reclama → „URL parameters”/„Tracking”): `utm_source=tiktok&utm_medium=reclama&utm_campaign=__CAMPAIGN_NAME__&utm_content=__CID_NAME__` **[de verificat]** macro-urile exacte de la TikTok pentru numele campaniei și al reclamei.

Fără pixel Meta și fără TikTok Pixel. **[Andrei]** (se adaugă doar dacă lead-urile ies prea scumpe; ar cere banner de cookie-uri și altă frază pe `/confidentialitate`)

### 3.3 Reclama ca lucru în CRM

- O **reclamă** = platformă + campanie (`utm_campaign`) + nume (`utm_content`). Apare singură la primul lead venit cu combinația asta. **[apelul meu]**
- **„+ Reclamă”**: Andrei adaugă de mână o reclamă care n-a adus încă niciun lead (platformă, campanie, nume, suma cheltuită), ca banii ei să intre în total. Când vine primul lead cu exact aceeași combinație, se leagă de ea, nu se face una nouă. **[Andrei]**
- **Cheltuit:** un singur total pe reclamă, în lei întregi, scris de Andrei din Ads Manager („Suma cheltuită”) și actualizat când vrea. Gol = „scrie suma” (auriu), iar reclama nu primește verdict. **[Andrei]**
- **Unirea:** dacă Andrei redenumește o reclamă în Meta, numele nou face o reclamă nouă. Din pagină, Andrei unește două reclame într-una: lead-urile și cheltuiala trec la cea păstrată. **[Andrei]** Lead-urile care vin mai târziu cu numele vechi ajung tot la cea păstrată. **[apelul meu]**
- O reclamă se poate șterge doar dacă nu are niciun lead (una adăugată din greșeală). **[apelul meu]**

### 3.4 Atribuirea

- Un lead aparține unei reclame doar dacă **cererea care l-a creat** (prima lui cerere) e din reclamă (§3.1). Dacă omul a venit întâi altfel (organic, recomandare, de mână) și abia apoi dintr-o reclamă, nu e al reclamei: nu ea l-a adus. Așa sursa lead-ului și reclama lui spun mereu același lucru. **[principiul lui Andrei: „clientul rămâne al reclamei care l-a adus prima dată”]** (Un lead șters după 90 de zile care revine dintr-o reclamă e un lead nou, deci al reclamei.)
- Un client aparține reclamei lead-ului lui. Toți banii lui (toate proiectele, net de returnări, inclusiv mentenanța) intră la reclama aceea. **[apelul meu]** Tranșele de tip `inainte` (banii de dinainte de Finanțe) nu contează: atunci nu existau reclame.
- **Lead-uri adăugate de mână cu sursa „Reclamă Meta/TikTok”** (fără UTM) nu intră la nicio reclamă; pagina le arată doar ca o linie sub totaluri: „N lead-uri din reclame adăugate de mână, fără reclamă anume”. **[apelul meu]**
- **Lead-uri** = câte lead-uri a adus reclama. **Discuții** = câte dintre ele au avut **vreodată** o discuție programată: se numără în clipa programării și nu mai scade, chiar dacă discuția e mutată sau ștearsă după (codul șterge rândurile viitoare din `discutii` la reprogramare și la schimbarea stării sau a closerului). Un lead devenit client fără discuție programată se numără și el. **Clienți** = câte au devenit clienți. **[apelul meu]**
- **Încasat** = suma netă încasată de la clienții reclamei. **Mai vin** = tranșele lor programate, neîncasate încă. **[apelul meu, din machetă]**

### 3.5 Cifrele nu dispar odată cu lead-urile

Lead-urile care nu devin clienți se șterg după 90 de zile (promisiune publică, nu se schimbă), iar clienții îi șterge Admin la un an după ultimul proiect (`clientiDeSters` în `crm/lib/retentie.ts`; ștergerea ia cu ea proiectele și tranșele). Cifrele reclamelor **nu au voie să scadă** din cauza asta: fiecare reclamă își păstrează numărătoarea (lead-uri, discuții, clienți) **și banii încasați de la clienții șterși**, fără date personale (fără nume, telefon, e-mail, text liber, fără legătură spre om). **[apelul meu]** La ștergerea unui client, suma lui netă încasată se adaugă la un total anonim al reclamei; „mai vin” nu se păstrează (la un an după ultimul proiect nu mai e nimic programat). Cum se ține (un rând anonim pe lead-ul atribuit, cu legătura spre lead pusă pe `null` la ștergere, contoare, trigger-e) e alegerea constructorului; condiția e să nu rămână nimic din care să se poată afla cine a fost omul, iar numărătoarea să se facă în clipa întâmplării (trigger), nu recalculată la deschiderea paginii. **[de verificat]** cu `legal-advisor-ro` dacă e nevoie de o propoziție pe `/confidentialitate` (părerea mea: nu, fiindcă nu sunt date personale).

### 3.6 Pagina „Reclame” (`/reclame`)

Aspectul: `prototip/crm-reclame.html`, **varianta B**. **[Andrei]**

- Doar **Admin**: în meniul lateral, după „Finanțe”, și în meniul de jos pe telefon. Ceilalți nu o văd, iar baza de date nu le dă datele (RLS). **[apelul meu]**
- **Sus, 4 totaluri:** Cheltuit (cu „X lei pe lead”), Lead-uri (din N reclame), Clienți (cu „X lei pe client”), Încasat (verde, cu „+ X lei mai vin”).
- **Câte un card pe reclamă**, pe două coloane pe laptop și pe una pe telefon: numele reclamei, campania, eticheta platformei (Meta albastru, TikTok turcoaz); pâlnia cu trei bare (lead-uri, discuții, clienți), scalată după reclama cu cele mai multe lead-uri; jos Cheltuit (se scrie pe loc), Încasat (+ mai vin), Câștig (încasat − cheltuit, verde/roșu).
- **Verdictul** de pe fiecare card:
  - fără sumă: „Scrie cât ai cheltuit ca să vezi dacă merită.” (auriu)
  - fără clienți: „Niciun client încă. N lead-uri, X lei fiecare.” (roșu)
  - câștig ≥ 0: „Aduce bani: la 1 leu cheltuit ai încasat X lei.” (verde)
  - câștig < 0 cu clienți: „Încă pe minus, dar mai vin X lei.” (auriu)
- **Ordinea cardurilor:** după câștig, cele mai bune sus; cele fără sumă la final. **[apelul meu]**
- Butonul **„+ Reclamă”** și acțiunea **„Unește cu…”** pe card. Locul lor exact e alegerea constructorului, în stilul temei.
- Fără reclame încă: un ecran gol care spune ce text să lipească în Ads Manager. **[apelul meu]**
- **Fără filtrul de perioadă** la început. **[Andrei]** (cheltuiala e un total; pe luni n-ar ieși corect)
- **Modul filmare:** numele reclamelor nu sunt date personale și rămân clare; nimic nou de blurat. **[apelul meu]**
- **Datele demo:** `npm run demo` umple și reclamele (cele 5 din machetă: toate felurile de verdict), cu lead-uri și clienți legați de ele. **[apelul meu]**

### 3.7 Curățenie lipită de bucata asta

- Coloana veche `proiecte.incasat_lei` (înlocuită de Finanțe) se scoate în migrația bucății. **[din stadiul Finanțelor]** În același pas: `crm/scripts/date/baza.mts` (o scrie încă, la linia cu `incasat_lei: 1800`) și tipurile regenerate (`crm/lib/baza.types.ts`); apoi o căutare după `incasat_lei` pe `proiecte` în cod, vederi și funcții (atenție: `transe.incasat_lei` e altă coloană și rămâne).

## 4. Ce NU intră

- Pixelul Meta / TikTok, Conversions API, bannerul de cookie-uri. **[Andrei]**
- Formularele care se deschid în aplicație (Meta Instant Forms, TikTok Lead Gen) și webhook-urile lor. **[Andrei]**
- Cheltuiala adusă automat din Meta/TikTok (API-ul de reclame). **[Andrei]** (se poate adăuga mai târziu)
- Filtrul pe perioadă și cheltuiala pe luni.
- Statistici pe celelalte surse (recomandare, cold calling etc.): țin de bucata 4, dashboard.

**Anti-scopuri:** orice face site-ul să urmărească oamenii (cookie-uri, pixeli); orice ar contrazice ce scrie pe `/confidentialitate`; cifre care se schimbă singure în timp fără ca Andrei să fi făcut ceva (de aici §3.5).

## 5. Căile cântărite

| Cale | Ce înseamnă | Pentru | Contra |
|---|---|---|---|
| **A. Reclama duce pe formularul site-ului, UTM + cheltuială scrisă de mână** (aleasă) | Linkul cu parametri; CRM-ul citește UTM-urile pe care le primește deja | aproape totul există; fără aplicații la Meta/TikTok; fără cookie-uri | Meta optimizează doar pe click-uri (fără pixel); cheltuiala o scrie Andrei |
| B. Formularele din aplicație (Instant Forms / Lead Gen) | Webhook-uri de la Meta și TikTok spre CRM | mai multe lead-uri, omul nu iese din aplicație | aplicații și permisiuni aprobate de platforme, lead-uri mai slabe, mult de construit |
| C. Ca A, plus cheltuiala din API-ul Meta | Legătură cu contul de reclame | cifre fără muncă de mână | aplicație Meta, aprobări, tokenuri; prea mult pentru câteva reclame |

Andrei a ales A (2026-11-13), fără pixel deocamdată, cu pagina „Reclame” în varianta B a machetei.

## 6. Ce rămâne la constructor

- Forma tabelelor (reclamele, legătura lead → reclamă, unirea, numărătoarea anonimă) și funcțiile/vederile pentru cifre, cu RLS doar pentru Admin.
- Unde se calculează sursa din UTM (în ruta de intrare sau în `primesteCerere`) și testele pentru toate valorile din §3.1.
- Citirea lui `?serviciu=` pe site (alege pastila din `FormularContact` și derulează la `#formular`) fără să strice `PastreazaUtm`.
- Unde stă textul de lipit din §3.2.
- Iconița „Reclame” din meniu, în stilul celorlalte.
- Migrațiile merg întâi pe TEST; pe PRODUCȚIE doar cu „da”-ul lui Andrei (el rulează `db push` cu `!`).
- Verificările obișnuite: vitest, RLS, e2e, `tsc`, lint în `crm/`; în `site/`: `npx vitest run`, `npm run verifica`, `npm run lint`.
