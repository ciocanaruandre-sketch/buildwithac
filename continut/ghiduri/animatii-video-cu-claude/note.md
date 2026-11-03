# Note: animatii-video-cu-claude

Sursa: caruselul TikTok al lui Andrei (capturile din `continut/clipuri/Screenshot 2026-11-03 2056*.png`).

## Ce spune caruselul (slide-urile primite)
- **Claude Opus 5.5:** „Nu generează video ca Veo sau Kling. Scrie cod, iar codul devine animație.” Avantajul: textul e lizibil, logo-ul e exact, culorile sunt ale brandului tău și poți modifica orice detaliu.
- **GSAP:** „Pentru mișcare, Claude folosește GSAP, o bibliotecă de animații folosită pe multe site-uri premium. Tu descrii cum vrei să intre textul sau logo-ul, el scrie animația cu timing și tranziții fluide.”
- **HyperFrames:** „Animația rulează într-o pagină web, deci mai trebuie transformată în clip. HyperFrames o randează cadru cu cadru într-un MP4, gata de urcat pe TikTok sau Instagram.” (în captură se vede `npx skills add heygen-com/hyperframes`)
- Lipsesc: slide-ul 1 (cârligul, titlul) și ultimul.

## Verificat azi (2026-11-03)
- **Claude Pro:** 20 $/lună (17 $/lună la plata anuală, 200 $ odată). Claude Code e inclus în Pro, nu și în Free. Sursa: https://claude.com/pricing
- **GSAP:** gratuit, inclusiv pluginurile și folosirea comercială (licența standard, Webflow). Interzis doar în unelte vizuale care concurează cu Webflow. Codul scris de AI e permis explicit. Sursa: https://gsap.com/community/standard-license/
- **HyperFrames:** open source, Apache 2.0, fără taxă pe randare. Cere Node.js 22+ și FFmpeg; Chrome-ul pentru randare îl descarcă singur. Versiunea actuală: 0.9.9 (npm). Surse: https://github.com/heygen-com/hyperframes, https://hyperframes.heygen.com/guides/with-claude-code.md
  - Instalarea recomandată în Claude Code (plugin):
    `claude plugin marketplace add heygen-com/hyperframes`
    `claude plugin install hyperframes@hyperframes`
    apoi sesiune nouă sau `/reload-plugins`; se cheamă cu `/hyperframes:hyperframes`.
  - Alternativa (cea din carusel): `npx skills add heygen-com/hyperframes`, alegi **Core Skills**; se cheamă cu `/hyperframes`.
  - Previzualizare: `npx hyperframes preview`. Randare: `npx hyperframes render --output final.mp4`.
  - Probleme: `npx hyperframes doctor` (verifică Node, FFmpeg, Chrome); skill-ul nu apare → sesiune nouă, `/reload-plugins` sau `npx hyperframes skills check`.
  - Există și aplicația desktop HyperFrames Studio (Mac, Windows, Linux), opțională.
- **Rulat într-un dosar gol** (scratchpad, Windows): `npx hyperframes@0.9.9 init intro --resolution portrait --non-interactive --skip-skills` → proiect cu `index.html`, `CLAUDE.md`, `AGENTS.md`, `hyperframes.json`; `doctor` → Node, FFmpeg, Chrome ✓ (whisper, TTS, muzica: opționale); `npm run render` → MP4 de 10 s, 1080×1920, randat în 17 s.
- `--resolution portrait` = 1080×1920 (format TikTok/Reels).
- FFmpeg pe Windows: `winget install Gyan.FFmpeg` (așa e instalat la Andrei); pe Mac: `brew install ffmpeg`.

- **Modelul:** pe Pro, Claude Code folosește implicit Opus 5.5; Opus 5.5 cere Claude Code v2.1.280 sau mai nou (`claude update`). Schimbarea: `/model`. Sursa: https://code.claude.com/docs/en/model-config
- `render --output intro.mp4` pune fișierul în dosarul proiectului; fără `--output`, în `renders/<nume>_<data>.mp4`. Previzualizarea pornește pe portul 3002.
- Zona acoperită de interfața TikTok (jos ~20%, fâșie în dreapta): cunoscută din ghidurile de „safe zone”, nemăsurată de mine; în ghid scrie „cam”.

## Nu se poate verifica fără contul lui Andrei
- Cum arată în Claude Code pluginul instalat (lista din `/plugin`).
- Cât din limita Pro consumă un clip (depinde de clip).

## PDF
- Link-ul pentru Instagram: https://buildwithac.ro/pdf/animatii-video-cu-claude-d72417c513cb.pdf (copie în `PDF ghiduri/animatii-video-cu-claude.pdf`), făcut pe 2026-11-03.
