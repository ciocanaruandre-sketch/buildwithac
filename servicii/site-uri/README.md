# Site-uri pentru clienți

Cum lucrezi la un site de client, de la primul telefon până la predare. Pașii îi știu skill-urile; aici sunt regulile și motivele.

## Drumul clientului

| Pas | Ce se întâmplă | Cine / ce skill |
|---|---|---|
| 1 | Lead-ul vine din formularul de pe site și intră în CRM. | singur |
| 2 | Telefonul. Omul zice „da” și devine client în CRM. | Andrei |
| 3 | Îi trimiți formularul Tally „Site” (`tally.so/r/Qo1xzg`). Tally **nu** intră în CRM: e doar ca să înțelegi ce vrea. | Andrei |
| 4 | Fișa clientului, din răspunsurile Tally și notițele de la telefon. | `client-nou` |
| 5 | 2–3 variante de aspect, cu comutator, arătate local. Alegi ce îi arăți clientului. | `site-client` |
| 6 | Clientul alege dintr-un link. Site-ul se construiește în depozitul lui separat. | `site-client` |
| 7 | Previzualizarea pe telefon, la client, și corecturile. | `site-client` |
| 8 | Lansarea pe domeniul clientului, după `lansare.md`. | `site-client` |
| 9 | Unul din cele două finaluri: mentenanța continuă sau predarea, după `predare.md`. | `site-client` / `predare-site` |

Codul fiecărui site stă în `clienti/<slug>/site/cod/`, cu git-ul lui, și pe GitHub în depozitul privat `site-<slug>`. Se pornește din `sablon/` cu:

```
node servicii/site-uri/porneste.mjs <slug> "<Numele firmei>" [domeniu]
```

## Cele două alegeri ale clientului

**Cine ține site-ul după lansare:**

| | Cu mentenanță (preferată) | Doar site-ul |
|---|---|---|
| Domeniul | pe numele clientului din prima zi; el plătește | la fel |
| Codul | depozit privat pe contul tău | transferat clientului la predare |
| Găzduirea | Vercel Pro-ul tău | contul lui de Netlify (gratuit) |
| Modificările | prin tine, incluse în mentenanța lunară | plătite separat, dacă le cere |
| Dacă pleacă | îi transferi depozitul și îl ajuți să mute găzduirea | — |

**Cine modifică site-ul:**
- **Simplu (preferat):** orice schimbare trece prin tine. Fără bază de date.
- **Cu panou:** clientul își schimbă singur meniul, prețurile, programul, pozele. Panoul **nu există încă**: se proiectează separat (brainstorming), la primul client care îl cere. Șablonul îi ține locul: tot conținutul modificabil stă în `lib/continut.ts`.

## Regulile de aspect

Aceleași principii ca în ghidul „site-uri fără aer de AI” (`site/content/ghiduri/site-uri-fara-aer-de-ai/index.mdx`) și ca în site-urile-concept (`site/public/concepte/`, designul în `docs/superpowers/specs/2026-11-04-site-uri-concept-design.md`):

- Trei direcții vizuale **diferite**, nu trei culori ale aceleiași pagini. Șablonul nu e o temă.
- Fotografie de atmosferă, animații la scroll (GSAP).
- Fără gradient mov, fără carduri identice, fără nimic care arată „făcut cu AI”.
- Totul proiectat întâi la ~390px (telefonul).
- **Fără recenzii, cifre sau rezultate inventate.** Doar ce a dat firma.
- Uneltele: skill-urile `ui-ux-pro-max` și `frontend-design`.

**Pozele:** ale clientului sau gratuite de pe Unsplash. Sursa fiecărei poze se notează în `clienti/<slug>/jurnal.md`.

## Costurile pe care le vede clientul

| Ce | Cât | Note |
|---|---|---|
| Domeniul `.ro`, direct la ROTLD | 12 € + TVA (21%) ≈ 14,52 € pe an | același preț la reînnoire; plătit în lei, la cursul BNR din ziua facturii |
| Găzduirea, la „doar site-ul” | 0 € (Netlify Free) | 300 de credite pe lună; un site de prezentare consumă puțin |
| Găzduirea, cu mentenanță | inclusă în mentenanță | stă pe Vercel Pro-ul tău |

**Registrarul ales: ROTLD direct** (`rotld.ro`, „ICI - Registrar”). E registrul oficial, prețul e același la reînnoire (fără promoții de primul an care se scumpesc), iar tu îi știi deja panoul de la `buildwithac.ro`. Partenerii ROTLD pot fi mai ieftini (de exemplu Datahost, 7,99 € + TVA pe an), dar cu încă un panou de învățat.

**Găzduirea gratuită aleasă pentru „doar site-ul”: Netlify Free.** Permite proiecte comerciale și rulează Next.js 16 complet (App Router, funcții pe server). Cloudflare Workers merge și el, dar are limita de 3 MiB pe planul gratuit și nu garantează build-ul de pe Windows.

## Vercel Pro

Vercel Hobby **nu** permite lucru plătit pentru un client, nici măcar previzualizările. Treci pe Pro **când semnezi cu primul client de site**, înainte de construire, indiferent ce variantă alege el: 20 $ pe lună, cu 20 $ credit de consum inclus, 1 TB de trafic pe lună, oricâte proiecte. Shareable Links (link-ul de previzualizare pentru client, fără cont Vercel) merg pe orice plan; pe Hobby, doar unul pe cont.

## Ce nu intră în git

Codul site-ului (`clienti/<slug>/site/cod/`) și materialele (`clienti/<slug>/materiale/`). Regulile complete și linia la datele personale sunt în `clienti/README.md`.

---

Verificat la 2026-11-19:
- Vercel: [prețuri](https://vercel.com/pricing), [planul Hobby](https://vercel.com/docs/plans/hobby), [fair use](https://vercel.com/docs/limits/fair-use-guidelines), [Shareable Links](https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/sharable-links)
- Netlify: [prețuri](https://www.netlify.com/pricing/), [Next.js](https://docs.netlify.com/frameworks/next-js/overview/), [Self-Serve Subscription Agreement](https://www.netlify.com/legal/self-serve-subscription-agreement/) (secțiunea 5, „Free Usage Tier”), [anunțul planului Free](https://www.netlify.com/blog/introducing-netlify-free-plan/) („commercial projects”)
- Cloudflare: [OpenNext pentru Cloudflare](https://opennext.js.org/cloudflare)
- Domenii: [ROTLD, prețuri](https://www.rotld.ro/prices/), [Datahost](https://www.datahost.ro/inregistrare-domenii)
