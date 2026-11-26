# Modelele de fluxuri

Fluxuri reale din portofoliu, curățate: fără conturi conectate, fără ID-uri, fără date reale, toate oprite (`active: false`). Ce e de completat la client e marcat `CONFIG_…`; conturile se conectează la fiecare nod (`DE_CONECTAT` sau fără cont în model).

| Model | Ce face | Aplicații | Date sensibile |
|---|---|---|---|
| `imobiliare-lead-uri` | califică lead-urile din formular cu AI, le trimite agentului | OpenAI, Telegram, Gmail, Sheets | nu |
| `clinica-wf1-programari` | confirmare, reamintiri la 48 h și 3 h, cerere de recenzie | Twilio, Sheets | da |
| `clinica-wf2-raspunsuri` | CONFIRM / ANULEZ / STOP din SMS, alertă de slot liber | Twilio, Sheets, Telegram | da |
| `clinica-wf3-rechemari` | SMS de rechemare la control, cu mesaj fix (fără AI) | Sheets, Twilio, Telegram | da |
| `clinica-wf4-neprezentari` | neprezentările, SMS de reprogramare, raportul de seară | Sheets, Twilio, Telegram | da |
| `carusele-instagram` | carusele din știri AI, în Drive | Telegram, OpenAI, Apify, ScreenshotOne, Drive, Sheets | nu |
| `flux-erori` | e-mail când pică un flux | Gmail | nu |
| `setari-firma` | setările firmei, completate o dată, citite de toate modelele de vânzare | — | nu |

**Un model nou:** `node servicii/automatizari/curata.mjs <export.json> <nume-model>`, apoi înlocuiești de mână ce raportează scriptul. Lângă flux scrii un `README.md`. `node --test "servicii/automatizari/*.test.mjs"` verifică toate modelele.

Sursele (`C:\n8n Agent Builder\`) rămân cum sunt. `workflow-b2b-lead-gen.json` nu e model: trimitea e-mailuri reci, ilegale în România (Legea 506/2004, art. 12).
