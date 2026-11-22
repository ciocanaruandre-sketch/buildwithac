<!--
Modelul instrucțiunilor de pornire (pasul 6 din drumul clientului). Skill-ul automatizare-client îl copiază în
clienti/<slug>/automatizari/pornire.md, înlocuiește <Numele firmei>, <adresa-contului> și <e-mailul lui Andrei>,
scoate ce nu se aplică, apoi face PDF-ul: node servicii/automatizari/pdf/tipareste.mjs <slug> pornire.
Comentariile ca acesta nu apar în PDF.
Numele butoanelor: verificate pe un cont de probă n8n Cloud, n8n 2.48.7, la 2026-11-22. Ce e marcat
„de confirmat la primul client” nu se putea vedea în perioada de probă.
-->
# Pornim automatizarea: ce faci ==tu==

Pentru <Numele firmei>. Facem pașii împreună, pe un apel, cu ecranul tău partajat. Durează cam 30 de minute. Ai nevoie de laptop, de e-mailul firmei și de un card pentru abonamentul n8n.

n8n e aplicația în care rulează automatizarea. Contul e al tău și îl plătești tu. Eu intru în el invitat, ca să construiesc și să repar.

## Faci contul n8n Cloud

Intră pe **n8n.io** și pornește contul gratuit de probă. Folosește e-mailul firmei, nu unul personal: contul rămâne al firmei.

La un moment dat îți cere numele contului. El apare în adresă: `<adresa-contului>.app.n8n.cloud`. Alege ceva scurt, fără diacritice și fără spații.

> **Atenție:** Numele contului nu se mai schimbă după aceea.

Când intri prima dată, n8n îți arată un asistent: „What do you want to automate?”. Nu scrie nimic acolo. Mergem direct la setări.

<!-- de confirmat la primul client: numele exact al butonului de pe n8n.io (Get started / Start free trial) -->

## Treci pe planul Starter

Proba gratuită ține 14 zile și nu are tot ce ne trebuie: lipsește accesul prin care lucrează Claude, unealta mea. De aceea treci pe **Starter** de la început.

| Plata | Cât costă | Ce primești |
|---|---|---|
| anuală | 20 € pe lună | 2.500 de rulări pe lună |
| lunară | 24 € pe lună | la fel |

O rulare înseamnă o pornire completă a automatizării. Pentru cele mai multe firme mici, 2.500 pe lună ajung din plin.

Abonamentul se face din **Cloud console**, jos în bara din stânga.

<!-- de confirmat la primul client: drumul exact din Cloud console până la plata pentru Starter; ce se întâmplă când se depășesc rulările -->

## Mă inviți în cont

1. Jos în bara din stânga, apasă **Settings**. Dacă bara arată doar pictograme, deschide-o întâi din pictograma de panou de sus.
2. Intră la **Users**.
3. Apasă **Invite**, scrie adresa mea, <e-mailul lui Andrei>, și lasă rolul **Member**.

Primesc un e-mail cu butonul **Set up your n8n account** și îmi fac contul de Member.

Ca Member construiesc și repar automatizările. Nu văd abonamentul, nu văd datele de plată și nu pot schimba setările contului. Parola ta nu mi-o dai niciodată.

## Pornești accesul pentru Claude

1. **Settings**, apoi **Instance-level MCP**.
2. La **MCP status**, alege **Enabled**.
3. Mai jos, la **MCP access for new workflows**, pornește comutatorul. Așa, Claude vede doar automatizările noi, pe care le construim noi, nu tot ce ai deja în cont.

Restul îl fac eu, din contul meu de Member: îmi iau singur accesul, legat de contul meu. Nu-mi trimiți nicio cheie.

> **Atenție:** Nu opri **MCP status** cât lucrez la automatizare sau cât avem mentenanță. Fără el, Claude nu mai ajunge în contul tău.

<!-- Andrei, după pasul ăsta: F5 pe Settings → Instance-level MCP (din contul de Member) → Connect → fereastra „Connect a client” → tab-ul „API key” → tokenul; apoi Settings → n8n API → cheia lui (de confirmat la primul client: că Member-ul are „n8n API” pe Starter). Cheile intră în clienti/<slug>/automatizari/.chei.env, scrise de Andrei, niciodată în chat. -->

## Conectezi conturile firmei

Automatizarea lucrează cu conturile tale: de exemplu Gmail, Google Sheets, WhatsApp. Le conectezi **tu**, cu parola ta, cât mă uit eu pe ecran. Eu nu văd parolele.

Pentru fiecare cont:

1. În n8n, faci o conexiune nouă și alegi aplicația (de exemplu, Gmail).
2. Apeși butonul de conectare și intri în contul firmei, cum intri de obicei.
3. Aprobi ce cere automatizarea și nimic în plus.
4. Îmi dai acces la conexiune, ca s-o pot folosi în automatizare.

<!-- de confirmat la primul client: numele exacte (Create credential / Sign in with Google / tab-ul de partajare) și dacă patronul poate partaja o conexiune cu un Member pe Starter. Lista conturilor se adaptează la fiecare client. -->

## Ce nu faci după

- Nu ștergi și nu oprești automatizarea din n8n. Dacă vrei s-o oprești, îmi scrii.
- Nu-mi schimbi rolul și nu mă scoți din cont cât avem mentenanță.
- Nu redenumești coloanele din tabelele pe care le folosește automatizarea: ea le caută după nume.
- Dacă schimbi parola unui cont conectat (de exemplu, Google), spune-mi în aceeași zi. Conexiunea se poate rupe.

<!--
Verificat la 2026-11-22:
- n8n Cloud, prețuri și probă: https://n8n.io/pricing/ (Starter 20 €/lună anual, 2.500 de rulări; proba: 14 zile, fără card, fără API public); https://docs.n8n.io/manage-cloud/cloud-free-trial/
- 24 €/lună la plata lunară: din surse externe (n8n arată pe pagină doar prețul anual); de confirmat la primul client.
- Roluri: https://docs.n8n.io/administer/manage-users-and-access/understand-instance-roles.md (Admin doar pe Pro)
- MCP: https://docs.n8n.io/connect/connect-to-n8n-mcp-server.md ; proba: tokenul Member-ului a mers pe MCP-ul oficial (70 de unelte).
-->
