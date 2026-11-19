# Lucrul pentru clienți, partea 1: site-urile

Data: 2026-11-19. Stare: de aprobat de Andrei.
Marcaje: **[Andrei]** = decizia lui; **[Claude]** = apelul meu, pe care Andrei îl poate schimba; **[de verificat]** = se verifică la construire.

## De ce

Andrei vrea ca **toate serviciile pentru clienți** (site-uri, automatizări, sesiuni 1 la 1 și ghiduri personalizate) să se facă din `C:\Portofoliu AC`, fiecare cu instrucțiunile, skill-urile și uneltele lui [Andrei, spus prima dată la 2026-11-09, la CRM]. Acum nu are niciun client concret. Vrea structura gata, ca atunci când vine unul **să se apuce direct de treabă** [Andrei].

Sunt trei proiecte, făcute pe rând: **1) site-urile** (acest document), 2) automatizările (cu actualizarea uneltelor n8n), 3) sesiunile și ghidurile personalizate [Claude, Andrei de acord]. Scheletul comun (`servicii/<serviciu>/` + `clienti/<firma>/<serviciu>/`) se stabilește aici și se refolosește la celelalte două.

## Drumul unui client de site

1. Lead-ul vine din formularul de pe site (sau, mai târziu, dintr-un formular din reclame) și intră în CRM [Andrei].
2. Telefonul. Omul zice „da” și devine client în CRM.
3. Andrei îi trimite formularul **Tally „Site”** (`tally.so/r/Qo1xzg`, întrebările în `continut/formulare/tally.md`). **Tally nu intră în CRM**: e doar ca Andrei să înțeleagă ce vrea clientul; eventual notează el ceva în CRM [Andrei].
4. Claude face **fișa clientului** din răspunsurile Tally și din notițele lui Andrei de la telefon.
5. Claude face **2–3 variante de aspect**, cu comutator (ca la prototipurile lui Andrei). Andrei alege ce îi arată clientului [Claude, necontrazis].
6. Clientul alege. Claude construiește site-ul în **depozitul lui separat**.
7. Previzualizarea pe telefon, la client; corecturile.

**Ce vede clientul înainte de lansare [Andrei: primește un link].** Variantele și previzualizarea stau **în depozitul site-ului clientului**, nu în buildwithac, deci clientul vede doar ce e al lui. Variantele se fac pe o ramură `variante` a depozitului; după alegere, ramura se șterge [Claude]. Clientul primește un **Shareable Link** de Vercel pentru previzualizare: îl deschide fără cont Vercel (pe Pro, oricâte link-uri) [de verificat la primul client: cum se comportă protecția pe adresele `…vercel.app` ale proiectelor noi].
8. Lansarea pe domeniul clientului.
9. Unul din două finaluri (mai jos).

## Deciziile lui Andrei

### Cine ține site-ul după lansare [Andrei: varianta C, plus varianta fără mentenanță]

| | **Cu mentenanță (preferată)** | **Doar site-ul** |
|---|---|---|
| Domeniul | pe numele clientului din prima zi; el plătește, Andrei are acces | la fel |
| Codul | depozit GitHub privat separat, pe contul lui Andrei | transferat clientului la predare |
| Găzduirea | Vercel Pro-ul lui Andrei | contul clientului |
| Modificările | prin Andrei, incluse în mentenanța lunară | plătite separat, dacă le cere |
| Dacă pleacă | i se transferă depozitul și e ajutat să mute găzduirea; fără dramă | — |

- **Vercel Hobby nu permite uz comercial** (lucru plătit pentru un client, inclusiv previzualizările). Andrei trece pe **Vercel Pro (~20 $/lună pe cont, plus consum; oricâte proiecte) când semnează cu primul client de site**, înainte de construire, indiferent de varianta aleasă de client [Andrei]. [de verificat prețul la trecere.] Semnalat o dată: și buildwithac.ro e tehnic „comercial”; nu insista.
- **Doar site-ul:** clientul are nevoie de o găzduire pe contul lui. Ca să nu plătească 20 $/lună pentru un site simplu, `predare.md` recomandă o găzduire gratuită care **permite uz comercial și rulează Next.js** (candidați: Netlify Free, Cloudflare); dacă niciuna nu merge, Vercel Pro pe contul clientului [de verificat la construire: termenii și suportul pentru Next.js 16].
- **Domeniul [Claude]:** clientul îl cumpără pe numele lui. `lansare.md` recomandă un singur registrar `.ro`, ales la construire după preț și cât de simplu e panoul [de verificat]. Andrei primește acces fie ca utilizator adăugat (dacă registrarul permite), fie prin pașii DNS pe care îi face clientul după listă, cu numele exacte ale butoanelor. Nu se cer parolele clientului în capturi.

### Cine modifică site-ul [Andrei: ambele, „simplu” e preferat]

- **Simplu (preferat):** orice schimbare trece prin Andrei; site fără bază de date.
- **Cu panou:** clientul își schimbă singur meniul, prețurile, programul, pozele, dintr-o pagină cu parolă.
- **Panoul nu se construiește acum** [Claude]: tehnologia lui (unde stă conținutul, cât costă pe fiecare găzduire) se proiectează separat, la primul client care îl cere. **Șablonul îi pregătește locul**: tot conținutul modificabil al unui site (texte, prețuri, program, liste de poze) stă dintr-un singur fișier de date, `continut.ts`, nu împrăștiat prin componente. Adăugarea panoului mută mai târziu doar acel fișier într-un loc editabil.

### Unde stau lucrurile [Andrei: varianta 1]

Totul se lucrează din `Portofoliu AC`; codul fiecărui site e în depozitul lui, ca clientul să nu ajungă niciodată la codul buildwithac. Respinse: un dosar separat `C:\Clienti\` (Claude n-ar mai vedea skill-urile de aici; Andrei a cerut „tot aici”) și site-urile ca aplicații în depozitul buildwithac, ca `crm/` (predarea ar cere extragere).

```
Portofoliu AC/
  servicii/
    README.md                ← harta serviciilor; ce e gata, ce urmează
    site-uri/
      README.md              ← cum lucrează Andrei la un site: pașii, regulile de aspect, costurile
      sablon/                ← site-ul de pornire (vezi mai jos)
      lansare.md             ← lista de pași: domeniu, DNS, Vercel, verificări
      predare.md             ← lista de pași pentru „doar site-ul”
  clienti/
    README.md                ← regulile dosarului (ce intră în git, ce nu)
    <slug-firma>/
      fisa.md                ← comună tuturor serviciilor: cine e firma, ce a cumpărat
      jurnal.md              ← decizii, livrări, modificări cerute (cu dată)
      materiale/             ← pozele, logo-ul, textele primite, exportul Tally (IGNORAT în git)
      site/
        cod/                 ← depozitul site-ului, git separat (IGNORAT de git-ul buildwithac);
                               variantele de aspect stau pe ramura lui `variante`
  .claude/skills/
    client-nou/
    site-client/
    predare-site/
```

[Claude] `clienti/*/materiale/` și `clienti/*/site/cod/` se adaugă în `.gitignore`. `fisa.md` și `jurnal.md` intră în git-ul buildwithac (depozitul e privat).

**Unde e linia la datele personale [Claude]:** ce va fi **public pe site** (telefonul firmei, WhatsApp-ul, adresa, programul), chiar dacă e telefonul personal al patronului, poate sta în `fisa.md` și în `config.ts` din depozitul clientului: oricum se publică. Ce **nu** se publică (numele persoanei de contact, e-mailul ei, alte numere, ce a spus la telefon despre sine) stă doar în CRM și în exportul Tally din `materiale/`. Fișa trimite la client prin numele firmei.

**Copiile de rezervă [Claude]:** depozitul site-ului e privat pe GitHub, `ciocanaruandre-sketch/site-<slug>`. Pozele și logo-ul folosite pe site ajung în depozit, deci au copie. Restul din `materiale/` (fișierele brute, exportul Tally) stă pe laptop; skill-ul `client-nou` îi amintește lui Andrei să pună o copie în Drive, în `buildwithac.ai/clienti/<slug>/` (așa face și cu clipurile).

## Ce construim

### 1. Șablonul (`servicii/site-uri/sablon/`)

Un site de pornire, **nu un design**. Fiecare client primește aspectul lui, din variante; șablonul dă doar fundația, ca să nu se pornească de la zero și să nu se uite nimic.

- Aceeași bază tehnică ca buildwithac: Next.js 16 (App Router), TypeScript, Tailwind, GSAP + Lenis [Claude, necontrazis]. Fonturile din fișiere locale, nu `next/font/google` (pica pe build-ul Vercel, lecția din 2026-11-09).
- **Fără export static** (`output: 'export'`) [Claude]: panoul și formularul, dacă vin, au nevoie de cod pe server, iar schimbarea ar trebui făcută în fiecare depozit de client. Costul: la „doar site-ul”, găzduirea gratuită trebuie să ruleze Next.js (vezi mai sus).
- `continut.ts`: tot ce poate cere clientul să se schimbe (vezi panoul).
- **O singură limbă, româna** [Claude]. `continut.ts` e scris așa încât o a doua limbă să fie doar un al doilea fișier de conținut; rutele pe limbi se adaugă abia la primul client care cere (hotel, clinică cu pacienți străini).
- `config.ts`: numele firmei, domeniul, telefonul, WhatsApp, adresa, harta, rețelele, culorile, fonturile. Echivalentul lui `site/lib/config.ts`.
- Contactul implicit: butoanele **Sună**, **WhatsApp**, **Vezi pe hartă**. Un formular doar dacă îl cere clientul; modulul lui se proiectează atunci (cine primește e-mailul, prin ce cont) [Claude].
- Ce are orice site, ca să nu se uite: titlurile și descrierile pentru Google, `sitemap`, `robots`, imaginea de previzualizare la distribuire (Open Graph), favicon, pagina 404, pagina de confidențialitate (de adaptat; verificată cu skill-ul `legal-advisor-ro` dacă site-ul strânge date).
- Fără bannere de cookie-uri cât nu se pun cookie-uri. Analytics doar Vercel Web Analytics (fără cookie-uri), doar la varianta cu mentenanță [Claude].
- În subsol, un link discret „Site făcut de buildwithac”; clientul poate cere să fie scos [Claude].
- `CLAUDE.md` (și `AGENTS.md`) proprii, copiate în fiecare depozit: regulile de lucru pentru acel site. Așa, depozitul se descurcă singur și după predare.
- Testele minime: build-ul trece, nicio pagină nu iese din ecran la 390px, link-urile interne merg. Fără suita mare de la buildwithac.
- Șablonul are un singur exemplu de pagină, neutru, doar ca să se vadă că merge. Nu e o temă de copiat.

### 2. Regulile de aspect (`servicii/site-uri/README.md`)

Cum arată un site făcut de Andrei: aceleași principii ca în ghidul „site-uri fără aer de AI” (`site/content/ghiduri/site-uri-fara-aer-de-ai/`) și ca în site-urile-concept (`site/public/concepte/`, designul în `docs/superpowers/specs/2026-11-04-site-uri-concept-design.md`): trei direcții vizuale diferite, nu un șablon; fotografie de atmosferă; animații la scroll; fără gradient mov, fără carduri identice; totul proiectat întâi la ~390px. Fără recenzii sau rezultate inventate. Pozele: ale clientului sau gratuite (Unsplash), cu sursa notată. Uneltele pe care le folosesc skill-urile: `ui-ux-pro-max`, `frontend-design` (deja instalate).

Tot aici: costurile pe care le vede clientul (domeniul `.ro` pe an, găzduirea la „doar site-ul”) [de verificat prețurile la construire].

### 3. Skill-urile

| Skill | Când | Ce face |
|---|---|---|
| `client-nou` | „am un client nou”, „a completat Tally” | creează `clienti/<slug>/` cu `fisa.md` și `jurnal.md`; cere exportul Tally și notițele de la telefon; scrie fișa; întreabă ce serviciu a cumpărat. **Comun tuturor serviciilor**: la automatizări și sesiuni doar se adaugă ramuri |
| `site-client` | „fă site-ul pentru …”, „clientul vrea o modificare” | din fișă: variantele cu comutator → alegerea → depozitul din șablon → construirea → previzualizarea → lansarea (după `lansare.md`). În modul „modificare”: face schimbarea, o notează în `jurnal.md` |
| `predare-site` | „clientul vrea doar site-ul”, „predau site-ul” | parcurge `predare.md` cu Andrei, pas cu pas, cu numele exacte ale butoanelor |

Skill-urile urmează felul de lucru al lui Andrei din `CLAUDE.md`: variantele se arată în browser, nu se descriu; pașii din conturi sunt unul câte unul; pașii grei se anunță.

### 4. `CLAUDE.md`

O secțiune nouă, scurtă, „Lucrul pentru clienți”: unde stau `servicii/` și `clienti/`, că depozitul fiecărui site e separat, ce nu intră în git, ce skill pornește fiecare serviciu. Plus rândurile în tabelul „Unde sunt lucrurile”.

## Ce NU facem acum

- Automatizările și sesiunile (proiectele 2 și 3).
- Panoul de administrare (doar locul lui în șablon).
- Modulul de formular de contact pentru clienți.
- Nicio schimbare în CRM: legătura fișă ↔ client din CRM e prin numele firmei, de mână [Claude].
- Facturarea și contractele (semnalat o dată: clienții plătiți regulat cer PFA/SRL; nu insista).
- Trecerea pe Vercel Pro: abia la primul client cu mentenanță.

## Ce ar face proiectul un eșec

- Site-uri care seamănă între ele sau arată „făcute cu AI” (șablonul devine temă).
- Un client care vede codul sau datele buildwithac ori ale altui client.
- Datele personale ale clienților în git.
- O structură pe care Andrei trebuie s-o țină minte; skill-urile trebuie s-o știe în locul lui.

## Lăsat constructorului

- Numele exacte ale fișierelor din șablon, componentele lui și cât de departe merge exemplul.
- Textul exact al fișierelor README, `lansare.md`, `predare.md` (în tonul din `CLAUDE.md`).
- Proba finală: un client inventat (de ex. o cafenea), trecut prin `client-nou` și primii pași din `site-client` până la depozitul pornit din șablon și previzualizarea locală, apoi șters. **Doar local** [Claude]: fără depozit pe GitHub și fără proiect Vercel, ca să nu se atingă conturile lui Andrei.
