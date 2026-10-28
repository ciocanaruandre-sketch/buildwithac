# Standardul unui ghid

Ținta (Andrei): omul îl pune în practică **fără nelămuriri**, chiar dacă e gratuit. Ghidul de pe site e complet și liber: nimic nu se ascunde în spatele PDF-ului sau al e-mailului.

Ghidul e mai lung decât postarea (Andrei: „vor fi mai lungi, mai mari un pic”). Pune tot ce clipul sau caruselul sare: conturile, instalările, setările, pașii de mijloc. Ghidul de exemplu („site-uri”) e doar o probă, nu ținta de lungime.

## Structura
1. **Antetul** (din frontmatter): titlu, descriere scurtă, durată, nivel, „actualizat la”. Cuprinsul se face singur din pași.
2. **`<DeCeAiNevoie>`**: conturile, abonamentele (cu preț), programele, timpul.
3. **Pașii**, fiecare `<Pas>` cu **o singură acțiune**. În pași:
   - `<Prompt>` pentru orice prompt sau comandă de copiat;
   - `<CeVezi>`: captura după fiecare pas important;
   - `<DacaNuMerge>`: erorile frecvente, la pașii care pot da erori.
4. **`<GresealaMea>`**: doar din clip sau de la Andrei. Altfel, `<Atentie>`, cu o capcană reală.
5. **Finalul comun** și **caseta PDF**: le pune pagina singură (nu se scriu în MDX).

## Frontmatter
```yaml
---
titlu: "Site-uri care nu arată „făcute cu AI”"   # același titlu ca prima slide a caruselului
slug: site-uri-fara-aer-de-ai                     # = numele dosarului; litere mici, cifre, cratime
cuvant: SITE                                      # MAJUSCULE și cifre, unic
descriere: "…"                                    # 1–2 fraze, sub 160 de caractere
ceGasesti: ["…", "…", "…"]                        # 3–4 rânduri scurte, apar în panoul de detalii
durata: "30 min"                                  # cât durează realist, cu tot cu așteptări
nivel: "începător"                                # începător | mediu | avansat
unelte: ["Claude Code", "21st.dev"]               # numele exacte; după ele se caută
actualizat: 2026-10-25
publicat: 2026-10-25
imagine: cover.webp                               # în site/public/ghiduri/<slug>/; aceeași ca prima slide
clip: https://www.tiktok.com/@buildwithac.ai/video/…   # doar la ghidurile din clip
pdf: false                                        # true abia după `npm run pdf`
---
```
Fără câmpul `exemplu` (e doar pentru ghidurile de test).

## Componentele
Ghidul se scrie **doar** din ele plus Markdown (paragrafe, **bold**, liste, `cod inline`, link-uri). Fără HTML de mână.

```mdx
<DeCeAiNevoie>
- Cont Claude Pro (20 $/lună)
- Claude Code instalat
- 30 de minute
</DeCeAiNevoie>

<Pas titlu="Instalezi skill-ul de design">
O frază despre ce faci și de ce.

<Prompt>Instalează skill-ul UI UX Pro Max și confirmă-mi când e gata.</Prompt>

<CeVezi src="pas-2-skill-instalat.webp" alt="Claude confirmă că skill-ul e instalat" />

<DacaNuMerge>Dacă nu apare în listă, închide și redeschide Claude Code, apoi scrie `/skills`.</DacaNuMerge>
</Pas>

<GresealaMea>Prima dată am sărit pasul ăsta și…</GresealaMea>

<Atentie>Pe telefon, prea multe animații fac site-ul greu.</Atentie>
```

Reguli:
- `<Pas titlu="…">` cu **ghilimele duble**; titlul e acțiunea, la persoana a doua („Instalezi…”, „Alegi…”).
- Un `<Prompt>` conține doar textul de copiat, fără explicații în el.
- `<CeVezi src alt />`: fișierul e în `site/public/ghiduri/<slug>/`, cu numele `pas-N-ce-arata.webp`. `alt` spune ce se vede („Claude confirmă că…”). Capturile pe care le face Andrei rămân deocamdată fără fișier și apar pe site ca „captură de pus: {alt}”. Fă-i lista lor: pasul, ce să capteze, numele fișierului.
- `<Pas` scris ca exemplu într-un bloc de cod nu contează ca pas.

## Tonul
| Regula | Bine | Rău |
|---|---|---|
| „tu”, ca un prieten care a făcut-o înaintea ta | „Deschide Claude și scrie…” | „Utilizatorul va deschide aplicația…” |
| fraze scurte, fără introduceri goale | „Instalezi skill-ul. Durează un minut.” | „În acest pas vom învăța cum putem instala…” |
| afirmații sigure; nesigurul, cu motivul lui | „Merge doar pe planul Pro: pe Free butonul nu apare.” | „S-ar putea să funcționeze în anumite cazuri.” |
| termenul tehnic explicat la prima apariție | „un MCP, adică un conector prin care Claude citește alt program” | „conectezi MCP-ul” (fără explicație) |
| fără exagerări de reclamă | „Durează 30 de minute și costă 20 $/lună.” | „Revoluționează-ți munca fără niciun efort!” |
| numele exacte de pe ecran | „apasă **Settings → Connectors**” | „intră în setări și caută conectorii” |
| fără semnele textului AI | (lista de mai jos) | |

## Semnele textului făcut cu AI (de evitat)
- linia lungă „—” (pune virgulă, două puncte sau fă două fraze);
- înșiruiri de câte trei, din reflex („rapid, simplu și eficient”);
- „nu doar X, ci și Y”, „nu e vorba de X, ci de Y”;
- deschideri: „Hai să…”, „În lumea de azi…”, „Ai visat vreodată…?”, întrebări retorice la început;
- cuvinte umflate: „revoluționar”, „fără efort”, „magic”, „game-changer”, „esențial”, „puternic”, „robust”;
- încheieri: „Sper că…”, „Mult succes!”, „În concluzie…”, rezumatul a ce tocmai s-a spus;
- emoji la fiecare rând; **bold** pe jumătate de frază;
- englezisme când există cuvântul românesc obișnuit („folosește”, nu „utilizează”/„leverage”).

## Verificarea (ghiduri gratuite)
Fără testare cap-coadă. Claude verifică singur:
- link-urile (se deschid, duc unde trebuie);
- prețurile și planurile (pe site-ul oficial, azi);
- versiunile și numele butoanelor (documentația sau capturi recente);
- comenzile, rulate într-un dosar gol din scratchpad, când nu cer conturile lui Andrei.

Ce nu se poate verifica fără contul lui Andrei se spune în `note.md` și i se arată lui Andrei.
