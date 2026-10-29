# Note: harvey-agent-clienti

Clipul: `continut/clipuri/2026-10-29-harvey-agent-clienti-final.mp4` (28 s, nepostat la 2026-10-29). Transcrierea: `transcriere.srt`.

Ce spune clipul: Harvey, agent gratuit și open source; îi dai site-ul tău și învață ce vinzi; găsește firme potrivite și le citește site-urile; află ceva specific despre fiecare; scrie e-mail personalizat; citește răspunsurile și duce discuția spre o întâlnire; nimic nu pleacă fără aprobarea ta; rulează pe abonamentul Claude, fără factură de API.

## Decizia lui Andrei (2026-10-29)
Ghidul acoperă **doar cercetarea** (instalare, antrenare pe site, găsirea firmelor, citirea site-urilor, lista). Trimiterea automată apare doar ca „Atenție”: în România e interzisă fără acord prealabil, și către firme. Fără „greșeala mea” (Andrei nu are una): „Atenție” cu capcane reale.

## Verificat (2026-10-29)
- Repo: https://github.com/ethanplusai/harvey · MIT · 3.153 stele · ultimul commit 4237f07, 2026-10-27 · versiunea din pyproject 0.3.0 (README zice 0.2.1 la changelog).
- Cerințe: Python 3.11+, abonament Claude Pro sau Max cu Claude Code conectat. Pe Windows merge doar cu Claude (Codex e refuzat pe Windows, README).
- Varianta ușoară din README: `git clone …`, `cd harvey`, `claude`, apoi „set up Harvey for me”. Repo-ul are un `CLAUDE.md` care face din Claude Code asistentul de instalare.
- Comenzi verificate în `harvey/cli.py`: `train <url>`, `signals --confirm free`, `discover --providers|--estimate|--provider|--city "A;B"|--limit|--max-spend`, `profile`, `dashboard` (127.0.0.1:5555, link cu token), `status`, `export` (implicit doar adrese verificate/risky; `--all` = lista brută).
- **Instalarea n-am putut-o rula** (sistemul de permisiuni a blocat instalarea codului din afară). Pașii sunt verificați din cod și README, nu rulați.
- Abonamentul: pagina oficială https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan (actualizată 2026-10-07): conectat cu planul Claude, `claude -p` consumă din limitele abonamentului. Creditele API separate sunt doar pentru cheie API din Console. Deci „fără factură de API” e corect.
- Prețuri: https://claude.com/pricing: Pro 20 $/lună (17 $ anual), Max de la 100 $/lună.
- Harvey își limitează singur consumul: `max_daily_claude_percent: 80` (lasă loc pentru munca ta).

## Sursele de firme (harvey/collectors/discover.py)
- **OpenStreetMap** (implicit, gratuit, fără cont): caută DOAR meseriile din `TAG_MAP`: roof, plumb, hvac, electric, dentist, lawyer, attorney, contractor, landscap (termeni în engleză). Cafenelele, saloanele, imobiliarele NU merg. Pentru România: doar „dentist”, „lawyer”, „electrician”, „plumber”, „contractor”.
- **Scavio Google Maps** (`scavio_maps`, cheie `SCAVIO_API_KEY`, https://scavio.dev): 50 de credite la înscriere, fără card; 1 credit = o pagină de 20 de firme. Trimite termenul așa cum e scris + centrul hărții (din oraș, geocodat cu Nominatim) → merge cu termeni românești („cafenea”, „salon”). Dă telefon, site, categorie, rating, nr. recenzii.
- DataForSEO Maps/Listings: 1 $ credit la înscriere; Maps trimite `language_code: en`.
- Termenii vin din `icp.industries`, orașele din `icp.geography` (sau `--city`). Nu există opțiune de termen în linia de comandă.

## Ce nu e în ghid / limite
- Telefonul firmei e salvat în baza de date (`companies.phone`), dar NU apare în CSV-ul din cohort (coloane: name, domain, website, industry, location) și nici în tabelul Companies. Soluția din ghid: îi ceri lui Claude Code să scoată un CSV din `data/harvey.db`.
- Etapa ENRICH caută proprietarul și adresa lui de e-mail (date personale: GDPR).

## Juridic (skill-ul legal-advisor-ro + textul legii)
- Legea 506/2004, art. 12 alin. (1): comunicări comerciale prin e-mail interzise fără consimțământ prealabil expres; alin. (4): se aplică și persoanelor juridice. https://legislatie.just.ro/Public/DetaliiDocument/214211
- Art. 13: contravenție, 5.000–100.000 lei; firmele cu cifra de afaceri > 5 mil. lei: până la 2% din cifra de afaceri. Constată și sancționează ANSPDCP.
- Amendă reală: https://financialintelligence.ro/operatorul-elefant-online-a-fost-amendat-cu-10-000-lei-pentru-ca-a-transmis-mesaje-comerciale-nesolicitate/
- Apelurile făcute de un om nu intră sub art. 12 (doar sistemele automate de apelare).
- Nu e consultanță juridică; e informare.

## Publicare
- Clipul pe TikTok: https://www.tiktok.com/@buildwithac.ai/video/7702113310866476310 (postat 2026-10-29).
- PDF (12 pagini): https://buildwithac.ro/pdf/harvey-agent-clienti-ef000b11d20a.pdf (merge după unirea în `main`).
