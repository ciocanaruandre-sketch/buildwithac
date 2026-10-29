---
name: ghid-nou
description: Folosește când Andrei vrea ghidul de pe buildwithac.ro pentru o postare a lui (un clip sau un carusel postat sau pe cale să fie postat), când zice „fă ghidul”, „ghid nou”, „am postat despre…”, „scrie caruselul despre…”, sau când un ghid publicat trebuie actualizat.
---

# Ghid nou

## Pe scurt
Fiecare postare a lui Andrei (clip **sau** carusel) primește un ghid complet pe site. Claude scrie tot: textul caruselului (la carusel) și ghidul. Apoi îl corectează împreună cu Andrei și îl publică prin previzualizare → `main`.

**Acoperă doar ghidurile făcute din postările lui Andrei.** Ghidurile separate, mai complexe, gratuite sau plătite, se discută separat, nu prin skill-ul ăsta.

Citește înainte: `CLAUDE.md` (regulile) și **`standard.md`** din dosarul ăsta (structura, componentele, tonul). Fără ele nu scrii nimic.

## Pașii
1. **Află ce e.** Subiectul, formatul (clip sau carusel), sursa (clipul, descrierea lui Andrei, o idee din `continut/idei.md`). Alege slug-ul (litere mici, cifre, cratime, fără diacritice) și creează `continut/ghiduri/<slug>/`.
   - **Clip:** clipul e în `continut/clipuri/`. Transcrie-l:
     `hyperframes transcribe continut/clipuri/<fișier> -l ro -d <dosar-temporar>` (scrie `transcript.json`; folosește Parakeet dacă e instalat, ~30 s pentru un clip de 30 s), apoi
     `hyperframes transcribe <dosar-temporar>/transcript.json --to srt -o continut/ghiduri/<slug>/transcriere.srt`.
     Cele două nu merg într-o singură comandă: `--to` exportă doar dintr-o transcriere existentă.
     Ghidul urmează ce spune Andrei în clip (pașii, ordinea, uneltele). Dacă transcrierea iese prost, spune-i și cere-i descrierea.
   - **Carusel:** urmează `carusel.md`.
2. **Caută ce trebuie verificat**, înainte de scris: prețurile actuale, versiunile, numele exacte ale butoanelor și meniurilor, link-urile oficiale. Notează sursele în `continut/ghiduri/<slug>/note.md`.
3. **Întreabă-l pe Andrei de greșelile lui reale** din subiectul ăsta (pentru `<GresealaMea>`), dacă nu apar în clip. Fără răspuns = fără `<GresealaMea>`; folosește `<Atentie>` cu o capcană reală, verificată.
4. **Scrie** caruselul (dacă e cazul) și ghidul `site/content/ghiduri/<slug>/index.mdx`, după `standard.md`. Capturile lipsă rămân `<CeVezi>` cu fișierul încă inexistent: pe site apar ca „captură de pus”. Fă lista lor pentru Andrei.
5. **Cuvântul-cheie** (`cuvant`): un cuvânt scurt, cu MAJUSCULE, fără diacritice, ușor de scris pe telefon (ex. `SITE`, `ANIMATII`). Trebuie să fie unic; încărcarea ghidurilor oprește build-ul la un duplicat. E același pe ultima slide, în lupă și pentru PDF.
6. **Verifică.** Din `site/`: `npm run verifica -- <slug> --ciorna` (zero erori; capturile și coperta care lipsesc sunt doar avertismente cât e ciornă). Apoi lista de mai jos, de mână. Verificarea completă, fără `--ciorna`, plus `npx vitest run`, se face abia la „Publică” (`publicare.md`, pasul 7).
7. **Publică** după `publicare.md`: ramură, previzualizare, corecturi, PDF, `main`, e-mailul din `email.md`.
8. **Marchează ideea** ca postată în `continut/idei.md` (secțiunea „Postate”: data și slug-ul).

## Lista de verificare înainte de previzualizare
| Ce | Cine prinde |
|---|---|
| `<DeCeAiNevoie>` există și are prețuri | `verifica` (lipsa = eroare; fără preț = avertisment) |
| fiecare pas e **o singură acțiune** | de mână |
| fiecare prompt sau comandă e în `<Prompt>` (are „Copiază”) | de mână; `verifica` prinde `<Prompt>` gol |
| captură după fiecare pas important (sau loc marcat) | `verifica` avertizează la pașii fără captură |
| `<DacaNuMerge>` la pașii care pot da erori | de mână |
| nicio notiță „greșeala mea” inventată | de mână; `verifica` le numără, ca să le confirmi |
| „actualizat la” = azi | `verifica` (dată în viitor = eroare) |
| sedila, HTML de mână, text de umplutură, linii lungi „—” | `verifica` |
| tonul și semnele de text AI (`standard.md`) | de mână: citește tot ghidul cu voce tare, o dată |

## Actualizarea unui ghid publicat
Ramura `ghid/<slug>`, modificările, `actualizat` = azi, `npm run pdf -- <slug>` dacă are PDF (cheia și link-ul rămân aceleași), apoi verificarea și publicarea ca mai sus.

## Greșeli frecvente
- Pași care fac două lucruri („instalează și configurează”): împarte-i.
- Prețuri sau meniuri din memorie: verifică-le pe site-ul oficial, azi.
- Text care repetă caruselul: ghidul e *cum*, cu pașii exacți, nu încă o dată *ce*.
- Ghid pornit direct pe `main`: ciornele stau doar pe `ghid/<slug>`.
