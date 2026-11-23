# Automatizările de vânzare: 4 modele gata de pus la client, cu clipuri

Data: 2026-11-23. Stare: de aprobat de Andrei (trecut prin verificatorul-constructor).
Marcaje: **[Andrei]** = decizia lui; **[Claude]** = apelul meu, pe care Andrei îl poate schimba; **[de verificat]** = se verifică la construire sau la primul client.

## De ce

Andrei vrea câteva automatizări pe care **să le arate firmelor și să le vândă**, nu doar să le descrie. Fiecare trebuie **să meargă cu adevărat**: la un client nou, Andrei pune modelul în contul lui n8n, conectează conturile clientului și completează datele firmei. Nimic construit de la zero [Andrei]. Demonstrația e **câte un clip pentru fiecare automatizare** [Andrei]. Mai târziu pot apărea ca exemple pe site și ca servicii cu preț („vedem după”) [Andrei].

Punctul de plecare e ghidul gratuit „Top 5 automatizări AI” (Angello, `Exemple/Top-5-Automatizari-AI-pentru-Q4-by-Antreprenor-AI.pdf`). Din el se iau **doar ideile**, care oricum sunt comune în domeniu. Numele, textele, mesajele și construcția sunt ale lui Andrei (regula din `CLAUDE.md`: „Subiectul și ideea, da. Textul și designul, cuvânt cu cuvânt, nu.”) [Andrei].

## Ce intră și ce nu

**Intră (4 modele), în ordinea construirii [Claude]:**

| # | Numele (propus) [Claude] | Ideea din ghid | Folderul modelului |
|---|---|---|---|
| 1 | **Reamintiri de programare** | „Zero programări ratate” | `modele/reamintiri-programare/` |
| 2 | **Cererea de recenzie** | „Mașina de recenzii” | `modele/cerere-recenzie/` |
| 3 | **Răspuns în primul minut** | „Follow-up-ul de 60 de secunde” | `modele/raspuns-primul-minut/` |
| 4 | **Asistentul de pe site** | „Asistentul AI 24/7” | `modele/asistent-site/` |

Ordinea: 1 fixează formatul programării în Google Calendar, pe care îl folosesc 2 și 4. Asistentul e ultimul pentru că e cel mai complex.

**Nu intră acum:**
- **Recepționerul vocal** („Recepționerul AI”): proiect separat, după o probă scurtă a vocii în română [Andrei]. Atunci se verifică cu `legal-advisor-ro` anunțul „vorbești cu un AI” (AI Act, art. 50, aplicabil din 2 august 2026, după știința lui Claude) și înregistrarea apelurilor.
- **WhatsApp** ca și canal: mai târziu, ca adăugare. Meta cere firmă verificată și șabloane aprobate, deci zile de așteptare la fiecare client [Claude, Andrei: „e bine”].
- **Legătura cu aplicațiile de programări** (MERO, Fresha, programele clinicilor): niciuna n-are API public găsit. Se face la client, dacă e nevoie. Prima întrebare la client: aplicația lui poate sincroniza programările în Google Calendar? **[de verificat la client]**
- Paginile de pe buildwithac.ro cu automatizările, prețurile serviciilor, ghidul gratuit: după [Andrei: „vedem după”].
- Clipurile propriu-zise (filmare, montaj): le face Andrei. Proiectul de față livrează fluxurile care merg și **scenariul fiecărui clip**.

**Anti-scopuri (ar fi un eșec chiar dacă „merge”):**
- un mesaj trimis unui client cu oră, zi sau adresă greșite;
- un model care cere modificări în flux la fiecare client, în loc de date completate;
- texte copiate sau parafrazate îndeaproape din ghidul lui Angello;
- mesaje cu ton de reclamă sau „făcut cu AI” (tonul din `CLAUDE.md` se aplică și mesajelor pe care le primesc clienții firmei).

## Deciziile comune

### Un model general, nu câte unul pe domeniu [Claude, Andrei: „e bine”]

Același flux merge la frizerie, salon, clinică, service. Diferența stă în **datele firmei**, completate într-un singur loc (vezi „Setările”), nu în noduri.

### Agenda: Google Calendar [Andrei]

Programările stau în **Google Calendar-ul firmei**. Andrei îl înlocuiește la client, dacă acesta folosește altceva [Andrei].

**Câte un calendar pentru fiecare om care primește programări** (frizer, cosmeticiană, medic), toate în contul Google al firmei [Andrei]. În setări stă lista: numele omului, calendarul lui, serviciile pe care le face. Modelele 1 și 2 citesc toate calendarele din listă. Asistentul (modelul 4) întreabă „la cine vrei?” și acceptă și „oricine e liber”. O firmă cu un singur om are o listă cu un singur rând; modelul e același.

**Formatul programării** (îl stabilește modelul 1, îl folosesc 2 și 4) [Claude]:
- titlul: `<Serviciul> – <Numele clientului>` (ex.: `Tuns + barbă – Mihai Ionescu`); cine face serviciul reiese din calendarul în care stă programarea;
- în descriere, câte un rând pentru fiecare câmp: `Telefon: 0722 123 456`, `Email: mihai@exemplu.ro` (cel puțin unul dintre ele);
- ora de început și de sfârșit, din calendar.

Programările care nu au telefon sau e-mail sunt sărite și notate în jurnal (de exemplu pauzele sau programările personale ale patronului).

### Canalele [Claude, Andrei: „e bine”]

- **Mesajele către clienții firmei:** e-mail (Gmail-ul firmei) și/sau SMS (Twilio, ca la modelele de acum). Canalul se alege din setări, nu din flux.
- **SMS-urile fără diacritice:** cu ele, un SMS costă dublu (lecția din modelul WF4).
- **Telefoanele** `07…` devin `+407…` (aceeași regulă ca în WF4).
- **Anunțurile pentru patron:** e-mail; Telegram, opțional.

### AI-ul: Claude [Claude, Andrei: „e bine”]

- **Claude Haiku 5.5** pentru mesajul din modelul 3. Pentru asistent (modelul 4) se încearcă întâi Haiku; dacă greșește la programări sau la română, se trece pe **Sonnet 5.5**.
- Modelul AI e **un singur nod**, schimbabil: un client care are deja cont OpenAI poate primi GPT.
- Costul, la prețurile din 2026-11-23: sub 0,001 $ pentru un mesaj de lead; aproximativ 0,005 $ pentru o conversație de 10 mesaje cu Haiku și 0,10 $ cu Sonnet. AI-ul e cel mai mic cost din flux: un SMS e cam 0,07 $.
- **Modelele 1 și 2 nu folosesc AI.** Mesajele lor sunt șabloane fixe, cu numele, ora și adresa. O oră inventată de AI înseamnă un client venit degeaba, iar un șablon nu greșește [Claude, Andrei: „e bine”].
- **Fără date sensibile la AI.** Modelele sunt generale, dar la o clinică, mesajul către AI din modelul 3 nu trebuie să conțină tratamentul cerut fără verificarea cu `legal-advisor-ro` (regula din `servicii/automatizari/README.md`). README-ul modelului 3 o spune explicit.

### Setările: un singur loc de completat, pentru toată firma [Claude]

Un flux mic și separat, **`setari-firma`**, ține tot ce e de completat la client: numele firmei, adresa, telefonul, programul, link-ul de programare/reprogramare, link-ul de recenzie Google, calendarul (sau calendarele), canalul (`email` / `sms` / `ambele`), e-mailul patronului, tonul (`prietenos` / `elegant`), întârzierile (vezi mai jos) și datele pentru asistent (servicii cu durată și preț, întrebări frecvente). Fiecare model îl cheamă la început (*Execute Workflow*) și primește setările. Un client care cumpără toate cele 4 modele completează datele **o singură dată**, nu în 5–6 locuri. Valorile de completat se scriu `CONFIG_…`, ca la modelele existente.

- Respins: câte un nod „Setări” în fiecare flux. La 4 modele, aceeași adresă ar sta în 6 locuri, iar una uitată la schimbare trimite adresa veche.
- Respins: foaia `Config` din Google Sheets, ca la clinică. E încă un loc de întreținut, iar un rând șters strică fluxul în tăcere.
- **[de verificat]** dacă rulările sub-fluxurilor se numără în limita abonamentului. Dacă da, setările trec înapoi în câte un nod Set pe flux, cu o listă de verificare în README.

### Câte rulări consumă [Claude]

Starter are 2.500 de rulări pe lună. Un flux programat la fiecare 15 minute, zi și noapte, ar consuma singur aproape 2.900. De aceea:
- fluxurile programate (reamintirile, recenzia) rulează **la 30 de minute, doar în programul firmei** plus o oră înainte și după (din setări). Asta înseamnă cam 30 de rulări pe zi, adică circa 900 pe lună pentru fiecare flux;
- declanșatoarele care verifică singure (Google Calendar) **[de verificat]** nu consumă rulări când nu găsesc nimic nou;
- README-ul fiecărui model spune cât consumă pe lună, ca Andrei să știe din propunere dacă clientul are nevoie de Pro.

Reamintirea „cu 2 ore înainte” pleacă deci între 2 ore și 2 ore și jumătate înainte. E acceptabil pentru o reamintire.

### Programările mutate [Claude]

Dacă o programare se mută după confirmare, clientul primește un mesaj „programarea ta s-a mutat pe …”. Altfel, ultima confirmare din telefonul lui arată ora veche. Fluxul programat compară ora din calendar cu ora din ultima confirmare din `Jurnal`. Nu e nevoie de încă un declanșator.

### Dezabonarea [Claude]

Un flux mic, comun, **`dezabonare`**:
- un **SMS cu „STOP”** primit pe numărul Twilio al firmei (webhook-ul de mesaje primite) pune telefonul în `Nu trimite`. Logica e luată din modelul clinicii WF2: telefonul în orice formă, STOP înaintea oricărui alt cuvânt;
- un **link de dezabonare** în fiecare e-mail pune adresa în `Nu trimite`.

Fiecare mesaj care nu e strict despre programare (cererea de recenzie) spune cum te scoți de pe listă. Așa, promisiunea „răspunde STOP” chiar funcționează.

### Formularul de pe site [Claude]

Șablonul site-urilor (`servicii/site-uri/sablon/`) **nu** se schimbă în acest proiect. README-ul modelului 3 scrie **contractul câmpurilor** (nume, telefon, e-mail, ce cere, mesaj, câmpul-capcană) și cum trimite un formular spre webhook. Formularul se pune în șablon la primul client de „site + automatizare”.

### Întârzierile se pot scurta pentru demonstrație [Claude]

Întârzierile (24 h și 2 h la reamintiri, 2 h la recenzie) sunt **valori în „Setări”, în minute**. Pentru clip, se pun câteva minute, ca filmarea să nu aștepte ore întregi. În modelul salvat în `modele/` rămân valorile reale.

### Jurnalul și lista „Nu trimite” [Claude]

Fiecare model scrie într-un **Google Sheet al firmei**: foaia `Jurnal` (ce a plecat, cui, pe ce canal, starea reală a trimiterii). Același tabel are foaia `Nu trimite` (telefoane și e-mailuri ale celor care au cerut să nu mai primească mesaje), verificată înainte de fiecare mesaj. Patronul vede tot și poate adăuga pe cineva cu mâna. Jurnalul servește și ca evidență a ce s-a trimis deja: nimeni nu primește aceeași reamintire de două ori.

### Siguranța, la toate [Claude]

- Fiecare model se leagă de `flux-erori` (*Settings → Error workflow*).
- Citirile din Sheets **nu** ascund erorile (regula testată în `modele.test.mjs`).
- După un nod Twilio, datele clientului **nu** se citesc din `$json` (aceeași regulă testată).
- Toate modelele sunt salvate oprite (`active: false`), fără conturi conectate și fără ID-uri (`curata.mjs`).
- Webhook-urile deschise (modelele 3 și 4) au protecții: vezi la fiecare model.

## Cele 4 modele

### 1. Reamintiri de programare

**Ce face:** când apare o programare nouă în calendar, clientul primește pe loc o confirmare. Apoi primește o reamintire cu 24 de ore înainte și încă una cu 2 ore înainte. Fiecare mesaj are link-ul de reprogramare.

**Cum [Claude]:**
- **Confirmarea:** declanșatorul Google Calendar „eveniment creat”.
- **Reamintirile:** un flux programat (vezi „Câte rulări consumă”) citește programările din următoarele ore și trimite reamintirile scadente care nu sunt deja în `Jurnal`. Respins: un nod Wait de 24 de ore după confirmare. Dacă programarea e mutată sau ștearsă între timp, Wait-ul trimite reamintirea la ora veche. Citirea periodică vede mereu calendarul de acum.
- O programare ștearsă nu mai primește nimic. O programare mutată primește reamintirile la ora nouă (cheia în jurnal: ID-ul evenimentului + ora de început + tipul reamintirii).
- Programările făcute cu mai puțin de 24 de ore înainte nu primesc reamintirea de 24 de ore; cele făcute cu mai puțin de 2 ore înainte primesc doar confirmarea.

**Mesajele:** șabloane fixe, cu nume, serviciu, zi, oră, adresă și link de reprogramare. Textele le scrie Claude în tonul din `CLAUDE.md`, iar Andrei le aprobă la construire.

**Poate fi un flux sau două** (declanșatorul plus fluxul programat): alegerea e a constructorului.

### 2. Cererea de recenzie

**Ce face:** după ce se termină o programare (2 ore, setabil), clientul primește un mesaj de mulțumire cu link-ul de recenzie Google. Cererea merge la toți clienții, fără filtru (Google interzice cererile selective).

**Cum [Claude]:** un flux programat (vezi „Câte rulări consumă”) găsește programările terminate de cel puțin „întârzierea” și de cel mult o zi, care n-au primit încă cererea (după `Jurnal`).

- **Cine n-a venit nu primește cererea** [Andrei]. Patronul marchează neprezentarea în calendar, iar o programare nemarcată și neștearsă înseamnă că omul a venit. Marcajul acceptat [Claude]: **culoarea roșie** a evenimentului (*Tomato* în Google Calendar, se alege din telefon) **sau** titlul care începe cu `NU A VENIT`; o programare ștearsă nu primește nimic, oricum. Marcajul trebuie pus în timpul întârzierii (2 ore implicit). Pasul intră în instrucțiunile de folosire pentru patron. **[de verificat la primul client]** cum își notează ei azi neprezentările; marcajul se poate schimba din setări.
- **O singură cerere pe programare.** O a doua reamintire după 3 zile există ca opțiune în „Setări”, **oprită** din start: nu putem ști dacă omul a lăsat deja recenzia [Claude, Andrei: „e bine”].
- **Un client care revine des** (frizerie: la 3 săptămâni) primește cererea o singură dată la 90 de zile (setabil), după telefon sau e-mail.
- Mesaj fix, fără AI.
- **[de verificat cu `legal-advisor-ro` la prima propunere]:** dacă cererea de recenzie prin SMS/e-mail cere consimțământ separat (Legea 506/2004). Până atunci, mesajul spune cum te scoți de pe listă („Răspunde STOP” / „scrie-ne”), iar lista `Nu trimite` e respectată.

### 3. Răspuns în primul minut

**Ce face:** cineva completează formularul de pe site (cerere de ofertă sau de programare). În mai puțin de un minut primește un mesaj personal, scris de Claude: cu numele lui, ce a cerut și link-ul de programare. Cererea intră în tabel, iar patronul primește un rezumat.

**Cum [Claude]:**
- **Declanșatorul:** un webhook, ca să meargă cu orice formular (site-ul din șablonul `servicii/site-uri/sablon/`, Tally, alt site). Facebook Lead Ads e o adăugare ulterioară, la client.
- **Claude Haiku** scrie mesajul doar din ce a trimis omul și din datele firmei. Instrucțiunile îi interzic să promită prețuri, ore libere sau reduceri care nu sunt în „Setări”.
- **Dacă AI-ul nu răspunde, nici după o reîncercare,** (eroare, timp depășit), pleacă un mesaj fix. Omul primește oricum răspuns, iar patronul vede în rezumat că a plecat varianta fixă.
- Cererea intră în Google Sheet-ul firmei (foaia `Cereri`), iar rezumatul ajunge la patron pe e-mail.
- **Protecția webhook-ului:** un câmp-capcană (honeypot) pe care oamenii nu-l văd, dar roboții îl completează; cel mult un mesaj pe același telefon sau e-mail într-o zi; textele foarte lungi se taie înainte să ajungă la AI. *Header Auth* se folosește când formularul trimite de pe server (site-ul din șablon poate face asta), nu din browser.

### 4. Asistentul de pe site

**Ce face:** un chat pe site. Asistentul răspunde la întrebări doar din informațiile firmei și, când clientul e gata, îi propune ore libere și face programarea în calendar, în formatul de la modelul 1 (deci primește automat confirmarea și reamintirile). Dacă nu știe un răspuns, spune că transmite întrebarea și îi trimite patronului conversația.

**Cum [Claude]:**
- Declanșatorul de chat al n8n, publicat și pus pe site (fereastra de chat a n8n, `@n8n/chat`, sau pagina găzduită de n8n). AI Agent cu Claude, memorie pe conversație, și uneltele: „ore libere” (citește calendarul omului ales sau, la „oricine”, toate calendarele care fac serviciul cerut; ține cont de program și de durata serviciului), „programează” (creează evenimentul în calendarul omului respectiv), „transmite patronului”.
- **Se prezintă ca asistent virtual** la primul mesaj. Nu inventează: dacă informația nu e în datele firmei, o transmite.
- **Înainte de programare**, cere numele și telefonul sau e-mailul și repetă ziua și ora pentru confirmare. Abia după „da” creează evenimentul. Înainte de creare verifică din nou că intervalul e liber (doi clienți în același timp).
- **Protecția:** lungimea mesajelor e limitată, conversațiile au un număr maxim de mesaje, iar originea chatului e restrânsă la domeniul site-ului firmei (*Allowed Origins*).
- Datele din chat (nume, telefon) intră doar în calendar și în rezumatul pentru patron. Confidențialitatea site-ului clientului trebuie să pomenească chatul: notă în README-ul modelului **[de verificat cu `legal-advisor-ro` la primul client]**.

## Unde se construiește și cum se testează

### Contul de probă n8n Cloud [Andrei]

Se construiește în contul de probă de la partea 2, `proba-buildwithac.app.n8n.cloud`. Patronul e e-mailul A al lui Andrei, iar Member e `admin@buildwithac.ro`. Contul n-are API public, deci se lucrează prin **MCP-ul oficial** (planul B, probat la 2026-11-22: `create_workflow_from_code`, `validate_workflow`, `test_workflow`, `publish_workflow`).

- **Expiră** după 14 zile de la creare (pe la 2026-12-06 dacă a fost făcut pe 2026-11-22) **[de verificat în cont: zilele rămase]**. Odată cu el se șterg și fluxurile. De aceea, fiecare model se exportă în `modele/` imediat ce merge, nu la final.
- Dacă expiră înainte de final, ce a rămas se face într-un cont de probă nou (alt e-mail al lui Andrei) sau pe n8n-ul local, la alegerea lui [Andrei: „le pot pune imediat și pe cel local”].
- **Legătura MCP:** un „client” de probă, `clienti/demo-buildwithac/` (fișă scurtă, `.chei.env` cu tokenul MCP al contului de probă), activat cu `client-activ.mjs demo-buildwithac`. Folderul rămâne cât durează proiectul; în git intră doar fișa și jurnalul, ca la un client.
- **Exportul:** planul B nu are unealtă de export. Andrei descarcă JSON-ul din n8n (meniul fluxului → *Download*), apoi `curata.mjs` îl face model **[de verificat: dacă MCP-ul oficial întoarce fluxul complet, exportul îl face Claude]**.

### Conturile pentru demonstrație (ale lui Andrei) [Claude]

Se conectează pe rând, la modelul care le cere. Credentialele le pune Andrei în interfața n8n, niciodată în chat.

| Cont | Pentru | Cost |
|---|---|---|
| Google (două calendare, câte unul pentru doi frizeri inventați ai „Conu' Leonida”, un Sheet, Gmail) | 1–4 | gratuit |
| Anthropic API (cheie) | 3, 4 | cenți la teste |
| Twilio de probă | SMS în 1–3 | gratuit (credit de probă) |
| Telegram (botul lui Andrei, deja există) | anunțurile opționale | gratuit |

**Contul Twilio de probă** trimite doar spre numere verificate (telefonul lui Andrei, exact ce trebuie pentru clip). Pune însă în fața fiecărui SMS textul „Sent from your Twilio trial account” **[de verificat]**. Pentru clipuri, Andrei alege la modelul 1: arată SMS-ul cu textul acela, arată e-mailul în locul SMS-ului sau trece Twilio pe cont plătit (alimentare minimă, de verificat).

### Firma de demonstrație [Claude]

**„Conu' Leonida”, frizeria-concept din portofoliu** (`site/public/concepte/frizerie/`). Clipul arată un site pe care oamenii l-au mai văzut, iar pachetul „site + automatizare” e de multe ori prima vânzare. Pentru modelul 3, cererea de pe formular e „programare pentru un grup / eveniment (mire și cavaleri de onoare)”.

- **Paginile de demonstrație** sunt **copii locale** ale conceptului, în `prototip/demo-automatizari/`, servite cu `python -m http.server 8765` din `prototip/`. Pagina live a conceptului de pe buildwithac.ro nu se atinge. Copia primește formularul de cerere (modelul 3) și chatul (modelul 4).
- Datele de demonstrație sunt inventate. Singurul număr și singurul e-mail reale sunt ale lui Andrei.

### Testarea, în trei pași, pentru fiecare model [Claude]

1. `validate_workflow` fără erori.
2. **Test cu date fixate** (`test_workflow` cu `pin data`): niciun mesaj real. Cazurile minime: programare fără telefon/e-mail, programare mutată, programare ștearsă, cineva din `Nu trimite`, AI căzut (modelul 3), interval ocupat între propunere și „da” (modelul 4).
3. **Rularea reală**, pe conturile de demonstrație, cu mesaje doar spre Andrei. Abia apoi „da”-ul lui Andrei, exportul și modelul în `modele/`.

### Ce se livrează la fiecare model

- `servicii/automatizari/modele/<model>/flux.json` (curățat; mai multe fluxuri → `flux-confirmare.json`, `flux-reamintiri.json` etc., cum alege constructorul, cu testele adaptate) și `README.md` în formatul celor existente: ce face, aplicații, **de completat**, date sensibile, de știut, **cum îl pui la client** (pașii, în ordinea din interfață).
- Rândul lui în tabelul din `modele/README.md`; numele lui în lista `ASTEPTATE` din `modele.test.mjs`, plus un test pentru regula lui principală (ex.: modelul 1 nu are nod AI; modelul 3 are ramura de rezervă).
- **Scenariul clipului**, în `continut/automatizari-demo/<model>.md`: ce se vede, în ce ordine, ce se setează înainte (întârzierile scurte), ce apare pe telefon, cât durează. Fără text de vorbit, doar dacă îl cere Andrei.
- Andrei verifică fiecare model pe telefon (mesajele reale) înainte de export.

## Ce rămâne la constructor

- Structura exactă a nodurilor, numele nodurilor (în română, clare pe pânză, pentru capturi și clipuri), versiunile nodurilor (cele din contul Cloud, verificate cu `get_node`).
- Unul sau mai multe fluxuri pe model.
- Textele mesajelor (aprobate de Andrei), instrucțiunile pentru Claude din modelele 3 și 4.
- Cum se citesc telefonul și e-mailul din descriere (toleranță la spații, majuscule, diacritice).
- Fereastra exactă a fluxurilor programate, în limitele din „Câte rulări consumă”.
- Cum arată copia locală a paginii (aspectul conceptului rămâne).

## După proiect

- Stadiul în `docs/progres-brainstorming.md`; memoria.
- Clipurile (Andrei). Apoi, la decizia lui: paginile de pe site, prețurile serviciilor, recepționerul vocal, WhatsApp.
