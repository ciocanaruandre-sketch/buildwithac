# Lansarea unui site de client

Câte o acțiune pe pas. Pașii din conturile tale îi faci tu; Claude îți spune următorul doar după ce l-ai terminat pe cel de acum. **Fără parole sau chei în capturi.**

Înainte: Vercel e pe Pro (vezi `README.md`), iar site-ul trece `npm run verifica` în `clienti/<slug>/site/cod/`.

## A. Depozitul pe GitHub

1. Deschide `github.com/new`.
2. La **Repository name** scrie `site-<slug>`.
3. Alege **Private**.
4. Lasă nebifat **Add a README file** (și fără `.gitignore` sau licență: depozitul are deja tot).
5. Apasă **Create repository**.
6. Claude rulează din `cod/`:
   ```
   git remote add origin https://github.com/ciocanaruandre-sketch/site-<slug>.git
   git push -u origin main
   ```

## B. Proiectul pe Vercel

7. În Vercel, pe echipa **Pro**, apasă **Add New…** → **Project**.
8. La **Import Git Repository**, alege `site-<slug>` și apasă **Import**.
9. Lasă setările găsite singure (Next.js) și apasă **Deploy**.
10. Așteaptă să apară pagina cu felicitări. Adresa `…vercel.app` e a previzualizării, nu o da încă nimănui.

## C. Link-ul pentru client

11. În proiect, deschide **Deployments** din bara din stânga.
12. Alege ultima publicare și apasă **Share**.
13. În fereastra **Share**, alege **Anyone with the link** din listă și copiază link-ul.
14. Trimite link-ul clientului. Îl deschide fără cont Vercel.
    Când nu mai trebuie, în aceeași fereastră alegi **Only people with access**.

*De verificat la primul client:* cum se poartă protecția pe adresele `…vercel.app` ale proiectelor noi. Notează în `jurnal.md` ce ai văzut.

## D. Domeniul clientului

Clientul își cumpără domeniul **pe numele lui**, direct de la ROTLD (`rotld.ro`, 12 € + TVA pe an). Tu nu-i ceri parola domeniului.

15. Clientul intră pe `rotld.ro`, alege înregistrarea unui domeniu `.ro`, completează datele lui și plătește.
16. În proiectul Vercel: **Settings** → **Domains** → **Add Existing**. Scrie domeniul clientului (`<domeniu>.ro`).
17. Vercel propune și `www.<domeniu>.ro`: acceptă, cu redirecționare spre domeniul fără `www`.
18. Alege metoda **Nameservers**. Vercel arată două servere de nume (de obicei `ns1.vercel-dns.com` și `ns2.vercel-dns.com`). Copiază-le exact cum apar pe ecran.
19. Trimite-i clientului cele două valori. El intră pe `rotld.ro` → **Administrare On-Line**, cu domeniul și parola lui, și pune serverele de nume primite în locul celor vechi. *Numele butoanelor din panoul ROTLD: de verificat la primul client (cere-i o captură fără parolă).*
    **Atenție:** dacă firma are deja e-mail pe domeniul ăsta (`ceva@<domeniu>.ro`), înregistrările MX trebuie copiate întâi în Vercel (**Domains** → domeniul → **DNS Records**), altfel e-mailul nu mai ajunge.
20. Așteaptă până Vercel arată domeniul ca valid (de la câteva minute la câteva ore).

## E. Verificările după lansare

21. `curl -I https://<domeniu>.ro` → `HTTP/2 200`.
22. `curl https://<domeniu>.ro/robots.txt` → conține `Allow: /` și `Sitemap:`. Dacă scrie `Disallow: /`, publicarea nu e de producție (vezi `lib/indexare.ts`).
23. `curl -I https://www.<domeniu>.ro` → redirecționare spre domeniul fără `www`.
24. Deschizi site-ul pe telefon și treci prin toate paginile.
25. În `lib/config.ts`, `domeniu` e cel adevărat (altfel `sitemap` și imaginea la distribuire arată spre alt loc).

## F. Notează

26. În `clienti/<slug>/jurnal.md`: data lansării, domeniul, adresa depozitului, proiectul Vercel, varianta (mentenanță / doar site-ul).

---

Verificat la 2026-11-19: [Vercel, domeniu propriu](https://vercel.com/docs/domains/working-with-domains/add-a-domain), [Vercel, Shareable Links](https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/sharable-links), [ROTLD, prețuri](https://www.rotld.ro/prices/). Panoul ROTLD (pasul 19) și protecția adreselor `…vercel.app` (pasul 14) rămân de văzut la primul client.
