# Dezabonarea (`dezabonare`)

**Ce face:** scoate un client de pe listă când o cere, ca promisiunea „Răspunde STOP” din mesaje să funcționeze. Două intrări:
- **SMS primit** (`POST /webhook/dezabonare-sms`): Twilio trimite aici fiecare SMS primit pe numărul firmei. Dacă mesajul conține `stop`, `dezabonare` sau `dezabonez` (cu sau fără majuscule și diacritice, oriunde în frază), telefonul intră în `Nu trimite`, scris `+407…`. Orice alt SMS e ignorat. Twilio primește un răspuns gol, deci clientul nu primește nimic înapoi.
- **Link din e-mail** (`GET /webhook/dezabonare?c=<adresa în base64url>`): link-ul de la finalul e-mailurilor. Adresa intră în `Nu trimite`, iar clientul vede o pagină scurtă: „Gata, nu mai primești mesaje de la <firma>.” Un link stricat nu scrie nimic și spune telefonul firmei.

Un contact care e deja în `Nu trimite` nu se dublează: rândul lui primește doar data nouă. Celelalte modele citesc foaia și sar peste el.

**Cum arată:** cele două intrări → *Dezabonare* (Code) → *Setări firmă* → *Cere dezabonarea?* → *Adaugă în Nu trimite* (Google Sheets) → *Din SMS?* → răspunsul pentru Twilio sau pagina de confirmare.

**Aplicații:** Google Sheets (contul firmei). Twilio doar trimite SMS-urile primite; fluxul nu are nevoie de contul Twilio.

**De completat:** în *Setări firmă*, fluxul `setari-firma` (`CONFIG_ID_SETARI_FIRMA`: alegi din listă). Conexiunea Google Sheets la *Adaugă în Nu trimite*. În `setari-firma`, `link_dezabonare` = adresa de producție a intrării *Link din e-mail* (o vezi pe nod, la *Production URL*).

**În Twilio:** *Phone Numbers* → *Manage* → *Active numbers* → numărul firmei → la *Messaging Configuration*, *A message comes in*: **Webhook**, adresa de producție a intrării *SMS primit*, **HTTP POST** → *Save configuration*. (Numele butoanelor sunt de verificat în interfața Twilio, la prima configurare.)

**Rulări:** câte una pentru fiecare SMS primit pe numărul firmei (inclusiv cele care nu sunt STOP) și pentru fiecare link apăsat.

**Date sensibile:** doar telefonul sau adresa celui care cere dezabonarea. Pagina de confirmare nu arată adresa.

## La client

1. Întâi publici `setari-firma`: n8n nu publică un flux care cheamă un sub-flux nepublicat („Please publish all referenced sub-workflows first”). După **orice** schimbare în setări, republici `setari-firma`: fluxurile publicate folosesc versiunea publicată, nu ciorna.
2. Importă fluxul, alege `setari-firma` în *Setări firmă* și conexiunea Sheets, apoi *Settings* → *Error workflow* → `flux-erori` și fusul orar `Europe/Bucharest`.
3. Publică-l. Copiază adresa de producție a *Link din e-mail* în `link_dezabonare` și republică `setari-firma`.
4. Probă: deschizi link-ul cu adresa ta (`node -e "console.log(Buffer.from('adresa@ta.ro').toString('base64url'))"` îți dă bucata de după `?c=`), vezi pagina și rândul din `Nu trimite`, apoi ștergi rândul.

## De știut

- **Telefoanele se scriu ca text** (opțiunea *Cell Format: RAW* din nodul Sheets). Altfel Google transformă `+40712345678` în număr și pierde plusul.
- **Roboții care verifică link-urile.** Unele programe de e-mail (de exemplu Outlook, la firme) deschid singure link-urile ca să le verifice și ar putea dezabona clientul fără să vrea. Intrarea *Link din e-mail* are opțiunea *Ignore Bots* pornită, care îi oprește pe cei cunoscuți. Dacă un client se plânge că a fost scos de pe listă fără să vrea, pagina trebuie să ceară o confirmare (un buton) înainte de scriere.
- **Oricine știe adresa SMS poate trimite o cerere falsă** și scoate un număr de pe listă. Răul e mic (clientul nu mai primește mesaje), dar dacă se întâmplă, nodul *SMS primit* poate verifica semnătura Twilio.

**Verificat la proba din 2026-11-26** (cont de probă n8n Cloud, Conu' Leonida): cu date fixate, SMS-ul „Nu mai trimiteti, STOP.” de la `0040712345678` → `+40712345678` și răspunsul gol; un SMS obișnuit nu scrie nimic. **Rulare reală** a link-ului din browser, cu adresa lui Andrei: pagina s-a afișat, rândul a apărut în `Nu trimite` (apoi șters). Ramura SMS pe bune rămâne de probat după ce e pus Twilio (Task 4).
