# buildwithac — regulile proiectului

## Proiectul
Site-ul contului **@buildwithac.ai** (TikTok și Instagram), live pe `https://buildwithac.ro`. Miezul e o bibliotecă de **ghiduri gratuite**: versiunea completă a tutorialelor scurte. Caruselul spune *ce*, ghidul spune *cum*.
Drumul omului: clip → „ghidul e pe site, link în bio” → homepage → ghidul → îl aplică → îl urmărește pe Andrei. În clipuri nu se pun link-uri (risc de ban pe TikTok).
Publicul: oameni care învață AI și firme mici (cafenele, saloane, clinici, imobiliare). Vin mai ales **de pe telefon**: totul se proiectează întâi la ~390px.
- Documentul de design (aprobat): `docs/superpowers/specs/2026-10-22-site-buildwithac-design.md`
- **Stadiul:** `docs/progres-brainstorming.md`. La începutul sesiunii citește secțiunea „DE AICI CONTINUĂM”.

## Limba
Totul în **română, cu diacritice cu virgulă** (ș, ț), niciodată cu sedilă (ş, ţ). `npm run verifica` prinde sedila în ghiduri.

## Lucrul cu Andrei
- Judecă **vizual**: orice schimbare de aspect se arată în browser sau în previzualizare, nu se descrie.
- Când sunt mai multe variante, le face comparabile în browser, cu un comutator. Andrei alege, apoi poate cere „încă câteva în stilul X”.
- Ia decizii pe bucăți și amână ce nu știe încă. Nu-l forța să decidă tot odată.
- Are o limită de folosire Claude. **Anunță pașii grei înainte** (fișiere mari, subagenți, build-uri lungi) și spune cât consumă.
- La final de sesiune salvează stadiul în `docs/progres-brainstorming.md`, ca să reluăm de acolo.
- Extensia Chrome nu deschide `file://`. Prototipurile se servesc cu `python -m http.server 8765` din `prototip/`.

## Ce NU e referință
- Ghidurile PDF vechi și stilul „editorial crem” din `C:\Instagram Content Pipeline`.
- Postările tăiate cu roșu din `Exemple/` (template-ul cu foc și fum).
- Orice arată „făcut cu AI”: șablon generic, gradient mov, carduri identice.

## Sistemul vizual
Cinematic: întunecat, fotografii de atmosferă, cuvinte-cheie în italic în gradientul logo-ului, accente de colaj (hârtie, bandă adezivă, scris de mână). Animații la scroll cu GSAP.

| Rol | Valoare |
|---|---|
| fundal `ink` | `#0b0908` |
| text / hârtie `cream` | `#f6efe3` |
| text secundar `muted` | `#a99d92` |
| auriu / portocaliu / roșu / vișiniu | `#ffb52e` / `#f26a21` / `#e53222` / `#7a0e0e` |
| gradientul logo-ului | `linear-gradient(90deg, #ffb52e, #f26a21 45%, #e53222)` |

Fonturile: **Unbounded** (titluri), **Inter** (text), **Instrument Serif** italic (cuvinte-cheie în gradient), **Caveat** (scris de mână), **Anton** (secțiunea de e-mail), **JetBrains Mono** (prompturi, cod). Fără Shrikhand. Rămân 6 fonturi (decizia lui Andrei).
Prototipurile (referința de aspect): `prototip/index.html` (homepage), `prototip/ghid.html` (varianta 3e, „pași în caiet”), `prototip/ghiduri.html` (aranjarea B, „Colaj”).

## Ghidurile
Standardul complet, componentele și tonul sunt în `.claude/skills/ghid-nou/standard.md`. Un ghid nou se face **doar** prin skill-ul `ghid-nou`. Tonul se aplică și textelor de pe site:
1. „tu”, ca un prieten care a făcut-o înaintea ta;
2. fraze scurte, fără introduceri goale;
3. afirmații sigure; dacă ceva e nesigur, spune de ce;
4. orice termen tehnic e explicat la prima apariție;
5. fără exagerări de reclamă: ce face, cât durează, cât costă;
6. butoanele și meniurile cu numele exact de pe ecran;
7. fără semnele textului făcut cu AI (lista e în `standard.md`).

Notițele „greșeala mea” **nu se inventează**: vin din clip sau de la Andrei. Altfel devin „Atenție”, cu o capcană reală.

## Verificarea ghidurilor gratuite
Fără testare cap-coadă (decizia lui Andrei). Claude verifică singur tot ce se poate fără conturile lui Andrei: link-urile, prețurile, versiunile actuale, numele butoanelor, comenzile (rulate într-un dosar gol). În ghid scrie „actualizat la [data]”. Testarea riguroasă rămâne pentru produsele plătite.

## Publicarea
1. Ramura `ghid/<slug>`. **Pe `main` nu ajung niciodată ghiduri neterminate.**
2. Claude scrie `continut/ghiduri/<slug>/carusel.md` (la carusel) și `site/content/ghiduri/<slug>/index.mdx`.
3. Lucrează cu Andrei pe text.
4. `git push`: Vercel face o previzualizare, pe care Andrei o verifică pe telefon.
5. La „Publică”: PDF-ul (`npm run pdf -- <slug>`), apoi verificările, apoi unirea în `main`, apoi push.
6. Textul e-mailului „ghid nou” pentru Kit (Andrei îl trimite manual).

Pașii exacți sunt în `.claude/skills/ghid-nou/publicare.md`. Înainte de orice unire în `main`, rulează din `site/`: `npx vitest run`, `npm run verifica`, `npm run lint`.

## Ce se poate copia de la alții
Subiectul și ideea, da. Textul și designul, cuvânt cu cuvânt, nu.

## Portofoliul
Doar munca lui Andrei. Site-urile-concept sunt marcate clar „Concept”.

## Codul
- Aplicația e în `site/` (Next.js 16, App Router, TypeScript, Tailwind, GSAP + Lenis). **Înainte de cod Next.js, citește `site/AGENTS.md`**: versiunea are API-uri noi.
- Domeniul, e-mailurile, link-urile sociale și operatorul de date stau **doar** în `site/lib/config.ts`.
- Ghidurile sunt fișiere MDX în `site/content/ghiduri/<slug>/index.mdx`, iar imaginile lor în `site/public/ghiduri/<slug>/`. Frontmatter-ul e validat de `site/lib/ghiduri.ts`. Ghidurile `exemplu: true` nu apar niciodată în producție.
- Comenzile (din `site/`):

| Comandă | Ce face |
|---|---|
| `npm run dev` | serverul local, pe portul 3000 |
| `npx vitest run` | testele unitare |
| `npx playwright test` | testele în browser (pornesc singure serverele de dev) |
| `npm run e2e:prod` | build de producție + testele de producție (~2 min) |
| `npm run verifica -- <slug> [--ciorna]` | verifică un ghid (`--ciorna`: capturile lipsă sunt doar avertismente); fără slug, toate cele adevărate |
| `npm run pdf -- <slug>` | face PDF-ul ghidului în `public/pdf/` și afișează link-ul |
| `npx tsc --noEmit -p .` | verificarea tipurilor (prinde ce nu prinde vitest) |

- Nu rula `next build` fără `NEXT_DIST_DIR` cât merge serverul de dev: strică dosarul `.next` al acestuia.
- GitHub: `ciocanaruandre-sketch/buildwithac` (privat). `main` = site-ul public. Previzualizările Vercel cer conectare.
- Mesajele de commit sunt în română și se termină cu `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Unde sunt lucrurile
| Ce | Unde |
|---|---|
| Site-ul | `site/` |
| Materialul de lucru (carusele, transcrieri, note) | `continut/ghiduri/<slug>/` |
| Clipurile lui Andrei / de inspirație (ignorate în git) | `continut/clipuri/`, `continut/inspiratie/` |
| Lista de idei | `continut/idei.md` |
| PDF-urile ghidurilor, pentru Andrei (`<slug>.pdf`, ignorate în git) | `PDF ghiduri/` (le pune `npm run pdf`) |
| Skill-urile | `.claude/skills/ghid-nou/`, `.claude/skills/idei/` |
| Prototipurile | `prototip/` |
| Montajul imaginii hero | `prototip/montaj/` (`compose.py`; pașii în `docs/progres-brainstorming.md`) |
| Logo-ul | `C:\Instagram Content Pipeline\buildwithacai\brand\logo-transparent.png` |
| Planurile și specificația | `docs/superpowers/` |
