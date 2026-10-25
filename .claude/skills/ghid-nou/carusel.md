# Textul caruselului

Andrei face designul în Canva, în culorile logo-ului. Claude scrie **textul gata de copiat**, slide cu slide, în `continut/ghiduri/<slug>/carusel.md`.

## Reguli
- **6–10 slide-uri**, cel mult ~25 de cuvinte pe slide.
- **Slide 1 = cârligul**: același titlu ca ghidul (`titlu` din frontmatter) și aceeași imagine (`imagine`).
- Caruselul spune ***ce***: ideea, rezultatul, de ce merită. Ghidul spune ***cum***. Pașii exacți nu încap în carusel; promite-i („pașii exacți îi găsești în ghid”).
- **Ultima slide:** „Ghidul complet: caută **CUVÂNT** pe buildwithac.ro · link în bio”.
- **Fără link-uri** nicăieri: nici în slide-uri, nici în descriere (risc de ban pe TikTok).
- Tonul din `standard.md`; aceleași semne de text AI de evitat.

## Formatul fișierului
```markdown
# Carusel: <titlu>
Cuvânt: <CUVÂNT> · Ghid: site/content/ghiduri/<slug>/index.mdx

## Slide 1 (cârlig)
<textul>
Imagine: <ce se vede; aceeași ca cover.webp>

## Slide 2
<textul>

…

## Slide N (final)
Ghidul complet: caută <CUVÂNT> pe buildwithac.ro · link în bio

## Descrierea postării
<2–3 rânduri, fără link-uri>, plus îndemnul: „scrie <CUVÂNT> în căutarea de pe site”
#hashtag1 #hashtag2 … (5–8, în română și engleză, despre subiect)
```
