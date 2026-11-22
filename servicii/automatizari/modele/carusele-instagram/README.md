# Carusele Instagram din știri AI

**Ce face:** pornește la comanda `/post` pe Telegram, la o oră fixă sau printr-un webhook. Strânge știri (Apify, RSS Anthropic, OpenAI, TechCrunch). OpenAI alege subiectul și scrie caruselul. Slide-urile se fac în HTML, devin imagini prin ScreenshotOne și ajung într-un dosar nou în Google Drive, cu descrierea. Pe Telegram vin coperta și starea, iar totul se notează în Sheets.

**Aplicații (toate pe contul clientului):** Telegram, OpenAI, Apify, ScreenshotOne, Google Drive, Google Sheets.

**De completat:** `CONFIG_CONT_INSTAGRAM` (în prompturi și pe slide-uri), `CONFIG_TELEGRAM_CHAT_ID`, `CONFIG_SHEET_ID`, `CONFIG_CONTENT_FOLDER_ID`, `CONFIG_APIFY_DATASET_ID`. `CONFIG_APIFY_TOKEN` și `CONFIG_SCREENSHOT_API_KEY` stau în antetele cererilor HTTP: la client se mută în conturi n8n (*Header Auth*), nu rămân scrise în flux.

**Date sensibile:** nu. Prompturile și aspectul slide-urilor sunt cele de la buildwithac: la client se rescriu pe vocea și culorile lui.

**Față de fluxul original (validat cu `n8n-mcp` 2.96.1, 2026-11-22):** bucla de slide-uri avea ieșirile inversate (acum: „loop” → captura slide-ului, „done” → descrierea); nodurile OpenAI aveau o versiune care nu există (acum v1.1); dosarul din Drive folosea o operație greșită; o expresie din promptul curatorului nu se evalua; alerta Telegram fără legături a ieșit (o înlocuiește `flux-erori`). Avertismentul rămas („Code - Generate Description” pe ieșirea „done”) e greșit: descrierea se face o singură dată, după toate slide-urile.

**Reparat la verificarea finală (2026-11-22):** ID-ul real de chat Telegram din notița „Overview” înlocuit cu `CONFIG_TELEGRAM_CHAT_ID`; OpenAI nu mai continuă la eroare. **De făcut:** webhook-ul și `/post` pornesc rulări plătite (OpenAI, Apify) de la oricine: verifică ID-ul chat-ului în IF.
