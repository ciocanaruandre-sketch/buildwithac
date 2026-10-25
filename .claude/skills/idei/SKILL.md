---
name: idei
description: Folosește când Andrei nu știe ce să posteze pe TikTok sau Instagram, cere idei de clipuri ori carusele, întreabă ce e nou în AI care merită postat, sau aduce clipuri de la alți creatori în continut/inspiratie/ ca să scoată ideea din ele.
---

# Idei de postări

## Pe scurt
Andrei primește **5–8 idei** de postări pentru @buildwithac.ai, fiecare gata de ales. Ce alege intră în `continut/idei.md`; de acolo pornește skill-ul `ghid-nou`.

## Două porniri
1. **„Nu știu ce să postez”**: Claude caută.
   - Noutăți și știri AI din ultimele ~2 săptămâni (WebSearch, întâi modul `standard`): lansări de modele, funcții noi în Claude și în uneltele folosite de public, unelte care fac ceva vizibil.
   - Ce postează alți creatori de AI. **TikTok și Instagram se pot căuta doar parțial** (prin web); spune-i asta lui Andrei, nu pretinde o imagine completă.
2. **Clipuri de inspirație** în `continut/inspiratie/` (ignorat în git). Transcrie fiecare clip:
   `hyperframes transcribe continut/inspiratie/<fișier> -m large-v3 -l ro --to srt -o continut/inspiratie/<fișier>.srt`
   (pentru clipuri în engleză: `-l en`). Apoi scoate **ideea** din el, nu textul.

## Ce primește Andrei
Pentru fiecare idee, exact câmpurile astea:
- **Cârligul:** prima frază sau prima slide, așa cum ar suna în postare.
- **De ce acum:** ce s-a întâmplat, cu **sursa** (link).
- **Formatul:** clip sau carusel, și de ce.
- **Ce ar intra în ghid:** 3–5 pași, pe scurt.
- **Efortul:** mic / mediu / mare (cât de greu e de făcut ghidul și postarea).

Înainte de listă, filtrează:
- nimic care e deja în `continut/idei.md` („De făcut” sau „Postate”);
- prioritate pentru subiectele în care **Claude face ceva concret, vizibil** (asta a mers până acum, alături de un design interesant în Canva, în culorile logo-ului);
- publicul: oameni care învață AI și firme mici (cafenele, saloane, clinici, imobiliare).

## Ce se poate copia
Subiectul și ideea, da. Textul și designul altui creator, cuvânt cu cuvânt, nu.

## `continut/idei.md`
Andrei alege ce se salvează; restul nu se scrie nicăieri.

```markdown
## De făcut
### <titlu scurt> (adăugată <AAAA-LL-ZZ>)
- Cârlig: …
- De ce acum: … (<link>)
- Format: clip | carusel
- În ghid: …
- Efort: mic | mediu | mare

## Postate
- <titlu scurt>: postată <AAAA-LL-ZZ> → ghid `<slug>`
```

Când o idee e postată (pasul 8 din `ghid-nou`), intrarea ei se mută în „Postate”, pe un singur rând.
