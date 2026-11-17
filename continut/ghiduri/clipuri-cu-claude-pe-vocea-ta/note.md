# Note: clipuri-cu-claude-pe-vocea-ta

Sursa: clipul lui Andrei „Claude face clipuri” (2026-11-16), făcut în studioul din `C:\buildwitchac Video Editor\clipuri\2026-11-16-claude-face-clipuri\` (scriptul exact în `script-de-citit.md`, nu a mai fost nevoie de transcriere). Clipul final e și în Drive: `buildwithac.ai/…/2026-11-16-claude-face-clipuri-final.mp4`.

## Ce spune clipul (ordinea pașilor)
1. „Clipul ăsta nu l-am editat eu. L-a făcut Claude.”
2. Îi spun ideea, el scrie scriptul.
3. Eu îl citesc și înregistrez vocea.
4. Pornește câte un agent pe cadru, le construiește în paralel, cu HyperFrames.
5. Subtitrările, sunetele și tranzițiile cad pe cuvintele mele.
6. Stilul: Style Lab. Claude arată variante de subtitrări, titluri și tranziții; votez ce rămâne; ce aleg devine stilul tuturor clipurilor.

## Deciziile lui Andrei (2026-11-17)
- Ce acoperă: clipul cu vocea cititorului + un Style Lab simplu, totul cu prompturi, fără skill-urile din studioul lui.
- `<GresealaMea>`: doar volumul microfonului (prima înregistrare, la volum mare, a ieșit cu mii de vârfuri tăiate și a trebuit refăcută; acum 50–60%). Sursa: `CLAUDE.md` din studio, confirmat de Andrei.
- Cuvântul: CLIPURI.

## Verificat azi (2026-11-17)
- **HyperFrames 0.9.63** (npm, publicat azi). Apache-2.0, gratuit. Cere Node.js 22+ și FFmpeg. Instalarea în Claude Code: pluginul (`claude plugin marketplace add heygen-com/hyperframes`, `claude plugin install hyperframes@hyperframes`), sau `npx skills add heygen-com/hyperframes`. Sursa: https://github.com/heygen-com/hyperframes
- **Skill-urile s-au schimbat față de studioul lui Andrei (0.8.98):** pachetul de azi are `hyperframes`, `hyperframes-cli`, `media-use` (în npm); pe GitHub mai sunt `hyperframes-registry`, `reverse-any-video`, `style-sampling`, `figma`, `slideshow`, `remotion-to-hyperframes`. `faceless-explainer` nu mai există. De aceea ghidul nu numește skill-uri: îi spui lui Claude ce vrei.
- **Vocea ta:** `media-use` (references/audio.md) primește o înregistrare proprie („Your own recording”): o transcrie și dă timpii fiecărui cuvânt, fără cont HeyGen.
- **Transcrierea în română:** `npx hyperframes transcribe <fișier> --json` alege Parakeet dacă e instalat (`npx hyperframes models install parakeet`, ~640 MB, o dată), altfel Whisper. Parakeet v3 știe engleza + 25 de limbi europene (româna inclusă).
  - **Testat azi** cu HyperFrames 0.9.63, într-un dosar gol, pe înregistrarea lui Andrei din clip (31 s, m4a): `parakeet-tdt-0.6b-v3`, 85 de cuvinte cu timpi, ~10 s.
  - Greșelile reale din test: „clot cod” (Claude), „Style. Clă” (Style Lab. Claude), „văști” (votez), „Umărește-mă”, „tutoriali”. → în ghid: Claude ia cuvintele din script, din transcriere doar timpii.
  - **Capcana Whisper:** fără Parakeet, `transcribe` folosește implicit modelul `small.en`, care **traduce** în engleză vorbirea în altă limbă. Pentru română: `--model small --language ro` (din `skills/hyperframes/references/captions.md`).
- **Cadrele în paralel:** `skills/hyperframes/references/film.md`: până la ~6 scene, Claude le face singur, într-o conversație (mai repede); peste, împarte pe workeri, 2–3 scene fiecare, porniți deodată. Deci „câte un agent pe cadru” nu e regula de azi: în ghid scrie că Claude decide singur.
- **Sunete:** `media-use`: efecte sonore de pe Openverse fără cont (licență CC BY: trebuie menționat autorul) sau cele incluse; HeyGen doar cu cont.
- **`/style-sampling`** NU e un Style Lab: 5 șabloane gata făcute, cere HyperFrames Pro și conectare. Ghidul face Style Lab-ul cu un prompt (pagină cu variante și butoane Păstrez / Poate / Nu, ca la Andrei).
- **Claude Pro:** 20 $/lună, 17 $/lună cu plata anuală (200 $ odată). Claude Code inclus în Pro, nu în Free. Sursa: https://claude.com/pricing
- **Previzualizarea și randarea:** ca în ghidul ANIMATII (`npx hyperframes preview`, `npx hyperframes render --output …`).

## Nu se poate verifica fără contul lui Andrei / nemăsurat
- Cât din limita Pro consumă un clip de 30 s cu ~9 cadre (depinde de clip).
- Construcția cap-coadă a unui clip pe 0.9.63 (n-am construit cadre: ar consuma mult).
- Numele exacte din Windows pentru volumul microfonului sunt din Windows 11 în engleză (Settings → System → Sound → Input); pe un Windows în română: Setări → Sistem → Sunet → Intrare.

## PDF
- Link-ul pentru Instagram: https://buildwithac.ro/pdf/clipuri-cu-claude-pe-vocea-ta-24ebba8ef187.pdf (copie în `PDF ghiduri/clipuri-cu-claude-pe-vocea-ta.pdf`), făcut pe 2026-11-17.
- Captura Style Lab (pasul 14) nu e pusă: pagina locală ia rundele din contul Claude al lui Andrei, iar extensia Chrome era deconectată. Se poate adăuga ca `<CeVezi>` mai târziu.
- Link-ul TikTok (`clip:`): https://www.tiktok.com/@buildwithac.ai/video/7708806387182144790 (2026-11-17). Coperta de pe peretele de clipuri: cadrul de la 2,5 s, decupat 3:4.
