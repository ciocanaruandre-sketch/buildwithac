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
| `dezabonare` | STOP prin SMS sau link-ul din e-mail → foaia `Nu trimite` | Sheets (Twilio trimite SMS-urile primite) | nu |
| `programari` | confirmarea programării, anunțul de mutare, reamintirile (două fluxuri: `flux-confirmare`, `flux-verificare`) | Google Calendar, Sheets, Gmail, Twilio | da |
| `raspuns-primul-minut` | răspuns personal în sub un minut la cererile din formularul site-ului, scris de Claude; mesaj fix dacă pică Claude; rezumat la patron | Anthropic, Sheets, Gmail, Twilio | da (la clinici, fără Claude) |
| `asistent-site` | chatul de pe site: răspunde din datele firmei, caută ore libere și face programări în calendar; ce nu știe trimite patronului (trei fluxuri: `flux`, `flux-ore-libere`, `flux-programeaza`) | Anthropic, Google Calendar, Gmail | da (la clinici, nu se pune fără patron) |

## Automatizările de vânzare

Patru automatizări pe care le vând firmelor mici (frizerii, saloane, clinici, restaurante), făcute pe firma demo „Conu' Leonida” și verificate în contul de probă n8n Cloud (2026-11-26 și 2026-11-27). Toate citesc datele firmei din `setari-firma`; la client nu construiești, completezi setările.

| Automatizarea | Modelul | Ce pui la client |
|---|---|---|
| Reamintiri de programare (confirmare, mutare, reamintiri) | `programari` | `flux-confirmare` + `flux-verificare` (`reamintiri: da`) |
| Cererea de recenzie după vizită | `programari` | doar `flux-verificare`, cu `reamintiri: nu`, `recenzie: da` (sau amândouă, odată cu reamintirile) |
| Răspuns în primul minut la cererile de pe site | `raspuns-primul-minut` | `flux.json` + adresa webhook-ului în formularul site-ului |
| Asistentul de pe site (chat cu programări) | `asistent-site` | cele trei fluxuri + fereastra de chat pe site |

**Mereu, la toate:** `setari-firma` (completat și publicat primul), `flux-erori`, tabelul firmei (foile din `setari-firma/tabel.md`). `dezabonare`, la orice automatizare care trimite mesaje oamenilor (toate, în afară de asistent). Sub-fluxurile se publică înaintea fluxurilor care le cheamă.

**Rulările pe lună** (n8n Cloud Starter: 2.500; Pro: 10.000):
- `flux-verificare`: ~840, fix (la fiecare jumătate de oră, între 8 și 21);
- `flux-confirmare`: una pe programare nouă;
- `raspuns-primul-minut`: una pe cerere din formular;
- `asistent-site`: una pe mesaj al clientului (sub-fluxurile nu se numără);
- `dezabonare`: una pe SMS primit sau pe link apăsat;
- `setari-firma`, `flux-erori`: nu se numără separat.

O socoteală, nu o măsurătoare: o frizerie cu 300 de programări, 60 de cereri pe site și 100 de conversații a câte 6 mesaje în chat ajunge la ~1.800 de rulări pe lună cu toate patru: încape în Starter. **Pro e nevoie** când chatul e folosit mult (peste ~200 de conversații pe lună alături de celelalte) sau la firme cu peste ~1.000 de programări pe lună. Prețurile planurilor: `servicii/automatizari/README.md`.

**Un model nou:** `node servicii/automatizari/curata.mjs <export.json> <nume-model>`, apoi înlocuiești de mână ce raportează scriptul. Lângă flux scrii un `README.md`. `node --test "servicii/automatizari/*.test.mjs"` verifică toate modelele.

Sursele (`C:\n8n Agent Builder\`) rămân cum sunt. `workflow-b2b-lead-gen.json` nu e model: trimitea e-mailuri reci, ilegale în România (Legea 506/2004, art. 12).
