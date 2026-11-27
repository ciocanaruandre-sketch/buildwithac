# Clipul: asistentul de pe site (Conu' Leonida)

Ce arată: pe site-ul frizeriei, cineva deschide chatul la o oră la care nu răspunde nimeni la telefon. Întreabă cât costă tunsul, apoi se programează sâmbătă la Vlad. Programarea apare în calendar, iar confirmarea vine pe telefon. La o întrebare la care asistentul nu știe răspunsul, nu inventează: o trimite patronului.

Fără text de vorbit (îl scrie Andrei, dacă vrea).

## Înainte de filmare (cam 5 minute)

1. În proba n8n: `asistent-site`, `asistent – ore libere`, `asistent – programează`, `flux-confirmare` publicate; `setari-firma` cu `ton: elegant`, `canal: email`.
2. Pagina demo, pe laptop: în `prototip/` rulezi `python -m http.server 8765`, apoi deschizi `http://localhost:8765/demo-automatizari/`. **Doar de aici merge chatul** (fluxul primește mesaje doar de la `localhost:8765`).
3. În calendarul lui Vlad, ziua pe care o alegi în clip: câteva programări puse dinainte, ca să se vadă că asistentul sare peste orele ocupate. Fără o programare a ta de la o filmare trecută (o ștergi).
4. Pe telefon: notificările Gmail pornite, modul „Nu deranja” cu excepție pentru Gmail.
5. Pe laptop, trei taburi: pagina demo, Google Calendar cu calendarul lui Vlad pe ziua aleasă, n8n cu `asistent-site` deschis.
6. Ceasul laptopului poate apărea în clip: dacă vrei efectul „seara târziu”, filmezi seara.

## Ce se vede, în ordine

| # | Unde | Ce se întâmplă | Cât durează în realitate |
|---|---|---|---|
| 1 | Laptop, pagina demo | Butonul rotund din colț → fereastra se deschide: „Bună ziua. Sunt asistentul virtual al Conu' Leonida.” | 2 s |
| 2 | Laptop, chat | Scrii: „Cât costă un tuns cu barbă?” → prețul și durata, din lista firmei. | 5–8 s |
| 3 | Laptop, chat | „Aveți loc sâmbătă la Vlad, după-amiaza?” → câteva ore libere, fără cele ocupate din calendar. | 6–10 s |
| 4 | Laptop, chat | Alegi o oră, dai numele și e-mailul tău → asistentul repetă tot într-o frază și cere „da”. | 5–8 s |
| 5 | Laptop, chat | „Da” → „Gata, sunteți programat…”. | 6–10 s |
| 6 | Laptop, Google Calendar | Reîncarci: programarea nouă în calendarul lui Vlad, „Tuns + barbă – <nume>”. | 3 s |
| 7 | Telefon | Confirmarea pe e-mail, cu ziua și ora. | 10–60 s (o tai) |
| 8 | Laptop, chat (opțional) | „Aveți parcare pentru rulote?” → nu inventează: cere numele și contactul, spune că întreabă la firmă. Pe telefon (contul demo e și „patronul”): e-mailul „Întrebare din chatul de pe site”. | 15 s |
| 9 | Laptop, n8n (opțional) | Fluxul pe pânză: agentul cu Claude, memoria și cele trei unelte. | 5 s |

Toată filmarea durează cam 5–10 minute; clipul, 30–45 de secunde. Așteptările dintre mesaje se pot tăia sau accelera; spune pe ecran dacă le accelerezi.

**Merită spus pe ecran:** „Nu propune o oră pe care n-a văzut-o liberă în calendar.” Și: „Ce nu știe, nu inventează: trimite întrebarea patronului.”

**Răspunsurile le scrie Claude de fiecare dată**, deci nu ies la fel la fiecare dublă. Citește-le înainte să le arăți în clip. Dacă propune mai mult de patru ore, refă dubla (instrucțiunile cer cel mult patru).

## Ce se ascunde

- Adresa ta de e-mail: în chat, în descrierea programării din calendar, în e-mailul de pe telefon.
- Bara de adrese a browserului (`localhost:8765`): filmezi pe tot ecranul (F11) sau tai bara.
- Adresa contului n8n (`proba-buildwithac.app.n8n.cloud`) și adresa de e-mail a calendarului, dacă apar.

## După filmare

1. Ștergi programările de probă din calendarul lui Vlad (altfel vin reamintirile).
2. Dacă nu mai filmezi: oprești `asistent-site` (proba n8n are rulări limitate) și serverul de pe 8765 (Ctrl+C).
