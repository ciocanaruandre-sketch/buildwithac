# Publicarea unui ghid

Comenzile `npm` rulează din `site/`, iar `git` din rădăcina repo-ului. Pe `main` nu ajunge nimic neterminat.

1. **Ramura:** `git switch main && git pull && git switch -c ghid/<slug>`
2. **Commit** după fiecare rundă de lucru (`ghid <slug>: …`, cu finalul obișnuit `Co-Authored-By`).
3. **Verificarea ciornei:** `npm run verifica -- <slug> --ciorna` (zero erori) și `npm run lint`. Capturile și coperta care lipsesc apar ca avertismente: în previzualizare, capturile se văd ca „captură de pus”, iar coperta lipsă ca imagine goală pe card. Avertismentele se citesc unul câte unul; cele rămase se spun lui Andrei. (`npx vitest run` pică pe ramură cât lipsesc capturi: testul ghidurilor adevărate cere zero erori. E normal până la „Publică”.)
4. **Push:** `git push -u origin ghid/<slug>`. Vercel face singur o previzualizare.
5. **Link-ul previzualizării:** în Vercel → proiectul → **Deployments**, rândul cu ramura `ghid/<slug>` (ultimul, „Ready”). Andrei îl deschide pe **telefon**, conectat în Vercel (previzualizările cer conectare). Dacă `vercel` (CLI) e conectat (`vercel whoami`), `vercel ls` dă link-ul direct; `gh` nu e instalat.
6. **Corecturi** cu Andrei. Fiecare rundă: commit, push, aceeași previzualizare se actualizează. Capturile pe care le trimite Andrei se salvează ca `.webp` în `site/public/ghiduri/<slug>/`, cu numele din `<CeVezi>`.
7. **La „Publică”** (doar la cuvântul lui Andrei):
   1. dacă ghidul are PDF: `npm run pdf -- <slug>` → `pdf: true` în frontmatter → commit (cu tot cu `site/public/pdf/<slug>-<cheie>.pdf`);
   2. verificarea completă: `npm run verifica -- <slug>` (fără `--ciorna`, zero erori), `npx vitest run`, `npm run lint`. `tests/unit/continut.test.ts` are lista cuvintelor scrisă de mână (cel mai nou primul): adaugă cuvântul ghidului nou în ambele liste. Dacă lipsesc capturi, ghidul nu se publică: le cere lui Andrei sau scoate `<CeVezi>`-urile acelea, cu acordul lui;
   3. `git switch main && git pull && git merge --no-ff ghid/<slug> && git push`, apoi `git push origin --delete ghid/<slug>`;
   4. după ~1–2 minute, deschide `https://buildwithac.ro/ghiduri/<slug>` și `https://buildwithac.ro/ghiduri?q=<CUVÂNT>`: ghidul apare, căutarea îl marchează „ăsta e ghidul din clip ✓”.
8. **Link-ul PDF-ului** (îl afișează `npm run pdf`) se scrie în `continut/ghiduri/<slug>/note.md`. Tot `npm run pdf` pune o copie în `PDF ghiduri/<slug>.pdf` (în rădăcina proiectului): spune-i lui Andrei că e acolo. Andrei îl trimite manual, în privat pe Instagram, celor care scriu cuvântul.
9. **E-mailul:** textul din `email.md`, completat, gata de lipit în Kit.
10. **Ideea** trece în „Postate” în `continut/idei.md`.
11. **Peretele de clipuri:** dacă ghidul vine dintr-un clip, întreabă-l pe Andrei dacă intră pe homepage. Dacă da: coperta în `site/public/clipuri/`, plus o intrare în `site/content/clipuri.ts` (titlul cu *cuvântul evidențiat* între stele și link-ul clipului).

## Dacă `verifica` dă erori
Repară-le în ghid, nu în verificare. Dacă o regulă pare greșită pentru un caz real, spune-i lui Andrei și schimbă regula în `site/lib/verificare.ts`, cu test.

## Primul ghid adevărat
Când apare primul ghid fără `exemplu`, producția îl arată în locul mare (cel mai nou ghid). Verifică după publicare și homepage-ul, și `/ghiduri`, pe telefon.
