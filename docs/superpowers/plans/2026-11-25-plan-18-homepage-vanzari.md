# Plan 18: homepage-ul pentru vânzări

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Homepage-ul aduce cereri de colaborare: întâi cine e Andrei și ce a făcut, apoi serviciile, calculatorul și formularul; ghidurile, după.

**Architecture:** Componente noi sau rescrise în `site/components/home/`, aceeași pagină statică. Calculele stau separat, în `site/lib/`, testate cu vitest. Variantele de aspect sunt **doar CSS** peste același HTML, alese prin `data-port`, `data-calc`, `data-ghid` pe `<html>`; o bară temporară le schimbă și iese la Task 8.

**Tech Stack:** Next.js 16.4.6, React 19, GSAP, Lenis, vitest, Playwright. Fără pachete noi.

**Spec:** `docs/superpowers/specs/2026-11-25-homepage-vanzari-design.md` (textele exacte sunt acolo; planul nu le repetă)

## Global Constraints

- Română, diacritice cu virgulă, „tu”, persoana I singular. `*cuvânt*` din spec = `<span className="serif gtxt">`.
- Coperta (`Hero.tsx`) nu se atinge. Fără cifre, recenzii sau clienți inventați. Fără prețuri.
- Se proiectează întâi la 390px; animațiile se opresc la `prefers-reduced-motion`.
- Nu se schimbă: API-urile, Kit, `/ghiduri`. `#formular`, `#email`, `#contact`, `#ghiduri`, `#portofoliu`, `#servicii` rămân valabile.
- Înainte de cod Next: `site/AGENTS.md`. Fără `next build` cât merge dev-ul, decât cu `NEXT_DIST_DIR`.
- Commit-urile: în română, cu `Claude-Session: …` și, pe ultimul rând, `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Nimic în `main` fără „da”.

## Review Focus

1. Omul a scris deja în „Descriere” și apoi folosește calculatorul: textul lui rămâne neatins (Task 3).
2. Cursoarele la capete: fără `NaN`, iar textul e corect („101 ore”, dar „187 de ore”) (Task 3).
3. Pagina lățită: rândurile trase cu degetul, foile rotite și cele două butoane nu fac scroll orizontal la 390px și la 320px (Task 1, 4, 6).
4. Doar cu tastatura: rândurile de proiecte se pot derula, filele calculatorului se schimbă cu săgețile (Task 3, 4).
5. Linkurile vechi (`/?serviciu=site#formular`, `/?abonat=1#email`, `/#contact`) ajung unde trebuie în ordinea nouă (Task 2, 6).

---

### Task 1: Descrierea, banda, titlul din Google

**Files:** Modify `site/components/home/Cortina.tsx`, `Banda.tsx`, `home.css`, `site/app/layout.tsx`. Test: `site/tests/e2e/home.spec.ts`.

**Interfaces:** Produces: `.cortina-but` (cele două linkuri).

- [ ] **Step 1: Testele** (în „cortina” și „banda”)
  - `.manifest` conține „Mecatronica la Politehnica din București” și „de clienții tăi.”
  - `.cortina-but a` are textele `["Analiză gratuită", "Ghiduri gratuite"]` și href `#formular`, `/ghiduri`.
  - la lățimile 390 și 320: cele două au același `y` (±1) și lățimi egale (±1), fiecare pe un singur rând (înălțime < 60px), iar `documentElement.scrollWidth <= innerWidth`.
  - `.curtain` și `.banda` nu conțin „tot gratuit”; `.banda` conține „construit pe nevoile tale”.
  - titlul paginii: `buildwithac · site-uri și automatizări cu AI`.
- [ ] **Step 2:** `npx playwright test home.spec.ts -g "cortina|banda"` → pică pe textele noi.
- [ ] **Step 3: Codul.** Textul, butoanele (flex, `flex: 1`, primul cu `--grad`, al doilea cu contur), scoaterea `.note`, cuvintele benzii, metadatele, toate după spec. Animația cuvintelor rămâne.
- [ ] **Step 4:** aceeași comandă → trece. **Step 5:** commit `homepage: descrierea nouă cu cele două butoane, banda, titlul`.

### Task 2: Ordinea, formularul sus, ghidurile gratuite/premium, meniul

**Files:**
- Create `site/components/home/Colaborare.tsx`, `site/components/home/Ghiduri.tsx`, `site/lib/numere.ts`, `site/tests/unit/numere.test.ts`
- Delete `SectiuneGhiduri.tsx`, `PanouGhid.tsx`, `PentruCine.tsx`, `site/tests/e2e/home-ghiduri.spec.ts`, stilurile `.guides/.gtrack/.gcard/.drawer/.who2/.paths/.path`
- Modify `site/app/page.tsx`, `Contact.tsx`, `FormularContact.tsx`, `formular-contact.css` (`.contact` → `.colab`), `Servicii.tsx`, `Intrebari.tsx`, `SectiuneEmail.tsx`, `home.css`, `site/components/layout/Nav.tsx`, `site/tests/e2e/{home,cadru,contact,fluiditate}.spec.ts`, `site/tests/prod/productie.spec.ts`

**Interfaces:** Produces:
- `cuDe(n: number, singular: string, plural: string): string` și `mii(n: number): string` (3250 → „3.250”, scris de mână, nu `toLocaleString`, ca să nu difere serverul de browser) în `lib/numere.ts`
- `<Ghiduri numar={number} />`, `<Colaborare />` (secțiunea `id="colaborare"`, clasa `colab`, conține `<FormularContact />` cu `id="formular"`)

- [ ] **Step 1: Testele**
```ts
// numere.test.ts
expect(cuDe(1, "ghid", "ghiduri")).toBe("1 ghid");
expect(cuDe(6, "ghid", "ghiduri")).toBe("6 ghiduri");
expect(cuDe(20, "oră", "ore")).toBe("20 de ore");
expect(cuDe(101, "oră", "ore")).toBe("101 ore");
expect(cuDe(187, "oră", "ore")).toBe("187 de ore");
expect(cuDe(1000, "oră", "ore")).toBe("1.000 de ore");
expect(mii(39000)).toBe("39.000");
// home.spec.ts: ordinea
const ids = await page.$$eval("main section", (s) => s.map((x) => x.id).filter(Boolean));
expect(ids).toEqual(["hero", "portofoliu", "servicii", "colaborare", "ghiduri", "tiktok", "email", "intrebari", "contact"]);
```
  (Task 3 adaugă `"calculator"` între `servicii` și `colaborare`.)
  - `#ghiduri`: linkul „Ghiduri gratuite” → `/ghiduri`, conține „6 ghiduri” în producție; linkul „Ghiduri premium” → `#email`, conține „În curând”. Nu există `.gcard`, `.drawer`, `#cine`.
  - `.colab`: titlul „Vrei să colaborăm?” (h2), „Începem cu o analiză gratuită.”, cele trei promisiuni, butonul „Vreau analiza gratuită” (înlocuiește „Trimite” în toate testele). `#contact` n-are `form`.
  - meniul: `["Portofoliu", "Servicii", "Ghiduri", "Social media", "Contact", "Colaborare"]`; pe telefon aceleași linkuri + rețelele.
  - Întrebări: există „Ce primesc la analiza gratuită?”; „Scrie-mi direct” → `#contact`.
  - `/#contact` → titlul „Ai o întrebare? Scrie-mi.” e în ecran. Testele existente pentru `?serviciu=…#formular` și `?abonat=1#email` rămân.
- [ ] **Step 2:** `npx vitest run numere` și `npx playwright test home cadru contact fluiditate` → pică.
- [ ] **Step 3: Codul.** În `FormularContact`, `h3` + `.sub` ies (titlul e în `Colaborare`), iar cardul devine `aria-labelledby` pe `h2`. `numar` = `ghiduri.length`. Răspunsul la întrebarea nouă: „Îmi povestești cum lucrezi, iar eu îți spun ce s-ar putea automatiza și ce aș îmbunătăți la site. Dacă n-ai încă site, îmi spui cum ți-l imaginezi.” În `productie.spec.ts`, `#ghiduri` verifică „Ghiduri gratuite” în loc de titlul unui ghid.
  Aspect: `.ghid-foi` = două foi crem lipite cu bandă; `[data-ghid="plic"]` schimbă foaia premium într-un plic sigilat cu lacăt (SVG).
- [ ] **Step 4:** aceleași comenzi → trec; `npx tsc --noEmit -p .` curat. **Step 5:** commit `homepage: ordinea nouă, formularul sus, ghidurile gratuite și premium`.

### Task 3: Calculatorul

**Files:** Create `site/lib/calculator.ts`, `site/components/home/Calculator.tsx`, `site/components/home/calculator.css`, `site/tests/unit/calculator.test.ts`, `site/tests/e2e/calculator.spec.ts`. Modify `site/app/page.tsx`, `FormularContact.tsx`.

**Interfaces:**
- Consumes: `cuDe`, `mii`; evenimentul existent `contact:serviciu`.
- Produces:
```ts
export type Timp = { minute: number; leiPeOra: number };
export type Clienti = { cereri: number; dinZece: number; leiPeClient: number };
export const LIMITE: Record<keyof Timp | keyof Clienti, { min: number; max: number; pas: number; start: number }>;
// minute 10–240 pas 5 start 45; leiPeOra 20–300 pas 10 start 50; cereri 1–30 pas 1 start 5;
// dinZece 1–10 pas 1 start 3; leiPeClient 50–5000 pas 50 start 500
export function calculTimp(v: Timp): { ore: number; lei: number };      // ore = floor(minute*250/60); lei = round(minute*250/60*leiPeOra)
export function calculClienti(v: Clienti): { leiPeLuna: number };        // round(cereri*52/12*dinZece/10*leiPeClient)
export function textTimp(v: Timp): string;
export function textClienti(v: Clienti): string;
```
  Evenimentul nou `contact:calcul`, `detail: string` (textul).

- [ ] **Step 1: Testele unitare**
```ts
expect(calculTimp({ minute: 45, leiPeOra: 50 })).toEqual({ ore: 187, lei: 9375 });
expect(calculTimp({ minute: 10, leiPeOra: 20 })).toEqual({ ore: 41, lei: 833 });
expect(calculTimp({ minute: 240, leiPeOra: 300 })).toEqual({ ore: 1000, lei: 300000 });
expect(calculClienti({ cereri: 5, dinZece: 3, leiPeClient: 500 })).toEqual({ leiPeLuna: 3250 });
expect(calculClienti({ cereri: 1, dinZece: 1, leiPeClient: 50 })).toEqual({ leiPeLuna: 22 });
expect(textTimp({ minute: 45, leiPeOra: 50 })).toBe("Din calculator: 45 de minute pe zi de muncă repetată, 50 de lei ora. Cam 187 de ore și 9.375 lei pe an.");
expect(textClienti({ cereri: 5, dinZece: 3, leiPeClient: 500 })).toBe("Din calculator: 5 cereri pe săptămână fără răspuns, 3 din 10 cumpără, 500 de lei pe client. Cam 3.250 lei pe lună.");
for (const k of Object.values(LIMITE)) expect((k.start - k.min) % k.pas).toBe(0);
```
- [ ] **Step 2: Testele în browser** (`calculator.spec.ts`)
  - la început se vede fila „Clienții pierduți” cu „3.250 lei”; cu săgeata stânga/dreapta pe file (`role="tablist"`) trece la „Timpul meu”, cu „187 de ore” și „9.375 lei”.
  - cursorul `cereri` dus la 10 cu tastatura → „6.500 lei”; toate cursoarele la capete: pagina nu conține „NaN”.
  - „Vreau analiza gratuită →”: formularul în ecran, „Automatizări” apăsat, „Descriere” = textul din `textClienti`.
  - „Descriere” scrisă de om („Am o cafenea”) rămâne „Am o cafenea” după buton; apăsat din nou fără text de om, descrierea ia cifrele noi.
  - fără scroll orizontal la 390 și 320.
- [ ] **Step 3:** `npx vitest run calculator` și `npx playwright test calculator` → pică.
- [ ] **Step 4: Codul.** `FormularContact` ține ultimul text pus de calculator într-un ref; scrie doar dacă descrierea e goală sau egală cu el; greșeala de la descriere se curăță. Rezultatul e în `<output aria-live="polite">`. Aspect: bonul de casă implicit, `[data-calc="caiet"]` = foaia de caiet. Actualizează testul de ordine din Task 2.
- [ ] **Step 5:** aceleași comenzi + `npx playwright test contact home` → trec. **Step 6:** commit `homepage: calculatorul`.

### Task 4: Portofoliul

**Files:** Modify `site/content/portofoliu.ts`, `Portofoliu.tsx`, `home.css`, `site/tests/e2e/home.spec.ts`.

**Interfaces:** `ElementPortofoliu` primește `dateDemo?: true`. CRM e primul, ImobSearch al doilea, `link: "https://www.imobsearch.ro"`. Imaginea CRM: `/portofoliu/crm.webp` (până la Task 5: un chenar gol).

- [ ] **Step 1: Testele:** primul `.it` conține „CRM pentru echipe de vânzări” și „date demo”; ImobSearch are link extern cu `target="_blank"` și `rel="noopener"`; conceptele rămân 3, cu linkurile lor, etichetate; rândurile `.rand` au `tabindex="0"`, `role="region"` și `aria-label`, iar săgeata dreapta le schimbă `scrollLeft`; fără scroll orizontal al paginii la 390 și 320.
- [ ] **Step 2:** `npx playwright test home -g portofoliu` → pică.
- [ ] **Step 3: Codul.** HTML: `.mare` (CRM), `.it` ImobSearch, `.rand` Automatizări (3), `.rand` Concepte (3); pe desktop rândurile sunt grile de 3. Variantele: implicit = rânduri trase cu degetul (scroll-snap); `[data-port="teanc"]` = foi `position: sticky` suprapuse; `[data-port="lista"]` = CRM mare + rânduri cu miniatură de 96px.
- [ ] **Step 4:** comanda → trece, pe toate trei valorile `data-port` pentru testul de lățime. **Step 5:** commit `homepage: portofoliul cu CRM-ul primul`.

### Task 5: Capturile

**Files:** Create `site/public/portofoliu/crm.webp`; replace `site/public/portofoliu/imobsearch.webp`.

- [ ] **Step 1:** ImobSearch: Playwright la 1440×900 pe https://www.imobsearch.ro, bara de cookie-uri închisă cu „Doar esențiale”; webp, 1440px lățime.
- [ ] **Step 2:** CRM: **anunță-l pe Andrei**, apoi din `crm/`: `npm run demo` (doar baza de test; scriptul refuză altele), `npm run dev` pe portul lui, pagina cea mai grăitoare în modul filmare (blurează numele, firmele, telefoanele); sumele se blurează în captură prin CSS injectat. Contul și parola demo: din README-ul și testele CRM-ului, nu se scriu nicăieri.
- [ ] **Step 3:** Uită-te la ambele imagini: niciun nume, telefon sau sumă lizibilă, nicio adresă de e-mail. Sub 200 KB fiecare.
- [ ] **Step 4:** commit `portofoliu: capturile CRM și ImobSearch`.

### Task 6: Finalul ghidurilor, newsletterul, confidențialitatea, lungimea

**Files:** Modify `site/components/ghid/FinalGhid.tsx`, `ghid.css`, `SectiuneEmail.tsx`, `site/app/confidentialitate/page.tsx`, `site/tests/e2e/{ghid,home,pagini}.spec.ts`.

- [ ] **Step 1: Testele**
  - pe pagina unui ghid: cardul „Vrei să-l fac eu pentru tine?” cu link `/#formular`; nu apare în PDF (secțiunea are deja `data-fara-tipar`).
  - `.mail` conține „gratuit sau premium”; `/confidentialitate` conține „ghidurile noi, gratuite sau plătite, și noutăți din AI”.
  - la 390×664: `#portofoliu` începe sub 3 ecrane, `#formular` sub 10, pagina are cel mult 17.
- [ ] **Step 2:** rulează → pică. **Step 3:** codul; dacă lungimea nu iese, micșorează spațierile secțiunilor (140px → 90px pe telefon), nu tăia conținut. Cardul din ghid: „Dacă n-ai timp de el, îmi spui ce vrei și îl fac eu.”
- [ ] **Step 4:** trec. **Step 5:** commit `ghiduri: cardul spre colaborare; newsletterul pomenește ghidurile premium`.

### Task 7: Comutatorul și previzualizarea

**Files:** Create `site/components/home/Variante.tsx` (temporar), modify `page.tsx`.

- [ ] **Step 1:** Bară mică jos, trei grupuri (Portofoliu, Calculator, Ghiduri), scrie `data-*` pe `<html>` și le ține în `sessionStorage`.
- [ ] **Step 2:** `npx vitest run`, `npx playwright test --workers=2`, `npx tsc --noEmit -p .`, `npm run lint`. Aurora și „banda curge” pot pica la rece (cunoscute): rulează-le singure.
- [ ] **Step 3:** Uită-te tu la pagina întreagă la 390px, pe fiecare variantă; repară ce se vede rău.
- [ ] **Step 4:** commit, `git push -u origin homepage-vanzari`, `vercel ls` din `site/`, linkul previzualizării către Andrei. **Oprire: Andrei alege și corectează textele.**

### Task 8: Curățenia și unirea (doar după alegerile lui Andrei)

- [ ] Scoate `Variante.tsx`, variantele nealese din CSS și atributele `data-*` din teste.
- [ ] `CLAUDE.md`: drumul omului (clip → ghid, iar homepage-ul vinde colaborarea) și prototipurile înlocuite; `docs/progres-brainstorming.md`: stadiul.
- [ ] `npx vitest run`, `npx playwright test --workers=2`, `npm run verifica`, `npm run lint`, `npm run e2e:prod` → trec. Un verificator pe toată ramura (un singur subagent, anunțat înainte).
- [ ] La „da”: unirea în `main`, push, `vercel ls`, `curl` pe `https://buildwithac.ro`.
