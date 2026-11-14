# CRM, bucata 4: pagina „Azi”

*2026-11-14. **Aprobat de Andrei** („aprob”, 2026-11-14). Sursa: discuția cu Andrei din 2026-11-14, macheta `prototip/crm-azi.html` (varianta **C · Acum + restul**, aleasă de Andrei), transcrierea clipului „CRM EasyGrow explicat” și codul din `crm/`. Marcaje: **[Andrei]** = decizia lui; **[apelul meu]** = ales de Claude, nerespins de Andrei.*

## 1. De ce

Bucata 4 din etapa 3 era „dashboard și KPI”. Andrei a despărțit-o în două **[Andrei]**:
- **pagina „Azi”** (documentul ăsta): **ce ai de făcut**, prima pagină pe care o vezi când intri;
- **pagina de KPI** (cifre pe perioadă și pe om: pâlnia, timpul până la primul apel etc.): se face **separat, după**.

Azi, `/` te trimite direct la Lead-uri (constructorul ajunge la Clienți). Ce e urgent stă împrăștiat: callback-urile în Lead-uri, ratele în Finanțe, task-urile în „Task-urile mele”, cererile noi pe fișa clientului. Pagina „Azi” le adună pe toate și îți spune de unde să începi.

EasyGrow are pe dashboard doar trei cifre pe lună (apeluri, programări, rata de programare). Ale lor sunt mai degrabă KPI și intră în pagina de KPI de mai târziu, nu aici.

## 2. Ce face, ce nu face

**Face:**
- arată, pentru omul conectat, tot ce cere o acțiune acum sau în zilele următoare, în patru teme: **De sunat, Discuții, Lucru, Bani**;
- alege singură **cel mai urgent lucru** și îl pune într-un card mare, „Acum”;
- fiecare rând duce la locul unde se rezolvă (fișa lead-ului, a clientului, Finanțe), iar câteva acțiuni simple se pot face direct de pe pagină.

**Nu face (non-goals):**
- cifre pe perioadă, grafice, clasamente: sunt pentru pagina de KPI;
- **revenirile automate** (lead-urile refuzate care reapar după 7/14/21/28/60 de zile): **scoase de Andrei** **[Andrei]**;
- nu salvează nimic nou: nicio coloană, niciun tabel, **nicio migrație**;
- nu se actualizează singură în timp real: se recalculează la fiecare deschidere sau refresh (și după acțiunile făcute de pe ea).

**Ar fi un eșec dacă:**
- arată unui om ce nu are voie să vadă (bani unui caller, clienți unui constructor care nu e pe proiect);
- „Acum” propune altceva decât ar face Andrei primul (de exemplu un comision de plătit în locul unui lead nou nesunat de 15 ore);
- arată ca un șablon generic de dashboard (carduri identice cu cifre fără sens). Rămâne în tema A „Grafit” a CRM-ului.

## 3. Cum arată (varianta C) **[Andrei]**

Referința de aspect e `prototip/crm-azi.html#C`, cu comutatorul pe „C · Acum + restul”. **Laptopul e pe primul loc**: CRM-ul se folosește mai ales pe PC/laptop; pe telefon pagina trebuie doar să meargă bine, fără lustruire separată **[Andrei]**.

```
Bună dimineața, Andrei
Luni, 16 noiembrie · ce ai de făcut azi
[5 întârziate] [● 6 de sunat] [● 1 discuție azi] [● 2 task-uri azi] [● 3 rate de încasat]

┃ Acum  [Lead nou]
┃ Cosmin Ilie
┃ Sesiune 1 la 1 · Reclamă TikTok · intrat ieri, 18:40
┃ [Sună] [WhatsApp] [Mai târziu]
┃ Încă 4 întârziate după asta. Apasă pe o temă de mai jos ca să vezi tot.

[De sunat 6 | 2 întârziate] [Discuții 2 | 1 azi] [Lucru 8 | 2 întârziate] [Bani 7 | 1 întârziată]

Lista temei alese (prima temă, implicit):
[Lead nou] Cosmin Ilie · Sesiune 1 la 1 · Reclamă TikTok     intrat ieri, 18:40  [Sună] [WhatsApp]
[Callback] Ana Popescu · Site · „sună după 16”               trebuia ieri, 16:00 [Sună] [WhatsApp]
…
```

- **Sus:** salutul după oră („Bună dimineața” până la 12, „Bună ziua” până la 18, apoi „Bună seara”), data în română și rândul cu cifre. Pastila „întârziate” e roșie și apare doar dacă există întârzieri. O pastilă cu 0 nu apare. **[apelul meu]**
- **Cardul „Acum”:** eticheta tipului, numele, descrierea, când, butoanele rândului și „Mai târziu”. Sub ele: „Încă N întârziate după asta.” dacă mai sunt.
- **Patru plăci** (pe telefon, 2×2): numele temei, câte rânduri are, iar dedesubt „N întârziate” cu roșu sau un rezumat scurt („3 noi · 2 callback”, „1 azi”, „3 task-uri”, „2 rate”). Placa aleasă e evidențiată. Se văd doar temele rolului și doar cele care au rânduri.
- **Lista de sub plăci:** rândurile temei alese, cu eticheta tipului (Lead nou, Callback, Discuție, Task, Termen, Cerere nouă, Livrare, Rată, Comision, Vânzare), ordonate după urgență: întârziate, azi, în zilele următoare, când ai timp.
- **Fără nimic de făcut:** „Nimic urgent acum.” în cardul „Acum”, fără plăci goale. **[apelul meu]**
- Culorile temelor din machetă: De sunat = auriu, Discuții = albastru, Lucru = violet, Bani = verde. Pastilele și culorile vin din tema existentă (`app/tema.css`). Violetul e nou și se adaugă acolo ca variabilă. **[apelul meu]**

## 4. Ce intră în fiecare temă **[Andrei: „toate, mai puțin 3”; limitele de zile sunt apelul meu, aprobate]**

„Azi” și „zilele următoare” se socotesc în fusul `Europe/Bucharest` (`lib/timp.ts`).

### De sunat
| Rând | Regula | Urgența | Butoane |
|---|---|---|---|
| **Lead nou** | `lead_uri.stare = 'nou'`, al meu (`caller_id` sau `closer_id` = eu) **sau** nepreluat (`caller_id` null). Adminul îi vede pe toți. | întârziat dacă a intrat (`intrat_la`) de peste **o zi** (24 de ore) **[Andrei]**; altfel azi | Sună (`tel:`), WhatsApp (`wa.me`) |
| **Callback** | `stare = 'callback'`, `callback_la` azi sau trecut, al meu (Adminul: toate) | întârziat dacă `callback_la < acum`; altfel azi | Sună, WhatsApp |

Textul de lângă: „intrat acum 25 min” / „acum 2 ore” / „intrat ieri, 18:40”; „azi, 11:30” / „trebuia ieri, 16:00”. `cand()` din `lib/afisare.ts` dă doar „azi/mâine/ieri, HH:MM” sau „25 oct., HH:MM”; formele „acum N min/ore” și „trebuia …” sunt noi și se adaugă (în `lib/azi.ts` sau lângă `cand()`).

### Discuții
| Rând | Regula | Urgența | Butoane |
|---|---|---|---|
| **Discuție** | `discutii` cu `incepe_la` azi sau mâine; ale mele (`closer_id` = eu), Adminul le vede pe toate (cu „cu tine” / „cu Vlad”) | azi / în zilele următoare; o discuție care **a trecut** nu mai apare | Deschide (fișa lead-ului) |

### Lucru
| Rând | Regula | Urgența | Butoane |
|---|---|---|---|
| **Task** | `taskuri` negata, cu `termen` ≤ azi + 7 zile (fără termen: nu apar). Constructorul: doar ale lui (`om_id` = eu). **Adminul: ale întregii echipe**, cu numele omului în descriere („Atelier Ceramică · Radu”, „· tu”), ca în macheta aprobată **[apelul meu, după machetă]** | întârziat dacă `termen < azi`; azi; în zilele următoare | ✓ Gata (aceeași acțiune ca în „Task-urile mele”) |
| **Termen** | proiecte neînchise (`inchis_la` null), stadiu înainte de `livrat`, cu `termen` ≤ azi + 7 zile. Adminul: toate; constructorul: doar proiectele lui (`proiect_oameni`) | întârziat dacă `termen < azi` („predare depășită cu 2 zile”), altfel „predare peste N zile” | Deschide (fișa clientului, pe proiect) |
| **Cerere nouă** | doar Admin: clientul are o cerere (`cereri.primita_la`) mai nouă decât cel mai nou proiect al lui, aceeași regulă ca banda „Cerere nouă” de pe fișă (`app/(app)/clienti/[id]/page.tsx`) | azi | Deschide (fișa clientului) |
| **Livrare de refăcut** | `livrari.stare = 'de_refacut'` pe proiecte neînchise. Adminul: toate; constructorul: pe proiectele lui. Fără „de N zile” (nu există o dată sigură a trecerii la „de refăcut”: `adaugat_la` e înghețat, iar evenimentul `livrare_stare` nu ține id-ul livrării); textul din dreapta e „de refăcut” **[apelul meu]** | azi | Deschide |
| **Livrare fără răspuns** | doar Admin: `livrari.stare = 'trimis'`, `adaugat_la` de peste 5 zile, proiect neînchis | în zilele următoare | WhatsApp (clientului), Deschide |

### Bani (doar Admin)
| Rând | Regula | Urgența | Butoane |
|---|---|---|---|
| **Rată** | tranșe neîncasate cu `scadenta` ≤ azi + 7 zile, **fără tranșele `tip = 'inainte'`** (ca în `coloaneIncasari` din `lib/finante.ts`). Atenție: „Urmează” din Finanțe are 30 de zile; aici fereastra e de 7, deci nu se refolosește direct `coloaneIncasari().urmeaza`, ci `stareTransa` + filtrul de 7 zile | întârziată dacă scadența a trecut („întârzie 5 zile”); altfel în zilele următoare | ✓ Am încasat (componenta existentă `Incaseaza`), WhatsApp |
| **Comision** | câte un rând **pe om** cu totalul de plătit (ca în tab-ul „De plătit echipei”, `dePlatitOm`) | când ai timp | ✓ Plătit tot (`platesteTot`), doar când `poatePlati`; altfel Deschide (Finanțe) |
| **A doua vânzare** | proiectul a ajuns la `livrat` acum **30–60 de zile**. Data livrării = cel mai recent eveniment `stadiu` din `evenimente_proiect` cu `in` = `livrat` sau `mentenanta`; dacă proiectul e în `livrat`/`mentenanta` fără un astfel de eveniment (creat direct așa, din demo sau din date vechi), se ia `proiecte.creat_la` **[apelul meu]**; iar clientul **n-are niciun proiect început după** acea zi. Textul: „Site livrat acum 6 săptămâni · propune o automatizare” (propunerea depinde de serviciu: după site → automatizare; după automatizare → site; altfel „propune ceva nou”) **[apelul meu]** | când ai timp | WhatsApp, Deschide |

**A doua vânzare, fără buton „Am propus”** **[Andrei]**: clientul iese singur din listă după 60 de zile sau când începe cu el un proiect nou. **[apelul meu, aprobat]**

## 5. „Acum” și ordinea **[apelul meu, aprobat]**

Ordinea rândurilor, și deci alegerea cardului „Acum”:
1. o **discuție care începe în cel mult 15 minute** (sau a început de cel mult 15 minute);
2. **întârziatele**, de la cea mai veche la cea mai nouă (după momentul de la care întârzie); la egalitate, lead-urile noi primele;
3. ce e **de azi**, după oră (rândurile fără oră, după cele cu oră);
4. **în zilele următoare**, după dată;
5. **când ai timp** (comisioane, a doua vânzare).

„Acum” = primul rând din ordinea asta. **„Mai târziu”** trece la următorul, dar doar în pagina deschisă: la refresh, ordinea revine. Nu se salvează nimic. **[Andrei]**

Ordinea, urgențele și textele „când” se calculează într-un modul pur, `lib/azi.ts`, care primește rândurile deja citite și ora curentă, iar apoi întoarce lista ordonată, plăcile și cifrele de sus. Așa se testează cu vitest fără bază de date. **[apelul meu]**

### Rezultatul apelului, direct pe card **[Andrei: varianta A]**

Când „Acum” e un lead (nou sau callback) și apeși **Sună** (`tel:`) sau **WhatsApp**, cardul își păstrează lead-ul și arată sub el **butoanele de rezultat de pe fișa lead-ului**: cele date de `actiuniPermise()` din `lib/stari.ts` pentru omul conectat (de regulă „Nu răspunde”, „A răspuns”, „Callback”, „Programează”, „Descalificat”; closerul are și „Client”/„Pierdut”). Se refolosesc acțiunile și componentele existente de pe fișă (`ButoaneActiuni`, scurtăturile de callback din `lib/timp.ts`), deci aceleași reguli și același Parcurs, **fără nimic nou în baza de date**.
- După un rezultat salvat, pagina se reîmprospătează, iar „Acum” trece la următorul rând.
- „Programează” duce, ca acum, la `/lead-uri/<id>/programeaza`.
- **Lead nepreluat** (`caller_id` null) la un caller/closer: butonul e „Ia lead-ul și sună”. Întâi face `ia_lead`, apoi pornește apelul **[apelul meu]**.
- **Sună dintr-un rând din listă** pornește apelul și aduce lead-ul acela în cardul „Acum”, cu butoanele de rezultat, ca să-l treci fără să ieși din pagină **[apelul meu]**.
- Butoanele de rezultat apar doar după Sună sau WhatsApp (sau după un link mic „Treci rezultatul”, pentru când ai sunat de pe alt telefon) **[apelul meu]**.

## 6. Pe roluri **[apelul meu, aprobat]**

| Rol | Teme |
|---|---|
| Admin | toate patru |
| Caller | De sunat |
| Closer | De sunat, Discuții |
| Constructor | Lucru (task-urile lui, termenele și livrările de refăcut de pe proiectele lui; fără cereri, fără „fără răspuns”) |

Datele se citesc cu clientul Supabase al omului conectat. **Banii și proiectele** (`transe`, `comisioane`, `proiecte`, `clienti`) sunt apărate de permisiunile din baza de date (RLS): un caller nu le poate primi nici dacă pagina ar greși, iar tema Bani nici nu se cere pentru alt rol decât Admin. **„Al meu” la lead-uri și discuții e doar un filtru în aplicație**: RLS-ul lasă callerii și closerii să citească toate lead-urile, cererile și discuțiile (`lead_citire`, `cereri_citire`, `discutii_citire`), cum e și în lista de lead-uri. Filtrele „al meu” din `/azi` se testează deci explicit (vitest pe regulile din `lib/azi.ts` + e2e pe rol).

## 7. Locul în aplicație **[apelul meu, aprobat]**

- Ruta: `/azi`, în `app/(app)/azi/page.tsx`, pagină de server (citirile în paralel), cu o parte mică de client pentru plăci și „Mai târziu”.
- `/` trimite la `/azi` pentru toate rolurile (azi trimite la `/lead-uri` sau `/clienti`).
- Meniul: „Azi” e **prima** intrare, cu iconița ei (`Iconite.tsx`), pentru toate rolurile, atât în bara laterală, cât și în meniul de jos de pe telefon.
- Acțiunile de pe pagină (✓ Gata, ✓ Am încasat, ✓ Plătit tot) refolosesc acțiunile de server existente, iar după ele pagina se reîmprospătează (`revalidatePath('/azi')` sau `router.refresh()`).
- **Modul filmare:** numele oamenilor, firmele și sumele trec prin `<Ascuns>`, ca pe celelalte pagini.
- **`npm run demo`** pune date care umplu toate plăcile, relativ la ziua rulării: lead-uri noi (unul intrat de peste o zi), callback-uri azi și întârziate, o discuție azi și una mâine, task-uri întârziate și de azi, un termen depășit, o cerere nouă, o livrare de refăcut și una fără răspuns de 6 zile, rate întârziate și în 7 zile, comisioane neplătite, un proiect livrat acum ~6 săptămâni. Ce există deja în demo se refolosește, iar ce lipsește se adaugă.

## 8. Testare

- **vitest** pe `lib/azi.ts`: ordinea, pragul de o zi la lead-uri, discuția „în 15 minute”, 7 zile, 5 zile, fereastra de 30–60 de zile, salutul după oră, cifrele de sus, ce vede fiecare rol.
- **e2e** (Playwright): fiecare rol vede doar temele lui și doar lead-urile/discuțiile lui; „Acum” arată cel mai urgent rând; „Mai târziu” trece la următorul; după „Sună”, „Nu răspunde” pe card salvează rezultatul și trece la următorul lead; „Ia lead-ul și sună” preia lead-ul; ✓ Gata pe un task îl scoate; `/` duce la `/azi`.
- Din `crm/`: `npx vitest run`, testele RLS, `npx playwright test`, `npx tsc --noEmit -p .`, `npm run lint`. Site-ul nu se atinge.

## 9. Abordările cântărite

1. **Pagina citește direct din tabelele existente, iar `lib/azi.ts` ordonează** **(aleasă, [Andrei: „mergi pe 1”])**. Fără migrație, permisiunile existente lucrează singure, iar regulile se testează ușor.
2. **O funcție SQL nouă care întoarce tot.** Cere o migrație pe test și pe producție (pe care o rulează Andrei cu `!`) și dublează în SQL reguli care există deja în TypeScript (`coloaneIncasari`, `dePlatitOm`, cererea nouă). Câștigul de viteză nu se simte la câteva sute de rânduri. Respinsă.

## 10. Lăsat constructorului

- Numele exacte ale componentelor și cum se împart între server și client.
- Formatul exact al textelor „când”, cât timp rămân în spiritul machetei și al `cand()` existent.
- Iconița „Azi” (în stilul celor din `Iconite.tsx`).
- Dacă meniul de jos de pe telefon nu mai are loc pentru încă o intrare, ce iese de acolo (rămâne în bara de sus sau într-un „Mai mult”). Arătat lui Andrei la punctul de control vizual.
