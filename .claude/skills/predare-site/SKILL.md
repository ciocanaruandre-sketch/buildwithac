---
name: predare-site
description: Folosește când un client de site vrea „doar site-ul”, fără mentenanță, sau când Andrei zice „predau site-ul”, „clientul vrea doar site-ul”, „mută site-ul pe contul lui”, „clientul pleacă”.
---

# Predarea unui site

## Pe scurt
Clientul ia site-ul cu totul: depozitul se transferă pe GitHub-ul lui, iar site-ul se mută pe Netlify-ul lui (gratuit). Lista de pași e `servicii/site-uri/predare.md`; skill-ul o parcurge cu Andrei.

Citește înainte: `servicii/site-uri/predare.md` și `clienti/<slug>/jurnal.md`.

## Pașii
1. Verifică întâi că site-ul e lansat și merge pe domeniul clientului (`curl -I https://<domeniu>`). Dacă nu, întâi `site-client` și `lansare.md`.
2. Parcurge `predare.md` **câte un pas pe mesaj**, cu numele exacte ale butoanelor. Treci la următorul doar după ce Andrei (sau clientul) l-a terminat.
3. Când un buton nu apare cum scrie, cere o captură, **fără parole sau chei pe ea**, și corectează `predare.md` după ce vezi.
4. După mutarea DNS, verifică din afară, nu pe cuvânt:
   - `curl -I https://<domeniu>` → `200`, cu `server: Netlify`;
   - `curl https://<domeniu>/robots.txt` → `Allow: /`.
5. Abia apoi: proiectul șters de pe Vercel-ul lui Andrei și `analytics: false` în `lib/config.ts` (pașii 17–18).
6. Un rând în `clienti/<slug>/jurnal.md`: data predării, conturile clientului (doar numele de utilizator), proiectul Vercel șters.

## Nu uita
- Nu se cer parolele clientului și nu se dau ale lui Andrei.
- Invitația de transfer pe GitHub expiră într-o zi: spune-i clientului dinainte.
- Dacă firma are e-mail pe domeniu, înregistrările MX se copiază înainte de schimbarea serverelor de nume.
- Proiectul de pe Vercel se șterge **doar** după ce site-ul merge pe Netlify, verificat cu `curl`.
