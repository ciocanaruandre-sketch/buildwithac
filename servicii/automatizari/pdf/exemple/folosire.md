<!-- Exemplu de aspect, pentru o clinică inventată. -->
# Reamintirile de programare: cum le ==folosești==

Pentru Clinica Probă. Automatizarea merge singură din fiecare dimineață. Documentul ăsta îți spune ce faci tu, ce nu faci și ce se întâmplă când ceva nu merge.

## Ce face, pe scurt

```schema
E 8:00 dimineața
Citește programările de mâine
Trimite câte un e-mail fiecărui pacient
Notează în tabel
```

E-mailul are prenumele pacientului, ziua, ora, adresa clinicii și link-ul de reprogramare. Nimic despre tratament.

## Ce ai de făcut tu

Doar un lucru: trece programările în calendar cu adresa de e-mail a pacientului în descriere, pe un rând de forma `email: ion@example.com`.

Fără adresă, pacientul nu primește nimic. Îl vezi în tabel, în coloana **Fără e-mail**, și îl suni ca înainte.

## Cum vezi ce a plecat

Deschide tabelul **Reamintiri** din Google Drive. Fiecare rând e un e-mail trimis:

| Coloana | Ce scrie |
|---|---|
| Data | ziua în care a plecat e-mailul |
| Pacient | prenumele |
| Programare | ziua și ora programării |
| Stare | **Trimis** sau **Fără e-mail** |

## Când ceva nu merge

Dacă automatizarea se oprește, primesc eu o alertă pe e-mail și o repar, de obicei în aceeași zi. Tu nu ai nimic de făcut.

> **Atenție:** dacă schimbi parola contului Google al clinicii, conectarea la Gmail se poate rupe. Spune-mi în aceeași zi, ca să nu rămână pacienți fără reamintire.

Dacă vezi că un pacient a primit un e-mail greșit, scrie-mi la contact@buildwithac.ro, cu numele lui și ziua programării.
