# Note: claude-tradingview-mcp

Sursa: ghidul vechi al lui Andrei, `PDF ghiduri/Ghid_Claude_Trading_TradingView.pdf` (5 pagini). Andrei (2026-11-04): ghidul se face în stilul nostru, cu informații noi și actualizate, păstrând ideea. Fără script, fără postare.

## Ce spune ghidul vechi
Claude ca analist de trading, prin proiectul comunitar `tradesdontlie/tradingview-mcp`: Node.js, Git, TradingView Desktop, Claude Desktop, `git clone`, `~/.claude/.mcp.json`, portul de depanare 9222, verificare. Prompturi: analiză de grafic, scanare, Pine Script, backtest, reluare lumânare cu lumânare, jurnal. Avertisment: fără tranzacții automate, nu e sfat financiar.

## Verificat azi (2026-11-04)
- **MCP oficial TradingView:** beta publică din 2026-09-16. URL `https://mcp.tradingview.com/mcp`, OAuth 2.1, fără chei. Inclus de la **Essential** în sus; Basic și perioadele de probă nu au acces. Claude: **Settings → Connectors → Add custom connector → lipești URL-ul → Add → autorizezi** (web, desktop, mobil). Claude Code: `claude mcp add --transport http mcp-tradingview https://mcp.tradingview.com/mcp`, apoi `/mcp`. Sursa: https://www.tradingview.com/mcp/docs
- **Limite oficiale:** date întârziate (blogul nu spune cu cât), listă de unelte limitată, posibile limite pe zi, ~100 de cereri/minut. Sursa: https://www.tradingview.com/blog/en/tradingview-mcp-server-public-beta-60864/
- **Unelte oficiale (35):** watchlists 8, date de piață 3 (`get_ohlcv`, max. 5.000 de lumânări), căutare 1, screener 5 (`run_screener`, max. 1.000 de rânduri; `get_technicals_rating`: RSI, MACD etc.), știri 2 (are și `ro`), fundamentale 3, documente 2, calendare 3, alerte 8 (doar preț simplu, fără indicatori, fără webhook). **Fără** grafic, desen, Pine Script, backtest, reluare, ordine.
- **Prețuri TradingView (EUR, pagina de prețuri):** Essential 14,95 €/lună, 12,95 €/lună la plata anuală. Sursa: https://www.tradingview.com/pricing/
- **Claude:** conectorii personalizați merg și pe Free (maximum unul). Sursa: https://support.claude.com/en/articles/11175166
- **Termenii TradingView, secțiunea 3:** datele sunt „licensed for exclusive display-only use”; interzic „any machine-driven processes that do not involve the direct, human-readable display”, „any processing of TradingView's content” și „utilization of any third-party products, tools, or services designed to facilitate or enable such non-display usage”. Terților le e interzis orice produs sau serviciu care „facilitates, enables, or encourages” încălcarea. Sursa: https://www.tradingview.com/policies/
- **Proiectul comunitar `tradesdontlie/tradingview-mcp`:** activ, ~7.000 de stele, MIT, 84 de unelte. Propriul avertisment: „may conflict with those terms”, riscul de suspendare a contului e al tău, folosește API-uri interne nedocumentate. Unealta `ui_evaluate` rulează cod în sesiunea conectată. Nu am găsit rapoarte de conturi închise (nu înseamnă că nu există).
- **Pași din ghidul vechi care nu mai merg sau n-au fost corecți:** calea Windows (TradingView e acum pachet MSIX în `WindowsApps`, poate da „Access is denied”); `~/.claude/.mcp.json` nu apare în documentația Claude Code (serverele stau în `~/.claude.json` sau în `.mcp.json` din proiect) și nu e fișierul lui Claude Desktop.

## Decizii (Andrei, 2026-11-04)
- MCP-ul oficial, ghid nou, metodă mai simplă. Poate urmează un clip („s-a schimbat, acum e mai ușor”).
- Andrei n-are cont TradingView. Conectorul nu poate fi testat; capturi doar din pagini publice și din ecranul de conectori din Claude.
- Slug-ul `claude-tradingview-mcp` și cuvântul `TRADING` se refolosesc: exemplul devine ghidul adevărat.

## Văzut pe ecran (2026-11-04)
- **Claude:** conectorii s-au mutat: **Customize → Connectors** (`claude.ai/customize/connectors`); **Settings → Connectors** arată doar „Connectors have moved to Customize”. Butonul **Add → Add custom connector**. Fereastra are **Name**, **MCP server URL**, **Cancel**, **Continue**. În fila **Yours**, conectorii neconectați au butonul **Connect**.
- **TradingView:** `tradingview.com/pricing`: **Essential**, **Start now**, **Monthly/Annually** (14,95 € / 12,95 €). `Export trades in CSV`: de la Essential în sus. Pine Script și backtestul: pe toate planurile.
- **Pine Editor** (fără cont, pe `tradingview.com/chart`): butoanele **Add to chart**, **Save**; versiunea v6. **Add to chart** cere conectare.
- **Strategy Report**, **List of Trades**, **Download**: din ajutorul oficial, nevăzute pe ecran. Sursa: https://www.tradingview.com/support/solutions/43000613680/
- Coperta: fotografia cu lumânări care era deja la ghidul exemplu, tăiată 1080×760.

## Nu s-a putut verifica (fără cont TradingView plătit)
- Conectorul n-a fost adăugat în contul lui Andrei. Clicul pe **Continue** a fost blocat de permisiuni, deci ecranele până la **Add** vin din ajutorul Claude: https://support.claude.com/en/articles/11175166
- Ecranul de autorizare TradingView și numele butoanelor de pe el.
- Răspunsurile reale ale uneltelor: prompturile sunt scrise după documentația uneltelor, nu rulate.
- Dacă screenerul are toate filtrele din prompturi (promptul cere lui Claude să spună când lipsește unul).
- Întârzierea datelor: TradingView nu o spune.
- Etichetele ferestrei de aprobare din Claude (în afară de **Allow always**, din ajutorul Claude).

## Greșeala mea
Andrei nu folosește TradingView, deci fără `<GresealaMea>`.

## PDF
- Link-ul pentru Instagram: https://buildwithac.ro/pdf/claude-tradingview-mcp-e39f4e1b2870.pdf (copie în `PDF ghiduri/claude-tradingview-mcp.pdf`), făcut pe 2026-11-04.
