<!-- Exemplu de aspect, pentru o clinică inventată. Nu e un client real. -->
# Reamintiri de programare care pleacă ==singure==

Pentru Clinica Probă. Pe scurt: cu o zi înainte de fiecare programare, pacientul primește un e-mail cu ora și adresa. Recepția nu mai sună pe nimeni ca să-i amintească.

## Ce face automatizarea

În fiecare dimineață, la 8:00, automatizarea se uită în calendarul clinicii la programările de a doua zi. Fiecărui pacient îi trimite un e-mail scurt: ziua, ora, adresa și un link de reprogramare.

```schema
E 8:00 dimineața
Citește programările de mâine din Google Calendar
Scrie e-mailul: prenumele, ora, adresa
Îl trimite din Gmail-ul clinicii
Notează în tabel că a plecat
```

Dacă un e-mail nu pleacă (adresă greșită, Gmail deconectat), primesc eu o alertă și repar.

## Ce aplicații leagă

| Aplicația | La ce folosește | Contul cui |
|---|---|---|
| Google Calendar | de aici citește programările | al clinicii |
| Gmail | de aici pleacă e-mailurile | al clinicii |
| Google Sheets | ține evidența e-mailurilor trimise | al clinicii |
| n8n Cloud | rulează automatizarea | al clinicii |

## Ce plătește clinica lunar

| Abonament | Cât | De ce |
|---|---|---|
| n8n Cloud Starter | 20 € pe lună la plata anuală, 24 € la plata lunară | aici rulează automatizarea; ajunge pentru 2.500 de rulări pe lună |
| Google Workspace | ce plătiți deja | Calendar, Gmail și Sheets sunt deja ale voastre |

O rulare înseamnă o pornire a automatizării. Aici e una pe zi, deci cam 30 pe lună: mult sub limită.

## Ce rămâne la voi

- Programările se trec în calendar ca până acum. Automatizarea citește doar ce e acolo.
- Reprogramările le face tot recepția. Link-ul din e-mail duce la formularul vostru de reprogramare.
- Dacă un pacient nu are e-mail în fișă, nu primește nimic. Recepția vede lista lor în tabel.

## Ce nu se întâmplă niciodată

> **Atenție:** E-mailul nu spune niciodată tratamentul sau motivul programării. Doar prenumele, ziua, ora și adresa. Datele medicale nu trec prin automatizare.

De ce n8n și nu altceva: treaba trebuie să meargă singură, în fiecare dimineață, fără ca cineva să fie la calculator. Pentru asta e făcut n8n.
