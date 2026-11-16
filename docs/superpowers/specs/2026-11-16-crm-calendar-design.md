# CRM: discuțiile în Google Calendar (bucata 5 din etapa 3)

Data: 2026-11-16 · Ramura: `crm-calendar` · Macheta: `prototip/crm-calendar.html` (varianta **A · Gri tăiat**, aleasă de Andrei)

## 1. Ce e și de ce

Discuțiile programate în CRM ajung singure în Google Calendar-ul closerului, cu memento pe telefon. Invers, orele în care closerul e ocupat în Google Calendar apar gri la „Programează discuția”, ca să nu mai poată fi alese.

**De ce** (Andrei): „pentru mine și ulterior pentru echipă, să fie totul organizat. Să nu uit.” Acum discuțiile trăiesc doar în CRM: fără memento, iar CRM-ul nu știe de programările lui din afară (exemplul lui: „am deja o programare la 12”).

**Pentru cine:** Andrei acum (singurul closer), apoi fiecare closer din echipă, fiecare cu contul lui Google.

## 2. Ce intră și ce nu

**Intră:**
- butonul „Conectează Google Calendar” pe pagina „Program” (Admin și closer, fiecare pentru el);
- discuțiile programate → evenimente în calendarul closerului; reprogramarea, anularea și schimbarea closerului se văd și acolo;
- la „Programează discuția”: orele ocupate în Google Calendar-ul closerului ales apar **gri, tăiate, cu contur punctat** (varianta A), neapăsabile;
- tot gri apar și orele ocupate de alte discuții din CRM (azi lipsesc din listă) **[apelul meu, Andrei: „e bine”]**;
- pe fișa lead-ului, sub discuție: „✓ În Google Calendar” / „N-a ajuns în calendar” + „Reîncearcă” / „{Nume} n-are Google Calendar conectat”.

**Nu intră (non-goluri):**
- callback-urile, task-urile, termenele și scadențele: rămân în CRM **[Andrei]**;
- Calendly: CRM-ul face deja ce face Calendly (alegerea orei), iar împărțirea automată ar costa ~16 $/om/lună **[Andrei a ales varianta fără]**;
- **linkul de Meet și invitația pentru lead:** Andrei îi trimite omului linkul de mână, „ca să fie și o confirmare, să-mi răspundă direct că poate intra” **[Andrei]**. Evenimentul nu are invitați;
- atribuirea automată la closerul liber: vine când există al doilea closer **[apelul meu, nespus contra]**;
- sincronizarea înapoi: dacă muți evenimentul direct în Google, CRM-ul nu află. CRM-ul e locul unde se programează **[apelul meu, Andrei: „e bine”]**;
- **fără propoziție nouă pe `/confidentialitate`** **[Andrei: „lăsăm așa”]**.

**Anti-goluri** (ar fi eșec chiar dacă „merge”):
- o discuție programată în CRM care nu apare în calendar, fără ca cineva să afle (de aici rândul de pe fișă);
- programarea blocată pentru că Google nu răspunde;
- un eveniment rămas în calendar pentru o discuție anulată sau mutată;
- un closer care vede ce scrie în calendarul altuia (CRM-ul citește doar „ocupat”, fără titluri).

## 3. Variantele cântărite

1. **Conectarea Google (OAuth, API-ul Calendar)**: evenimentele intră pe loc, orele ocupate se citesc live. Cere o aplicație în Google Cloud și, cât nu e verificată de Google, ecranul „Google n-a verificat aplicația” la conectare (o dată de om; până la 100 de oameni). Gratuit. **Aleasă de Andrei.**
2. **Invitație pe e-mail de la `crm@` + adresa secretă iCal**: fără aplicație Google, dar atârnă de e-mail; mesajele de la `crm@` au ajuns deja în Spam la Andrei, iar o invitație din Spam poate să nu intre în calendar.
3. **Link de abonare în ambele sensuri**: cel mai simplu, dar Google reîmprospătează abonamentele rar (ore), deci o discuție nouă poate apărea prea târziu. Scoasă: contrazice „să nu uit”.

## 4. Cum funcționează

### 4.1 Conectarea
- Contul Google al lui Andrei: **Gmail-ul buildwithac** (nu cel personal) **[Andrei]**. Pe iPhone pune aplicația Google Calendar cu contul ăsta.
- „Conectează Google Calendar” → ecranul Google (alegi contul, accepți) → înapoi pe „Program”, cu cardul „conectat”, adresa contului și „Deconectează”.
- Cardul are trei stări (macheta, ecranul 2): **neconectat** (buton auriu), **conectat** (bifă verde), **legătura a căzut** (Google refuză cheia, de exemplu după schimbarea parolei: „Conectează din nou”; discuțiile rămase neajunse intră după reconectare).
- Doar omul însuși se poate conecta. Adminul, când se uită la programul altcuiva, vede doar starea.
- **Deconectează**: CRM-ul uită cheia și o revocă la Google. Evenimentele deja create rămân în calendar; de acum nu se mai sincronizează **[apelul meu]**.
- Drepturile cerute la Google: doar crearea/schimbarea evenimentelor și citirea „ocupat/liber” (fără citirea conținutului calendarului). Numele exacte ale scope-urilor le verifică constructorul în documentația Google.

### 4.2 Evenimentul
- În calendarul **principal** al closerului. Titlu: `Discuție · {numele lead-ului}`. Ora și durata discuției. În descriere: telefonul, serviciul și linkul spre fișă (`https://crm.buildwithac.ro/lead-uri/{id}`).
- Memento-ul: cel implicit din Google Calendar-ul omului (fără setare din CRM) **[apelul meu]**.
- Fără invitați, fără Meet.
- Callerul care a programat nu primește nimic.

### 4.3 Sincronizarea (CRM → Google)
Discuțiile se schimbă pe multe drumuri care nu trec prin pagina „Programează”: `programeaza_discutie` (șterge și pune la loc), trigger-ul `discutii_dupa_lead` (lead-ul iese din „programat” → discuția viitoare se șterge; Adminul schimbă closerul → discuția trece la cel nou), `muta_lead_uri`, ștergerea lead-ului și a omului (cascade), „N-a venit” (`neprezentat_la`).

**Decizia [apelul meu]:** o **coadă în baza de date**. Un trigger pe `discutii` (insert / update de oră sau closer / delete) scrie în tabela-coadă ce trebuie făcut în Google. Așa niciun drum nu scapă, inclusiv cascadele. Apoi:
- imediat după acțiunea din CRM, serverul golește coada pentru discuția atinsă (utilizatorul nu așteaptă după Google mai mult de câteva secunde; dacă Google pică, acțiunea din CRM rămâne făcută);
- ce rămâne în coadă se reîncearcă la „Reîncearcă” de pe fișă, la deschiderea fișei sau a paginii „Azi” și la jobul zilnic (`/api/cron/zilnic`; Vercel Hobby rulează cron doar o dată pe zi);
- **schimbarea closerului** = șterge evenimentul din calendarul vechiului closer + creează unul la cel nou;
- discuțiile din trecut nu se mai ating, cu o excepție (mai jos).

Pentru fiecare discuție se ține în bază: id-ul evenimentului din Google, al cui calendar e și starea (în calendar / n-a ajuns / closerul n-are conectat). De aici vine rândul de pe fișă.

**Lead șters sau anonimizat după 1 an:** evenimentele lui se șterg și din Google, ca promisiunea de pe `/confidentialitate` („după un an, fără nume”) să rămână adevărată și în calendar **[apelul meu, de confirmat de Andrei la citire]**.

### 4.4 Orele ocupate (Google → CRM)
- La deschiderea „Programează discuția” cu un closer ales, CRM-ul cere la Google „ocupat/liber” pentru următoarele 14 zile, din calendarul principal. Răspunsul nu se păstrează nicăieri.
- Ora care se suprapune cu ceva ocupat apare **gri, tăiată, cu contur punctat** (varianta A), cu `title` „Ocupat în Google Calendar”. Discuțiile CRM: același aspect, `title` „Altă discuție”. Legenda: „liberă” / „ocupată (Google Calendar sau altă discuție)”.
- Dacă Google nu răspunde în ~3 secunde sau legătura a căzut: alerta galbenă „Nu pot citi acum Google Calendar-ul lui {Nume}. Vezi doar programul din CRM. Poți programa, dar verifică-i ora la telefon.” Dacă closerul nu s-a conectat: „{Nume} n-a conectat Google Calendar…” (textele din machetă).
- La salvare, CRM-ul nu reverifică Google (doar baza, ca acum). Riscul (cineva își pune ceva în calendar în cele câteva secunde dintre deschidere și click) e acceptat **[apelul meu]**.
- Evenimentele create chiar de CRM apar și ele ca „ocupat” la Google; nu e o problemă, pentru că acolo discuția CRM e deja gri.

## 5. Constrângeri

- Next.js 16 (citește `crm/AGENTS.md`), Supabase cu RLS, Vercel Hobby (un cron pe zi).
- **Cheia Google (refresh token)** e un secret: stă criptată, într-o tabelă pe care n-o poate citi niciun utilizator (nici Adminul, prin API). Doar serverul, cu cheia de serviciu. Cheia de criptare stă în variabilele Vercel.
- **Aplicația Google** se face în Google Cloud, pe Gmail-ul buildwithac, pas cu pas cu Andrei (numele exacte ale butoanelor). Trebuie pusă pe **„In production”**: în „Testing”, Google expiră cheile după 7 zile. Rămâne neverificată (ecranul de avertizare); verificarea se cere doar dacă vreodată CRM-ul se vinde clienților.
- Adresele de întoarcere (redirect URI) trebuie înscrise exact la Google: producția `https://crm.buildwithac.ro/...`, `http://localhost:3000/...` și previzualizarea (adresa fixă a ramurii din Vercel, nu cea a fiecărui deploy).
- Testele nu vorbesc cu Google: clientul Google se înlocuiește în teste (unitare + e2e).
- Conturile demo (`npm run demo`) nu se conectează la Google; modul filmare nu se schimbă.
- Terminațiile de rând amestecate (LF/CRLF) în repo: editările scriptate le păstrează.

## 6. Lăsate constructorului

- numele exacte ale scope-urilor Google și biblioteca (fetch simplu sau pachetul oficial);
- forma tabelelor (cheile Google, coada) și a migrațiilor (numerotate după `20261115000013`);
- criptarea (AES-GCM în Node sau Supabase Vault), cu motivul;
- ce se întâmplă când o discuție e ștearsă înainte ca evenimentul ei să fi fost creat (coada se compactează);
- textele mărunte care nu sunt în machetă, pe tonul din `CLAUDE.md`.
