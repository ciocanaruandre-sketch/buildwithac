# Clienții

Un dosar pe client: `clienti/<slug>/`. Slug-ul e numele firmei cu litere mici, fără diacritice, cu cratime („Cafeneaua Colț” → `cafeneaua-colt`). Dosarul îl face skill-ul `client-nou`.

```
clienti/<slug>/
  fisa.md        ← cine e firma, ce a cumpărat, ce vrea (comună tuturor serviciilor)
  jurnal.md      ← decizii, livrări, modificări cerute, cu data, cel mai nou sus
  materiale/     ← pozele, logo-ul, textele primite, exportul Tally
  site/cod/      ← depozitul site-ului, cu git-ul lui
  automatizari/
    propunere.md, pornire.md, folosire.md  ← sursele celor trei PDF-uri
    fluxuri/     ← exporturile JSON ale fluxurilor
    pdf/         ← PDF-urile generate
    .chei.env    ← cheia API și tokenul MCP ale lui Andrei pentru n8n-ul clientului
```

## Ce intră în git

- **Intră:** `fisa.md` și `jurnal.md`. Depozitul buildwithac e privat.
- **Nu intră:** `materiale/`, `site/cod/`, iar la automatizări `fluxuri/`, `pdf/` și `.chei.env` (regulile sunt în `.gitignore`). Un export de flux poate avea adresele sau ID-urile de tabele ale clientului; copia lui de rezervă e chiar n8n-ul clientului, plus Drive. Codul site-ului are depozitul lui separat pe GitHub, `site-<slug>`, ca clientul să nu vadă niciodată codul buildwithac sau al altui client.

## Unde e linia la datele personale

Ce va fi **public pe site** (telefonul firmei, WhatsApp-ul, adresa, programul), chiar dacă e telefonul personal al patronului, poate sta în `fisa.md` și în `config.ts` din depozitul clientului: oricum se publică. Ce **nu** se publică (numele persoanei de contact, e-mailul ei, alte numere, ce a spus la telefon despre sine) stă doar în CRM și în exportul Tally din `materiale/`. Fișa trimite la client prin numele firmei.

## Copia de rezervă

Pozele și logo-ul folosite pe site ajung în depozitul site-ului, deci au copie pe GitHub. Restul din `materiale/` (fișierele brute, exportul Tally) stă doar pe laptop: pune o copie în Drive, în `buildwithac.ai/clienti/<slug>/`, cum faci cu clipurile.

## Legătura cu CRM-ul

Prin numele firmei, de mână. Fișa nu conține ID-uri din CRM, iar CRM-ul nu se atinge din acest dosar. Formularul Tally nu intră în CRM: e doar ca să înțelegi ce vrea clientul.
