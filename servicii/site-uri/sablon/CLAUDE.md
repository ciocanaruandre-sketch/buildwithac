# Site-ul __NUME_FIRMA__

Site-ul firmei **__NUME_FIRMA__**, pe `https://__DOMENIU__`. Depozitul: `site-__SLUG__`.

## Ce e site-ul
Se completează la pornire:
- **Firma:** ce face, orașul, cui vinde.
- **Varianta:** cu mentenanță (găzduit și modificat de cine l-a făcut) sau doar site-ul (predat clientului).
- **Modificările:** simplu (prin cel care întreține site-ul) sau cu panou de administrare.
- **Aspectul ales:** direcția vizuală, culorile, fonturile.

## Limba
Totul în **română, cu diacritice cu virgulă** (ș, ț), niciodată cu sedilă (ş, ţ). O singură limbă. O a doua limbă înseamnă un al doilea fișier de conținut, cu aceeași schemă (`lib/schema.ts`); rutele pe limbi se adaugă abia când e nevoie de ele.

## Regulile
- **Conținutul** (texte, prețuri, program, poze) stă **doar** în `lib/continut.ts`, verificat de schema din `lib/schema.ts`. Componentele nu au texte scrise în ele.
- **Datele firmei** (nume, domeniu, telefon, WhatsApp, adresă, hartă, rețele) stau **doar** în `lib/config.ts`.
- Telefoanele se scriu oricum în `config.ts`; linkurile (`tel:`, WhatsApp) se fac **doar** prin `lib/telefon.ts`. Un număr greșit pică testele.
- **Fonturile** stau în `public/fonts/` + `app/fonturi.css`. **Niciodată** `next/font/google`: a picat pe build-ul de producție Vercel. Pașii pentru alt font sunt în `fonturi.css`.
- Totul se proiectează **întâi la ~390px** (telefonul), apoi pentru ecrane mari. Testele verifică 360 și 390.
- **Fără recenzii, cifre sau rezultate inventate.** Doar ce a dat firma.
- Pozele: ale firmei sau gratuite (Unsplash), cu sursa notată. Fiecare poză are `alt`.
- Indexarea în Google: doar producția, pe domeniul firmei (`lib/indexare.ts`). Pe Vercel merge după ce domeniul e adăugat și site-ul publicat încă o dată; pe Netlify merge singură; pe altă găzduire, variabila `INDEXARE=da`, pusă înainte de build (robots.txt se face la build).
- Fără bannere de cookie-uri cât site-ul nu pune cookie-uri. Dacă apare un formular, pagina de confidențialitate se reface.
- Animațiile la scroll: GSAP, cu tiparul din `components/Apare.tsx`; scroll-ul lin: Lenis (`components/Lenis.tsx`). Amândouă se opresc la „mai puțină mișcare”.

## Codul
Next.js 16 (App Router), TypeScript, Tailwind 4, GSAP + Lenis, zod. **Înainte de cod Next.js, citește `AGENTS.md`**: versiunea are API-uri noi.

| Comandă | Ce face |
|---|---|
| `npm run dev` | serverul local, pe portul 3300 |
| `npm run verifica` | tipurile, lint-ul, testele unitare și testele pe telefon (pornesc singure serverul) |
| `npm run build` | build-ul de producție |

Înainte de orice push pe `main`, `npm run verifica` trebuie să treacă.
