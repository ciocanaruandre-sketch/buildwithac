# Setările firmei (`setari-firma`)

**Ce face:** ține într-un singur loc tot ce e de completat la client: numele firmei, programul, oamenii, serviciile, link-urile, canalul. Fiecare model de vânzare (reamintirile, recenzia, răspunsul în primul minut, asistentul) îl cheamă la început și primește setările. **Completezi o singură dată, pentru toate modelele.** O adresă schimbată se schimbă aici, nu în șase fluxuri.

**Cum arată:** *Chemat de alt flux* → *Setări* (nodul Set cu valorile) → *Verifică setările* (Code). Verificarea oprește fluxul cu un mesaj clar dacă lipsește ceva, în loc să lase un model să trimită mesaje greșite. Mesajul ajunge la fluxul de erori.

**Cum îl cheamă celelalte fluxuri:** un nod *Execute Workflow* numit exact **`Setări firmă`**, care alege fluxul `setari-firma`. Setările se citesc apoi cu `$('Setări firmă').first().json`.

**Aplicații:** niciuna. **Rulări:** nu consumă; în n8n Cloud se numără doar fluxul care îl cheamă.

**Date sensibile:** nu. Aici stau doar datele publice ale firmei.

## Câmpurile

Toate stau în nodul *Setări*. Ce e `CONFIG_…` trebuie completat; verificarea nu lasă fluxul să meargă cu un `CONFIG_` rămas.

| Câmp | Ce pui acolo |
|---|---|
| `firma_nume`, `firma_adresa`, `firma_telefon` | cum apar în mesajele către clienți |
| `program` | orele pe zile, ca text JSON: cheia e ziua (`"0"` = duminică, `"1"` = luni … `"6"` = sâmbătă), valoarea e `["10:00","20:00"]` sau `null` pentru închis |
| `oameni` | cine primește programări, ca text JSON: `[{"nume":"Vlad","calendar_id":"…","servicii":["Tuns"]}]`. `calendar_id` e din Google Calendar: *Setări și permisiuni* → *Integrează calendarul* → *ID calendar*. Fiecare serviciu al unui om trebuie să fie și în `servicii` |
| `servicii` | ce se poate programa, ca text JSON: `[{"nume":"Tuns","durata_min":45,"pret":"100 lei"}]` |
| `link_programare` | pagina unde clientul se programează sau se reprogramează |
| `link_recenzie` | link-ul de recenzie Google al firmei |
| `link_dezabonare` | adresa webhook-ului `GET /dezabonare` din fluxul `dezabonare` (`https://<contul>.app.n8n.cloud/webhook/dezabonare`) |
| `canal` | `email`, `sms` sau `ambele`: pe unde pleacă mesajele către clienți |
| `email_patron` | unde primește patronul anunțurile |
| `telegram_chat_id` | gol = fără Telegram |
| `ton` | `prietenos` sau `elegant` |
| `sheet_id` | ID-ul tabelului firmei (vezi `tabel.md`): bucata din adresă dintre `/d/` și `/edit` |
| `reamintiri`, `recenzie` | `da` / `nu`: pornesc sau opresc fiecare automatizare |
| `reamintire_1_min`, `reamintire_2_min` | cu câte minute înainte pleacă reamintirile (de obicei 1440 și 120) |
| `recenzie_dupa_min` | după câte minute de la sfârșitul programării pleacă cererea de recenzie (de obicei 120) |
| `recenzie_a_doua_zile` | după câte zile pleacă a doua cerere; `0` = fără a doua |
| `recenzie_pauza_zile` | câte zile nu mai ceri recenzie aceluiași client (de obicei 90) |
| `neprezentare_culoare`, `neprezentare_titlu` | cum marchează patronul în calendar un client care n-a venit (culoarea `11` = roșu „Tomato”, sau titlul începe cu `NU A VENIT`): el nu primește cererea de recenzie |
| `informatii_asistent` | întrebările frecvente, pentru asistentul de pe site; ce nu e aici, asistentul transmite patronului |
| `model_ai_mesaj`, `model_ai_asistent` | ID-ul modelului Claude (de exemplu `claude-haiku-5-5`) |

## La client

1. Importă fluxul, completează *Setări*, salvează.
2. Rulează-l o dată de mână (*Execute workflow*): dacă *Verifică setările* e verde, setările sunt bune; dacă e roșu, mesajul spune exact ce câmp lipsește.
3. *Settings* → *Error workflow* → `flux-erori`. Fusul orar: `Europe/Bucharest`.
4. **Publică-l**, înaintea oricărui model: n8n nu publică un flux care cheamă un sub-flux nepublicat. După **orice** schimbare în *Setări*, îl republici: fluxurile publicate citesc versiunea publicată, nu ciorna.

**Verificat la proba din 2026-11-26** (cont de probă n8n Cloud, Conu' Leonida): setările demo trec, iar listele ies ca date, nu ca text. Cazurile de eroare (`CONFIG_` rămas, JSON stricat, serviciu lipsă, canal greșit) sunt verificate de testele din `modele-cod.test.mjs`.
