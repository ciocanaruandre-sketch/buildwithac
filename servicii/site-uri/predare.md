# Predarea: „doar site-ul”

Clientul ia site-ul cu totul: codul în contul lui de GitHub, găzduirea în contul lui de Netlify (gratuit). Câte o acțiune pe pas. **Clientul nu-ți dă parolele lui, iar tu nu i le dai pe ale tale.**

Înainte: site-ul e lansat și merge pe domeniul clientului (`lansare.md`).

## A. Conturile clientului

1. Clientul își face cont pe `github.com` (gratuit) și îți trimite **numele de utilizator**.
2. Clientul își face cont pe `netlify.com` (planul **Free**). Cel mai simplu: **Sign up with GitHub**, cu contul de la pasul 1.

## B. Transferul depozitului

3. Pe GitHub, în `site-<slug>`, apasă **Settings**.
4. Jos, în **Danger Zone**, apasă **Transfer**.
5. La **New owner**, alege **Specify an organization or username** și scrie numele de utilizator al clientului.
6. Scrie numele depozitului la **Type REPOSITORY NAME to confirm** și apasă **I understand, transfer this repository**.
7. Clientul primește un e-mail și **trebuie să accepte într-o zi**, altfel invitația expiră.
8. Tu rămâi colaborator pe depozit. Claude actualizează adresa în `cod/`:
   ```
   git remote set-url origin https://github.com/<utilizatorul-clientului>/site-<slug>.git
   ```

## C. Site-ul pe Netlify

9. Clientul, în Netlify: **Add new project** → **Import an existing project** → **GitHub** → alege `site-<slug>`.
10. Lasă setările găsite singure (Next.js) și apasă **Deploy**.
11. Verifică adresa `…netlify.app` pe telefon.
12. Indexarea: Netlify spune singur producția (`CONTEXT=production`), iar `lib/indexare.ts` o știe. Verifică:
    `curl https://<site>.netlify.app/robots.txt` → `Allow: /`.

*Numele butoanelor din Netlify: verificate doar din documentație. Dacă pe ecran apar altfel, cere-i clientului o captură.*

## D. Domeniul

13. În Netlify: **Domain management** → **Add a domain** → domeniul clientului.
14. Netlify arată serverele lui de nume. Clientul le pune în locul celor de la Vercel, pe `rotld.ro` → **Administrare On-Line** (ca la lansare). Dacă firma are e-mail pe domeniu, înregistrările MX se copiază întâi în Netlify.
15. Așteaptă până Netlify arată domeniul ca valid și cu certificat (HTTPS).
16. Verifică din afară:
    - `curl -I https://<domeniu>.ro` → `200`, iar răspunsul are `server: Netlify`;
    - `curl https://<domeniu>.ro/robots.txt` → `Allow: /`.

## E. Curățenia la tine

17. Doar după pasul 16: în Vercel, proiectul `site-<slug>` → **Settings** → jos, **Delete Project**.
18. Analytics: Vercel Web Analytics nu mai merge pe Netlify. În `lib/config.ts`, `analytics: false`, iar pagina de confidențialitate se schimbă singură. Push, apoi verifici că Netlify a publicat.

## F. Notează

19. În `clienti/<slug>/jurnal.md`: data predării, contul GitHub și Netlify ale clientului (doar numele de utilizator), că proiectul Vercel e șters.

**Bine de spus clientului:** pe planul gratuit, Netlify poate opri un site fără garanții de funcționare (secțiunea 5 din termenii lor). Pentru un site de prezentare, riscul e mic. Dacă vrea garanții, trece pe un plan plătit.

---

Verificat la 2026-11-19: [GitHub, transferul unui depozit](https://docs.github.com/en/repositories/creating-and-managing-repositories/transferring-a-repository), [Netlify, Next.js](https://docs.netlify.com/frameworks/next-js/overview/), [Netlify, Self-Serve Subscription Agreement](https://www.netlify.com/legal/self-serve-subscription-agreement/) (secțiunea 5, „Free Usage Tier”), [Netlify, prețuri](https://www.netlify.com/pricing/).
